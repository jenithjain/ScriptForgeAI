import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import StyleProfile from '@/lib/models/StyleProfile';

/**
 * GET /api/style-profile — Load the user's persisted style profile
 * POST /api/style-profile — Save/update style profile from Story Intelligence output
 */

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const profile = await StyleProfile.findOne({ userId: session.user.id });

        if (!profile) {
            return NextResponse.json({ profile: null, message: 'No style profile found. Run a workflow to create one.' });
        }

        return NextResponse.json({ profile });
    } catch (error) {
        console.error('Style profile GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { storyIntel, workflowId } = await request.json();

        if (!storyIntel) {
            return NextResponse.json({ error: 'Missing storyIntel data' }, { status: 400 });
        }

        await connectDB();

        // Upsert: update existing profile or create new one
        const update = {
            userId: session.user.id,
            genre: storyIntel.genre || '',
            themes: storyIntel.themes || [],
            tone: {
                formality: storyIntel.tone?.formality || 'mixed',
                sentiment: storyIntel.tone?.sentiment || 'neutral',
                pacing: storyIntel.tone?.pacing || 'steady',
            },
            writingStyle: {
                perspective: storyIntel.writingStyle?.perspective || '',
                tense: storyIntel.writingStyle?.tense || '',
                voice: storyIntel.writingStyle?.voice || '',
            },
            narrativeStructure: {
                type: storyIntel.narrativeStructure?.type || '',
            },
            lastWorkflowId: workflowId || '',
            updatedAt: new Date(),
            $inc: { sessionsAnalyzed: 1 },
        };

        const profile = await StyleProfile.findOneAndUpdate(
            { userId: session.user.id },
            update,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({
            profile,
            message: `Style profile updated (${profile.sessionsAnalyzed} sessions analyzed)`
        });
    } catch (error) {
        console.error('Style profile POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
