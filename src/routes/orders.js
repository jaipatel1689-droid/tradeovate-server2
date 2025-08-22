// src/routes/orders.js
const express = require('express');
const { validateBody, orderCreateSchema } = require('../lib/validate');

const router = express.Router();

const orders = []; // in-memory list for now

// POST /orders  -> validate request then push in-memory
router.post('/', validateBody(orderCreateSchema), (req, res) => {
  const { user_id, order_id, symbol, qty, side, price, status } = req.valid;

  const row = {
    id: orders.length + 1,
    order_id,
    user_id,
    symbol,
    qty,
    side,
    price,
    status,
    created_at: new Date().toISOString(),
  };

  orders.push(row);
  res.status(201).json(row);
});

// GET /orders
router.get('/', (_req, res) => {
  res.json(orders);
});

module.exports = router;
