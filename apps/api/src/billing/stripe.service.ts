import { Injectable, Logger } from "@nestjs/common";
import Stripe from "stripe";

/** Маппинг наших планов на price-IDs в Stripe. Задаётся через env. */
interface PlanPrice {
  priceId: string | null;
  amount: number; // ₽, для отображения
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly client: Stripe | null;
  private readonly webhookSecret: string | null;

  readonly prices: Record<"pro" | "business", PlanPrice>;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY;
    this.client = key ? new Stripe(key, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion }) : null;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? null;
    this.prices = {
      pro: {
        priceId: process.env.STRIPE_PRICE_PRO ?? null,
        amount: 890,
      },
      business: {
        priceId: process.env.STRIPE_PRICE_BUSINESS ?? null,
        amount: 2890,
      },
    };
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  hasPriceFor(plan: "pro" | "business"): boolean {
    return !!this.prices[plan].priceId;
  }

  /**
   * Создаёт Stripe Checkout Session.
   * Если price-id для плана не задан — создаст inline-цену "на лету"
   * (для удобства разработки, без необходимости заводить Product+Price в дашборде).
   */
  async createCheckoutSession(opts: {
    plan: "pro" | "business";
    userId: string;
    userEmail: string;
    customerId: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string; sessionId: string }> {
    if (!this.client) {
      throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
    }

    const planPrice = this.prices[opts.plan];

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem =
      planPrice.priceId
        ? { price: planPrice.priceId, quantity: 1 }
        : {
            // Inline-цена: ₽890/мес или ₽2890/мес, recurring.
            // Это удобно для dev — не надо создавать продукт в дашборде.
            price_data: {
              currency: "rub",
              recurring: { interval: "month" },
              product_data: {
                name: `ContractLens ${opts.plan.toUpperCase()}`,
              },
              unit_amount: planPrice.amount * 100, // в копейках
            },
            quantity: 1,
          };

    const session = await this.client.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [lineItem],
      customer: opts.customerId ?? undefined,
      customer_email: opts.customerId ? undefined : opts.userEmail,
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
      client_reference_id: opts.userId,
      metadata: { userId: opts.userId, plan: opts.plan },
      subscription_data: {
        metadata: { userId: opts.userId, plan: opts.plan },
      },
    });

    if (!session.url) {
      throw new Error("Stripe returned session without URL");
    }
    return { url: session.url, sessionId: session.id };
  }

  /**
   * Верифицирует webhook signature и возвращает событие.
   * Если STRIPE_WEBHOOK_SECRET не задан — парсит без проверки (только для dev!).
   */
  constructEvent(
    rawBody: Buffer | string,
    signature: string | undefined,
  ): Stripe.Event {
    if (!this.client) throw new Error("Stripe not configured");
    if (this.webhookSecret && signature) {
      return this.client.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    }
    this.logger.warn(
      "Webhook signature not verified (no STRIPE_WEBHOOK_SECRET). DO NOT use this in production.",
    );
    const text =
      typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
    return JSON.parse(text) as Stripe.Event;
  }

  async retrieveSubscription(
    subscriptionId: string,
  ): Promise<Stripe.Subscription | null> {
    if (!this.client) return null;
    return this.client.subscriptions.retrieve(subscriptionId);
  }
}
