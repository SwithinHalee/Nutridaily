import { Controller, Post, Body, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { PaymentsService, CreateSnapTransactionDto } from './payments.service';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create-snap')
  @HttpCode(HttpStatus.CREATED)
  async createSnap(@Body() body: CreateSnapTransactionDto) {
    const result = await this.paymentsService.createSnapTransaction(body);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Token pembayaran Midtrans Snap berhasil dibuat.',
      data: result,
    };
  }

  @Post('midtrans-webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() payload: any) {
    // 1. Signature validation
    const isValid = this.paymentsService.verifyMidtransSignature(payload);
    if (!isValid) {
      throw new UnauthorizedException('Midtrans Webhook Signature tidak valid.');
    }

    // 2. Process with idempotency
    const result = await this.paymentsService.handleMidtransWebhook(payload);

    return {
      statusCode: HttpStatus.OK,
      message: 'Webhook Midtrans berhasil diproses.',
      data: result,
    };
  }
}
