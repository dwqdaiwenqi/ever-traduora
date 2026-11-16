import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { CodedException } from '../errors';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof CodedException) {
      // 登录相关的结果保留自己的状态码和 code
      response.setHeader('Cache-Control', 'no-store');
      response.status(exception.getStatus()).json({
        error: {
          code: exception.code,
          message: exception.message,
          ...(exception.details ? { details: exception.details } : {}),
        },
      });
    } else if (
      // Re-map forbidden to not found (TypeORM 0.3 names the error 'EntityNotFoundError', older versions 'EntityNotFound')
      exception.name === 'EntityNotFoundError' ||
      exception.name === 'EntityNotFound' ||
      exception.status === 404 ||
      exception.status === 403
    ) {
      response.status(404).json({
        error: {
          code: 'NotFound',
          message: 'The requested resource could not be found',
        },
      });
    } else if (this.isInvalidUuidError(exception)) {
      // PostgreSQL UUID syntax errors should be treated as "not found"
      response.status(404).json({
        error: {
          code: 'NotFound',
          message: 'The requested resource could not be found',
        },
      });
    } else if (this.isUniqueConstraintViolation(exception)) {
      response.status(409).json({
        error: {
          code: 'AlreadyExists',
          message: 'This resource already exists',
        },
      });
    } else if (exception.status === 401) {
      response.status(401).json({
        error: {
          code: 'Unauthorized',
          message: 'You are not authorized to access this resource',
        },
      });
    } else if (exception.status === 400 || exception.code === 'ER_DATA_TOO_LONG') {
      response.status(400).json({
        error: {
          code: 'BadRequest',
          message: 'Your request seems to be invalid or malformed',
        },
      });
    } else if (exception.status === 429) {
      response.status(429).json({
        error: {
          code: 'TooManyRequests',
          message: 'You are sending too many requests, please try again later',
        },
      });
    } else if (exception.status === 422) {
      response.status(422).json({
        error: {
          code: 'UnprocessableEntity',
          message: 'We understood the request, but are unable to process it',
        },
      });
    } else if (exception.status === 402) {
      response.status(402).json({
        error: {
          code: 'PaymentRequired',
          message: 'You seem to have reached your plan limit',
        },
      });
    } else if (exception.status === 413) {
      response.status(413).json({
        error: {
          code: 'PayloadTooLarge',
          message: 'Payload too large',
        },
      });
    } else {
      console.error(exception);
      response.status(500).json({
        error: {
          code: 'Internal',
          // tslint:disable-next-line:quotemark
          message: "Something wen't wrong, that's all we know",
        },
      });
    }
  }
  private isUniqueConstraintViolation(exception: any): boolean {
    return (
      exception.status === 409 ||
      (exception.name === 'QueryFailedError' && exception.code === 'ER_DUP_ENTRY') || // MySQL
      (exception.name === 'QueryFailedError' && exception.code === '23505') // PostgreSQL unique constraint violation
    );
  }

  private isInvalidUuidError(exception: any): boolean {
    return (
      exception.name === 'QueryFailedError' &&
      exception.code === '22P02' && // PostgreSQL invalid input syntax error
      exception.message &&
      exception.message.includes('invalid input syntax for type uuid')
    );
  }
}
