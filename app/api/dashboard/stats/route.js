import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import ScriptVersion from '@/lib/models/ScriptVersion';
import GeneratedVideo from '@/lib/models/GeneratedVideo';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const userId = session.user.id;

    // Fetch all user workflows
    const workflows = await ScriptWorkflow.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch all versions for user's workflows
    const workflowIds = workflows.map(w => w._id);
    const versions = await ScriptVersion.find({ workflowId: { $in: workflowIds } })
      .sort({ createdAt: -1 })
      .lean();

    // Fetch all generated videos
    const videos = await GeneratedVideo.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // --- Compute stats ---

    // Workflow status breakdown
    const statusCounts = { draft: 0, active: 0, running: 0, completed: 0, partial: 0, error: 0 };
    workflows.forEach(w => {
      if (statusCounts[w.status] !== undefined) statusCounts[w.status]++;
    });

    // Word counts from latest version of each workflow
    const latestVersionByWorkflow = {};
    versions.forEach(v => {
      const wId = v.workflowId.toString();
      if (!latestVersionByWorkflow[wId] || new Date(v.createdAt) > new Date(latestVersionByWorkflow[wId].createdAt)) {
        latestVersionByWorkflow[wId] = v;
      }
    });

    // Calculate total words across all workflows
    let totalWords = 0;
    const workflowWordCounts = [];
    for (const wf of workflows) {
      const latestVersion = latestVersionByWorkflow[wf._id.toString()];
      const wordCount = latestVersion?.content
        ? latestVersion.content.split(/\s+/).filter(Boolean).length
        : 0;
      totalWords += wordCount;
      workflowWordCounts.push({
        id: wf._id,
        name: wf.name,
        wordCount,
        status: wf.status,
        updatedAt: wf.updatedAt,
        createdAt: wf.createdAt
      });
    }

    // Version activity over time (last 30 days, grouped by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentVersions = versions.filter(v => new Date(v.createdAt) >= thirtyDaysAgo);

    const activityByDay = {};
    recentVersions.forEach(v => {
      const day = new Date(v.createdAt).toISOString().split('T')[0];
      if (!activityByDay[day]) {
        activityByDay[day] = { date: day, saves: 0, linesAdded: 0, linesRemoved: 0 };
      }
      activityByDay[day].saves++;
      activityByDay[day].linesAdded += v.stats?.addedLines || 0;
      activityByDay[day].linesRemoved += v.stats?.removedLines || 0;
    });

    const activityTimeline = Object.values(activityByDay).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Video stats
    const videoStatusCounts = { processing: 0, completed: 0, failed: 0, expired: 0 };
    videos.forEach(v => {
      if (videoStatusCounts[v.status] !== undefined) videoStatusCounts[v.status]++;
    });

    // Videos by agent type
    const videosByAgent = {};
    videos.forEach(v => {
      if (!videosByAgent[v.agentType]) videosByAgent[v.agentType] = 0;
      videosByAgent[v.agentType]++;
    });

    // Recent workflows (top 5)
    const recentWorkflows = workflows.slice(0, 5).map(w => ({
      id: w._id,
      name: w.name,
      status: w.status,
      updatedAt: w.updatedAt,
      createdAt: w.createdAt,
      nodeCount: w.nodes?.length || 0,
      description: w.description || ''
    }));

    // Version stats
    const totalVersions = versions.length;
    const totalLinesAdded = versions.reduce((sum, v) => sum + (v.stats?.addedLines || 0), 0);
    const totalLinesRemoved = versions.reduce((sum, v) => sum + (v.stats?.removedLines || 0), 0);

    // Workflow creation timeline (monthly)
    const workflowsByMonth = {};
    workflows.forEach(w => {
      const month = new Date(w.createdAt).toISOString().slice(0, 7);
      if (!workflowsByMonth[month]) workflowsByMonth[month] = 0;
      workflowsByMonth[month]++;
    });

    const creationTimeline = Object.entries(workflowsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        workflows: count
      }));

    return NextResponse.json({
      success: true,
      stats: {
        totalWorkflows: workflows.length,
        totalWords,
        totalVersions,
        totalVideos: videos.length,
        totalLinesAdded,
        totalLinesRemoved,
        statusCounts,
        videoStatusCounts,
        videosByAgent
      },
      workflowWordCounts,
      activityTimeline,
      creationTimeline,
      recentWorkflows,
      user: {
        name: session.user.name,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard stats' },
      { status: 500 }
    );
  }
}
