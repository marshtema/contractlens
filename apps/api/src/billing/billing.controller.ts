import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  CurrentUser,
  RequireUserGuard,
} from "../auth/current-user.decorator.js";
import { AuthService, type SessionUser } from "../auth/auth.service.js";

@Controller("billing")
export class BillingController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Заглушка под Stripe. Если задан STRIPE_SECRET_KEY — в будущем здесь
   * создадим Checkout Session и вернём URL. Сейчас — мгновенно меняем
   * тариф пользователя (test-mode).
   */
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

    if (process.env.STRIPE_SECRET_KEY) {
      // TODO: integrate real Stripe Checkout
      // Сейчас — те же дев-моки, чтобы не блокировать поток
    }

    const updated = await this.auth.setPlan(user.id, plan);
    return { ok: true, user: updated, mode: "dev_mock" };
  }
}
