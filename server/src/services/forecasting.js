/**
 * InventIQ Forecasting Engine
 * Algorithm: Weighted Moving Average + Seasonal Multipliers + Safety Stock
 */

const SalesLog = require('../modules/sales/sales.model');
const Product = require('../modules/products/product.model');

// Seasonal multipliers
const WEEKEND_MULTIPLIER = 1.15;     // Fri / Sat / Sun see higher footfall
const SALARY_WEEK_MULTIPLIER = 1.25; // 1st–7th of month: salary week boost
const Z_SCORE_95 = 1.65;             // z-score for 95% service level

/**
 * Return a composite seasonal multiplier for a given date.
 * Weekend + salary-week effects stack multiplicatively.
 */
function getSeasonalMultiplier(date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();   // 0 = Sun, 5 = Fri, 6 = Sat
  const dayOfMonth = d.getDate();
  let multiplier = 1.0;
  if (dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6) {
    multiplier *= WEEKEND_MULTIPLIER;
  }
  if (dayOfMonth >= 1 && dayOfMonth <= 7) {
    multiplier *= SALARY_WEEK_MULTIPLIER;
  }
  return multiplier;
}

/**
 * Population standard deviation of an array of numbers.
 * Returns 0 for arrays shorter than 2 elements (no spread to measure).
 */
function stdDev(arr) {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Weighted Moving Average — linearly increasing weights so recent days
 * count more than older days.
 * e.g. for n=7: weights are 1,2,3,4,5,6,7 (newest = 7)
 */
function weightedMovingAverage(dailySales) {
  const n = dailySales.length;
  if (n === 0) return 0;
  const totalWeight = (n * (n + 1)) / 2;
  const wma = dailySales.reduce((sum, val, idx) => sum + val * (idx + 1), 0) / totalWeight;
  return wma;
}

/**
 * Main forecasting function — runs for all active products of a user.
 * Returns an array of reorder suggestion items sorted by urgency.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<Array>}
 */
async function generateForecast(userId) {
  const products = await Product.find({ userId, isActive: true }).populate('distributorId');
  const today = new Date();
  const lookbackDate = new Date(today);
  lookbackDate.setDate(today.getDate() - 28); // 28-day rolling window

  const suggestions = [];

  for (const product of products) {
    // ── Fetch 28 days of sales logs for this product ─────────────────────────
    const salesLogs = await SalesLog.find({
      userId,
      productId: product._id,
      date: { $gte: lookbackDate, $lte: today },
    }).sort({ date: 1 });

    // ── Build a daily totals map: "YYYY-MM-DD" → total qty ──────────────────
    const dailyMap = {};
    for (const log of salesLogs) {
      const key = log.date.toISOString().split('T')[0];
      dailyMap[key] = (dailyMap[key] || 0) + log.quantitySold;
    }

    // ── Fill missing days with 0 so the array always has 28 elements ────────
    const dailySales = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailySales.push(dailyMap[key] || 0);
    }

    // ── WMA on the most recent 7 days ────────────────────────────────────────
    const recent7 = dailySales.slice(-7);
    const avgDailySales = weightedMovingAverage(recent7);

    // ── Seasonal-adjusted 7-day demand forecast ──────────────────────────────
    let forecastedDemand7d = 0;
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      forecastedDemand7d += avgDailySales * getSeasonalMultiplier(futureDate);
    }
    forecastedDemand7d = Math.ceil(forecastedDemand7d);

    // ── Dynamic Lead Time: Actual turnaround vs promised deliveryDays ───────
    const promisedLeadTime = product.distributorId?.deliveryDays || 3;
    const actualLeadTime = product.distributorId?.effectiveLeadTime || promisedLeadTime;
    const leadTimeDays = actualLeadTime;
    const delayBufferDays = Math.max(0, Number((actualLeadTime - promisedLeadTime).toFixed(1)));
    const onTimeRate = product.distributorId?.onTimeRate ?? 100;

    // ── Safety stock: absorbs demand variability & vendor delivery delays ────
    const sigma = stdDev(recent7);
    const safetyStock = Math.ceil(Z_SCORE_95 * sigma * Math.sqrt(leadTimeDays));

    // ── Reorder point: average consumption during lead time + safety buffer ──
    const reorderPoint = Math.ceil(avgDailySales * leadTimeDays) + safetyStock;

    // Only include products at or below their reorder point
    if (product.currentStock > reorderPoint) continue;

    // ── Suggested order quantity rounded up to nearest pack size ─────────────
    const rawOrderQty = Math.max(
      forecastedDemand7d + safetyStock - product.currentStock,
      product.packSize
    );
    const suggestedOrderQty = Math.ceil(rawOrderQty / product.packSize) * product.packSize;
    const suggestedCartons = suggestedOrderQty / product.packSize;

    // ── Urgency based on remaining days of stock ─────────────────────────────
    let urgency = 'low';
    const daysOfStock = avgDailySales > 0 ? product.currentStock / avgDailySales : Infinity;
    if (daysOfStock <= 1) urgency = 'critical';
    else if (daysOfStock <= 3) urgency = 'high';
    else if (daysOfStock <= leadTimeDays) urgency = 'medium';

    suggestions.push({
      productId: product._id,
      productName: product.name,
      distributorId: product.distributorId?._id || null,
      distributorName: product.distributorId?.name || 'Unknown',
      promisedLeadTime,
      effectiveLeadTime: actualLeadTime,
      delayBufferDays,
      distributorOnTimeRate: onTimeRate,
      currentStock: product.currentStock,
      avgDailySales: parseFloat(avgDailySales.toFixed(2)),
      forecastedDemand7d,
      safetyStock,
      reorderPoint,
      suggestedOrderQty,
      suggestedCartons,
      urgency,
      packSize: product.packSize,
      unit: product.unit,
      costPrice: product.costPrice || 0,
      distributorMov: product.distributorId?.minimumOrderValue || 0,
    });
  }

  // Sort: critical → high → medium → low
  const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  suggestions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

  return suggestions;
}

module.exports = { generateForecast };
