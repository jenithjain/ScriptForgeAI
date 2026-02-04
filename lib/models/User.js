import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Business Profile Schema (KYC Data)
 * This is embedded within the User document for efficient access
 */
const BusinessProfileSchema = new mongoose.Schema({
  // Identity Section (Questions 1-3)
  businessType: {
    type: String,
    enum: ['LLC', 'Sole Proprietorship', 'Partnership', 'Corporation', 'Other'],
    required: true
  },
  industry: {
    type: String,
    enum: ['Retail', 'SaaS', 'E-commerce', 'Manufacturing', 'Services', 'Other'],
    required: true
  },
  employeeCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    required: true
  },

  // Financials Section (Questions 4-6)
  revenueTier: {
    type: String,
    enum: ['<100K', '100K-500K', '500K-1M', '1M-5M', '5M+'],
    required: true
  },
  businessModel: {
    type: String,
    enum: ['Subscription', 'One-time Purchase', 'Hybrid', 'Freemium'],
    required: true
  },
  averageOrderValue: {
    type: String,
    enum: ['<$50', '$50-$200', '$200-$500', '$500-$1000', '$1000+'],
    required: true
  },

  // Targeting Section (Questions 7-8)
  audienceDemographic: {
    type: [String],
    enum: ['Gen Z', 'Millennials', 'Gen X', 'Baby Boomers', 'B2B'],
    required: true
  },
  purchaseFrequency: {
    type: String,
    enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'],
    required: true
  },

  // Marketing Section (Questions 9-10)
  acquisitionChannels: {
    type: [String],
    enum: ['Social Media', 'SEO', 'Paid Ads', 'Email', 'Referrals', 'Events', 'Direct'],
    required: true
  },
  activePlatforms: {
    type: [String],
    enum: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter/X', 'TikTok', 'YouTube', 'Pinterest'],
    required: true
  },

  // Operations Section (Questions 11-12)
  skuCount: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '500+'],
    required: true
  },
  peakSeasonality: {
    type: [String],
    enum: ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)', 'Holiday Season', 'No Peak'],
    required: true
  },

  // Goals Section (Questions 13-14)
  primaryObjective: {
    type: String,
    enum: ['Increase Sales', 'Brand Awareness', 'Customer Retention', 'Market Expansion', 'Lead Generation'],
    required: true
  },
  painPoints: {
    type: [String],
    enum: ['Low Conversion', 'High CAC', 'Poor Retention', 'Limited Budget', 'Lack of Analytics', 'Time Constraints'],
    required: true
  },

  // Compliance Section (Questions 15-16)
  documentType: {
    type: String,
    enum: ['Business License', 'Tax ID', 'Registration Certificate', 'Other'],
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending'
  },
  
  // Metadata
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * User Schema with Embedded KYC
 */
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function() {
      return this.authProvider === 'credentials';
    }
  },
  authProvider: {
    type: String,
    enum: ['credentials', 'google'],
    default: 'credentials',
    required: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  
  // KYC Data (Embedded)
  businessProfile: {
    type: BusinessProfileSchema,
    default: null
  },
  
  // Onboarding Status
  hasCompletedKYC: {
    type: Boolean,
    default: false
  },
  
  // API Keys (Optional for future integrations)
  apiKeys: {
    gemini: { type: String, select: false },
    midjourney: { type: String, select: false },
    other: { type: Map, of: String, select: false }
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Prevent model recompilation in development
export default mongoose.models.User || mongoose.model('User', UserSchema);
