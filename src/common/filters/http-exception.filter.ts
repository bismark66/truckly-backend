import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '../api-response';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let apiResponse: ApiResponse<null>;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message || exception.message;

      // Map HTTP status codes to appropriate ApiResponse methods
      switch (status) {
        case HttpStatus.NOT_FOUND:
          apiResponse = ApiResponse.notFound(message);
          break;
        case HttpStatus.BAD_REQUEST:
          apiResponse = ApiResponse.badRequest(message);
          break;
        case HttpStatus.UNAUTHORIZED:
          apiResponse = ApiResponse.unauthorized(message);
          break;
        case HttpStatus.FORBIDDEN:
          apiResponse = ApiResponse.forbidden(message);
          break;
        case HttpStatus.INTERNAL_SERVER_ERROR:
          apiResponse = ApiResponse.internalError(message);
          break;
        default:
          apiResponse = ApiResponse.error(message, null, status);
      }
    } else {
      // Handle non-HTTP exceptions
      this.logger.error('Unhandled exception:', exception);
      apiResponse = ApiResponse.internalError('An unexpected error occurred');
    }

    // Log the error
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(apiResponse);
  }
}
