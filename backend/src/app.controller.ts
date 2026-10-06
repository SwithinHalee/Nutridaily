import { Controller, Get, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { renderKdsView } from './internal-views/kds-view';
import { renderAdminView } from './internal-views/admin-view';
import { renderPortalHomeView } from './internal-views/portal-home-view';

@Controller()
export class AppController {
  @Get('kds')
  getKdsView(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderKdsView());
  }

  @Get('admin')
  getAdminView(@Res() res: Response) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderAdminView());
  }

  @Get()
  getRoot(@Req() req: Request, @Res() res: Response) {
    const acceptHeader = req.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(renderPortalHomeView());
    }

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      service: 'NutriDaily Indonesia. Core REST API & Internal Staff Operations',
      version: '1.0.0',
      status: 'ONLINE',
      serverTimeWib: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      portals: {
        kdsInternalView: 'http://localhost:4000/kds',
        adminInternalView: 'http://localhost:4000/admin',
        customerFrontend: 'http://localhost:3000',
      },
      endpoints: {
        tdeeCalculator: 'POST /api/v1/health-profile/calculate',
        healthProfile: 'GET  /api/v1/health-profile/:userId',
        subscriptionDetail: 'GET  /api/v1/subscriptions/:id',
        subscriptionPause: 'PATCH /api/v1/subscriptions/:id/pause',
        subscriptionSwapMenu: 'PATCH /api/v1/subscriptions/:id/swap-menu',
        subscriptionAddress: 'PATCH /api/v1/subscriptions/:id/address',
        cleanLabelVerify: 'GET  /api/v1/recipes/verify/:qrCode',
        kdsTickets: 'GET  /api/v1/kds/tickets',
        kdsUpdateStatus: 'PATCH /api/v1/kds/tickets/:id/status',
        paymentSnap: 'POST /api/v1/payments/create-snap',
        midtransWebhook: 'POST /api/v1/payments/midtrans-webhook',
      },
      websocket: {
        namespace: '/kds',
        url: 'ws://localhost:4000/kds',
        description: 'Gateway real-time kitchen display system untuk tablet dapur sentral dan satelit hub.',
      },
    });
  }
}
