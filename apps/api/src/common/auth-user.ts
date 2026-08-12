import type { Role } from '../../../../prisma/generated/client/enums';

export type AuthUser = { id: string; email: string; role: Role };
