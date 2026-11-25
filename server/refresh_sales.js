require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/modules/auth/auth.model');
const Product = require('./src/modules/products/product.model');
const { refreshRecentSalesForUser } = require('./src/services/salesRefresh.service');

async function main() {
  console.log('🚀 InventIQ — Sales Refresh to Today');
  console.log('Connecting to database...');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Find all users who have products
  const users = await User.find({});
  let totalRefreshed = 0;

  for (const user of users) {
    const productCount = await Product.countDocuments({ userId: user._id, isActive: true });
    if (productCount === 0) {
      console.log(`⏩ Skipping ${user.name} (${user.phone}) — no products found.`);
      continue;
    }

    console.log(`🔄 Refreshing 30 days of sales for: ${user.name} (${user.phone})...`);
    console.log(`   Found ${productCount} active products.`);

    const result = await refreshRecentSalesForUser(user._id);
    console.log(`   ✅ Inserted ${result.salesInserted} sales logs ending today.`);
    console.log(`   ✅ Reorder suggestions recalculated.\n`);
    totalRefreshed++;
  }

  console.log(`🎉 Finished! Successfully refreshed sales history for ${totalRefreshed} user account(s).`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Error refreshing sales:', err);
  process.exit(1);
});
