const ReorderSuggestion = require('./reorder.model');
const Distributor = require('../distributors/distributor.model');
const User = require('../auth/auth.model');
const { generateWhatsAppLinks } = require('../../services/whatsapp');

/**
 * Fetch the most recent reorder suggestion for a user.
 */
async function getLatestSuggestions(userId) {
  const suggestion = await ReorderSuggestion.findOne({ userId })
    .sort({ generatedAt: -1 })
    .populate('items.productId', 'name unit packSize')
    .populate('items.distributorId', 'name phone');
  return suggestion;
}

/**
 * Fetch the last 10 reorder suggestion documents for a user.
 */
async function getSuggestionHistory(userId) {
  const suggestions = await ReorderSuggestion.find({ userId })
    .sort({ generatedAt: -1 })
    .limit(10)
    .select('-whatsappMessages'); // Omit large message map in list view
  return suggestions;
}

/**
 * Update the status of a specific suggestion (pending → sent → ordered).
 * @param {string} userId
 * @param {string} id - Suggestion document _id
 * @param {'pending'|'sent'|'ordered'} status
 */
async function updateSuggestionStatus(userId, id, status) {
  const suggestion = await ReorderSuggestion.findOneAndUpdate(
    { _id: id, userId },
    { $set: { status } },
    { new: true }
  );
  if (!suggestion) {
    const err = new Error('Suggestion not found');
    err.statusCode = 404;
    throw err;
  }
  return suggestion;
}

/**
 * (Re-)generate WhatsApp message links for an existing suggestion.
 * Fetches fresh distributor data from DB, then delegates to whatsapp service.
 * @param {object} suggestion - Mongoose document
 */
async function generateWhatsAppMessages(suggestion) {
  const [distributors, user] = await Promise.all([
    Distributor.find({ userId: suggestion.userId, isActive: true }),
    User.findById(suggestion.userId),
  ]);
  const storeName = user?.storeName || 'Store';

  const links = generateWhatsAppLinks(storeName, suggestion.items, distributors);

  // Persist the updated links back to the suggestion doc
  suggestion.whatsappMessages = links;
  await suggestion.save();

  return links;
}

module.exports = {
  getLatestSuggestions,
  getSuggestionHistory,
  updateSuggestionStatus,
  generateWhatsAppMessages,
};
