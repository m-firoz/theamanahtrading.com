import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/config';

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/products/*.{png,jpg,jpeg,webp}',
  { eager: true },
);

// Match by file name only, so it does not matter which folder prefix the CMS writes.
function findImage(file: string): ImageMetadata | undefined {
  const base = file.split('/').pop()!.toLowerCase();
  const key = Object.keys(images).find((k) => k.split('/').pop()!.toLowerCase() === base);
  return key ? images[key].default : undefined;
}

export type Category = { id: string; names: Record<string, string>; order: number };
export type Product = {
  slug: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  unitWeight: { value: number; unit: string };
  moq: { value: number; unit: string };
  image: ImageMetadata;
  featured: boolean;
  order: number;
};

export async function getCategories(): Promise<Category[]> {
  const entries = await getCollection('categories');
  return entries
    .map((e) => ({ id: e.id, names: e.data.name as Record<string, string>, order: e.data.order }))
    .sort((a, b) => a.order - b.order);
}

export const categoryName = (c: Category, locale: Locale) => c.names[locale] || c.names.en;

/** Published products, validated. A bad entry fails the build, so the live site is never broken. */
export async function getProducts(): Promise<Product[]> {
  const [entries, cats] = await Promise.all([getCollection('products'), getCategories()]);
  const catIds = new Set(cats.map((c) => c.id));
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const e of entries) {
    const d = e.data;
    if (!d.published) continue;
    if (!catIds.has(d.category)) {
      throw new Error(`Product ${d.sku}: unknown category "${d.category}". Known: ${[...catIds].join(', ')}`);
    }
    const image = findImage(d.image);
    if (!image) {
      throw new Error(`Product ${d.sku}: image "${d.image}" not found in src/assets/products`);
    }
    if (seen.has(d.sku.toLowerCase())) throw new Error(`Duplicate SKU: ${d.sku}`);
    seen.add(d.sku.toLowerCase());
    out.push({
      slug: e.id, sku: d.sku, name: d.name, description: d.description, category: d.category,
      unitWeight: d.unitWeight, moq: d.moq, image, featured: d.featured, order: d.order,
    });
  }
  return out.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
