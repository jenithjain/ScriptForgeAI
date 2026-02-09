import mongoose from 'mongoose';

// Delete existing model if it exists to force recompilation
if (mongoose.models.ScriptWorkflow) {
  delete mongoose.models.ScriptWorkflow;
}

// Define nested schemas for better structure
const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, required: true },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 }
  },
  data: mongoose.Schema.Types.Mixed
}, { _id: false, strict: false }); // Allow additional node-specific fields

const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, default: 'default' },
  data: mongoose.Schema.Types.Mixed
}, { _id: false, strict: false });

const ScriptWorkflowSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true
    // No maxlength - description can mirror brief for legacy data
  },
  brief: {
    type: String,
    trim: true,
    maxlength: 50000 // Allow long manuscripts
  },
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  status: {
    type: String,
    enum: ['draft', 'active', 'running', 'completed', 'partial', 'error'],
    default: 'draft'
  },
  inputs: mongoose.Schema.Types.Mixed,
  progress: mongoose.Schema.Types.Mixed,
  analysisContext: mongoose.Schema.Types.Mixed,
  lastRun: Date
}, {
  timestamps: true,
  strict: true // Enforce schema - no arbitrary root-level fields
});

// Index for faster queries
ScriptWorkflowSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export default mongoose.model('ScriptWorkflow', ScriptWorkflowSchema);
