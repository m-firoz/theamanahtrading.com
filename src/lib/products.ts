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

/** Broad groups shown on the website, in display order. Names live in the UI strings (groups.*). */
export const groupIds = ['rice', 'spices', 'herbs-vegetables', 'pulses-snacks', 'dairy'] as const;
export type GroupId = (typeof groupIds)[number];

export type Category = { id: string; names: Record<string, string>; order: number; group: GroupId };
export type Product = {
  slug: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  group: GroupId; // broad public group, derived from the category
  unitWeight?: string;
  moq: { value: number; unit: string };
  image: ImageMetadata; // the product photo
  featured: boolean;
  order: number;
};

export async function getCategories(): Promise<Category[]> {
  const entries = await getCollection('categories');
  return entries
    .map((e) => ({ id: e.id, names: e.data.name as Record<string, string>, order: e.data.order, group: e.data.group as GroupId }))
    .sort((a, b) => a.order - b.order);
}

export const categoryName = (c: Category, locale: Locale) => c.names[locale] || c.names.en;

/** Published products, validated. A bad entry fails the build, so the live site is never broken. */
export async function getProducts(): Promise<Product[]> {
  const [entries, cats] = await Promise.all([getCollection('products'), getCategories()]);
  const catIds = new Set(cats.map((c) => c.id));
  const groupByCat = new Map(cats.map((c) => [c.id, c.group] as const));
  const catOrder = new Map(cats.map((c) => [c.id, c.order] as const));
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const e of entries) {
    const d = e.data;
    if (!d.published) continue;
    if (!catIds.has(d.category)) {
      throw new Error(`Product ${d.sku}: unknown category "${d.category}". Known: ${[...catIds].join(', ')}`);
    }
    const images = d.images.map((file) => {
      const found = findImage(file);
      if (!found) throw new Error(`Product ${d.sku}: image "${file}" not found in src/assets/products`);
      return found;
    });
    if (seen.has(d.sku.toLowerCase())) throw new Error(`Duplicate SKU: ${d.sku}`);
    seen.add(d.sku.toLowerCase());
    out.push({
      slug: e.id, sku: d.sku, name: d.name, description: d.description, category: d.category,
      group: groupByCat.get(d.category)!, unitWeight: d.unitWeight, moq: d.moq, image: images[0],
      featured: d.featured, order: d.order,
    });
  }
  // Catalogue order: by broad group, then detailed category, then the product's own order, then name.
  const gi = (g: GroupId) => groupIds.indexOf(g);
  return out.sort((a, b) =>
    gi(a.group) - gi(b.group) ||
    (catOrder.get(a.category)! - catOrder.get(b.category)!) ||
    a.order - b.order || a.name.localeCompare(b.name));
}
