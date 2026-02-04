import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import PastWorkflow from '@/lib/models/PastWorkflow';
import User from '@/lib/models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const body = await request.json();
    const { brief, strategyRationale, nodes, edges } = body;
    if (!brief || !strategyRationale || !Array.isArray(nodes) || !Array.isArray(edges)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Sanitize node data (remove openSettings functions if present)
    const sanitizedNodes = nodes.map(n => ({
      ...n,
      data: (() => {
        const d = { ...(n.data || {}) };
        delete d.openSettings;
        return d;
      })()
    }));

    const wf = await PastWorkflow.create({
      userId: user._id,
      brief,
      strategyRationale,
      nodes: sanitizedNodes,
      edges,
    });

    return NextResponse.json({ success: true, id: wf._id.toString(), createdAt: wf.createdAt });
  } catch (e) {
    console.error('Save workflow error:', e);
    return NextResponse.json({ error: 'Failed to save workflow' }, { status: 500 });
  }
}
