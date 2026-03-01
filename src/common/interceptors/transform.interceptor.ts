/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../api-response';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // Get the HTTP response object to extract status code
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode || 200;

        // If data is already an ApiResponse, return it as-is
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'message' in data
        ) {
          return data;
        }

        // Otherwise, wrap it in ApiResponse.success
        return ApiResponse.success(data, 'Request successful', statusCode);
      }),
    );
  }
}
