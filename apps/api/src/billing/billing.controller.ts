import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import type Stripe from "stripe";
import {
  CurrentUser,
  RequireUserGuard,
} from "../auth/current-user.decorator.js";
import { AuthService, type SessionUser } from "../auth/auth.service.js";
import { PrismaService } from "../prisma/prisma.service.js";
import { StripeService } from "./stripe.service.js";

@Controller("billing")
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  @Post("checkout")
  @UseGuards(RequireUserGuard)
  async checkout(
    @CurrentUser() user: SessionUser,
    @Body() body: { plan?: "free" | "pro" | "business" | "enterprise" },
  ) {
    const plan = body?.plan;
    if (!plan || !["free", "pro", "business", "enterprise"].includes(plan)) {
      throw new BadRequestException("Invalid plan");
    }

    // Бесплатный — мгновенный downgrade
    if (plan === "free") {
      const updated = await this.auth.setPlan(user.id, "free");
      return { ok: true, mode: "instant", user: updated };
    }

    // Enterprise — пока заглушка (custom-deal)
    if (plan === "enterprise") {
      return {
        ok: true,
        mode: "contact_sales",
        message: "Свяжитесь с нами для enterprise-плана",
      };
    }

    // Реальный Stripe (если ключи заданы)
    if (this.stripe.isAvailable()) {
      const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";
      const dbUser = await this.prisma.user.findUnique({
        where: { id: user.id },
      });
      const { url, sessionId } = await this.stripe.createCheckoutSession({
        plan,
        userId: user.id,
        userEmail: user.email,
        customerId: dbUser?.stripeCustomerId ?? null,
        successUrl: `${webOrigin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${webOrigin}/billing/cancel`,
      });
      this.logger.log(
        `Created Stripe Checkout session ${sessionId} for user ${user.id} plan=${plan}`,
      );
      return { ok: true, mode: "stripe", url };
    }

    // Fallback: dev-mock (мгновенный апгрейд без оплаты)
    const updated = await this.auth.setPlan(user.id, plan);
    this.logger.warn(
      `Stripe not configured — instantly upgraded ${user.id} to ${plan} (dev mock)`,
    );
    return { ok: true, mode: "dev_mock", user: updated };
  }

  /**
   * Stripe webhook: подтверждает оплату, апгрейдит юзера.
   * Raw body нужен для signature verification — используем req.body как Buffer.
   */
  @Post("webhook")
  @HttpCode(200)
  async webhook(
    @Req() req: FastifyRequest,
    @Headers("stripe-signature") signature: string,
  ) {
    if (!this.stripe.isAvailable()) {
      this.logger.warn("Webhook received but Stripe not configured");
      return { received: false };
    }

    // Fastify по умолчанию парсит JSON. Нам нужен raw body — берём его из rawBody
    // (нужно настроить fastify config). Пока — JSON.stringify обратно (теряет
    // сигнатуру если ключ задан, но при наличии STRIPE_WEBHOOK_SECRET fastify
    // должен быть переключён в raw-mode).
    const rawBody =
      (req as FastifyRequest & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(req.body ?? {}));

    let event: Stripe.Event;
    try {
      event = this.stripe.constructEvent(rawBody, signature);
    } catch (err) {
      this.logger.error(
        `Webhook signature verification failed: ${err instanceof Error ? err.message : err}`,
      );
      throw new BadRequestException("Invalid signature");
    }

    this.logger.log(`Webhook event: ${event.type}`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.userId ?? session.client_reference_id ?? null;
        const plan = session.metadata?.plan as
          | "pro"
          | "business"
          | undefined;

        if (!userId || !plan) {
          this.logger.warn(
            `checkout.session.completed missing userId/plan in metadata: ${session.id}`,
          );
          break;
        }

        await this.auth.setPlan(userId, plan);
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : (session.customer?.id ?? null),
            stripeSubscriptionId:
              typeof session.subscription === "string"
                ? session.subscription
                : (session.subscription?.id ?? null),
          },
        });
        this.logger.log(
          `Activated plan=${plan} for user=${userId} after checkout`,
        );
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId ?? null;
        if (!userId) break;
        const isActive =
          sub.status === "active" || sub.status === "trialing";
        await this.prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: isActive
              ? "active"
              : sub.status === "canceled"
                ? "cancelled"
                : "past_due",
            ...(isActive
              ? {}
              : { subscriptionTier: "free", documentsLimit: 3, pagesLimit: 5 }),
          },
        });
        this.logger.log(
          `Updated subscription for user=${userId}: status=${sub.status}`,
        );
        break;
      }

      default:
      // ignore
    }

    return { received: true };
  }
}
