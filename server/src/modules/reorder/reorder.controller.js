const reorderService = require('./reorder.service');
const { generateForecast } = require('../../services/forecasting');
const { generateWhatsAppLinks } = require('../../services/whatsapp');
const ReorderSuggestion = require('./reorder.model');
const Distributor = require('../distributors/distributor.model');
const User = require('../auth/auth.model');
const { sendSuccess, sendError } = require('../../utils/apiResponse');

/**
 * GET /api/reorder/suggestions
 * Returns the most recent reorder suggestion for the logged-in user.
 */
async function getSuggestions(req, res, next) {
  try {
    const suggestion = await reorderService.getLatestSuggestions(req.user.id);
    if (!suggestion) {
      return sendSuccess(res, null, 'No suggestions generated yet');
    }
    return sendSuccess(res, { suggestion }, 'Latest suggestions retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reorder/history
 * Returns the last 10 reorder suggestion documents.
 */
async function getHistory(req, res, next) {
  try {
    const suggestions = await reorderService.getSuggestionHistory(req.user.id);
    return sendSuccess(res, { suggestions }, 'Suggestion history retrieved');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reorder/generate
 * On-demand: runs the forecasting engine and saves a new ReorderSuggestion doc.
 */
async function generate(req, res, next) {
  try {
    const userId = req.user.id;

    // Run the forecasting engine for this user's products
    const items = await generateForecast(userId);

    if (items.length === 0) {
      return sendSuccess(res, { suggestion: null }, 'All products are sufficiently stocked — no reorder needed');
    }

    // Fetch distributors and user info for WhatsApp link generation
    const [distributors, user] = await Promise.all([
      Distributor.find({ userId, isActive: true }),
      User.findById(userId),
    ]);

    const whatsappMessages = generateWhatsAppLinks(user.storeName, items, distributors);

    const suggestion = await ReorderSuggestion.create({
      userId,
      generatedAt: new Date(),
      status: 'pending',
      items,
      whatsappMessages,
    });

    return sendSuccess(res, { suggestion }, 'Reorder suggestions generated', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reorder/whatsapp
 * Body: { suggestionId?, distributorId? }
 * Returns WhatsApp deep links for a given suggestion or the latest suggestion.
 */
async function getWhatsAppLinks(req, res, next) {
  try {
    const { suggestionId, distributorId } = req.body;
    let suggestion = null;

    if (suggestionId) {
      suggestion = await ReorderSuggestion.findOne({ _id: suggestionId, userId: req.user.id });
    } else {
      suggestion = await reorderService.getLatestSuggestions(req.user.id);
    }

    if (!suggestion) return sendError(res, 'No active suggestions found. Please generate a forecast first.', 404);

    const links = await reorderService.generateWhatsAppMessages(suggestion);
    
    // If a specific distributor was requested, find matching link
    let targetLink = null;
    if (distributorId) {
      const dIdStr = distributorId.toString();
      targetLink = links[dIdStr]?.link;
      if (!targetLink) {
        for (const [key, val] of Object.entries(links)) {
          if (key.includes(dIdStr) || dIdStr.includes(key)) {
            targetLink = val.link;
            break;
          }
        }
      }
    }
    if (!targetLink) {
      targetLink = Object.values(links)[0]?.link;
    }

    return sendSuccess(res, { links, link: targetLink }, 'WhatsApp links generated');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/reorder/mark-ordered
 * Body: { distributorId?, suggestionId? }
 */
async function markOrdered(req, res, next) {
  try {
    const { suggestionId } = req.body;
    let suggestion = null;
    if (suggestionId) {
      suggestion = await ReorderSuggestion.findOne({ _id: suggestionId, userId: req.user.id });
    } else {
      suggestion = await reorderService.getLatestSuggestions(req.user.id);
    }

    if (suggestion) {
      suggestion.status = 'ordered';
      await suggestion.save();
    }

    return sendSuccess(res, { suggestion }, 'Marked as ordered');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/reorder/:id/status
 * Body: { status: 'pending' | 'sent' | 'ordered' }
 */
async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'sent', 'ordered'];
    if (!validStatuses.includes(status)) {
      return sendError(res, `status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const suggestion = await reorderService.updateSuggestionStatus(req.user.id, req.params.id, status);
    return sendSuccess(res, { suggestion }, 'Suggestion status updated');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reorder/:id/fulfill
 * Called when wholesale delivery arrives: increments currentStock for all items and marks order received.
 */
async function fulfillOrder(req, res, next) {
  try {
    const Product = require('../products/product.model');
    const suggestion = await ReorderSuggestion.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!suggestion) {
      return sendError(res, 'Reorder suggestion not found', 404);
    }

    const restockedItems = [];
    for (const item of suggestion.items) {
      const p = await Product.findOneAndUpdate(
        { _id: item.productId, userId: req.user.id },
        { $inc: { currentStock: item.suggestedOrderQty } },
        { new: true }
      );
      if (p) {
        restockedItems.push({
          productId: p._id,
          productName: p.name,
          addedQty: item.suggestedOrderQty,
          currentStock: p.currentStock,
        });
      }
    }

    suggestion.status = 'ordered';
    await suggestion.save();

    return sendSuccess(res, {
      suggestionId: suggestion._id,
      restockedCount: restockedItems.length,
      items: restockedItems,
    }, `Restocked ${restockedItems.length} products from wholesale delivery!`);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getSuggestions,
  getHistory,
  generate,
  getWhatsAppLinks,
  updateStatus,
  markOrdered,
  fulfillOrder,
};
