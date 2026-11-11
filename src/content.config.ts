import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One JSON file per product. Pages CMS edits these files (see .pages.yml).
const products = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/products' }),
  schema: z.object({
    sku: z.string().min(1),
    name: z.string().min(1), // as printed on the pack; not translated
    description: z.string().max(300).optional(), // optional short line, shown as written in every language
    category: z.string().min(1), // id of a file in src/content/categories
    unitWeight: z.object({
      value: z.number().positive(),
      unit: z.enum(['g', 'kg', 'ml', 'l', 'pcs']),
    }),
    moq: z.object({
      value: z.number().int().positive(),
      unit: z.enum(['pcs', 'carton', 'pallet', 'kg']),
    }),
    image: z.string().min(1), // file name in src/assets/products
    published: z.boolean().default(true),
    featured: z.boolean().default(false), // shown in the home page carousel
    order: z.number().default(100),
  }),
});

// Categories are maintained by the developer; names exist per language.
const categories = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/categories' }),
  schema: z.object({
    name: z.object({ en: z.string().min(1) }).catchall(z.string()),
    order: z.number().default(100),
  }),
});

export const collections = { products, categories };
