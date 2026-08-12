import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../../prisma/generated/client/enums';
import { RolesGuard } from './roles.guard';

function context(role: Role) {
  return {
    getHandler: () => null,
    getClass: () => null,
    switchToHttp: () => ({
      getRequest: () => ({
        user: { id: 'user-1', email: 'user@example.com', role },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('rejects CUSTOMER from restaurant endpoints', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue([Role.ADMIN, Role.MANAGER, Role.STAFF]),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context(Role.CUSTOMER))).toBe(
      false,
    );
  });
  it('allows STAFF on restaurant operational endpoints', () => {
    const reflector = {
      getAllAndOverride: jest
        .fn()
        .mockReturnValue([Role.ADMIN, Role.MANAGER, Role.STAFF]),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context(Role.STAFF))).toBe(
      true,
    );
  });
  it('rejects STAFF from ADMIN-only mutations', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.ADMIN, Role.MANAGER]),
    } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(context(Role.STAFF))).toBe(
      false,
    );
  });
  it.each([Role.MANAGER, Role.ADMIN])(
    'allows %s on privileged mutations',
    (role) => {
      const reflector = {
        getAllAndOverride: jest
          .fn()
          .mockReturnValue([Role.ADMIN, Role.MANAGER]),
      } as unknown as Reflector;
      expect(new RolesGuard(reflector).canActivate(context(role))).toBe(true);
    },
  );
});
