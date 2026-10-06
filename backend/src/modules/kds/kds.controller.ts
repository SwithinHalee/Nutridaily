import { Controller, Get, Patch, Post, Param, Body, HttpStatus } from '@nestjs/common';
import { KDSService, KDSTicketStatus } from './kds.service';
import { KDSGateway } from './kds.gateway';

@Controller('api/v1/kds')
export class KDSController {
  constructor(
    private readonly kdsService: KDSService,
    private readonly kdsGateway: KDSGateway
  ) {}

  @Get('tickets')
  async getTickets() {
    const tickets = await this.kdsService.getAllTickets();
    return {
      statusCode: HttpStatus.OK,
      data: tickets,
    };
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: KDSTicketStatus }
  ) {
    const updated = await this.kdsService.updateTicketStatus(id, body.status);
    if (this.kdsGateway.server) {
      this.kdsGateway.server.emit('kds:ticket_updated', updated);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `Status tiket ${id} diubah menjadi ${body.status}`,
      data: updated,
    };
  }

  @Post('tickets/archive-dispatched')
  async archiveDispatched() {
    const archived = await this.kdsService.archiveAllDispatched();
    if (this.kdsGateway.server) {
      this.kdsGateway.server.emit('kds:tickets_archived', archived);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `${archived.length} pesanan terkirim berhasil diarsipkan`,
      data: archived,
    };
  }

  @Post('tickets/:id/archive')
  async archiveSingleTicket(@Param('id') id: string) {
    const archived = await this.kdsService.archiveDispatchedTicket(id);
    if (this.kdsGateway.server) {
      this.kdsGateway.server.emit('kds:ticket_updated', archived);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `Tiket ${id} berhasil diarsipkan`,
      data: archived,
    };
  }

  @Post('tickets/:id/restore')
  async restoreSingleTicket(@Param('id') id: string) {
    const restored = await this.kdsService.restoreArchivedTicket(id);
    if (this.kdsGateway.server) {
      this.kdsGateway.server.emit('kds:ticket_updated', restored);
    }
    return {
      statusCode: HttpStatus.OK,
      message: `Tiket ${id} berhasil dikembalikan ke antrean`,
      data: restored,
    };
  }
}
