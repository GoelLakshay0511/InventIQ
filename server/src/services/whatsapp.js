/**
 * WhatsApp message generator using wa.me deep links.
 * Groups order items by distributor and formats a clean, human-readable message.
 */

function getDistributorIdStr(distributorId) {
  if (!distributorId) return null;
  if (typeof distributorId === 'object' && distributorId._id) {
    return distributorId._id.toString();
  }
  return distributorId.toString();
}

/**
 * Format a single distributor's order message as a WhatsApp-friendly string.
 *
 * @param {string} storeName
 * @param {string} distributorName
 * @param {Array}  items - Filtered suggestion items for this distributor
 * @param {Date}   date
 * @returns {string}
 */
function formatDistributorMessage(storeName, distributorName, items, date) {
  const dateStr = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const lines = [
    `🛒 *STOCK ORDER — ${storeName || 'Kirana Store'}*`,
    `📅 Date: ${dateStr}`,
    '',
    `📦 *${distributorName || 'Supplier'}*`,
    '─────────────────────',
  ];

  let totalOrderEst = 0;
  for (const item of items) {
    const cartons = item.suggestedCartons || Math.ceil((item.suggestedOrderQty || 1) / (item.packSize || 1));
    const cartonText = cartons > 1 ? ` (${cartons} cartons)` : ` (1 carton)`;
    const unit = item.unit || 'units';
    const orderQty = item.suggestedOrderQty || item.suggestedQty || 1;
    const name = item.productName || 'Item';
    const itemCost = item.costPrice ? item.costPrice * orderQty : 0;
    totalOrderEst += itemCost;

    lines.push(
      `• ${name.padEnd(20)} × ${orderQty} ${unit}${cartonText}`
    );
  }

  lines.push('─────────────────────');
  if (totalOrderEst > 0) {
    lines.push(`🧾 Est. Total: ₹${totalOrderEst.toLocaleString('en-IN')}`);
    lines.push('─────────────────────');
  }
  lines.push('');
  lines.push('_Sent via InventIQ_ 📊');

  return lines.join('\n');
}

/**
 * Generate wa.me deep links for each distributor in the suggestion.
 *
 * @param {string} storeName
 * @param {Array}  suggestionItems - Items from a ReorderSuggestion document
 * @param {Array}  distributors    - Distributor documents from DB
 * @returns {{ [distributorId]: { distributorName, phone, message, link } }}
 */
function generateWhatsAppLinks(storeName, suggestionItems, distributors = []) {
  const grouped = {};
  for (const item of suggestionItems || []) {
    const key = getDistributorIdStr(item.distributorId) || 'general';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  }

  const result = {};

  for (const [distId, items] of Object.entries(grouped)) {
    // Match against distributors from DB, or extract from populated item
    const distributor =
      distributors.find((d) => d._id?.toString() === distId) ||
      (typeof items[0]?.distributorId === 'object' ? items[0].distributorId : null);

    const distName =
      distributor?.name || items[0]?.distributorName || 'Wholesale Supplier';

    const message = formatDistributorMessage(storeName, distName, items, new Date());
    const encodedMessage = encodeURIComponent(message);

    let rawPhone = distributor?.phone || items[0]?.distributorPhone || '';
    let phone = rawPhone.replace(/[^\d]/g, '');

    // Prepend 91 if it's a 10-digit Indian mobile number
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    const link = phone
      ? `https://wa.me/${phone}?text=${encodedMessage}`
      : `https://wa.me/?text=${encodedMessage}`;

    result[distId] = {
      distributorName: distName,
      phone,
      message,
      link,
    };
  }

  return result;
}

module.exports = { generateWhatsAppLinks, formatDistributorMessage };
