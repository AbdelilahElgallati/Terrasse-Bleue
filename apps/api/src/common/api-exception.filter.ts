import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status < 500)
        return response.status(status).json(exception.getResponse());
      this.log(exception);
      return response.status(status).json({
        statusCode: status,
        message: 'Une erreur interne est survenue.',
      });
    }
    this.log(exception);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Une erreur interne est survenue.',
    });
  }

  private log(exception: unknown) {
    this.logger.error(
      exception instanceof Error ? exception.message : 'Unknown API exception',
      exception instanceof Error ? exception.stack : undefined,
    );
  }
}
