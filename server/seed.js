/**
 * InventIQ — Database Seed Script
 * ─────────────────────────────────
 * Populates MongoDB with a realistic kirana store demo dataset:
 *   - 1 store owner (user)
 *   - 3 distributors
 *   - 30 products (realistic Indian FMCG items)
 *   - 30 days of sales history
 *
 * Usage:
 *   cd server
 *   node seed.js
 *
 * To clear and re-seed:
 *   node seed.js --fresh
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const User = require('./src/modules/auth/auth.model');
const Product = require('./src/modules/products/product.model');
const SalesLog = require('./src/modules/sales/sales.model');
const Distributor = require('./src/modules/distributors/distributor.model');
const ReorderSuggestion = require('./src/modules/reorder/reorder.model');

// ── Config ────────────────────────────────────────────────────────────────────
const FRESH = process.argv.includes('--fresh');
const SALES_HISTORY_DAYS = 30;

// ── Demo Store Owner ──────────────────────────────────────────────────────────
const DEMO_USER = {
  name: 'Ramesh Gupta',
  phone: '9876543210',
  storeName: 'Gupta General Store',
  pincode: '400001',
  password: 'demo1234',
  settings: { leadTimeDays: 3, safetyStockDays: 2 },
};

// ── Distributors ──────────────────────────────────────────────────────────────
const DISTRIBUTORS = [
  {
    name: 'Sharma Brothers Wholesale',
    phone: '9123456789',
    minimumOrderValue: 5000,
    deliveryDays: 2,
    effectiveLeadTime: 3.9,
    onTimeRate: 25,
    delayBufferDays: 1.9,
    deliveryHistory: [
      { orderDate: new Date(Date.now() - 25 * 86400000), deliveredDate: new Date(Date.now() - 21 * 86400000), turnaroundDays: 4.0, promisedDays: 2, onTime: false, note: 'Delayed wholesale shipment' },
      { orderDate: new Date(Date.now() - 16 * 86400000), deliveredDate: new Date(Date.now() - 12 * 86400000), turnaroundDays: 3.8, promisedDays: 2, onTime: false, note: 'Late afternoon delivery' },
      { orderDate: new Date(Date.now() - 7 * 86400000), deliveredDate: new Date(Date.now() - 3 * 86400000), turnaroundDays: 4.0, promisedDays: 2, onTime: false, note: 'Truck breakdown reported' },
    ],
    categories: ['Edible Oil', 'Biscuits', 'Snacks', 'Noodles'],
  },
  {
    name: 'Mumbai Dairy Supplies',
    phone: '9234567890',
    minimumOrderValue: 2000,
    deliveryDays: 1,
    effectiveLeadTime: 1.1,
    onTimeRate: 100,
    delayBufferDays: 0.1,
    deliveryHistory: [
      { orderDate: new Date(Date.now() - 20 * 86400000), deliveredDate: new Date(Date.now() - 19 * 86400000), turnaroundDays: 1.0, promisedDays: 1, onTime: true, note: 'Morning fresh delivery' },
      { orderDate: new Date(Date.now() - 12 * 86400000), deliveredDate: new Date(Date.now() - 11 * 86400000), turnaroundDays: 1.2, promisedDays: 1, onTime: true, note: 'Delivered before 8 AM' },
      { orderDate: new Date(Date.now() - 4 * 86400000), deliveredDate: new Date(Date.now() - 3 * 86400000), turnaroundDays: 1.0, promisedDays: 1, onTime: true, note: 'On-time morning route' },
    ],
    categories: ['Dairy', 'Beverages'],
  },
  {
    name: 'Kiran FMCG Distributors',
    phone: '9345678901',
    minimumOrderValue: 3000,
    deliveryDays: 3,
    effectiveLeadTime: 3.2,
    onTimeRate: 75,
    delayBufferDays: 0.2,
    deliveryHistory: [
      { orderDate: new Date(Date.now() - 24 * 86400000), deliveredDate: new Date(Date.now() - 21 * 86400000), turnaroundDays: 3.0, promisedDays: 3, onTime: true, note: 'Standard delivery' },
      { orderDate: new Date(Date.now() - 15 * 86400000), deliveredDate: new Date(Date.now() - 11 * 86400000), turnaroundDays: 3.6, promisedDays: 3, onTime: false, note: 'Partial delay due to rain' },
      { orderDate: new Date(Date.now() - 6 * 86400000), deliveredDate: new Date(Date.now() - 3 * 86400000), turnaroundDays: 3.0, promisedDays: 3, onTime: true, note: 'Delivered as scheduled' },
    ],
    categories: ['Flour & Grains', 'Personal Care', 'Household', 'Pulses'],
  },
];

// ── Products ──────────────────────────────────────────────────────────────────
// avgDailySales is used to generate realistic sales history
const PRODUCT_TEMPLATES = [
  // Edible Oil
  { name: 'Fortune Sunflower Oil 1L', category: 'Edible Oil', brand: 'Fortune', unit: 'bottle', packSize: 12, currentStock: 8, costPrice: 115, sellingPrice: 130, isTopSeller: true, avgDailySales: 4, distIdx: 0 },
  { name: 'Saffola Gold Oil 1L', category: 'Edible Oil', brand: 'Saffola', unit: 'bottle', packSize: 12, currentStock: 4, costPrice: 150, sellingPrice: 168, isTopSeller: true, avgDailySales: 2, distIdx: 0 },

  // Biscuits
  { name: 'Parle-G 100g', category: 'Biscuits', brand: 'Parle', unit: 'pack', packSize: 48, currentStock: 96, costPrice: 5, sellingPrice: 6, isTopSeller: true, avgDailySales: 15, distIdx: 0 },
  { name: 'Britannia Good Day 100g', category: 'Biscuits', brand: 'Britannia', unit: 'pack', packSize: 24, currentStock: 24, costPrice: 20, sellingPrice: 24, isTopSeller: true, avgDailySales: 5, distIdx: 0 },
  { name: 'Bourbon 100g', category: 'Biscuits', brand: 'Britannia', unit: 'pack', packSize: 24, currentStock: 48, costPrice: 18, sellingPrice: 22, isTopSeller: false, avgDailySales: 3, distIdx: 0 },

  // Noodles / Snacks
  { name: 'Maggi Noodles 70g', category: 'Noodles', brand: 'Maggi', unit: 'pack', packSize: 48, currentStock: 30, costPrice: 12, sellingPrice: 14, isTopSeller: true, avgDailySales: 8, distIdx: 0 },
  { name: 'Lays Classic 26g', category: 'Snacks', brand: "Lay's", unit: 'pack', packSize: 24, currentStock: 48, costPrice: 10, sellingPrice: 12, isTopSeller: true, avgDailySales: 6, distIdx: 0 },
  { name: 'Kurkure Masala 90g', category: 'Snacks', brand: 'Kurkure', unit: 'pack', packSize: 24, currentStock: 24, costPrice: 18, sellingPrice: 20, isTopSeller: false, avgDailySales: 4, distIdx: 0 },

  // Dairy
  { name: 'Amul Full Cream Milk 1L', category: 'Dairy', brand: 'Amul', unit: 'pouch', packSize: 30, currentStock: 12, costPrice: 60, sellingPrice: 68, isTopSeller: true, avgDailySales: 10, distIdx: 1 },
  { name: 'Amul Butter 100g', category: 'Dairy', brand: 'Amul', unit: 'pack', packSize: 20, currentStock: 10, costPrice: 50, sellingPrice: 58, isTopSeller: true, avgDailySales: 3, distIdx: 1 },
  { name: 'Mother Dairy Curd 500g', category: 'Dairy', brand: 'Mother Dairy', unit: 'cup', packSize: 12, currentStock: 6, costPrice: 38, sellingPrice: 45, isTopSeller: true, avgDailySales: 4, distIdx: 1 },

  // Beverages
  { name: 'Coca-Cola 750ml', category: 'Beverages', brand: 'Coca-Cola', unit: 'bottle', packSize: 24, currentStock: 48, costPrice: 28, sellingPrice: 35, isTopSeller: false, avgDailySales: 5, distIdx: 1 },
  { name: 'Frooti 200ml', category: 'Beverages', brand: 'Frooti', unit: 'pack', packSize: 24, currentStock: 72, costPrice: 10, sellingPrice: 12, isTopSeller: true, avgDailySales: 8, distIdx: 1 },
  { name: 'Bisleri 1L', category: 'Beverages', brand: 'Bisleri', unit: 'bottle', packSize: 12, currentStock: 24, costPrice: 18, sellingPrice: 20, isTopSeller: false, avgDailySales: 6, distIdx: 1 },

  // Flour & Grains
  { name: 'Aashirvaad Atta 5kg', category: 'Flour & Grains', brand: 'Aashirvaad', unit: 'bag', packSize: 5, currentStock: 3, costPrice: 210, sellingPrice: 240, isTopSeller: true, avgDailySales: 2, distIdx: 2 },
  { name: 'Tata Salt 1kg', category: 'Salt & Sugar', brand: 'Tata', unit: 'pack', packSize: 12, currentStock: 24, costPrice: 22, sellingPrice: 26, isTopSeller: true, avgDailySales: 3, distIdx: 2 },
  { name: 'Sugar 1kg', category: 'Flour & Grains', brand: 'Local', unit: 'pack', packSize: 10, currentStock: 10, costPrice: 40, sellingPrice: 46, isTopSeller: true, avgDailySales: 4, distIdx: 2 },

  // Pulses
  { name: 'Toor Dal 1kg', category: 'Pulses', brand: 'Local', unit: 'pack', packSize: 10, currentStock: 5, costPrice: 110, sellingPrice: 125, isTopSeller: true, avgDailySales: 2, distIdx: 2 },
  { name: 'Chana Dal 1kg', category: 'Pulses', brand: 'Local', unit: 'pack', packSize: 10, currentStock: 10, costPrice: 90, sellingPrice: 105, isTopSeller: false, avgDailySales: 1, distIdx: 2 },

  // Personal Care
  { name: 'Lifebuoy Soap 100g', category: 'Personal Care', brand: 'Lifebuoy', unit: 'bar', packSize: 24, currentStock: 48, costPrice: 25, sellingPrice: 30, isTopSeller: true, avgDailySales: 4, distIdx: 2 },
  { name: 'Colgate 200g', category: 'Personal Care', brand: 'Colgate', unit: 'tube', packSize: 12, currentStock: 12, costPrice: 70, sellingPrice: 82, isTopSeller: true, avgDailySales: 2, distIdx: 2 },
  { name: 'Head & Shoulders 180ml', category: 'Personal Care', brand: 'H&S', unit: 'bottle', packSize: 12, currentStock: 6, costPrice: 165, sellingPrice: 195, isTopSeller: false, avgDailySales: 1, distIdx: 2 },
  { name: 'Dettol Handwash 200ml', category: 'Personal Care', brand: 'Dettol', unit: 'bottle', packSize: 12, currentStock: 12, costPrice: 75, sellingPrice: 90, isTopSeller: false, avgDailySales: 2, distIdx: 2 },

  // Household
  { name: 'Vim Dish Wash Bar 200g', category: 'Household', brand: 'Vim', unit: 'bar', packSize: 12, currentStock: 24, costPrice: 22, sellingPrice: 28, isTopSeller: false, avgDailySales: 2, distIdx: 2 },
  { name: 'Harpic Toilet Cleaner 500ml', category: 'Household', brand: 'Harpic', unit: 'bottle', packSize: 12, currentStock: 12, costPrice: 80, sellingPrice: 95, isTopSeller: false, avgDailySales: 1, distIdx: 2 },
  { name: 'Surf Excel 500g', category: 'Household', brand: 'Surf Excel', unit: 'pack', packSize: 12, currentStock: 24, costPrice: 75, sellingPrice: 88, isTopSeller: true, avgDailySales: 3, distIdx: 2 },

  // Tea & Coffee
  { name: 'Brooke Bond Red Label 250g', category: 'Tea & Coffee', brand: 'Brooke Bond', unit: 'pack', packSize: 12, currentStock: 12, costPrice: 105, sellingPrice: 120, isTopSeller: true, avgDailySales: 2, distIdx: 0 },
  { name: 'Tata Tea Gold 250g', category: 'Tea & Coffee', brand: 'Tata', unit: 'pack', packSize: 12, currentStock: 6, costPrice: 115, sellingPrice: 130, isTopSeller: false, avgDailySales: 1, distIdx: 0 },
  { name: 'Nescafe Classic 50g', category: 'Tea & Coffee', brand: 'Nescafe', unit: 'jar', packSize: 12, currentStock: 6, costPrice: 110, sellingPrice: 130, isTopSeller: false, avgDailySales: 1, distIdx: 0 },

  // Dead stock (slow movers for demo)
  { name: 'Rose Syrup 750ml', category: 'Beverages', brand: 'Rooh Afza', unit: 'bottle', packSize: 12, currentStock: 24, costPrice: 120, sellingPrice: 140, isTopSeller: false, avgDailySales: 0.1, distIdx: 1 },
  { name: 'Corn Flakes 500g', category: 'Breakfast', brand: "Kellogg's", unit: 'box', packSize: 12, currentStock: 12, costPrice: 180, sellingPrice: 210, isTopSeller: false, avgDailySales: 0.2, distIdx: 0 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Add Gaussian-like noise to a number, clamped to 0 */
