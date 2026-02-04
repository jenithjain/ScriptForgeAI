import mongoose from 'mongoose';

const ScriptVersionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ScriptWorkflow',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  message: {
    type: String, // Commit message
    default: 'Checkpoint save'
  },
  tags: [String], // e.g., 'major', 'auto-save', 'v1.0'
  stats: {
    addedLines: Number,
    removedLines: Number,
    totalLines: Number
  }
}, {
  timestamps: true
});

// Index for retrieving history efficiently
ScriptVersionSchema.index({ workflowId: 1, createdAt: -1 });

export default mongoose.models.ScriptVersion || mongoose.model('ScriptVersion', ScriptVersionSchema);
