import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Role } from '../../../../prisma/generated/client/enums';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/auth-user';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { GuestDto } from './dto/guest.dto';

const publicUser = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;

const REFRESH_HASH_PREFIX = 'sha256:';

function hashRefreshToken(token: string) {
  return `${REFRESH_HASH_PREFIX}${createHash('sha256').update(token).digest('base64url')}`;
}

async function verifyRefreshToken(storedHash: string, token: string) {
  if (!storedHash.startsWith(REFRESH_HASH_PREFIX)) {
    // Keep sessions created before the fast refresh-token hashing migration valid.
    return argon2.verify(storedHash, token);
  }
  const actual = Buffer.from(storedHash);
  const expected = Buffer.from(hashRefreshToken(token));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: Role;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? null,
    role: user.role,
    createdAt: user.createdAt,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    if (
      await this.prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
    )
      throw new ConflictException(
        'Un compte existe déjà avec cette adresse e-mail.',
      );
    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        phone: dto.phone?.trim() || null,
        passwordHash: await argon2.hash(dto.password, {
          type: argon2.argon2id,
        }),
        role: Role.CUSTOMER,
      },
      select: publicUser,
    });
    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException(
        'Adresse e-mail ou mot de passe incorrect.',
      );
    return this.issueTokens(user);
  }

  async guest(dto: GuestDto) {
    const id = randomUUID();
    const user = await this.prisma.user.create({
      data: {
        id,
        name: dto.name.trim(),
        email: `guest+${id}@terrassebleue.local`,
        phone: dto.phone?.trim() || null,
        passwordHash: await argon2.hash(randomUUID(), {
          type: argon2.argon2id,
        }),
        role: Role.CUSTOMER,
      },
      select: publicUser,
    });
    return this.issueTokens(user);
  }

  async refresh(refreshToken: string) {
    let payload: AuthUser;
    try {
      payload = await this.jwt.verifyAsync<AuthUser>(refreshToken, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Jeton de renouvellement invalide.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (
      !user?.refreshTokenHash ||
      !(await verifyRefreshToken(user.refreshTokenHash, refreshToken))
    )
      throw new UnauthorizedException('Session expirée.');
    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
    return { success: true };
  }
  async me(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: publicUser,
    });
  }

  private async issueTokens(user: {
    id: string;
    email: string;
    role: Role;
    name: string;
    phone?: string | null;
    createdAt: Date;
  }) {
    const payload: AuthUser = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    const accessTtl = this.config.get<string>('JWT_ACCESS_TTL') ?? '15m';
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL') ?? '7d';
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: accessTtl as never,
      }),
      this.jwt.signAsync(payload, {
        secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: refreshTtl as never,
      }),
    ]);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashRefreshToken(refreshToken),
      },
    });
    return { user: toPublicUser(user), accessToken, refreshToken };
  }
}
