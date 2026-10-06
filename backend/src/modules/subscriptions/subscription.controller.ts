import { Controller, Get, Patch, Body, Param, HttpStatus, UseGuards } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { CutoffValidator } from './cutoff-validator';
import { JwtAuthGuard, CurrentUser, AuthenticatedUser } from '../../common/guards/jwt-auth.guard';

export class PauseResumeDto {
  effectiveDate!: string; // YYYY-MM-DD
}

export class SwapMenuDto {
  orderDate!: string; // YYYY-MM-DD
  recipeId!: string;
  recipeTitle!: string;
}

export class UpdateAddressDto {
  effectiveDate!: string; // YYYY-MM-DD
  addressId!: string;
  label!: string;
  fullAddress!: string;
}

@Controller('api/v1/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.subscriptionService.getOrCreateUserSubscription(user.id);
    const cutoffStatus = CutoffValidator.getWibTime();
    return {
      statusCode: HttpStatus.OK,
      data,
      currentWibTime: cutoffStatus,
      cutoffNotice: 'Modifikasi menu dan pengiriman H+1 ditutup setiap hari kerja pukul 20.00 WIB. Dapur libur Sabtu dan Minggu.',
    };
  }

  @Get(':id')
  async getSubscription(@Param('id') id: string) {
    const data = await this.subscriptionService.getSubscription(id);
    const cutoffStatus = CutoffValidator.getWibTime();
    return {
      statusCode: HttpStatus.OK,
      data,
      currentWibTime: cutoffStatus,
      cutoffNotice: 'Modifikasi menu dan pengiriman H+1 ditutup setiap hari kerja pukul 20.00 WIB. Dapur libur Sabtu dan Minggu.',
    };
  }

  @Patch(':id/pause')
  async pause(@Param('id') id: string, @Body() body: PauseResumeDto) {
    const data = await this.subscriptionService.pauseSubscription(id, body.effectiveDate);
    return {
      statusCode: HttpStatus.OK,
      message: `Langganan berhasil di-pause efektif mulai tanggal ${body.effectiveDate}.`,
      data,
    };
  }

  @Patch(':id/resume')
  async resume(@Param('id') id: string, @Body() body: PauseResumeDto) {
    const data = await this.subscriptionService.resumeSubscription(id, body.effectiveDate);
    return {
      statusCode: HttpStatus.OK,
      message: `Langganan berhasil diaktifkan kembali mulai tanggal ${body.effectiveDate}.`,
      data,
    };
  }

  @Patch(':id/swap-menu')
  async swapMenu(@Param('id') id: string, @Body() body: SwapMenuDto) {
    const data = await this.subscriptionService.swapMenu(id, body.orderDate, {
      id: body.recipeId,
      title: body.recipeTitle,
    });
    return {
      statusCode: HttpStatus.OK,
      message: `Menu untuk tanggal ${body.orderDate} berhasil ditukar dengan "${body.recipeTitle}".`,
      data,
    };
  }

  @Patch(':id/skip-meal')
  async skipMeal(@Param('id') id: string, @Body() body: PauseResumeDto) {
    const data = await this.subscriptionService.skipMeal(id, body.effectiveDate);
    return {
      statusCode: HttpStatus.OK,
      message: `Pesanan tanggal ${body.effectiveDate} berhasil dilewati (skipped). Kuota dikompensasi ke akhir durasi.`,
      data,
    };
  }

  @Patch(':id/address')
  async updateAddress(@Param('id') id: string, @Body() body: UpdateAddressDto) {
    const data = await this.subscriptionService.updateDeliveryAddress(id, body.effectiveDate, {
      id: body.addressId,
      label: body.label,
      fullAddress: body.fullAddress,
    });
    return {
      statusCode: HttpStatus.OK,
      message: `Alamat pengiriman mulai tanggal ${body.effectiveDate} berhasil diperbarui ke ${body.label}.`,
      data,
    };
  }
}
