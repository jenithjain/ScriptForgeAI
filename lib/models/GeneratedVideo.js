import mongoose from 'mongoose';

const GeneratedVideoSchema = new mongoose.Schema({
  // Reference to the workflow/project
  workflowId: {
    type: String,
    required: true,
    index: true
  },
  
  // User who generated the video
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Agent that generated this video
  agentId: {
    type: String,
    required: true
  },
  agentType: {
    type: String,
    required: true
  },
  
  // Video identification
  promptIndex: {
    type: Number,
    required: true
  },
  promptKey: {
    type: String,
    required: true  // e.g., "prompt_0", "prompt_1"
  },
  
  // The original prompt used for generation
  prompt: {
    type: String,
    required: true
  },
  
  // Scene details from the visual prompt
  sceneName: {
    type: String
  },
  sceneDetails: {
    location: String,
    characters: [String],
    mood: String,
    tone: String,
    cameraAngle: String
  },
  
  // Video file information
  localPath: {
    type: String,
    required: true  // e.g., "/generated-videos/varuna_draft_scene1_1234567890.mp4"
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number  // in bytes
  },
  
  // Video configuration
  config: {
    aspectRatio: {
      type: String,
      default: '16:9'
    },
    resolution: {
      type: String,
      default: '720p'
    },
    duration: {
      type: Number,
      default: 5
    }
  },
  
  // Generation status
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed', 'expired'],
    default: 'completed'
  },
  
  // Veo operation tracking
  operationId: {
    type: String
  },
  
  // Timestamps
  generatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Project/draft naming info for file naming
  projectName: {
    type: String
  },
  draftName: {
    type: String
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
GeneratedVideoSchema.index({ workflowId: 1, agentType: 1, promptKey: 1 });
GeneratedVideoSchema.index({ userId: 1, workflowId: 1 });

// Static method to find videos for a specific workflow and agent
GeneratedVideoSchema.statics.findByWorkflowAndAgent = function(workflowId, agentType) {
  return this.find({ workflowId, agentType }).sort({ promptIndex: 1 });
};

// Static method to find all videos for a workflow
GeneratedVideoSchema.statics.findByWorkflow = function(workflowId) {
  return this.find({ workflowId }).sort({ agentType: 1, promptIndex: 1 });
};

// Method to get public URL
GeneratedVideoSchema.methods.getPublicUrl = function() {
  return this.localPath;
};

export default mongoose.models.GeneratedVideo || mongoose.model('GeneratedVideo', GeneratedVideoSchema);
