import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import dbConnect from '@/lib/mongodb';
import GeneratedVideo from '@/lib/models/GeneratedVideo';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';

// In-memory store for video operations (use Redis in production)
const videoOperations = new Map();

// Rate limiting: track last video generation per user
const userLastGeneration = new Map();
const MIN_SECONDS_BETWEEN_VIDEOS = 30; // Minimum 30 seconds between video requests

// Memory cleanup constants
const OPERATION_TTL_MS = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run cleanup every 5 minutes

/**
 * Cleanup expired video operations to prevent memory leaks
 */
function cleanupExpiredOperations() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [key, value] of videoOperations.entries()) {
    if (value.timestamp && (now - value.timestamp) > OPERATION_TTL_MS) {
      videoOperations.delete(key);
      cleanedCount++;
    }
  }
  
  // Also cleanup old rate limit entries (older than 24 hours)
  const dayAgo = now - (24 * 60 * 60 * 1000);
  for (const [key, value] of userLastGeneration.entries()) {
    if (value < dayAgo) {
      userLastGeneration.delete(key);
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`[VideoOps] Cleaned up ${cleanedCount} expired operations`);
  }
}

// Start periodic cleanup
setInterval(cleanupExpiredOperations, CLEANUP_INTERVAL_MS);

/**
 * Generate a clean file name for videos
 * Format: {projectName}_{sceneName}_{timestamp}.mp4
 */
function generateVideoFileName(options = {}) {
  const {
    projectName = 'draft',
    sceneName = 'scene',
    promptIndex = 0,
    timestamp = Date.now()
  } = options;
  
  // Clean and sanitize names
  const cleanProject = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 30);
  
  const cleanScene = sceneName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 30);
  
  return `${cleanProject}_${cleanScene}_${promptIndex}_${timestamp}.mp4`;
}

/**
 * Video Generation API using Google Veo 3.1
 * Based on veo-streamlit/app.py implementation
 * 
 * PURPOSE: Visual ideation tool for writers to:
 * - Preview scene atmosphere and mood
 * - Visualize emotional beats
 * - See relationship dynamics and tone
 * 
 * Uses: @google/genai with veo-3.1-generate-preview model
 */
