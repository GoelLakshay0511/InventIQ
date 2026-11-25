const Product = require('./product.model');
const Distributor = require('../distributors/distributor.model');
const SalesLog = require('../sales/sales.model');
const mongoose = require('mongoose');

const DEFAULT_LIMIT = 50;
const DEFAULT_PAGE = 1;

/**
 * Get a paginated list of products for a user.
 * Optional filters: category, isTopSeller.
 */
async function getProducts(userId, query = {}) {
  const { category, isTopSeller, page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = query;

  const filter = { userId, isActive: true };
  if (category) filter.category = category;
  if (isTopSeller !== undefined) filter.isTopSeller = isTopSeller === 'true' || isTopSeller === true;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('distributorId', 'name phone deliveryDays')
      .sort({ name: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Product.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  };
}

/**
 * Return top 25 best-selling products for a user.
 */
async function getTopSellers(userId) {
  return Product.find({ userId, isActive: true, isTopSeller: true })
    .populate('distributorId', 'name phone')
    .limit(25)
    .sort({ name: 1 });
}

/**
 * Create a new product for the user.
 */
async function createProduct(userId, data) {
  const trimmedName = (data.name || '').trim();
  if (!trimmedName) {
    const err = new Error('Product name is required');
    err.statusCode = 400;
    throw err;
  }

  // Prevent duplicate product names (case-insensitive) under the SAME distributor
  const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const duplicateQuery = {
    userId,
    isActive: true,
    name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
  };
  if (data.distributorId && data.distributorId !== '' && data.distributorId !== 'null') {
    duplicateQuery.distributorId = data.distributorId;
  }
  const existingProduct = await Product.findOne(duplicateQuery);

  if (existingProduct) {
    const err = new Error(`Product "${trimmedName}" already exists under this distributor.`);
    err.statusCode = 409;
    throw err;
  }

  const productData = { ...data, name: trimmedName, userId };

  // Strip empty or invalid distributorId to avoid Mongoose ObjectId CastError
  if (!productData.distributorId || productData.distributorId === '' || productData.distributorId === 'null') {
    delete productData.distributorId;
  }

  // Ensure numeric constraints are respected
  if (productData.packSize !== undefined) {
    productData.packSize = Math.max(1, Number(productData.packSize) || 1);
  }
  if (productData.currentStock !== undefined) {
    productData.currentStock = Math.max(0, Number(productData.currentStock) || 0);
  }
  if (productData.reorderPoint !== undefined) {
    productData.reorderPoint = Math.max(0, Number(productData.reorderPoint) || 0);
  }
  if (productData.costPrice !== undefined && productData.costPrice !== '' && productData.costPrice !== null) {
    productData.costPrice = Number(productData.costPrice);
  } else {
    delete productData.costPrice;
  }
  if (productData.sellingPrice !== undefined && productData.sellingPrice !== '' && productData.sellingPrice !== null) {
    productData.sellingPrice = Number(productData.sellingPrice);
  } else {
    delete productData.sellingPrice;
  }

  const product = await Product.create(productData);
  return product;
}

/**
 * Update an existing product. Always scoped to the calling user.
 */
async function updateProduct(userId, id, data) {
  const updateData = { ...data };

  if (updateData.name && updateData.name.trim()) {
    const trimmedName = updateData.name.trim();
    const escapedName = trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let targetDistributorId = updateData.distributorId;
    if (targetDistributorId === undefined) {
      const current = await Product.findById(id).select('distributorId');
      targetDistributorId = current?.distributorId;
    }

    const duplicateQuery = {
      userId,
      isActive: true,
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    };
    if (targetDistributorId && targetDistributorId !== 'null') {
      duplicateQuery.distributorId = targetDistributorId;
    }

    const duplicate = await Product.findOne(duplicateQuery);
    if (duplicate) {
      const err = new Error(`Another product named "${trimmedName}" already exists under this distributor.`);
      err.statusCode = 409;
      throw err;
    }
    updateData.name = trimmedName;
  }

  // Strip or set null for empty distributorId to prevent CastError
  if (updateData.distributorId === '' || updateData.distributorId === 'null' || !updateData.distributorId) {
    updateData.distributorId = null;
  }

  if (updateData.packSize !== undefined) {
    updateData.packSize = Math.max(1, Number(updateData.packSize) || 1);
  }
  if (updateData.costPrice !== undefined && (updateData.costPrice === '' || updateData.costPrice === null)) {
    delete updateData.costPrice;
  }
  if (updateData.sellingPrice !== undefined && (updateData.sellingPrice === '' || updateData.sellingPrice === null)) {
    delete updateData.sellingPrice;
  }

  const product = await Product.findOneAndUpdate(
    { _id: id, userId, isActive: true },
    { $set: updateData },
    { new: true, runValidators: true }
  ).populate('distributorId', 'name phone deliveryDays');

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
}

/**
 * Soft-delete a product (sets isActive: false).
 * Never hard-deletes so historical sales data stays intact.
 */
async function deleteProduct(userId, id) {
  const product = await Product.findOneAndUpdate(
    { _id: id, userId, isActive: true },
    { $set: { isActive: false } },
    { new: true }
  );

  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  return product;
}

/**
 * Analyze dead stock and calculate trapped working capital.
 * Items with <= 3 units sold in the last 30 days and stock > 0.
 */
async function getDeadStock(userId) {
  const products = await Product.find({ userId, isActive: true, currentStock: { $gt: 0 } }).populate('distributorId', 'name phone');
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const uId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

  const recentSales = await SalesLog.aggregate([
    {
      $match: {
        userId: uId,
        date: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$productId',
        totalSold: { $sum: '$quantitySold' }
      }
    }
  ]);

  const salesMap = {};
  for (const s of recentSales) {
    if (s._id) salesMap[s._id.toString()] = s.totalSold;
  }

  const deadStockItems = [];
  let totalTrappedCapital = 0;

  for (const p of products) {
    const soldIn30d = salesMap[p._id.toString()] || 0;
    if (soldIn30d <= 3) {
      const trappedCash = Math.round(p.currentStock * (p.costPrice || 0));
      totalTrappedCapital += trappedCash;
      deadStockItems.push({
        _id: p._id,
        name: p.name,
        brand: p.brand,
        category: p.category,
        currentStock: p.currentStock,
        unit: p.unit,
        costPrice: p.costPrice,
        soldIn30d,
        trappedCash,
        distributorName: p.distributorId?.name || 'Unknown',
        recommendation: soldIn30d === 0 ? 'Dead stock — stop reordering and bundle discount' : 'Slow mover — avoid bulk restock',
      });
    }
  }

  deadStockItems.sort((a, b) => b.trappedCash - a.trappedCash);

  return {
    totalTrappedCapital,
    count: deadStockItems.length,
    items: deadStockItems,
  };
}

module.exports = { getProducts, getTopSellers, getDeadStock, createProduct, updateProduct, deleteProduct };
