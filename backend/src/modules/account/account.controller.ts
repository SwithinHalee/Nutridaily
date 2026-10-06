import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { CsrfGuard } from '../../common/security/csrf.guard';
import { ZodValidationPipe } from '../../common/validation/zod-validation.pipe';
import { AuthenticatedUser, CurrentUser, JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ChangePasswordInput,
  DeleteAccountInput,
  UpdateProfileInput,
  changePasswordSchema,
  deleteAccountSchema,
  updateProfileSchema,
} from '../auth/auth.schemas';
import { clearSessionCookies, requestContext, setSessionCookies } from '../auth/auth-cookies';
import { AccountService } from './account.service';

/** Authenticated self-service account management. Guard order: CSRF first, then auth. */
@Controller('api/v1/account')
@UseGuards(CsrfGuard, JwtAuthGuard)
export class AccountController {
  constructor(private readonly account: AccountService) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return { user: await this.account.getProfile(user.id) };
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ) {
    return { message: 'Data profil berhasil diperbarui.', user: await this.account.updateProfile(user.id, body) };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.account.changePassword(user.id, body, requestContext(req));
    setSessionCookies(res, session);
    return { message: 'Kata sandi berhasil diubah. Perangkat lain telah dikeluarkan dari akun.' };
  }

  @Get('sessions')
  async sessions(@CurrentUser() user: AuthenticatedUser) {
    return { sessions: await this.account.listSessions(user.id, user.sessionId) };
  }

  @Get('login-history')
  async loginHistory(@CurrentUser() user: AuthenticatedUser) {
    return { history: await this.account.listLoginHistory(user.id) };
  }

  /** Requires the current password and a typed confirmation phrase. */
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(deleteAccountSchema)) body: DeleteAccountInput,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.account.deleteAccount(user.id, body, requestContext(req));
    clearSessionCookies(res);
    return { message: 'Akun Anda telah dihapus dan data pribadi telah dianonimkan.' };
  }
}