export async function POST(request) {
  // Store request data early to avoid "unusable" error in catch block
  let requestData = {};
  
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting check - prevent hammering the API
    const userId = session.user.id;
    const lastGen = userLastGeneration.get(userId);
    const now = Date.now();
    
    if (lastGen) {
      const secondsSinceLastGen = (now - lastGen) / 1000;
      if (secondsSinceLastGen < MIN_SECONDS_BETWEEN_VIDEOS) {
        const waitTime = Math.ceil(MIN_SECONDS_BETWEEN_VIDEOS - secondsSinceLastGen);
        return NextResponse.json({
          success: false,
          error: `Please wait ${waitTime} seconds before generating another video. This prevents API quota issues.`,
          status: 'rate_limited',
          retryAfter: waitTime,
          tip: 'Veo has strict rate limits. Space out your video generations.'
        }, { status: 429 });
      }
    }

    // Parse request body ONCE and store it
    requestData = await request.json();
    
    const { 
      prompt, 
      aspectRatio = '16:9', 
      resolution = '720p',
      duration = 5,
      negativePrompt = '',
      // New fields for proper naming and DB storage
      workflowId,
      agentType = 'cinematic-teaser',
      agentId,
      promptIndex = 0,
      promptKey,
      sceneName,
      sceneDetails,
      projectName,
      draftName
    } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Video prompt is required' },
        { status: 400 }
      );
    }

    // Ensure duration is integer between 4-8 (Veo requirement)
    const validDuration = Math.min(8, Math.max(4, parseInt(duration) || 5));

    console.log('🎬 Starting Veo 3.1 video generation...');
    console.log('Prompt:', prompt.substring(0, 100) + '...');
    console.log('Config:', { aspectRatio, resolution, duration: validDuration });
    console.log('Project:', { workflowId, projectName, sceneName, promptIndex });

    const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Import the SDK (matching veo-streamlit pattern: from google import genai)
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build config matching veo-streamlit/app.py exactly
    // Python uses snake_case: aspect_ratio, duration_seconds
    // JS SDK might need camelCase OR snake_case - let's try snake_case to match Python
    const configParams = {
      aspect_ratio: aspectRatio,  // snake_case like Python SDK
      resolution: resolution,
    };

    // Add duration - MUST be integer between 4-8
    // veo-streamlit: only 720p supports variable duration, 1080p/4k only 8s
    if (resolution === '720p') {
      configParams.duration_seconds = validDuration;  // snake_case like Python
    } else if ((resolution === '1080p' || resolution === '4k') && validDuration === 8) {
      configParams.duration_seconds = 8;
    }
    // If 1080p/4k with duration != 8, don't add duration_seconds (API will use default)

    // Add negative prompt if provided (snake_case like Python)
    if (negativePrompt) {
      configParams.negative_prompt = negativePrompt;
    }

    console.log('📤 Sending request to Veo API...');
    console.log('Config params:', JSON.stringify(configParams));

    // Try multiple Veo models with fallback
    // Preview models have stricter rate limits, so try stable versions first
    const veoModels = [
      'veo-3.0-generate-001',        // Most stable
      'veo-3.0-fast-generate-001',   // Faster, may have better availability
      'veo-3.1-generate-preview',    // Latest features but preview (stricter limits)
      'veo-2.0-generate-001',        // Older but stable
    ];

    let operation = null;
    let lastError = null;
    let usedModel = null;

    for (const model of veoModels) {
      try {
        console.log(`🎬 Trying model: ${model}`);
        operation = await client.models.generateVideos({
          model: model,
          prompt: prompt,
          config: configParams,
        });
        usedModel = model;
        console.log(`✅ Success with model: ${model}`);
        break;
      } catch (modelError) {
        console.log(`❌ Model ${model} failed:`, modelError.message);
        lastError = modelError;
        // If quota exceeded, wait a bit before trying next model
        if (modelError.message?.includes('quota') || modelError.message?.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        continue;
      }
    }

    if (!operation) {
      throw lastError || new Error('All Veo models failed');
    }

    // Store operation for polling
    const operationId = operation.name || `veo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Debug: log the operation structure to understand the JS SDK response
    console.log('📋 Operation response structure:', JSON.stringify(operation, null, 2));
    console.log('📋 Operation name:', operation.name);
    console.log('📋 Operation keys:', Object.keys(operation || {}));
    
    // Store operation with all metadata for later use when saving
    videoOperations.set(operationId, {
      operation,
      prompt,
      config: configParams,
      status: 'processing',
      startedAt: new Date().toISOString(),
      timestamp: Date.now(), // For cleanup
      client,
      // Metadata for proper naming and DB storage
      userId: session.user.id,
      workflowId,
      agentType,
      agentId,
      promptIndex,
      promptKey: promptKey || `prompt_${promptIndex}`,
      sceneName,
      sceneDetails,
      projectName,
      draftName
    });

    // Update rate limiting timestamp on successful operation start
    userLastGeneration.set(userId, Date.now());

    console.log('✅ Video generation started, operation:', operationId);
    console.log(`🕐 Rate limit: User ${userId} must wait ${MIN_SECONDS_BETWEEN_VIDEOS}s before next video`);

    return NextResponse.json({
      success: true,
      message: 'Video generation started - visual ideation preview',
      operationId: operationId,
      status: 'processing',
      config: {
        prompt: prompt.substring(0, 100) + '...',
        aspectRatio,
        resolution,
        duration: `${validDuration}s`,
      },
      estimatedTime: '30s - 2min for short clips',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Video Generation Error:', error);
    
    // Handle specific error types
    if (error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return NextResponse.json({
        success: false,
        error: 'API quota exceeded. Veo video generation has strict daily limits. Try again later or use fewer videos.',
        status: 'quota_exceeded',
        shouldPoll: false,
        fallbackUrl: 'https://aistudio.google.com',
        tip: 'Veo has ~5-10 videos/day limit on free tier. Wait 1 hour or enable paid billing for higher limits.',
        concept: {
          prompt: requestData.prompt || 'Unknown prompt',
          canRetryIn: '1 hour'
        }
      }, { status: 429 });
    }
    
    if (error.message?.includes('rate') || error.message?.includes('too many')) {
      return NextResponse.json({
        success: false,
        error: 'Rate limit hit. Please wait a moment before generating another video.',
        status: 'rate_limited',
        shouldPoll: false,
        retryAfter: 60,
        tip: 'Wait 60 seconds between video generations',
        concept: {
          prompt: requestData.prompt || 'Unknown prompt'
        }
      }, { status: 429 });
    }
    
    if (error.message?.includes('permission') || error.message?.includes('403')) {
      return NextResponse.json({
        success: false,
        error: 'Veo API access denied. Ensure the API is enabled in your GCP project.',
        status: 'permission_denied',
        shouldPoll: false,  // Tell frontend not to poll
        fallbackUrl: 'https://aistudio.google.com'
      }, { status: 403 });
    }

    // Return concept mode for any other error (use stored requestData instead of re-reading)
    return NextResponse.json({
      success: true,
      message: 'Video generation unavailable - showing concept mode',
      status: 'concept_only',
      shouldPoll: false,  // Tell frontend not to poll
      error: error.message,
      concept: {
        prompt: requestData.prompt || 'Unknown prompt',
        tip: 'Copy this prompt to Google AI Studio to generate the video manually',
      },
      fallbackUrl: 'https://aistudio.google.com',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * GET endpoint to check video generation status and retrieve video
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }

    // Check in-memory store first
    const storedOp = videoOperations.get(operationId);
    
    if (!storedOp) {
      return NextResponse.json({
        success: false,
        status: 'not_found',
        error: 'Operation not found or expired. Please try generating again.'
      }, { status: 404 });
    }

    // If already completed, return cached result
    if (storedOp.status === 'completed' && storedOp.videoUrl) {
      return NextResponse.json({
        success: true,
        status: 'completed',
        videoUrl: storedOp.videoUrl,
        message: 'Video ready for visual ideation preview'
      });
    }

    const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Poll operation status using REST API directly
    // The JS SDK's client.operations.get() doesn't work the same as Python
    // So we use the REST API: GET https://generativelanguage.googleapis.com/v1beta/{operationId}
    console.log('🔄 Polling operation status via REST API...');
    console.log('Operation ID:', operationId);
    
    // The operationId is already in the format: models/veo-3.1-generate-preview/operations/xxx
    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${operationId}?key=${GEMINI_API_KEY}`;
    
    const pollResponse = await fetch(pollUrl);
    
    if (!pollResponse.ok) {
      const errorText = await pollResponse.text();
      console.error('Poll API Error:', pollResponse.status, errorText);
      
      // If 404, the operation may have expired
      if (pollResponse.status === 404) {
        videoOperations.delete(operationId);
        return NextResponse.json({
          success: false,
          status: 'expired',
          error: 'Operation expired. Please generate a new video.',
          shouldPoll: false
        }, { status: 404 });
      }
      
      return NextResponse.json({
        success: false,
        status: 'poll_error',
        error: `Failed to check status: ${errorText}`,
        shouldPoll: false
      }, { status: pollResponse.status });
    }
    
    const operation = await pollResponse.json();
    console.log('📋 Poll response:', JSON.stringify(operation, null, 2).substring(0, 500));

    if (operation.done) {
      console.log('✅ Video generation completed!');
      
      // Get the generated video - handle the actual API response structure:
      // response.generateVideoResponse.generatedSamples[0].video.uri
      const response = operation.response || operation.result || operation;
      
      // Try multiple possible paths for the video
      let generatedVideo = null;
      let videoUri = null;
      
      // Path 1: generateVideoResponse.generatedSamples (actual Veo API structure)
      if (response.generateVideoResponse?.generatedSamples?.[0]) {
        generatedVideo = response.generateVideoResponse.generatedSamples[0];
        videoUri = generatedVideo.video?.uri;
        console.log('📍 Found video via generateVideoResponse.generatedSamples');
      }
      // Path 2: generatedVideos (alternative structure)
      else if (response.generatedVideos?.[0]) {
        generatedVideo = response.generatedVideos[0];
        videoUri = generatedVideo.video?.uri;
        console.log('📍 Found video via generatedVideos');
      }
      // Path 3: generated_videos (snake_case)
      else if (response.generated_videos?.[0]) {
        generatedVideo = response.generated_videos[0];
        videoUri = generatedVideo.video?.uri;
        console.log('📍 Found video via generated_videos');
      }
      
      console.log('🎥 Video URI:', videoUri);
      
      if (videoUri) {
        try {
          // Create videos directory
          const videosDir = path.join(process.cwd(), 'public', 'generated-videos');
          await mkdir(videosDir, { recursive: true });

          // Generate filename with proper naming convention
          // Format: {projectName}_{sceneName}_{promptIndex}_{timestamp}.mp4
          const timestamp = Date.now();
          const videoFileName = generateVideoFileName({
            projectName: storedOp.projectName || storedOp.workflowId || 'draft',
            sceneName: storedOp.sceneName || `scene`,
            promptIndex: storedOp.promptIndex || 0,
            timestamp
          });
          const videoPath = path.join(videosDir, videoFileName);

          console.log('💾 Downloading video from:', videoUri);
          console.log('💾 Saving as:', videoFileName);
          
          // Download the video from the URI
          // The URI already has the path, we just need to add the API key
          // URI format: https://generativelanguage.googleapis.com/v1beta/files/xxx:download?alt=media
          const downloadUrl = videoUri.includes('?') 
            ? `${videoUri}&key=${GEMINI_API_KEY}`
            : `${videoUri}?key=${GEMINI_API_KEY}`;
          
          console.log('📥 Fetching from:', downloadUrl.replace(GEMINI_API_KEY, 'API_KEY_HIDDEN'));
          
          const videoResponse = await fetch(downloadUrl);
          
          if (!videoResponse.ok) {
            const errorText = await videoResponse.text();
            console.error('❌ Video download failed:', videoResponse.status, errorText);
            return NextResponse.json({
              success: false,
              status: 'download_failed',
              error: `Failed to download video: ${videoResponse.status}`,
              shouldPoll: false
            }, { status: 500 });
          }
          
          const arrayBuffer = await videoResponse.arrayBuffer();
          const videoData = Buffer.from(arrayBuffer);
          
          if (videoData.length > 0) {
            await writeFile(videoPath, videoData);
            console.log('💾 Video saved! Size:', (videoData.length / 1024 / 1024).toFixed(2), 'MB');

            const videoUrl = `/generated-videos/${videoFileName}`;

            // Save to database for persistence across page refreshes
            if (storedOp.workflowId) {
              try {
                await dbConnect();
                
                // Check if video already exists, update if so
                const existingVideo = await GeneratedVideo.findOne({
                  workflowId: storedOp.workflowId,
                  agentType: storedOp.agentType,
                  promptKey: storedOp.promptKey,
                  userId: storedOp.userId
                });

                if (existingVideo) {
                  existingVideo.localPath = videoUrl;
                  existingVideo.fileName = videoFileName;
                  existingVideo.fileSize = videoData.length;
                  existingVideo.status = 'completed';
                  existingVideo.generatedAt = new Date();
                  await existingVideo.save();
                  console.log('📝 Updated video in database');
                } else {
                  await GeneratedVideo.create({
                    workflowId: storedOp.workflowId,
                    userId: storedOp.userId,
                    agentId: storedOp.agentId || 'unknown',
                    agentType: storedOp.agentType || 'cinematic-teaser',
                    promptIndex: storedOp.promptIndex || 0,
                    promptKey: storedOp.promptKey || `prompt_${storedOp.promptIndex || 0}`,
                    prompt: storedOp.prompt,
                    sceneName: storedOp.sceneName,
                    sceneDetails: storedOp.sceneDetails,
                    localPath: videoUrl,
                    fileName: videoFileName,
                    fileSize: videoData.length,
                    config: storedOp.config,
                    operationId,
                    projectName: storedOp.projectName,
                    draftName: storedOp.draftName,
                    status: 'completed',
                    generatedAt: new Date()
                  });
                  console.log('📝 Saved new video to database');
                }

                // Also update the workflow node's result with the video URL so it persists
                // This ensures the video displays even after page refresh
                if (storedOp.workflowId && storedOp.agentId) {
                  try {
                    const workflow = await ScriptWorkflow.findById(storedOp.workflowId);
                    if (workflow && workflow.nodes) {
                      const nodeIndex = workflow.nodes.findIndex(n => 
                        n.id === storedOp.agentId || 
                        n.data?.agentType === storedOp.agentType
                      );
                      
                      if (nodeIndex !== -1) {
                        // Initialize generatedVideos if it doesn't exist
                        if (!workflow.nodes[nodeIndex].data.generatedVideos) {
                          workflow.nodes[nodeIndex].data.generatedVideos = {};
                        }
                        // Store the video path in the node's data
                        workflow.nodes[nodeIndex].data.generatedVideos[storedOp.promptKey] = videoUrl;
                        await workflow.save();
                        console.log('📝 Updated workflow node with video URL');
                      }
                    }
                  } catch (workflowError) {
                    console.error('⚠️ Failed to update workflow node:', workflowError);
                  }
                }
              } catch (dbError) {
                console.error('⚠️ Failed to save video to database:', dbError);
                // Continue anyway - video is still saved to disk
              }
            }

            // Update stored operation
            storedOp.status = 'completed';
            storedOp.videoUrl = videoUrl;
            storedOp.completedAt = new Date().toISOString();
            videoOperations.set(operationId, storedOp);

            console.log('🎉 Video saved successfully:', videoUrl);

            return NextResponse.json({
              success: true,
              status: 'completed',
              videoUrl: videoUrl,
              message: 'Visual ideation preview ready!',
              metadata: {
                prompt: storedOp.prompt?.substring(0, 100),
                config: storedOp.config,
                completedAt: storedOp.completedAt,
                fileSize: `${(videoData.length / 1024 / 1024).toFixed(2)} MB`
              }
            });
          } else {
            return NextResponse.json({
              success: false,
              status: 'empty_video',
              error: 'Downloaded video file is empty',
              shouldPoll: false
            }, { status: 500 });
          }

        } catch (saveError) {
          console.error('Error saving video:', saveError);
          return NextResponse.json({
            success: false,
            status: 'save_error',
            error: 'Video generated but failed to save: ' + saveError.message,
            shouldPoll: false
          }, { status: 500 });
        }
      } else {
        // Generation completed but no video URI found
        console.log('❌ No video URI in response. Full operation:', JSON.stringify(operation, null, 2));
        storedOp.status = 'failed';
        videoOperations.set(operationId, storedOp);
        
        // Check for error in operation
        if (operation.error) {
          return NextResponse.json({
            success: false,
            status: 'generation_error',
            error: operation.error.message || 'Video generation failed',
            errorDetails: operation.error,
            shouldPoll: false
          });
        }
        
        return NextResponse.json({
          success: false,
          status: 'failed',
          error: 'Video generation completed but no video URI was returned',
          shouldPoll: false
        });
      }
    }

    // Still processing
    const elapsed = Math.round((Date.now() - new Date(storedOp.startedAt).getTime()) / 1000);
    
    return NextResponse.json({
      success: true,
      status: 'processing',
      operationId,
      message: `Generating visual preview... (${elapsed}s elapsed)`,
      elapsed: elapsed
    });

  } catch (error) {
    console.error('Video Status Check Error:', error);
    console.error('Error details - message:', error.message);
    console.error('Error details - stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
    
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message || 'Failed to check video status',
      shouldPoll: false  // Stop polling on error
    }, { status: 500 });
  }
}
