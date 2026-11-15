const mongoose = require('mongoose');
const SalesLog = require('./sales.model');
const Product = require('../products/product.model');

/**
 * Batch insert sales log entries and deduct stock in bulk.
 * @param {string} userId
 * @param {Array<{productId, quantitySold, date, source}>} entries
 */
async function batchLogSales(userId, entries) {
  if (!entries || entries.length === 0) {
    const err = new Error('No sales entries provided');
    err.statusCode = 400;
    throw err;
  }

  // Stamp userId on every entry before bulk insert
  const docs = entries.map((e) => ({
    userId,
    productId: e.productId,
    quantitySold: e.quantitySold,
    date: e.date ? new Date(e.date) : new Date(),
    source: e.source || 'manual',
  }));

  const inserted = await SalesLog.insertMany(docs, { ordered: false });

  // ── Bulk-update currentStock for each affected product ─────────────────────
  // Aggregate total sold per product from this batch
  const stockDelta = {};
  for (const doc of docs) {
    const key = doc.productId.toString();
    stockDelta[key] = (stockDelta[key] || 0) + doc.quantitySold;
  }

  const bulkOps = Object.entries(stockDelta).map(([productId, totalSold]) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(productId), userId },
      update: { $inc: { currentStock: -totalSold } },
    },
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps);
  }

  return inserted;
}

/**
 * Retrieve sales history with optional filters.
 * @param {string} userId
 * @param {{ productId?, from?, to?, limit? }} options
 */
async function getSalesHistory(userId, { productId, from, to, limit = 100 } = {}) {
  const filter = { userId };

  if (productId) filter.productId = productId;

  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  const logs = await SalesLog.find(filter)
    .populate('productId', 'name unit category')
    .sort({ date: -1 })
    .limit(parseInt(limit));

  return logs;
}

/**
 * Aggregate total sales for a given date grouped by product.
 * @param {string} userId
 * @param {string|Date} date - ISO date string or Date object
 */
async function getDailySalesSummary(userId, date) {
  const targetDate = new Date(date);
  // Build start/end of the target day in UTC
  const start = new Date(targetDate);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setUTCHours(23, 59, 59, 999);

  const summary = await SalesLog.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$productId',
        totalQuantitySold: { $sum: '$quantitySold' },
        entries: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        productName: '$product.name',
        category: '$product.category',
        unit: '$product.unit',
        totalQuantitySold: 1,
        entries: 1,
      },
    },
    { $sort: { totalQuantitySold: -1 } },
  ]);

  return summary;
}

module.exports = { batchLogSales, getSalesHistory, getDailySalesSummary };
