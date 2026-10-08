import { Inject, Logger, Module, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { authConfig } from '../../config/auth.config';
import { PasswordHasherService } from '../../common/security/password-hasher.service';
import { RateLimiterService } from '../../common/security/rate-limiter.service';
import { CsrfGuard } from '../../common/security/csrf.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MailService } from '../../common/mail/mail.service';
import { AccountController } from '../account/account.controller';
import { AccountService } from '../account/account.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY, AuthRepository } from './repository/auth.repository';
import { DATA_CONSENT_VERSION } from './auth.schemas';
import { InMemoryAuthRepository } from './repository/in-memory-auth.repository';
import { PrismaAuthRepository } from './repository/prisma-auth.repository';

const PRISMA_CLIENT = Symbol('PRISMA_CLIENT');

export { PRISMA_CLIENT };

export const DEMO_ACCOUNT = {
  email: 'demo@nutridaily.id',
  password: 'Katering#Sehat2026',
  fullName: 'Joshua M.',
  phone: '+6281298421084',
};

@Module({
  imports: [
    JwtModule.register({
      secret: authConfig.jwt.accessSecret,
      signOptions: { algorithm: 'HS256' },
      verifyOptions: { algorithms: ['HS256'] },
    }),
  ],
  controllers: [AuthController, AccountController],
  providers: [
    {
      provide: PRISMA_CLIENT,
      useFactory: () => (authConfig.databaseUrl ? new PrismaClient() : null),
    },
    {
      provide: AUTH_REPOSITORY,
      inject: [PRISMA_CLIENT],
      useFactory: (prisma: PrismaClient | null): AuthRepository =>
        prisma ? new PrismaAuthRepository(prisma) : new InMemoryAuthRepository(),
    },
    PasswordHasherService,
    RateLimiterService,
    MailService,
    CsrfGuard,
    JwtAuthGuard,
    AuthService,
    AccountService,
  ],
  exports: [AUTH_REPOSITORY, JwtAuthGuard, JwtModule, PRISMA_CLIENT],
})
export class AuthModule implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger('AuthModule');

  constructor(
    @Inject(AUTH_REPOSITORY) private readonly repo: AuthRepository,
    @Inject(PRISMA_CLIENT) private readonly prisma: PrismaClient | null,
    private readonly hasher: PasswordHasherService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit(): Promise<void> {
    if (this.prisma) {
      await this.prisma.$connect();
      this.logger.log('Penyimpanan auth: PostgreSQL (Prisma).');
      await this.seedDemoAccount();
    } else {
      this.logger.warn(
        'Penyimpanan auth: IN-MEMORY (DATABASE_URL tidak diset). Data akun hilang saat server restart. Khusus pengembangan.',
      );
      await this.seedDemoAccount();
    }
    this.logger.log(`Pengiriman email: ${this.mail.transportName}.`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.prisma?.$disconnect();
  }

  /** Verified demo customer and initial client account so frontend & CRM can be tried immediately in development. */
  private async seedDemoAccount(): Promise<void> {
    if (authConfig.isProduction) return;
    if (!(await this.repo.findUserByEmail(DEMO_ACCOUNT.email))) {
      await this.repo.createUser({
        email: DEMO_ACCOUNT.email,
        phone: DEMO_ACCOUNT.phone,
        fullName: DEMO_ACCOUNT.fullName,
        passwordHash: await this.hasher.hash(DEMO_ACCOUNT.password),
        isVerified: true,
        emailVerifiedAt: new Date(),
        dataConsentAt: new Date(),
        dataConsentVersion: DATA_CONSENT_VERSION,
      });
      this.logger.log(`Akun demo siap: ${DEMO_ACCOUNT.email} / ${DEMO_ACCOUNT.password}`);
    }

    const joshuaEmail = 'joshuaabdiel365@gmail.com';
    if (!(await this.repo.findUserByEmail(joshuaEmail))) {
      await this.repo.createUser({
        id: '3d3e5a9b-6d9f-4154-b330-9a48399de585',
        email: joshuaEmail,
        phone: '+6281292570602',
        fullName: 'Joshua Abdiel',
        passwordHash: await this.hasher.hash('Katering#Sehat2026'),
        isVerified: true,
        emailVerifiedAt: new Date(),
        dataConsentAt: new Date(),
        dataConsentVersion: DATA_CONSENT_VERSION,
      } as any);
      this.logger.log(`Akun pelanggan siap: ${joshuaEmail}`);
    }
  }
}
