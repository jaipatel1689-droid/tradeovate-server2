// src/lib/validate.js
const { z } = require('zod');

// Reusable primitives
const uuid = z.string().uuid({ message: 'user_id must be a valid UUID' });
const tradeRef = z
  .string()
  .min(1, 'trade_ref is required')
  .max(64, 'trade_ref too long');
const accountId = z
  .string()
  .min(1, 'account_id required')
  .regex(/^\d+$/, 'account_id must be numeric text');
const integerCents = z
  .number({ invalid_type_error: 'realized_pl_cents must be a number' })
  .int('realized_pl_cents must be an integer')
  .safe();

// ISO date (YYYY-MM-DD)
const dateYMD = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'pl_date must be YYYY-MM-DD');

// Schemas per route
const ledgerInsertSchema = z.object({
  user_id: uuid.optional(),          // you also support fallback in code
  account_id: accountId.optional(),  // default/fallback supported too
  trade_ref: tradeRef,
  realized_pl_cents: integerCents,
  pl_date: dateYMD,
});

const orderCreateSchema = z.object({
  user_id: uuid,
  order_id: z.string().min(1),
  symbol: z.string().toUpperCase().min(1),
  qty: z.number().int().positive(),
  side: z.enum(['buy', 'sell']),
  price: z.number().positive(),
  status: z.enum(['open', 'filled', 'canceled']).default('open'),
});

// Express middleware factory
function validateBody(schema) {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      const errors = parsed.error.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return res.status(400).json({ ok: false, errors });
    }
    // Use parsed (sanitized) data
    req.valid = parsed.data;
    next();
  };
}

module.exports = {
  validateBody,
  ledgerInsertSchema,
  orderCreateSchema,
};
