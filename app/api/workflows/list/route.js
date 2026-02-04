import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import PastWorkflow from '@/lib/models/PastWorkflow';
import User from '@/lib/models/User';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const workflows = await PastWorkflow.find({ userId: user._id }).sort({ createdAt: -1 }).limit(25).lean();
    return NextResponse.json({ success: true, workflows: workflows.map(w => ({
      id: w._id.toString(),
      brief: w.brief.substring(0, 140) + (w.brief.length > 140 ? '…' : ''),
      strategyRationale: w.strategyRationale.substring(0, 140) + (w.strategyRationale.length > 140 ? '…' : ''),
      createdAt: w.createdAt,
      nodesCount: w.nodes.length,
      edgesCount: w.edges.length,
      nodes: w.nodes,
      edges: w.edges,
    })) });
  } catch (e) {
    console.error('List workflows error:', e);
    return NextResponse.json({ error: 'Failed to list workflows' }, { status: 500 });
  }
}
