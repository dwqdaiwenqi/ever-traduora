import { HttpException, HttpStatus } from '@nestjs/common';

export class TooManyRequestsException extends HttpException {
  constructor(message?: string | object | any, error: string = 'TooManyRequests') {
    super(HttpException.createBody(message, error, HttpStatus.TOO_MANY_REQUESTS), HttpStatus.TOO_MANY_REQUESTS);
  }
}
export class ConflictException extends HttpException {
  constructor(message?: string | object | any, error: string = 'AlreadyExists') {
    super(HttpException.createBody(message, error, HttpStatus.CONFLICT), HttpStatus.CONFLICT);
  }
}

/**
 * 前端需要据此做出反应的错误：返回自己的状态码和稳定的 `code`（比如邮箱还没被添加、需要密码登录），
 * 而不是被统一成 404 / 401 的通用提示。不会携带任何 token。
 */
export class CodedException extends HttpException {
  constructor(
    status: HttpStatus,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message, status);
  }
}

export class PaymentRequiredException extends HttpException {
  constructor(message?: string | object | any, error: string = 'PaymentRequired') {
    super(HttpException.createBody(message, error, HttpStatus.PAYMENT_REQUIRED), HttpStatus.PAYMENT_REQUIRED);
  }
}
