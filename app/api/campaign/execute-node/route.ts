import { NextResponse } from 'next/server';
import { getFlashModel, getImageModel, generateWithRetry } from '@/lib/gemini';
import { buildExecutionContext, compilePrompt } from '@/lib/execution-engine';
import { WorkflowNode, WorkflowEdge } from '@/types/workflow';
import { saveBase64Image } from '@/lib/fs-helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import dbConnect from '@/lib/mongodb';
import User from '@/lib/models/User';

export async function POST(request: Request) {
  try {
    const { nodeId, nodes, edges, brief, strategy } = await request.json();

    // Validate input
    if (!nodeId || !nodes || !edges || !brief || !strategy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build execution context
    // Get user's KYC business profile from session
    let kyc: Record<string, any> | undefined = undefined;
    try {
      const session: any = await getServerSession(authOptions as any);
      if (session?.user?.id) {
        await dbConnect();
        const user = await User.findById(session.user.id).select('businessProfile');
        if (user?.businessProfile) {
          kyc = user.businessProfile.toObject?.() || user.businessProfile;
        }
      }
    } catch {}

    const context = buildExecutionContext(
      nodeId,
      nodes as WorkflowNode[],
      edges as WorkflowEdge[],
      brief,
      strategy,
      kyc
    );

    // Compile the final prompt
    let finalPrompt = compilePrompt(context);

    // If image node, enforce ad creative style with CTA overlays
    if (context.nodeType === 'image') {
      finalPrompt += `\n\nAD CREATIVE REQUIREMENTS:\n- Generate 2 to 4 product ad image concepts.\n- Each image should feel like a polished marketing asset.\n- Integrate concise overlay text: headline (max 6 words) + subline (max 10 words).\n- Include a clear call-to-action phrase variant: "Shop Now", "Free Home Delivery", "Order Today", or "Limited Offer".\n- Use clean readable typography, high contrast, and leave safe margins around text.\n- Return only raw images (no descriptive paragraphs).`; 
    }

    if (context.nodeType === 'image') {
      // Image generation producing multiple ad set variants
      const imageModel = getImageModel();
      try {
        const images: { file: string; url: string; theme?: string }[] = [];
        const themes = ['Minimalist Clean', 'Vibrant Pop', 'Natural Organic', 'Luxury Monochrome'];
        const variantCount = Math.min(4, themes.length);
        for (let i = 0; i < variantCount; i++) {
          const theme = themes[i];
          const variantPrompt = finalPrompt + `\nVARIANT INDEX: ${i + 1}\nVARIANT THEME: ${theme}\nGuidance: Ensure the visual style reflects the theme through palette, composition, and typography accents.`;
          const result: any = await imageModel.generateContent(variantPrompt);
          const response: any = await result.response;
          const parts = response.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            const inline = part?.inlineData;
            if (inline?.mimeType?.startsWith('image/')) {
              const ext = inline.mimeType.includes('jpeg') ? 'jpg' : inline.mimeType.split('/')[1] || 'png';
              const saved = saveBase64Image(inline.data, 'campaign', ext);
              images.push({ file: saved.fullPath, url: `/api/tmp-images/${saved.filename}`, theme });
            }
          }
        }
        if (images.length === 0) {
          return NextResponse.json({ success: true, output: 'Image model did not return images.', nodeId });
        }
        const payload = JSON.stringify({ images, meta: { type: 'ad_creatives', count: images.length, themes, ctaExamples: ['Shop Now','Free Home Delivery','Order Today','Limited Offer'] } });
        return NextResponse.json({ success: true, output: payload, nodeId });
      } catch (e) {
        console.error('Image generation failed:', e);
        return NextResponse.json({ success: false, error: 'Image generation failed' }, { status: 500 });
      }
    } else {
      // Text generation (ad copy, research, etc.) using Gemini 2.5 Pro
      const textModel = getFlashModel();
      try {
        const output = await generateWithRetry(textModel, finalPrompt);
        const processedOutput = output.trim();
        return NextResponse.json({ success: true, output: processedOutput, nodeId });
      } catch (error) {
        console.error('Text generation failed:', error);
        return NextResponse.json({ success: false, error: 'Failed to generate content' }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error executing node:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute node',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
