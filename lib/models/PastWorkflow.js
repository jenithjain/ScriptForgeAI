import mongoose from 'mongoose';

const NodeSchema = new mongoose.Schema({
  id: String,
  type: String,
  position: { x: Number, y: Number },
  data: mongoose.Schema.Types.Mixed,
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: String,
  source: String,
  target: String,
  type: String,
  animated: Boolean,
  data: mongoose.Schema.Types.Mixed,
}, { _id: false });

const PastWorkflowSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  brief: { type: String, required: true },
  strategyRationale: { type: String, required: true },
  nodes: { type: [NodeSchema], default: [] },
  edges: { type: [EdgeSchema], default: [] },
  createdAt: { type: Date, default: Date.now, index: true }
});

export default mongoose.models.PastWorkflow || mongoose.model('PastWorkflow', PastWorkflowSchema);
