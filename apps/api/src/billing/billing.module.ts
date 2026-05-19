import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller.js";
import { StripeService } from "./stripe.service.js";

@Module({
  controllers: [BillingController],
  providers: [StripeService],
  exports: [StripeService],
})
export class BillingModule {}
