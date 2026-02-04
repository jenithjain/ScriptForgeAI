import mongoose from 'mongoose';

// Delete existing model if it exists to force recompilation
if (mongoose.models.ScriptWorkflow) {
  delete mongoose.models.ScriptWorkflow;
}

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
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  brief: {
    type: String,
    trim: true
  },
  nodes: [mongoose.Schema.Types.Mixed],
  edges: [mongoose.Schema.Types.Mixed],
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
  strict: false
});

// Index for faster queries
ScriptWorkflowSchema.index({ userId: 1, status: 1, updatedAt: -1 });

export default mongoose.model('ScriptWorkflow', ScriptWorkflowSchema);
