/**
 * Seeds default reference data and optional demo markets.
 *
 * Defaults (market types + expense categories) are created once if missing.
 * Demo data populates a handful of completed markets so the dashboard and
 * forecast look alive the first time the owner opens the app.
 */
import { randomUUID } from 'expo-crypto';

import { db } from './db/client';
import * as t from './db/schema';
import type { Repositories } from './repositories';

const DEFAULT_MARKET_TYPES = [
  'Craft Fair',
  'Farmers Market',
  'Holiday Market',
  'Pop-up',
  'Art Show',
];

/** name, isCOGS, sortOrder. Includes the Equipment/Vehicle Rental (U-Haul) category. */
const DEFAULT_CATEGORIES: Array<[string, boolean, number]> = [
  ['Vendor / Booth Fee', false, 10],
  ['Cost of Goods (COGS)', true, 20],
  ['Equipment / Vehicle Rental', false, 30],
  ['Travel (Gas / Mileage)', false, 40],
  ['Lodging', false, 50],
  ['Food / Meals', false, 60],
  ['Staff / Labor', false, 70],
  ['Supplies / Packaging', false, 80],
  ['Payment Processing Fees', false, 90],
  ['Marketing / Promo', false, 100],
  ['Booth Equipment / Displays', false, 110],
  ['Permits / Insurance / Tax', false, 120],
  ['Samples / Giveaways', false, 130],
];

const now = () => new Date().toISOString();

/** Create default market types and expense categories if none exist yet. */
export async function ensureSeededDefaults(): Promise<void> {
  const existingTypes = await db.select().from(t.marketTypes).limit(1);
  if (existingTypes.length === 0) {
    await db.insert(t.marketTypes).values(
      DEFAULT_MARKET_TYPES.map((name) => ({
        id: randomUUID(),
        name,
        isSystemDefault: true,
      })),
    );
  }

  const existingCategories = await db.select().from(t.expenseCategories).limit(1);
  if (existingCategories.length === 0) {
    await db.insert(t.expenseCategories).values(
      DEFAULT_CATEGORIES.map(([name, isCogs, sortOrder]) => ({
        id: randomUUID(),
        name,
        isCogs,
        isSystemDefault: true,
        sortOrder,
      })),
    );
  }
}

/** Whether any markets exist (used to decide if demo data is worth offering). */
export async function hasAnyMarkets(): Promise<boolean> {
  const rows = await db.select().from(t.markets).limit(1);
  return rows.length > 0;
}

type DemoSpec = {
  name: string;
  type: string;
  date: string;
  setup: number;
  selling: number;
  teardown: number;
  sales: number; // dollars
  fee: number; // dollars
  cogs: number; // dollars
  rental?: number; // dollars (U-Haul etc.)
  misc?: number; // dollars (travel/food/supplies bundled)
};

const DEMO: DemoSpec[] = [
  { name: 'Riverside Craft Fair', type: 'Craft Fair', date: '2026-01-18', setup: 60, selling: 360, teardown: 45, sales: 540, fee: 75, cogs: 150, misc: 40 },
  { name: 'Downtown Winter Market', type: 'Holiday Market', date: '2026-02-08', setup: 75, selling: 420, teardown: 60, sales: 820, fee: 120, cogs: 240, rental: 90, misc: 60 },
  { name: 'Maple Street Craft Fair', type: 'Craft Fair', date: '2026-02-22', setup: 60, selling: 360, teardown: 45, sales: 610, fee: 85, cogs: 175, misc: 45 },
  { name: 'Spring Farmers Market', type: 'Farmers Market', date: '2026-03-14', setup: 45, selling: 300, teardown: 30, sales: 320, fee: 40, cogs: 110, misc: 25 },
  { name: 'Artisan Pop-up', type: 'Pop-up', date: '2026-03-29', setup: 50, selling: 240, teardown: 40, sales: 410, fee: 60, cogs: 130, misc: 30 },
  { name: 'Lakeside Craft Fair', type: 'Craft Fair', date: '2026-04-12', setup: 60, selling: 360, teardown: 45, sales: 720, fee: 90, cogs: 190, rental: 80, misc: 50 },
  { name: 'Earth Day Art Show', type: 'Art Show', date: '2026-04-26', setup: 90, selling: 420, teardown: 60, sales: 950, fee: 150, cogs: 280, rental: 95, misc: 70 },
  { name: 'May Craft Fair', type: 'Craft Fair', date: '2026-05-17', setup: 60, selling: 360, teardown: 45, sales: 680, fee: 85, cogs: 180, misc: 48 },
];

/**
 * Populate demo markets. Assumes defaults are seeded. Looks up category and
 * type ids by name so the demo data wires into the real schema.
 */
export async function seedDemoData(repos: Repositories): Promise<void> {
  await ensureSeededDefaults();
  const [types, categories] = await Promise.all([
    repos.marketTypes.list(),
    repos.categories.list(),
  ]);
  const typeId = (name: string) => types.find((x) => x.name === name)?.id ?? null;
  const catId = (name: string) =>
    categories.find((x) => x.name === name)?.id ?? categories[0].id;

  const C = (dollars: number) => Math.round(dollars * 100);

  for (const d of DEMO) {
    const market = await repos.markets.create({
      name: d.name,
      marketTypeId: typeId(d.type),
      location: null,
      date: d.date,
      setupMinutes: d.setup,
      sellingMinutes: d.selling,
      teardownMinutes: d.teardown,
      status: 'completed',
    });

    await repos.sales.create({ marketId: market.id, amount: C(d.sales) });
    await repos.expenses.create({ marketId: market.id, categoryId: catId('Vendor / Booth Fee'), amount: C(d.fee) });
    await repos.expenses.create({ marketId: market.id, categoryId: catId('Cost of Goods (COGS)'), amount: C(d.cogs) });
    if (d.rental) {
      await repos.expenses.create({ marketId: market.id, categoryId: catId('Equipment / Vehicle Rental'), amount: C(d.rental) });
    }
    if (d.misc) {
      await repos.expenses.create({ marketId: market.id, categoryId: catId('Supplies / Packaging'), amount: C(d.misc) });
    }
  }

  // One upcoming planned market so the "planned" state is visible.
  await repos.markets.create({
    name: 'Summer Solstice Market',
    marketTypeId: typeId('Craft Fair'),
    location: null,
    date: '2026-06-20',
    setupMinutes: 60,
    sellingMinutes: 360,
    teardownMinutes: 45,
    status: 'planned',
  });
}
