export class ApiResponse<T> {
  data: T | null;
  message: string;
  success: boolean;
  statusCode: number;

  constructor(
    data: T | null,
    message: string = 'Success',
    success: boolean = true,
    statusCode: number = 200,
  ) {
    this.data = data;
    this.message = message;
    this.success = success;
    this.statusCode = statusCode;
  }

  static success<T>(
    data: T,
    message: string = 'Success',
    statusCode: number = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>(data, message, true, statusCode);
  }

  static error<T = null>(
    message: string = 'Error',
    data: T | null = null,
    statusCode: number = 500,
  ): ApiResponse<T> {
    return new ApiResponse<T>(data, message, false, statusCode);
  }

  static notFound<T = null>(message: string = 'Not Found'): ApiResponse<T> {
    return new ApiResponse<T>(null, message, false, 404);
  }

  static badRequest<T = null>(message: string = 'Bad Request'): ApiResponse<T> {
    return new ApiResponse<T>(null, message, false, 400);
  }

  static unauthorized<T = null>(
    message: string = 'Unauthorized',
  ): ApiResponse<T> {
    return new ApiResponse<T>(null, message, false, 401);
  }

  static forbidden<T = null>(message: string = 'Forbidden'): ApiResponse<T> {
    return new ApiResponse<T>(null, message, false, 403);
  }

  static internalError<T = null>(
    message: string = 'Internal Server Error',
  ): ApiResponse<T> {
    return new ApiResponse<T>(null, message, false, 500);
  }

  static custom<T>(
    data: T | null,
    message: string,
    success: boolean,
    statusCode: number = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>(data, message, success, statusCode);
  }
}
