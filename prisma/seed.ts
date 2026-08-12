import 'dotenv/config';
import * as argon2 from 'argon2';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from './generated/client/client';

type MenuProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  image_url: string | null;
  source_status: 'approx' | 'demo';
  sort_order: number;
};
type MenuCategory = { id: string; name: string; products: MenuProduct[] };
type MenuSeed = {
  meta: { restaurant: string; location: string; currency: string; warning: string };
  categories: MenuCategory[];
};

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL is required to seed the database.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

function stableUuid(namespace: 'category' | 'product', sourceId: string) {
  const bytes = Buffer.from(createHash('sha256').update(`terrasse-bleue:${namespace}:${sourceId}`).digest().subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function imageKey(categoryId: string) {
  const keys: Record<string, string> = {
    crepes: 'crepes', glaces: 'ice-cream', smoothies: 'smoothies', breakfast: 'breakfast',
    entrees: 'salads', poelees: 'skillet', pizzas: 'pizza', sandwiches: 'sandwiches',
    brunch: 'breakfast', sea_snacks: 'seafood', moroccan: 'tagine', fruit: 'fruit',
    desserts: 'dessert', mains: 'skillet',
  };
  return keys[categoryId] ?? 'tagine';
}

async function main() {
  const sourcePath = resolve(process.cwd(), 'prisma/data/terrasse_bleue_demo_seed.json');
  const menu = JSON.parse(await readFile(sourcePath, 'utf8')) as MenuSeed;
  if (menu.meta.currency !== 'MAD') throw new Error(`Unsupported seed currency: ${menu.meta.currency}`);

  const categoryIds = menu.categories.map((category) => stableUuid('category', category.id));
  const productIds = menu.categories.flatMap((category) => category.products.map((product) => stableUuid('product', product.id)));
  await prisma.category.updateMany({ where: { id: { notIn: categoryIds } }, data: { isActive: false } });
  await prisma.product.updateMany({ where: { id: { notIn: productIds } }, data: { isAvailable: false } });

  for (const [categoryIndex, category] of menu.categories.entries()) {
    const categoryId = stableUuid('category', category.id);
    await prisma.category.upsert({
      where: { id: categoryId },
      update: { name: category.name, description: null, imageUrl: imageKey(category.id), sortOrder: categoryIndex + 1, isActive: true },
      create: { id: categoryId, name: category.name, imageUrl: imageKey(category.id), sortOrder: categoryIndex + 1 },
    });
    for (const product of category.products) {
      const productId = stableUuid('product', product.id);
      const data = {
        categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.image_url ?? imageKey(category.id),
        isAvailable: product.available,
        isFeatured: product.name.toLocaleLowerCase('fr').includes('signature') || product.sort_order <= 4,
      };
      await prisma.product.upsert({ where: { id: productId }, update: data, create: { id: productId, ...data } });
    }
  }

  const seedCustomerPassword = process.env.SEED_CUSTOMER_PASSWORD?.trim();
  if (seedCustomerPassword) {
    if (seedCustomerPassword.length < 12) throw new Error('SEED_CUSTOMER_PASSWORD must contain at least 12 characters.');
    const passwordHash = await argon2.hash(seedCustomerPassword, { type: argon2.argon2id });
    await prisma.user.upsert({
      where: { email: 'client@terrassebleue.local' },
      update: { name: 'Client Démo', passwordHash },
      create: { name: 'Client Démo', email: 'client@terrassebleue.local', phone: '+212600000000', passwordHash, role: Role.CUSTOMER },
    });
  }
  const productCount = menu.categories.reduce((total, category) => total + category.products.length, 0);
  console.info(`Seed complete: ${menu.categories.length} café sections, ${productCount} products${seedCustomerPassword ? ', 1 customer' : ''}.`);
  console.info(`Seed notice: ${menu.meta.warning}`);
}

main().finally(() => prisma.$disconnect());
