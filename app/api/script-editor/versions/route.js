import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import ScriptVersion from '@/lib/models/ScriptVersion';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    await connectDB();

    const versions = await ScriptVersion.find({ workflowId })
      .sort({ createdAt: -1 })
      .limit(50) // Limit to last 50 versions for performance
      .populate('userId', 'name email image'); // Optional: populate user details

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId, content, message, stats } = await request.json();

    if (!workflowId || !content) {
      return NextResponse.json({ error: 'Workflow ID and content are required' }, { status: 400 });
    }

    await connectDB();

    const newVersion = await ScriptVersion.create({
      workflowId,
      userId: session.user.id, // Assuming session.user.id is populated
      content,
      message: message || 'Manual save',
      stats: stats || { totalLines: content.split('\n').length }
    });

    return NextResponse.json({ success: true, version: newVersion });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
