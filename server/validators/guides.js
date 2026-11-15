import { z } from 'zod';
import { GUIDE_ICONS } from '../data/guidesDefaults.js';

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,47}$/i;

function text(max, { required = false } = {}) {
  const base = z.string().max(max, `Text too long (max ${max} characters).`);
  return required ? base.refine((v) => v.trim().length > 0, 'Required text is empty.') : base;
}

function localized(max) {
  return z.object({
    es: text(max, { required: true }),
    en: text(max).optional(),
    pt: text(max).optional(),
  });
}

const idSchema = z.string().trim().regex(ID_RE, 'Ids must be 1-48 characters: letters, numbers, - or _.');

const itemSchema = z.object({
  id: idSchema,
  title: localized(120),
  body: localized(60000),
});

const categorySchema = z.object({
  id: idSchema,
  icon: z.enum(GUIDE_ICONS, { errorMap: () => ({ message: 'Icon is not in the allowed list.' }) }),
  title: localized(120),
  items: z.array(itemSchema).max(40, 'A category can have at most 40 items.'),
});

export const guidesSchema = z
  .object({
    intro: localized(20000).optional(),
    categories: z.array(categorySchema).max(20, 'At most 20 categories.'),
  })
  .superRefine((data, ctx) => {
    const cats = new Set();
    const items = new Set();
    data.categories.forEach((c, ci) => {
      const ck = c.id.toLowerCase();
      if (cats.has(ck)) {
        ctx.addIssue({ code: 'custom', message: `Duplicate category id: ${c.id}`, path: ['categories', ci, 'id'] });
      }
      cats.add(ck);
      c.items.forEach((it, ii) => {
        const ik = it.id.toLowerCase();
        if (items.has(ik) || cats.has(ik)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate id: ${it.id}`,
            path: ['categories', ci, 'items', ii, 'id'],
          });
        }
        items.add(ik);
      });
    });
  });
