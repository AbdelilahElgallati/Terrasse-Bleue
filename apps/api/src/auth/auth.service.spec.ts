import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Role } from '../../../../prisma/generated/client/enums';
import { AuthService } from './auth.service';

function setup() {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUniqueOrThrow: jest.fn(),
    },
  } as any;
  const jwt = {
    signAsync: jest
      .fn()
      .mockResolvedValueOnce('access-token-value-long')
      .mockResolvedValueOnce('refresh-token-value-long'),
    verifyAsync: jest.fn(),
  } as any;
  const config = { getOrThrow: jest.fn((key) => key), get: jest.fn() } as any;
  return { prisma, jwt, service: new AuthService(prisma, jwt, config) };
}
const safeUser = {
  id: 'user-1',
  name: 'Sofia',
  email: 'sofia@example.com',
  phone: null,
  role: Role.CUSTOMER,
  createdAt: new Date(),
};
describe('AuthService', () => {
  it('registers public users only as CUSTOMER', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(safeUser);
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUniqueOrThrow.mockResolvedValue(safeUser);
    const result = await service.register({
      name: 'Sofia',
      email: 'SOFIA@example.com',
      password: 'Password123!',
    });
    expect(prisma.user.create.mock.calls[0][0].data.role).toBe(Role.CUSTOMER);
    expect(prisma.user.create.mock.calls[0][0].data.passwordHash).not.toBe(
      'Password123!',
    );
    expect(result.user).toEqual(safeUser);
    expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(prisma.user.update.mock.calls[0][0].data.refreshTokenHash).toMatch(
      /^sha256:/,
    );
  });
  it('rejects duplicate email', async () => {
    const { service, prisma } = setup();
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(
      service.register({
        name: 'Sofia',
        email: 'sofia@example.com',
        password: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('logs in with a valid password', async () => {
    const { service, prisma } = setup();
    const passwordHash = await argon2.hash('Password123!');
    prisma.user.findUnique.mockResolvedValue({ ...safeUser, passwordHash });
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUniqueOrThrow.mockResolvedValue(safeUser);
    await expect(
      service.login({ email: safeUser.email, password: 'Password123!' }),
    ).resolves.toMatchObject({ user: safeUser });
  });
  it('rejects an invalid password', async () => {
    const { service, prisma } = setup();
    const passwordHash = await argon2.hash('Password123!');
    prisma.user.findUnique.mockResolvedValue({ ...safeUser, passwordHash });
    await expect(
      service.login({ email: safeUser.email, password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('preserves an ADMIN role during real authentication', async () => {
    const { service, prisma } = setup();
    const passwordHash = await argon2.hash('Password123!');
    const admin = { ...safeUser, role: Role.ADMIN, passwordHash };
    prisma.user.findUnique.mockResolvedValue(admin);
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      ...safeUser,
      role: Role.ADMIN,
    });
    await expect(
      service.login({ email: admin.email, password: 'Password123!' }),
    ).resolves.toMatchObject({ user: { role: Role.ADMIN } });
  });
  it('refreshes a valid stored refresh token', async () => {
    const { service, prisma, jwt } = setup();
    const refreshToken = 'refresh-token-value-long';
    jwt.verifyAsync.mockResolvedValue({
      id: safeUser.id,
      email: safeUser.email,
      role: Role.CUSTOMER,
    });
    prisma.user.findUnique.mockResolvedValue({
      ...safeUser,
      refreshTokenHash: await argon2.hash(refreshToken),
    });
    prisma.user.update.mockResolvedValue({});
    prisma.user.findUniqueOrThrow.mockResolvedValue(safeUser);
    await expect(service.refresh(refreshToken)).resolves.toMatchObject({
      user: safeUser,
    });
  });
  it('refreshes a token stored with the fast hash format', async () => {
    const { service, prisma, jwt } = setup();
    const refreshToken = 'refresh-token-value-long';
    jwt.verifyAsync.mockResolvedValue({
      id: safeUser.id,
      email: safeUser.email,
      role: Role.CUSTOMER,
    });
    prisma.user.findUnique.mockResolvedValue({
      ...safeUser,
      refreshTokenHash:
        'sha256:xy6RjXINV_fjwp-I_lxPC9H-fks7n8BDZAIIaA7LlpY',
    });
    prisma.user.update.mockResolvedValue({});
    await expect(service.refresh(refreshToken)).resolves.toMatchObject({
      user: safeUser,
    });
  });
  it('rejects an invalid refresh token', async () => {
    const { service, jwt } = setup();
    jwt.verifyAsync.mockRejectedValue(new Error('invalid signature'));
    await expect(
      service.refresh('invalid-refresh-token-value'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('logs out by revoking the stored refresh token', async () => {
    const { service, prisma } = setup();
    prisma.user.update.mockResolvedValue({});
    await expect(service.logout(safeUser.id)).resolves.toEqual({
      success: true,
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: safeUser.id },
      data: { refreshTokenHash: null },
    });
  });
});
