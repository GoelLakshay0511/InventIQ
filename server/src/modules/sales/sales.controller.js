const Papa = require('papaparse');
const salesService = require('./sales.service');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * POST /api/sales/batch
 * Body: { entries: [{ productId, quantitySold, date?, source? }] }
 */
async function batchLog(req, res, next) {
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return sendError(res, 'entries must be a non-empty array', 400);
    }
    const inserted = await salesService.batchLogSales(req.user.id, entries);
    return sendSuccess(res, { count: inserted.length }, `${inserted.length} sales logged`, 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sales/history
 * Query params: productId, from (ISO date), to (ISO date), limit
 */
async function getHistory(req, res, next) {
  try {
    const { productId, from, to, limit } = req.query;
    const logs = await salesService.getSalesHistory(req.user.id, { productId, from, to, limit });
    return sendSuccess(res, { logs }, 'Sales history retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/sales/daily-summary
 * Query params: date (ISO date string, defaults to today)
 */
async function getDailySummary(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const summary = await salesService.getDailySalesSummary(req.user.id, date);
    return sendSuccess(res, { date, summary }, 'Daily summary retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/sales/import/csv
 * Expects multipart/form-data with a CSV file in the `file` field.
 * CSV columns expected: productId, quantitySold, date (optional), source (optional)
 */
async function importCSV(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'No CSV file uploaded', 400);
    }

    const csvText = req.file.buffer.toString('utf8');

    // Parse CSV from memory buffer using PapaParse (node-compatible)
    const parsed = Papa.parse(csvText, {
      header: true,       // First row as field names
      skipEmptyLines: true,
      dynamicTyping: true, // Auto-convert numbers
    });

    if (parsed.errors.length > 0) {
      const messages = parsed.errors.slice(0, 5).map((e) => e.message);
      return sendError(res, 'CSV parsing errors', 422, messages);
    }

    // Fetch user's products to allow matching by either productId OR product name (e.g. from Vyapar / Khatabook)
    const Product = require('../products/product.model');
    const userProducts = await Product.find({ userId: req.user.id });
    const productLookup = {};
    for (const p of userProducts) {
      productLookup[p._id.toString()] = p._id;
      productLookup[p.name.toLowerCase().trim()] = p._id;
    }

    // Map CSV rows to entries format expected by batchLogSales
    const entries = [];
    const importedSummary = [];
    const unmatchedRows = [];

    for (const row of parsed.data) {
      const rawId = (row.productId || row.product_id || '').toString().trim();
      const rawName = (row.name || row.productName || row.item || row['Product Name'] || row['Item Name'] || '').toString().toLowerCase().trim();
      
      const matchedProduct = userProducts.find((p) => {
        if (rawId && p._id.toString() === rawId) return true;
        if (!rawName) return false;
        const pName = p.name.toLowerCase().trim();
        return pName === rawName || pName.includes(rawName) || rawName.includes(pName);
      });

      const qty = Number(row.quantitySold || row.quantity_sold || row.qty || row.quantity || row['Quantity'] || row['Qty']);
      
      if (matchedProduct && qty > 0) {
        entries.push({
          productId: matchedProduct._id,
          quantitySold: qty,
          date: row.date || row.Date || null,
          source: 'csv',
        });
        importedSummary.push({
          productId: matchedProduct._id,
          productName: matchedProduct.name,
          quantitySold: qty,
          unit: matchedProduct.unit || 'units',
          previousStock: matchedProduct.currentStock,
          newStock: Math.max(0, matchedProduct.currentStock - qty),
        });
      } else if (rawName || rawId) {
        unmatchedRows.push({
          name: rawName || rawId,
          qty: qty || 0,
        });
      }
    }

    if (entries.length === 0) {
      return sendError(res, 'No matching products found in CSV. Make sure product names match your catalog.', 400);
    }

    const inserted = await salesService.batchLogSales(req.user.id, entries);
    return sendSuccess(
      res,
      {
        count: inserted.length,
        items: importedSummary,
        unmatched: unmatchedRows,
      },
      `${inserted.length} sales imported from CSV`,
      201
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { batchLog, getHistory, getDailySummary, importCSV };
