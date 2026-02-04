import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import GeneratedVideo from '@/lib/models/GeneratedVideo';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';

/**
 * GET - Fetch generated videos for a workflow/agent
 * Query params:
 *   - workflowId: The workflow ID
 *   - agentType: (optional) Filter by agent type
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');
    const agentType = searchParams.get('agentType');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'workflowId is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Build query
    const query = { 
      workflowId,
      userId: session.user.id,
      status: 'completed'
    };
    
    if (agentType) {
      query.agentType = agentType;
    }

    // Fetch videos
    const videos = await GeneratedVideo.find(query)
      .sort({ agentType: 1, promptIndex: 1 })
      .lean();

    // Transform to a map format for easy frontend consumption
    // { "cinematic-teaser": { "prompt_0": "/path/to/video.mp4", ... } }
    const videoMap = {};
    
    videos.forEach(video => {
      if (!videoMap[video.agentType]) {
        videoMap[video.agentType] = {
          videos: {},
          statuses: {}
        };
      }
      
      videoMap[video.agentType].videos[video.promptKey] = video.localPath;
      videoMap[video.agentType].statuses[video.promptKey] = {
        status: video.status,
        message: video.status === 'completed' ? 'Video ready' : video.status,
        sceneName: video.sceneName,
        generatedAt: video.generatedAt
      };
    });

    return NextResponse.json({
      success: true,
      videos: videoMap,
      count: videos.length
    });

  } catch (error) {
    console.error('Fetch videos error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch videos'
    }, { status: 500 });
  }
}

/**
 * POST - Save a generated video record to database
 * Used by generate-video API after successful generation
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      workflowId,
      agentType,
      agentId,
      promptIndex,
      promptKey,
      prompt,
      sceneName,
      sceneDetails,
      localPath,
      fileName,
      fileSize,
      config,
      operationId,
      projectName,
      draftName
    } = data;

    if (!workflowId || !agentType || !localPath) {
      return NextResponse.json({
        error: 'workflowId, agentType, and localPath are required'
      }, { status: 400 });
    }

    await dbConnect();

    // Check if a video already exists for this prompt
    const existingVideo = await GeneratedVideo.findOne({
      workflowId,
      agentType,
      promptKey,
      userId: session.user.id
    });

    if (existingVideo) {
      // Update existing record
      existingVideo.localPath = localPath;
      existingVideo.fileName = fileName;
      existingVideo.fileSize = fileSize;
      existingVideo.prompt = prompt || existingVideo.prompt;
      existingVideo.sceneName = sceneName || existingVideo.sceneName;
      existingVideo.sceneDetails = sceneDetails || existingVideo.sceneDetails;
      existingVideo.config = config || existingVideo.config;
      existingVideo.status = 'completed';
      existingVideo.generatedAt = new Date();
      
      await existingVideo.save();
      
      return NextResponse.json({
        success: true,
        message: 'Video record updated',
        video: existingVideo
      });
    }

    // Create new video record
    const newVideo = new GeneratedVideo({
      workflowId,
      userId: session.user.id,
      agentId: agentId || 'unknown',
      agentType,
      promptIndex: promptIndex || 0,
      promptKey: promptKey || `prompt_${promptIndex || 0}`,
      prompt: prompt || '',
      sceneName,
      sceneDetails,
      localPath,
      fileName,
      fileSize,
      config: config || {},
      operationId,
      projectName,
      draftName,
      status: 'completed',
      generatedAt: new Date()
    });

    await newVideo.save();

    return NextResponse.json({
      success: true,
      message: 'Video record saved',
      video: newVideo
    });

  } catch (error) {
    console.error('Save video record error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to save video record'
    }, { status: 500 });
  }
}

/**
 * DELETE - Remove a generated video record
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const workflowId = searchParams.get('workflowId');
    const promptKey = searchParams.get('promptKey');
    const agentType = searchParams.get('agentType');

    await dbConnect();

    let result;
    
    if (videoId) {
      // Delete by video ID
      result = await GeneratedVideo.findOneAndDelete({
        _id: videoId,
        userId: session.user.id
      });
    } else if (workflowId && agentType && promptKey) {
      // Delete by workflow, agent, and prompt
      result = await GeneratedVideo.findOneAndDelete({
        workflowId,
        agentType,
        promptKey,
        userId: session.user.id
      });
    } else {
      return NextResponse.json({
        error: 'videoId or (workflowId, agentType, promptKey) required'
      }, { status: 400 });
    }

    if (!result) {
      return NextResponse.json({
        error: 'Video not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Video record deleted'
    });

  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete video'
    }, { status: 500 });
  }
}
