import { BadRequestException, HttpException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function setup() {
  const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const host = {
    switchToHttp: () => ({ getResponse: () => response }),
  } as ArgumentsHost;
  return { filter: new ApiExceptionFilter(), host, response };
}

describe('ApiExceptionFilter', () => {
  it('preserves useful client validation errors', () => {
    const { filter, host, response } = setup();
    filter.catch(new BadRequestException(['email must be an email']), host);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('sanitizes internal and unknown errors', () => {
    const { filter, host, response } = setup();
    filter.catch(new Error('Prisma database internals'), host);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Une erreur interne est survenue.',
    });
    const second = setup();
    second.filter.catch(
      new HttpException('sensitive upstream detail', 503),
      second.host,
    );
    expect(second.response.json).toHaveBeenCalledWith({
      statusCode: 503,
      message: 'Une erreur interne est survenue.',
    });
  });
});
