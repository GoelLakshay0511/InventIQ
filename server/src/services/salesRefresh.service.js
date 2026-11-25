const mongoose = require('mongoose');
const SalesLog = require('../modules/sales/sales.model');
const Product = require('../modules/products/product.model');
const Distributor = require('../modules/distributors/distributor.model');
const ReorderSuggestion = require('../modules/reorder/reorder.model');
const { generateForecast } = require('./forecasting');

// Template knowledge of known demo FMCG Kirana items
const KNOWN_ITEM_VELOCITY = {
  'Fortune Sunflower Oil 1L': 4,
  'Saffola Gold Oil 1L': 2,
  'Parle-G 100g': 14,
  'Britannia Good Day 100g': 5,
  'Bourbon 100g': 3,
  'Maggi Noodles 70g': 8,
  'Lays Classic 26g': 6,
  'Kurkure Masala 90g': 4,
  'Amul Full Cream Milk 1L': 10,
  'Amul Butter 100g': 3,
  'Mother Dairy Curd 500g': 4,
  'Coca-Cola 750ml': 5,
  'Frooti 200ml': 8,
  'Bisleri 1L': 6,
  'Aashirvaad Atta 5kg': 2,
  'Tata Salt 1kg': 3,
  'Sugar 1kg': 4,
  'Toor Dal 1kg': 2,
  'Chana Dal 1kg': 2,
  'Lifebuoy Soap 100g': 4,
  'Colgate 200g': 2,
  'Head & Shoulders 180ml': 1.5,
  'Dettol Handwash 200ml': 2,
  'Vim Dish Wash Bar 200g': 2.5,
  'Harpic Toilet Cleaner 500ml': 1.5,
  'Surf Excel 500g': 3,
  'Brooke Bond Red Label 250g': 2,
  'Tata Tea Gold 250g': 1.5,
  'Nescafe Classic 50g': 1.5,
  // True slow-movers / dead-stock showcase items
  'Rose Syrup 750ml': 0.04,
  'Corn Flakes 500g': 0.06,
};

function jitter(value, range = 0.35) {
  const noise = (Math.random() - 0.5) * 2 * range * value;
  return Math.max(0, Math.round(value + noise));
}

function getSeasonalMultiplier(date) {
  const d = new Date(date);
  const dow = d.getDay();   // 0 = Sun, 5 = Fri, 6 = Sat
  const dom = d.getDate();
  let m = 1.0;
  if (dow === 0 || dow === 5 || dow === 6) m *= 1.15;
  if (dom >= 1 && dom <= 7) m *= 1.25;
  return m;
}

/**
 * Regenerate 30 days of realistic daily sales history ending TODAY for a given user.
 * This directly updates the database and refreshes reorder suggestions.
 *
 * @param {string|ObjectId} userId
 * @returns {Promise<{ salesInserted: number, productsUpdated: number }>}
 */
