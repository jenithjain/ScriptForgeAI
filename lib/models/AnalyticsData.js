import mongoose from 'mongoose';

/**
 * Analytics Data Schema - Time Series Transaction Data
 * Optimized for forecasting and retail analytics
 */
const AnalyticsDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  transactionDate: {
    type: Date,
    required: true,
    index: true
  },
  
  // Product Information
  sku: {
    type: String,
    required: true,
    index: true
  },
  productName: {
    type: String
  },
  category: {
    type: String,
    index: true
  },
  
  // Transaction Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  
  // Customer Information
  customerId: {
    type: String,
    required: true,
    index: true
  },
  customerSegment: {
    type: String,
    enum: ['New', 'Returning', 'VIP', 'At-Risk', 'Churned']
  },
  
  // Channel Information
  channel: {
    type: String,
    enum: ['Online', 'In-Store', 'Mobile App', 'Social Commerce', 'Marketplace'],
    default: 'Online'
  },
  
  // Location Data
  location: {
    country: String,
    state: String,
    city: String,
    zipCode: String
  },
  
  // Additional Metrics
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Campaign Attribution
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timeseries: {
    timeField: 'transactionDate',
    metaField: 'userId',
    granularity: 'hours'
  }
});

// Compound indexes for common queries
AnalyticsDataSchema.index({ userId: 1, transactionDate: -1 });
AnalyticsDataSchema.index({ userId: 1, sku: 1, transactionDate: -1 });
AnalyticsDataSchema.index({ userId: 1, customerId: 1 });
AnalyticsDataSchema.index({ campaignId: 1, transactionDate: -1 });

export default mongoose.models.AnalyticsData || mongoose.model('AnalyticsData', AnalyticsDataSchema);
