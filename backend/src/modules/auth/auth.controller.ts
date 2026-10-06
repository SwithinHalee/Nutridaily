import { Body, Controller, Get, HttpCode, HttpStatus, NotFoundException, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { authConfig } from '../../config/auth.config';
import { CsrfGuard, issueCsrfToken } from '../../common/security/csrf.guard';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe';
import { AuthenticatedUser, CurrentUser, JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MailService } from '../../common/mail/mail.service';
import { AuthService } from './auth.service';
import {
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  emailOnlySchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schemas';
import { clearSessionCookies, readCookie, requestContext, setCsrfCookie, setSessionCookies } from './auth-cookies';

/**
 * Public authentication endpoints. Every state-changing route is CSRF protected.
 * Tokens are only ever delivered as HTTP-only cookies, never in a response body.
 */
@Controller('api/v1/auth')
@UseGuards(CsrfGuard)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}

  /** Issues the signed double-submit CSRF token (cookie + body for cross-host frontends). */
  @Get('csrf')
  csrf(@Res({ passthrough: true }) res: Response) {
    const token = issueCsrfToken();
    setCsrfCookie(res, token);
    res.setHeader('Cache-Control', 'no-store');
    return { csrfToken: token, headerName: authConfig.csrf.headerName };
  }

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput, @Req() req: Request) {
    return this.auth.register(body, requestContext(req));
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) body: { token: string }, @Req() req: Request) {
    return this.auth.verifyEmail(body.token, requestContext(req));
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  resendVerification(@Body(new ZodValidationPipe(emailOnlySchema)) body: { email: string }, @Req() req: Request) {
    return this.auth.resendVerification(body.email, requestContext(req));
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, session } = await this.auth.login(body, requestContext(req));
    // Replace any session this browser already held instead of leaving it active.
    await this.auth.logout(readCookie(req, authConfig.cookies.refreshName));
    setSessionCookies(res, session);
    res.setHeader('Cache-Control', 'no-store');
    return { message: 'Berhasil masuk.', user, accessTokenExpiresIn: authConfig.jwt.accessTtlSeconds };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      const session = await this.auth.refresh(readCookie(req, authConfig.cookies.refreshName), requestContext(req));
      setSessionCookies(res, session);
      res.setHeader('Cache-Control', 'no-store');
      return { message: 'Sesi diperbarui.', accessTokenExpiresIn: authConfig.jwt.accessTtlSeconds };
    } catch (err) {
      // A lost multi-tab race must NOT clear the cookies the winning tab just set.
      if ((err as { code?: string }).code !== 'REFRESH_RACE') clearSessionCookies(res);
      throw err;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(readCookie(req, authConfig.cookies.refreshName));
    clearSessionCookies(res);
    return { message: 'Anda telah keluar dari akun.' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    await this.auth.logoutAll(user.id);
    clearSessionCookies(res);
    return { message: 'Semua sesi di seluruh perangkat telah dikeluarkan.' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  forgotPassword(@Body(new ZodValidationPipe(emailOnlySchema)) body: { email: string }, @Req() req: Request) {
    return this.auth.forgotPassword(body.email, requestContext(req));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.resetPassword(body, requestContext(req));
    clearSessionCookies(res);
    return result;
  }

  /**
   * Development only (AUTH_DEV_MAIL_OUTBOX=true and NODE_ENV != production): lists emails that
   * would have been sent, so the verify/reset flows can be tested without an SMTP server.
   */
  @Get('dev/outbox')
  devOutbox() {
    if (!authConfig.mail.devOutboxEnabled) throw new NotFoundException();
    return { emails: this.mail.getDevOutbox().map(({ to, subject, link, sentAt }) => ({ to, subject, link, sentAt })) };
  }
}
