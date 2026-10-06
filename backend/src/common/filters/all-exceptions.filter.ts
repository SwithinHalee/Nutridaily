import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ApiException } from '../errors/api.exception';

interface ErrorBody {
  statusCode: number;
  code: string;
  message: string;
  requestId?: string;
  errors?: Array<{ field: string; message: string }>;
  details?: Record<string, unknown>;
}

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

/**
 * Single place that turns any thrown value into a JSON response.
 * - Known errors keep their status and safe message.
 * - Unknown errors become a generic 500. The stack trace is logged server side with the
 *   request id, and is never serialised to the client, in any environment.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      // WebSocket and other transports keep their own handling.
      throw exception;
    }

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string }>();
    const res = ctx.getResponse<Response>();
    const requestId = req.requestId;

    const { body, headers } = this.toBody(exception, requestId, req);

    if (body.statusCode >= 500) {
      const err = exception as Error;
      this.logger.error(
        `[${requestId}] ${req.method} ${req.originalUrl} -> ${body.statusCode}: ${err?.message ?? String(exception)}`,
        err?.stack,
      );
    } else if (body.statusCode === 401 || body.statusCode === 403 || body.statusCode === 429) {
      this.logger.warn(`[${requestId}] ${req.method} ${req.originalUrl} -> ${body.statusCode} ${body.code} ip=${req.ip}`);
    }

    if (headers) {
      for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
    }
    if (!res.headersSent) {
      res.status(body.statusCode).json(body);
    }
  }

  private toBody(
    exception: unknown,
    requestId: string | undefined,
    req: Request,
  ): { body: ErrorBody; headers?: Record<string, string> } {
    if (exception instanceof ApiException) {
      return {
        body: {
          statusCode: exception.getStatus(),
          code: exception.code,
          message: exception.message,
          requestId,
          ...(exception.details ? { details: exception.details } : {}),
        },
        headers: exception.headers,
      };
    }

    if (exception instanceof ZodError) {
      return { body: this.validationBody(exception, requestId) };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return {
          body: { statusCode: 409, code: 'CONFLICT', message: 'Data yang sama sudah terdaftar.', requestId },
        };
      }
      if (exception.code === 'P2025') {
        return { body: { statusCode: 404, code: 'NOT_FOUND', message: 'Data tidak ditemukan.', requestId } };
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      let message = exception.message;
      if (typeof response === 'object' && response !== null) {
        const raw = (response as { message?: unknown }).message;
        if (Array.isArray(raw)) message = raw.join(' ');
        else if (typeof raw === 'string') message = raw;
      }
      if (status === 404 && message.startsWith('Cannot ')) {
        // Nest's default "Cannot GET /x" echoes the path. Replace with a neutral message.
        message = 'Sumber daya tidak ditemukan.';
      }
      if (status === 413) message = 'Ukuran data permintaan terlalu besar.';
      if (status >= 500) {
        return { body: this.internalBody(requestId) };
      }
      return {
        body: { statusCode: status, code: STATUS_CODES[status] || 'ERROR', message, requestId },
      };
    }

    // body-parser errors (malformed JSON, too large) are plain errors with a status.
    const maybe = exception as { status?: number; type?: string };
    if (maybe && typeof maybe.status === 'number' && maybe.status >= 400 && maybe.status < 500) {
      const message =
        maybe.type === 'entity.too.large'
          ? 'Ukuran data permintaan terlalu besar.'
          : 'Format data permintaan tidak valid.';
      return {
        body: { statusCode: maybe.status, code: STATUS_CODES[maybe.status] || 'BAD_REQUEST', message, requestId },
      };
    }

    void req;
    return { body: this.internalBody(requestId) };
  }

  private validationBody(error: ZodError, requestId?: string): ErrorBody {
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      code: 'VALIDATION_FAILED',
      message: 'Data yang dikirim belum valid. Periksa kembali isian Anda.',
      requestId,
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.') || '_',
        message: issue.message,
      })),
    };
  }

  private internalBody(requestId?: string): ErrorBody {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kendala pada server. Silakan coba beberapa saat lagi.',
      requestId,
    };
  }
}
