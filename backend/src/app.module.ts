import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthModule, PRISMA_CLIENT } from './modules/auth/auth.module';
import { HealthProfileController } from './modules/health-profile/health-profile.controller';
import { HealthProfileService } from './modules/health-profile/health-profile.service';
import { SubscriptionController } from './modules/subscriptions/subscription.controller';
import { SubscriptionService } from './modules/subscriptions/subscription.service';
import { AdminAccountsController } from './modules/account/admin-accounts.controller';
import { KDSController } from './modules/kds/kds.controller';
import { KDSService } from './modules/kds/kds.service';
import { KDSGateway } from './modules/kds/kds.gateway';
import { RecipesController } from './modules/recipes/recipes.controller';
import { RecipesService } from './modules/recipes/recipes.service';
import {
  RECIPES_REPOSITORY,
  RecipesRepository,
} from './modules/recipes/repository/recipes.repository';
import { FileRecipesRepository } from './modules/recipes/repository/file-recipes.repository';
import { PrismaRecipesRepository } from './modules/recipes/repository/prisma-recipes.repository';
import { PaymentsController } from './modules/payments/payments.controller';
import { PaymentsService } from './modules/payments/payments.service';
import { DailyKdsDispatchProcessor } from './workers/daily-kds-dispatch.processor';
import { PaymentWebhookProcessor } from './workers/payment-webhook.processor';
import { WhatsAppNotificationProcessor } from './workers/whatsapp-notification.processor';

import { AppController } from './app.controller';

@Module({
  imports: [
    // Registration, login, sessions, password recovery and account management.
    // Exports JwtAuthGuard so other controllers can protect routes with @UseGuards(JwtAuthGuard).
    AuthModule,
  ],
  controllers: [
    AppController,
    HealthProfileController,
    SubscriptionController,
    AdminAccountsController,
    KDSController,
    RecipesController,
    PaymentsController,
  ],
  providers: [
    HealthProfileService,
    SubscriptionService,
    KDSService,
    KDSGateway,
    RecipesService,
    PaymentsService,
    DailyKdsDispatchProcessor,
    PaymentWebhookProcessor,
    WhatsAppNotificationProcessor,
    {
      provide: RECIPES_REPOSITORY,
      useFactory: (prisma: PrismaClient | null): RecipesRepository =>
        prisma ? new PrismaRecipesRepository(prisma) : new FileRecipesRepository(),
      inject: [PRISMA_CLIENT],
    },
  ],
})
export class AppModule {}
