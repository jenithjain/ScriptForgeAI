import mongoose from 'mongoose';

/**
 * StyleProfile — Persistent user writing style learned from Story Intelligence analysis.
 * Stored per-user, updated after each workflow run, and loaded as context for future sessions.
 */
const StyleProfileSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
        unique: true,
    },
    // Core style attributes (from StoryContextSchema)
    genre: { type: String, default: '' },
    themes: [{ type: String }],
    tone: {
        formality: { type: String, enum: ['formal', 'informal', 'mixed'], default: 'mixed' },
        sentiment: { type: String, enum: ['dark', 'light', 'neutral', 'complex'], default: 'neutral' },
        pacing: { type: String, enum: ['slow', 'steady', 'fast', 'variable'], default: 'steady' },
    },
    writingStyle: {
        perspective: { type: String, default: '' },
        tense: { type: String, default: '' },
        voice: { type: String, default: '' },
    },
    narrativeStructure: {
        type: { type: String, default: '' },
        preferredFormat: { type: String, enum: ['screenplay', 'novel', 'episodic'], default: 'screenplay' },
    },
    // Accumulated style patterns (learned over multiple sessions)
    vocabularyPatterns: [{ type: String }],       // Frequently used words/phrases
    dialogueStyle: { type: String, default: '' }, // e.g., "snappy, short exchanges" or "long monologues"
    sceneTransitions: { type: String, default: '' }, // e.g., "favors hard cuts" or "uses dissolves"
    characterVoiceNotes: [{
        characterName: String,
        voiceDescription: String,
    }],
    // Metadata
    sessionsAnalyzed: { type: Number, default: 0 },
    lastWorkflowId: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

StyleProfileSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

export default mongoose.models.StyleProfile || mongoose.model('StyleProfile', StyleProfileSchema);
