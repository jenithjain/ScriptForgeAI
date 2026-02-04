import mongoose from 'mongoose';

/**
 * Tool Schema - Registry of AI Agent Capabilities
 * Defines what tools the AI can use to build campaigns
 */
const ToolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  displayName: {
    type: String,
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  category: {
    type: String,
    enum: ['Content Generation', 'Visual Design', 'Analytics', 'Automation', 'Social Media', 'Email Marketing'],
    required: true
  },
  
  // Input Schema Definition (JSON Schema format)
  requiredInputs: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Output Schema Definition
  outputSchema: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // API Handler Reference
  apiHandler: {
    type: String,
    required: true
  },
  
  // Pricing Information
  costPerExecution: {
    type: Number,
    default: 0
  },
  
  // Tool Configuration
  config: {
    maxRetries: { type: Number, default: 3 },
    timeout: { type: Number, default: 30000 }, // milliseconds
    rateLimit: { type: Number, default: 100 } // requests per minute
  },
  
  // Tool Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Usage Statistics
  usageCount: {
    type: Number,
    default: 0
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

// Index for efficient lookups
ToolSchema.index({ name: 1, isActive: 1 });
ToolSchema.index({ category: 1 });

export default mongoose.models.Tool || mongoose.model('Tool', ToolSchema);