async function refreshRecentSalesForUser(userId) {
  const uId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
  const products = await Product.find({ userId: uId, isActive: true });

  if (!products || products.length === 0) {
    return { salesInserted: 0, productsUpdated: 0 };
  }

  // 0. Ensure demo distributors have realistic reliability scorecards populated
  try {
    const dists = await Distributor.find({ userId: uId, isActive: true });
    for (const d of dists) {
      if (!d.deliveryHistory || d.deliveryHistory.length === 0) {
        if (d.name.includes('Sharma')) {
          d.effectiveLeadTime = 3.9;
          d.onTimeRate = 25;
          d.delayBufferDays = 1.9;
          d.deliveryHistory = [
            { orderDate: new Date(Date.now() - 25 * 86400000), deliveredDate: new Date(Date.now() - 21 * 86400000), turnaroundDays: 4.0, promisedDays: d.deliveryDays || 2, onTime: false, note: 'Delayed wholesale shipment' },
            { orderDate: new Date(Date.now() - 16 * 86400000), deliveredDate: new Date(Date.now() - 12 * 86400000), turnaroundDays: 3.8, promisedDays: d.deliveryDays || 2, onTime: false, note: 'Late afternoon delivery' },
            { orderDate: new Date(Date.now() - 7 * 86400000), deliveredDate: new Date(Date.now() - 3 * 86400000), turnaroundDays: 4.0, promisedDays: d.deliveryDays || 2, onTime: false, note: 'Truck breakdown reported' },
          ];
          await d.save();
        } else if (d.name.includes('Mumbai Dairy')) {
          d.effectiveLeadTime = 1.1;
          d.onTimeRate = 100;
          d.delayBufferDays = 0.1;
          d.deliveryHistory = [
            { orderDate: new Date(Date.now() - 20 * 86400000), deliveredDate: new Date(Date.now() - 19 * 86400000), turnaroundDays: 1.0, promisedDays: d.deliveryDays || 1, onTime: true, note: 'Morning fresh delivery' },
            { orderDate: new Date(Date.now() - 12 * 86400000), deliveredDate: new Date(Date.now() - 11 * 86400000), turnaroundDays: 1.2, promisedDays: d.deliveryDays || 1, onTime: true, note: 'Delivered before 8 AM' },
            { orderDate: new Date(Date.now() - 4 * 86400000), deliveredDate: new Date(Date.now() - 3 * 86400000), turnaroundDays: 1.0, promisedDays: d.deliveryDays || 1, onTime: true, note: 'On-time morning route' },
          ];
          await d.save();
        } else if (d.name.includes('Kiran')) {
          d.effectiveLeadTime = 3.2;
          d.onTimeRate = 75;
          d.delayBufferDays = 0.2;
          d.deliveryHistory = [
            { orderDate: new Date(Date.now() - 24 * 86400000), deliveredDate: new Date(Date.now() - 21 * 86400000), turnaroundDays: 3.0, promisedDays: d.deliveryDays || 3, onTime: true, note: 'Standard delivery' },
            { orderDate: new Date(Date.now() - 15 * 86400000), deliveredDate: new Date(Date.now() - 11 * 86400000), turnaroundDays: 3.6, promisedDays: d.deliveryDays || 3, onTime: false, note: 'Partial delay due to rain' },
            { orderDate: new Date(Date.now() - 6 * 86400000), deliveredDate: new Date(Date.now() - 3 * 86400000), turnaroundDays: 3.0, promisedDays: d.deliveryDays || 3, onTime: true, note: 'Delivered as scheduled' },
          ];
          await d.save();
        }
      }
    }
  } catch (err) {
    console.error('Distributor scorecard seeding warning:', err.message);
  }

  // 1. Clear old sales logs for this user to keep data clean and avoid duplicate accumulations
  await SalesLog.deleteMany({ userId: uId });

  // 2. Generate 30 days of sales up to today
  const salesEntries = [];
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const DAYS = 30;

  for (let dayOffset = DAYS - 1; dayOffset >= 0; dayOffset--) {
    const saleDate = new Date(today);
    saleDate.setDate(today.getDate() - dayOffset);
    const multiplier = getSeasonalMultiplier(saleDate);

    for (const prod of products) {
      let baseVelocity = KNOWN_ITEM_VELOCITY[prod.name];

      if (baseVelocity === undefined) {
        // Fallback for custom products added by the user
        if (prod.isTopSeller) {
          baseVelocity = 5;
        } else if (['Dairy', 'Beverages', 'Biscuits', 'Snacks', 'Noodles'].includes(prod.category)) {
          baseVelocity = 4;
        } else if (['Edible Oil', 'Flour & Grains', 'Pulses'].includes(prod.category)) {
          baseVelocity = 2.5;
        } else {
          baseVelocity = 1.5;
        }
      }

      // If it's a slow mover (dead stock showcase), only very rarely sell 1 unit
      if (baseVelocity < 0.1) {
        if (Math.random() < baseVelocity) {
          salesEntries.push({
            userId: uId,
            productId: prod._id,
            date: saleDate,
            quantitySold: 1,
            source: 'manual',
          });
        }
        continue;
      }

      const rawQty = baseVelocity * multiplier;
      const qty = jitter(rawQty, 0.35);

      if (qty > 0) {
        salesEntries.push({
          userId: uId,
          productId: prod._id,
          date: saleDate,
          quantitySold: qty,
          source: 'manual',
        });
      }
    }
  }

  // 3. Batch insert fresh sales entries into MongoDB
  if (salesEntries.length > 0) {
    await SalesLog.insertMany(salesEntries);
  }

  // 4. Run forecasting engine and update reorder suggestions
  try {
    const forecastItems = await generateForecast(uId);
    if (forecastItems && forecastItems.length > 0) {
      await ReorderSuggestion.deleteMany({ userId: uId });
      await ReorderSuggestion.create({
        userId: uId,
        generatedAt: new Date(),
        items: forecastItems,
        status: 'pending',
      });
    }
  } catch (err) {
    console.error('Forecasting update warning:', err.message);
  }

  return {
    salesInserted: salesEntries.length,
    productsUpdated: products.length,
  };
}

module.exports = { refreshRecentSalesForUser };