function jitter(value, range = 0.3) {
  const noise = (Math.random() - 0.5) * 2 * range * value;
  return Math.max(0, Math.round(value + noise));
}

/** Weekend/salary-week multiplier matching the forecasting engine */
function getSeasonalMultiplier(date) {
  const d = new Date(date);
  const dow = d.getDay();
  const dom = d.getDate();
  let m = 1.0;
  if (dow === 0 || dow === 5 || dow === 6) m *= 1.15;
  if (dom >= 1 && dom <= 7) m *= 1.25;
  return m;
}

// ── Main Seed ─────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 InventIQ Seed Script');
  console.log('─'.repeat(40));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');

  if (FRESH) {
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      SalesLog.deleteMany({}),
      Distributor.deleteMany({}),
      ReorderSuggestion.deleteMany({}),
    ]);
    console.log('✅ Collections cleared');
  }

  // ── Create User ─────────────────────────────────────────────────────────────
  let user = await User.findOne({ phone: DEMO_USER.phone });
  if (user) {
    console.log(`ℹ️  Demo user already exists (${DEMO_USER.phone}). Skipping user creation.`);
  } else {
    const passwordHash = await bcrypt.hash(DEMO_USER.password, 12);
    user = await User.create({ ...DEMO_USER, passwordHash });
    console.log(`✅ Created user: ${user.name} | Phone: ${DEMO_USER.phone} | Password: ${DEMO_USER.password}`);
  }

  // ── Create Distributors ──────────────────────────────────────────────────────
  const existingDist = await Distributor.find({ userId: user._id });
  let distributors;
  if (existingDist.length > 0) {
    console.log(`ℹ️  ${existingDist.length} distributors already exist. Skipping.`);
    distributors = existingDist;
  } else {
    distributors = await Distributor.insertMany(
      DISTRIBUTORS.map(d => ({ ...d, userId: user._id }))
    );
    console.log(`✅ Created ${distributors.length} distributors`);
  }

  // ── Create Products ──────────────────────────────────────────────────────────
  const existingProds = await Product.find({ userId: user._id });
  let products;
  if (existingProds.length > 0) {
    console.log(`ℹ️  ${existingProds.length} products already exist. Skipping.`);
    products = existingProds;
  } else {
    products = await Product.insertMany(
      PRODUCT_TEMPLATES.map(p => ({
        userId: user._id,
        name: p.name,
        category: p.category,
        brand: p.brand,
        unit: p.unit,
        packSize: p.packSize,
        currentStock: p.currentStock,
        reorderPoint: Math.ceil(p.avgDailySales * 3 + 2), // rough reorder point
        distributorId: distributors[p.distIdx]._id,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        isTopSeller: p.isTopSeller,
        isActive: true,
      }))
    );
    console.log(`✅ Created ${products.length} products`);
  }

  // ── Create Sales History ─────────────────────────────────────────────────────
  const existingSales = await SalesLog.countDocuments({ userId: user._id });
  if (existingSales > 0) {
    console.log(`ℹ️  ${existingSales} sales records already exist. Skipping.`);
  } else {
    const salesEntries = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = SALES_HISTORY_DAYS - 1; dayOffset >= 0; dayOffset--) {
      const date = new Date(today);
      date.setDate(today.getDate() - dayOffset);
      const seasonalMult = getSeasonalMultiplier(date);

      for (let i = 0; i < products.length; i++) {
        const template = PRODUCT_TEMPLATES[i];
        if (template.avgDailySales === 0) continue;

        const rawQty = template.avgDailySales * seasonalMult;
        const qty = jitter(rawQty, 0.35);
        if (qty === 0) continue;

        salesEntries.push({
          userId: user._id,
          productId: products[i]._id,
          date,
          quantitySold: qty,
          source: 'manual',
        });
      }
    }

    await SalesLog.insertMany(salesEntries);
    console.log(`✅ Created ${salesEntries.length} sales log entries (${SALES_HISTORY_DAYS} days)`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(40));
  console.log('🎉 Seed complete!');
  console.log('─'.repeat(40));
  console.log(`📱 Demo Login`);
  console.log(`   Phone:    ${DEMO_USER.phone}`);
  console.log(`   Password: ${DEMO_USER.password}`);
  console.log(`   Store:    ${DEMO_USER.storeName}`);
  console.log('─'.repeat(40));
  console.log(`📊 Data Summary`);
  console.log(`   Users:        1`);
  console.log(`   Distributors: ${distributors.length}`);
  console.log(`   Products:     ${products.length}`);
  console.log(`   Sales Days:   ${SALES_HISTORY_DAYS}`);
  console.log('─'.repeat(40));
  console.log('\n💡 Tip: Run `node seed.js --fresh` to wipe and re-seed.\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});