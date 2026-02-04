import mongoose from 'mongoose';

/**
 * Node Schema for ReactFlow Canvas
 */
const NodeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['toolNode', 'decisionNode', 'triggerNode', 'outputNode']
  },
  data: {
    toolName: {
      type: String,
      required: true
    },
    inputParams: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    generatedOutput: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending'
    }
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
}, { _id: false });

/**
 * Edge Schema for ReactFlow Canvas
 */
const EdgeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  target: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'default'
  },
  animated: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * Chat Message Schema
 */
const ChatMessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * Campaign Schema - The Heart of ChainForecast
 * Stores both the chat context and the resulting workflow graph
 */
const CampaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  campaignName: {
    type: String,
    required: true,
    trim: true
  },
  
  status: {
    type: String,
    enum: ['Conceptualizing', 'Generated', 'Approved', 'Executing', 'Completed', 'Failed'],
    default: 'Conceptualizing',
    index: true
  },
  
  // AI's Strategic Reasoning
  strategicConcept: {
    type: String,
    required: true
  },
  
  // Chat History that Led to This Campaign
  chatContext: {
    type: [ChatMessageSchema],
    default: []
  },
  
  // The ReactFlow Graph State
  canvasState: {
    nodes: {
      type: [NodeSchema],
      default: []
    },
    edges: {
      type: [EdgeSchema],
      default: []
    },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 }
    }
  },
  
  // Execution Metadata
  executionLog: [{
    nodeId: String,
    status: String,
    output: mongoose.Schema.Types.Mixed,
    executedAt: Date,
    error: String
  }],
  
  // Budget and Performance
  estimatedBudget: {
    type: Number,
    default: 0
  },
  actualSpend: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  approvedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
CampaignSchema.index({ userId: 1, status: 1 });
CampaignSchema.index({ createdAt: -1 });

export default mongoose.models.Campaign || mongoose.model('Campaign', CampaignSchema);
