import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/mongodb';
import ScriptWorkflow from '@/lib/models/ScriptWorkflow';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * COMPREHENSIVE PDF REPORT GENERATOR FOR WRITERS
 * Generates a detailed, professional PDF report analyzing all aspects of the manuscript
 * Includes insights from all 7 AI agents with actionable recommendations
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { workflowId } = await request.json();

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID is required' }, { status: 400 });
    }

    await connectDB();

    const workflow = await ScriptWorkflow.findOne({
      _id: workflowId,
      userId: session.user.id
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Collect ALL agent results with complete data
    const agentResults = {};
    for (const node of workflow.nodes || []) {
      if (node.data?.result || node.data?.output) {
        agentResults[node.data.agentType] = {
          result: node.data.result || {},
          output: node.data.output || '',
          status: node.data.status || 'unknown',
          prompt: node.data.prompt || '',
          input: node.data.input || ''
        };
      }
    }

    // Validate at least one agent ran
    if (Object.keys(agentResults).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No agent results found. Please run the workflow first.'
      }, { status: 400 });
    }

    // Generate comprehensive PDF
    const pdfBytes = await generateComprehensivePDF(workflow, agentResults);

    // Return PDF as base64
    return NextResponse.json({
      success: true,
      pdf: Buffer.from(pdfBytes).toString('base64'),
      filename: `${sanitizeFilename(workflow.name || 'Manuscript_Analysis')}_Report_${new Date().toISOString().split('T')[0]}.pdf`
    });

  } catch (error) {
    console.error('Report Generation Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate report'
    }, { status: 500 });
  }
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
}

// Colors
const colors = {
  primary: rgb(0.545, 0.361, 0.965),      // #8B5CF6
  secondary: rgb(0.063, 0.725, 0.506),    // #10B981
  danger: rgb(0.937, 0.267, 0.267),       // #EF4444
  warning: rgb(0.961, 0.620, 0.043),      // #F59E0B
  text: rgb(0.122, 0.161, 0.216),         // #1F2937
  muted: rgb(0.420, 0.447, 0.502),        // #6B7280
  light: rgb(0.6, 0.6, 0.6)
};

/**
 * Sanitize text for PDF rendering - removes newlines and other problematic characters
 */
function sanitizeText(text) {
  if (!text) return '';
  return String(text).replace(/[\r\n\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * COMPREHENSIVE PDF GENERATOR - Professional manuscript analysis report
 * Creates a detailed, multi-section PDF with insights from all 7 AI agents
 */

// PDF Document Constants (A4 in points)
const PDF_CONFIG = {
  PAGE_WIDTH: 595,
  PAGE_HEIGHT: 842,
  MARGIN: 50,
  get CONTENT_WIDTH() { return this.PAGE_WIDTH - (this.MARGIN * 2); }
};

async function generateComprehensivePDF(workflow, agentResults) {
  const pdfDoc = await PDFDocument.create();
  
  // Embed fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  const { PAGE_WIDTH: pageWidth, PAGE_HEIGHT: pageHeight, MARGIN: margin, CONTENT_WIDTH: contentWidth } = PDF_CONFIG;

  // Helper to add new page
  const addPage = () => {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    return { page, y: pageHeight - margin };
  };

  // Helper to wrap text
  const wrapText = (text, maxWidth, fontSize, usedFont = font) => {
    // Sanitize text to remove newlines and other problematic characters
    const cleanText = sanitizeText(text);
    const words = cleanText.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if (!word) continue; // Skip empty words
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = usedFont.widthOfTextAtSize(testLine, fontSize);
      
      if (width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  };

  // Helper to draw text with wrap
  const drawText = (page, text, x, y, options = {}) => {
    const { fontSize = 10, color = colors.text, usedFont = font, maxWidth = contentWidth } = options;
    const lines = wrapText(text, maxWidth, fontSize, usedFont);
    let currentY = y;
    
    for (const line of lines) {
      if (currentY < margin + 20) return { y: currentY, overflow: true };
      page.drawText(line, { x, y: currentY, size: fontSize, font: usedFont, color });
      currentY -= fontSize + 4;
    }
    return { y: currentY, overflow: false };
  };

  // ==================== COVER PAGE ====================
  let { page, y } = addPage();
  
  // Title
  y = pageHeight - 200;
  page.drawText('STORY ANALYSIS', {
    x: margin,
    y,
    size: 36,
    font: fontBold,
    color: colors.primary
  });
  
  y -= 50;
  page.drawText('REPORT', {
    x: margin,
    y,
    size: 28,
    font: fontBold,
    color: colors.primary
  });

  // Project name
  y -= 80;
  const projectName = workflow.name || 'Untitled Project';
  page.drawText(projectName, {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: colors.text
  });

  // Generated info
  y -= 60;
  page.drawText('Generated by ScriptForge AI', {
    x: margin,
    y,
    size: 12,
    font: font,
    color: colors.muted
  });

  y -= 20;
  page.drawText(new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }), {
    x: margin,
    y,
    size: 12,
    font: font,
    color: colors.muted
  });

  // Brief
  if (workflow.brief) {
    y -= 60;
    page.drawText('Project Brief:', {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: colors.text
    });
    y -= 20;
    const briefText = workflow.brief.substring(0, 500) + (workflow.brief.length > 500 ? '...' : '');
    const result = drawText(page, briefText, margin, y, { fontSize: 10, color: colors.muted });
    y = result.y;
  }

  // ==================== EXECUTIVE SUMMARY ====================
  ({ page, y } = addPage());
  
  // Section header
  page.drawText('EXECUTIVE SUMMARY', {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: colors.primary
  });
  
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
    color: colors.primary
  });

  const summary = generateExecutiveSummary(agentResults);
  
  // Health status
  y -= 40;
  const healthColor = summary.overallHealth === 'Good' ? colors.secondary : 
                      summary.overallHealth === 'Minor Issues' ? colors.warning : colors.danger;
  page.drawText(`Story Health: ${sanitizeText(summary.overallHealth)}`, {
    x: margin,
    y,
    size: 16,
    font: fontBold,
    color: healthColor
  });

  // Overview
  y -= 30;
  const overviewResult = drawText(page, summary.overview, margin, y, { fontSize: 11 });
  y = overviewResult.y;

  // Stats
  y -= 30;
  page.drawText(`Critical Issues: ${summary.criticalIssues}`, {
    x: margin,
    y,
    size: 24,
    font: fontBold,
    color: colors.danger
  });

  page.drawText(`Warnings: ${summary.warnings}`, {
    x: margin + 180,
    y,
    size: 24,
    font: fontBold,
    color: colors.warning
  });

  page.drawText(`Suggestions: ${summary.suggestions}`, {
    x: margin + 340,
    y,
    size: 24,
    font: fontBold,
    color: colors.secondary
  });

  // Key findings
  if (summary.keyFindings.length > 0) {
    y -= 50;
    page.drawText('Key Findings:', {
      x: margin,
      y,
      size: 14,
      font: fontBold,
      color: colors.text
    });
    
    y -= 20;
    for (const finding of summary.keyFindings) {
      page.drawText(`- ${sanitizeText(finding)}`, {
        x: margin + 10,
        y,
        size: 11,
        font: font,
        color: colors.text
      });
      y -= 18;
    }
  }

  // ==================== STORY OVERVIEW ====================
  if (agentResults['story-intelligence']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'STORY OVERVIEW', y, margin, pageWidth, fontBold);
    y = renderStoryIntelligence(page, agentResults['story-intelligence'].result, y, margin, contentWidth, font, fontBold, fontItalic);
  }

  // ==================== CHARACTERS & RELATIONSHIPS ====================
  if (agentResults['knowledge-graph']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'CHARACTERS & RELATIONSHIPS', y, margin, pageWidth, fontBold);
    y = renderKnowledgeGraph(pdfDoc, page, agentResults['knowledge-graph'].result, y, margin, contentWidth, font, fontBold, pageHeight);
  }

  // ==================== TIMELINE ====================
  if (agentResults['temporal-reasoning']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'TIMELINE & EVENTS', y, margin, pageWidth, fontBold);
    y = renderTimeline(pdfDoc, page, agentResults['temporal-reasoning'].result, y, margin, contentWidth, font, fontBold, pageHeight);
  }

  // ==================== CONTINUITY ISSUES ====================
  if (agentResults['continuity-validator']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'CONTINUITY ANALYSIS', y, margin, pageWidth, fontBold);
    const result = renderContinuityReport(pdfDoc, page, agentResults['continuity-validator'].result, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth);
    page = result.page;
    y = result.y;
  }

  // ==================== CREATIVE SUGGESTIONS ====================
  if (agentResults['creative-coauthor']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'CREATIVE SUGGESTIONS', y, margin, pageWidth, fontBold);
    const result = renderCreativeSuggestions(pdfDoc, page, agentResults['creative-coauthor'].result, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth);
    page = result.page;
    y = result.y;
  }

  // ==================== STORY INSIGHTS ====================
  if (agentResults['intelligent-recall']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'STORY INSIGHTS', y, margin, pageWidth, fontBold);
    const result = renderIntelligentRecall(pdfDoc, page, agentResults['intelligent-recall'].result, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth);
    page = result.page;
    y = result.y;
  }

  // ==================== VISUAL CONCEPTS ====================
  if (agentResults['cinematic-teaser']) {
    ({ page, y } = addPage());
    y = drawSectionHeader(page, 'VISUAL CONCEPTS', y, margin, pageWidth, fontBold);
    const result = renderCinematicTeaser(pdfDoc, page, agentResults['cinematic-teaser'].result, y, margin, contentWidth, font, fontBold, fontItalic, pageHeight, pageWidth);
    page = result.page;
    y = result.y;
  }

  // ==================== ACTION ITEMS ====================
  ({ page, y } = addPage());
  y = drawSectionHeader(page, 'ACTION ITEMS & NEXT STEPS', y, margin, pageWidth, fontBold);
  const actions = generateActionItems(agentResults);
  renderActionItems(pdfDoc, page, actions, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth);

  // Add page numbers
  const pages = pdfDoc.getPages();
  pages.forEach((pg, i) => {
    pg.drawText(`ScriptForge AI Report - Page ${i + 1} of ${pages.length}`, {
      x: margin,
      y: 25,
      size: 8,
      font: font,
      color: colors.muted
    });
  });

  return await pdfDoc.save();
}

function drawSectionHeader(page, title, y, margin, pageWidth, fontBold) {
  page.drawText(title, {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: colors.primary
  });
  
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: pageWidth - margin, y },
    thickness: 2,
    color: colors.primary
  });
  
  return y - 30;
}

function drawSubsectionHeader(page, title, y, margin, fontBold) {
  page.drawText(title, {
    x: margin,
    y,
    size: 14,
    font: fontBold,
    color: colors.text
  });
  return y - 20;
}

// ==================== COMPREHENSIVE SUMMARY GENERATOR ====================
function generateExecutiveSummary(agentResults) {
  const summary = {
    overview: '',
    keyFindings: [],
    criticalIssues: 0,
    warnings: 0,
    suggestions: 0,
    overallHealth: 'Good',
    agentsSummary: {
      storyIntelligence: null,
      knowledgeGraph: null,
      timeline: null,
      continuity: null,
      creative: null,
      recall: null,
      teaser: null
    }
  };

  // Story Intelligence Summary
  if (agentResults['story-intelligence']?.result) {
    const si = agentResults['story-intelligence'].result;
    summary.agentsSummary.storyIntelligence = {
      genre: si.genre || si.detectedGenre || 'Unknown',
      themes: si.themes || [],
      tone: si.tone?.sentiment || 'Neutral',
      structure: si.narrativeStructure?.type || 'Unknown'
    };
    if (si.genre) summary.keyFindings.push(`Genre: ${si.genre}`);
    if (si.themes?.length) summary.keyFindings.push(`Themes: ${si.themes.slice(0, 3).join(', ')}`);
  }

  // Knowledge Graph Summary
  if (agentResults['knowledge-graph']?.result) {
    const kg = agentResults['knowledge-graph'].result;
    const chars = kg.characters || kg.entities?.characters || [];
    const locs = kg.locations || kg.entities?.locations || [];
    const objs = kg.objects || kg.entities?.objects || [];
    const events = kg.events || kg.entities?.events || [];
    
    summary.agentsSummary.knowledgeGraph = {
      characterCount: chars.length,
      locationCount: locs.length,
      objectCount: objs.length,
      eventCount: events.length
    };
    
    if (chars.length > 0) summary.keyFindings.push(`${chars.length} character(s) tracked`);
    if (locs.length > 0) summary.keyFindings.push(`${locs.length} location(s) mapped`);
    if (events.length > 0) summary.keyFindings.push(`${events.length} event(s) tracked`);
  }

  // Timeline Analysis
  if (agentResults['temporal-reasoning']?.result) {
    const tr = agentResults['temporal-reasoning'].result;
    const temporalIssues = tr.temporalIssues || tr.issues || [];
    summary.agentsSummary.timeline = {
      issueCount: temporalIssues.length,
      hasCritical: temporalIssues.some(i => i.severity === 'critical' || i.severity === 'high')
    };
    if (temporalIssues.length > 0) {
      summary.warnings += temporalIssues.length;
      summary.keyFindings.push(`${temporalIssues.length} timeline issue(s) detected`);
    }
  }

  // Continuity Validation
  if (agentResults['continuity-validator']?.result) {
    const cv = agentResults['continuity-validator'].result;
    const issues = cv.errors || cv.issues || cv.contradictions || [];
    
    const critical = issues.filter(e => e.severity === 'critical' || e.severity === 'high');
    const warnings = issues.filter(e => e.severity === 'medium' || e.severity === 'warning');
    const minor = issues.filter(e => !e.severity || e.severity === 'low' || e.severity === 'minor');
    
    summary.criticalIssues = critical.length;
    summary.warnings += warnings.length;
    
    summary.agentsSummary.continuity = {
      score: cv.continuityScore || cv.score || 100,
      criticalCount: critical.length,
      warningCount: warnings.length,
      minorCount: minor.length
    };
    
    // Determine overall health
    if (summary.criticalIssues >= 5) {
      summary.overallHealth = 'Needs Immediate Attention';
    } else if (summary.criticalIssues >= 3) {
      summary.overallHealth = 'Needs Attention';
    } else if (summary.criticalIssues > 0 || summary.warnings > 5) {
      summary.overallHealth = 'Minor Issues';
    } else if (summary.warnings > 0) {
      summary.overallHealth = 'Good with Minor Warnings';
    }
  }

  // Creative Suggestions
  if (agentResults['creative-coauthor']?.result) {
    const cc = agentResults['creative-coauthor'].result;
    const scenes = cc.sceneSuggestions || cc.suggestions || [];
    const dialogues = cc.dialogueImprovements || [];
    const plots = cc.plotDevelopments || [];
    
    summary.suggestions = scenes.length + dialogues.length + plots.length;
    summary.agentsSummary.creative = {
      sceneIdeas: scenes.length,
      dialogueImprovements: dialogues.length,
      plotDevelopments: plots.length
    };
    
    if (summary.suggestions > 0) {
      summary.keyFindings.push(`${summary.suggestions} creative suggestion(s) offered`);
    }
  }

  // Intelligent Recall
  if (agentResults['intelligent-recall']?.result) {
    const ir = agentResults['intelligent-recall'].result;
    const insights = ir.keyInsights || ir.insights || [];
    const strengths = ir.strengths || [];
    
    summary.agentsSummary.recall = {
      insightCount: insights.length,
      strengthCount: strengths.length
    };
  }

  // Cinematic Teaser
  if (agentResults['cinematic-teaser']?.result) {
    const ct = agentResults['cinematic-teaser'].result;
    summary.agentsSummary.teaser = {
      hasHook: !!(ct.hookLine || ct.hook || (ct.hooks && ct.hooks[0])),
      hasTagline: !!ct.tagline,
      visualCount: (ct.visualPrompts || []).length
    };
  }

  // Build comprehensive overview
  const agentCount = Object.keys(agentResults).length;
  summary.overview = `This comprehensive analysis report was generated using ${agentCount} specialized AI agent(s). ` +
    `Your manuscript has been thoroughly analyzed across multiple dimensions. ` +
    `We identified ${summary.criticalIssues} critical issue(s) requiring immediate attention, ` +
    `${summary.warnings} warning(s) to review, and ${summary.suggestions} creative suggestion(s) ` +
    `to enhance your narrative. Overall manuscript health: ${summary.overallHealth}.`;

  return summary;
}

// ==================== STORY INTELLIGENCE ====================
function renderStoryIntelligence(page, result, y, margin, contentWidth, font, fontBold, fontItalic) {
  if (!result) return y;

  // Genre with emphasis
  if (result.genre || result.detectedGenre) {
    const genre = sanitizeText(result.genre || result.detectedGenre);
    page.drawText('Genre:', { x: margin, y, size: 11, font: fontBold, color: colors.text });
    page.drawText(genre, {
      x: margin + 60,
      y,
      size: 13,
      font: fontBold,
      color: colors.primary
    });
    y -= 28;
  }

  // Main Conflict
  if (result.mainConflict) {
    y = drawSubsectionHeader(page, 'Central Conflict', y, margin, fontBold);
    const lines = wrapTextSimple(result.mainConflict, contentWidth, 10, font);
    for (const line of lines.slice(0, 3)) {
      page.drawText(line, { x: margin, y, size: 10, font: fontItalic, color: colors.text });
      y -= 13;
    }
    y -= 10;
  }

  // Themes
  const themes = result.themes || [];
  if (themes.length > 0) {
    page.drawText('Major Themes:', { x: margin, y, size: 11, font: fontBold, color: colors.text });
    y -= 18;
    for (const theme of themes) {
      page.drawText(`- ${sanitizeText(theme)}`, { x: margin + 5, y, size: 10, font: font, color: colors.primary });
      y -= 14;
    }
    y -= 10;
  }

  // Tone Analysis
  if (result.tone) {
    y = drawSubsectionHeader(page, 'Tone & Atmosphere', y, margin, fontBold);
    page.drawText(`Formality: ${sanitizeText(result.tone.formality || 'Mixed')}`, { x: margin, y, size: 10, font: font, color: colors.text });
    y -= 13;
    page.drawText(`Sentiment: ${sanitizeText(result.tone.sentiment || 'Neutral')}`, { x: margin, y, size: 10, font: font, color: colors.text });
    y -= 13;
    page.drawText(`Pacing: ${sanitizeText(result.tone.pacing || 'Steady')}`, { x: margin, y, size: 10, font: font, color: colors.text });
    y -= 20;
  }

  // Narrative Structure
  if (result.narrativeStructure) {
    const ns = result.narrativeStructure;
    y = drawSubsectionHeader(page, 'Story Structure', y, margin, fontBold);
    page.drawText(`Type: ${sanitizeText(ns.type || 'Linear')}`, { x: margin, y, size: 10, font: font, color: colors.text });
    y -= 13;
    if (ns.currentAct && ns.totalActs) {
      page.drawText(`Progress: Act ${ns.currentAct} of ${ns.totalActs}`, { x: margin, y, size: 10, font: font, color: colors.text });
      y -= 13;
    }
    y -= 10;
  }

  // Writing Style
  if (result.writingStyle) {
    const ws = result.writingStyle;
    y = drawSubsectionHeader(page, 'Writing Style', y, margin, fontBold);
    page.drawText(`Perspective: ${sanitizeText(ws.perspective || 'Unknown')}`, { x: margin, y, size: 10, font: font, color: colors.text });
    y -= 13;
    page.drawText(`Tense: ${sanitizeText(ws.tense || 'Past')}`, { x: margin, y, size: 10, font: font, color: colors.text });
    y -= 13;
    if (ws.voice) {
      const voiceLines = wrapTextSimple(`Voice: ${ws.voice}`, contentWidth, 10, font);
      for (const line of voiceLines.slice(0, 2)) {
        page.drawText(line, { x: margin, y, size: 10, font: font, color: colors.muted });
        y -= 13;
      }
    }
    y -= 10;
  }

  // Setting & Time Period
  if (result.setting || result.timePeriod) {
    y = drawSubsectionHeader(page, 'Setting', y, margin, fontBold);
    if (result.setting) {
      const settingLines = wrapTextSimple(result.setting, contentWidth, 10, font);
      for (const line of settingLines.slice(0, 2)) {
        page.drawText(line, { x: margin, y, size: 10, font: font, color: colors.text });
        y -= 13;
      }
    }
    if (result.timePeriod) {
      page.drawText(`Time Period: ${sanitizeText(result.timePeriod)}`, { x: margin, y, size: 10, font: font, color: colors.muted });
      y -= 13;
    }
  }

  return y;
}

// ==================== KNOWLEDGE GRAPH ====================
function renderKnowledgeGraph(pdfDoc, page, result, y, margin, contentWidth, font, fontBold, pageHeight) {
  if (!result) return y;

  const entities = result.entities || result;
  const characters = entities.characters || result.characters || [];
  const locations = entities.locations || result.locations || [];
  const objects = entities.objects || result.objects || [];
  const relationships = result.relationships || [];
  const plotThreads = result.plotThreads || [];

  // Characters Section
  if (characters.length > 0) {
    y = drawSubsectionHeader(page, `Characters (${characters.length})`, y, margin, fontBold);
    
    for (let i = 0; i < characters.length; i++) {
      const char = characters[i];
      if (y < 120) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      
      // Character name and role
      const name = sanitizeText(char.name || 'Unknown Character');
      const role = char.role || 'supporting';
      const roleColor = role === 'protagonist' ? colors.primary : 
                       role === 'antagonist' ? colors.danger : colors.text;
      
      page.drawText(`${i + 1}. ${name}`, { x: margin, y, size: 11, font: fontBold, color: roleColor });
      y -= 15;
      
      // Role badge
      page.drawText(`[${role.toUpperCase()}]`, { x: margin + 10, y, size: 8, font: fontBold, color: roleColor });
      y -= 14;
      
      // Description
      if (char.description) {
        const lines = wrapTextSimple(char.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 2)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      
      // Traits
      const traits = Array.isArray(char.traits) ? char.traits : [];
      if (traits.length > 0) {
        const traitsText = traits.slice(0, 5).map(t => sanitizeText(t)).join(', ');
        page.drawText(`Traits: ${traitsText}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.muted 
        });
        y -= 11;
      }
      
      // Motivations
      const motivations = Array.isArray(char.motivations) ? char.motivations : [];
      if (motivations.length > 0) {
        const motivationsText = motivations.slice(0, 3).map(m => sanitizeText(m)).join(', ');
        page.drawText(`Motivations: ${motivationsText}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 11;
      }
      
      // First appearance
      if (char.firstAppearance) {
        page.drawText(`Introduced: ${sanitizeText(char.firstAppearance)}`, { 
          x: margin + 10, y, size: 8, font: font, color: colors.light 
        });
        y -= 11;
      }
      
      y -= 8;
    }
    y -= 10;
  }

  // Locations Section
  if (locations.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, `Locations (${locations.length})`, y, margin, fontBold);
    
    for (let i = 0; i < locations.length; i++) {
      const loc = locations[i];
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      
      const name = sanitizeText(loc.name || 'Unknown Location');
      const type = loc.type ? ` [${sanitizeText(loc.type)}]` : '';
      page.drawText(`${i + 1}. ${name}${type}`, { x: margin, y, size: 10, font: fontBold, color: colors.secondary });
      y -= 14;
      
      if (loc.description) {
        const lines = wrapTextSimple(loc.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 2)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      
      if (loc.significance) {
        const sigText = sanitizeText(loc.significance.substring(0, 60));
        page.drawText(`Significance: ${sigText}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.muted 
        });
        y -= 11;
      }
      y -= 5;
    }
    y -= 10;
  }

  // Important Objects
  if (objects.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, `Key Objects (${objects.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(objects.length, 15); i++) {
      const obj = objects[i];
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      
      const name = obj.name || 'Unknown Object';
      page.drawText(`- ${sanitizeText(name)}`, { x: margin, y, size: 10, font: font, color: colors.warning });
      if (obj.significance) {
        page.drawText(` - ${sanitizeText(obj.significance).substring(0, 50)}`, { 
          x: margin + font.widthOfTextAtSize(`- ${sanitizeText(name)}`, 10), 
          y, size: 9, font: font, color: colors.muted 
        });
      }
      y -= 14;
    }
    y -= 10;
  }

  // Relationships
  if (relationships.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, 'Character Relationships', y, margin, fontBold);
    
    for (let i = 0; i < Math.min(relationships.length, 20); i++) {
      const rel = relationships[i];
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      const relType = rel.type || 'connected to';
      page.drawText(`${sanitizeText(rel.from)} -> ${sanitizeText(relType)} -> ${sanitizeText(rel.to)}`, {
        x: margin, y, size: 9, font: font, color: colors.text
      });
      y -= 13;
    }
    y -= 10;
  }

  // Plot Threads
  if (plotThreads.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, 'Plot Threads', y, margin, fontBold);
    
    for (let i = 0; i < plotThreads.length; i++) {
      const thread = plotThreads[i];
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      
      const status = thread.status || 'active';
      const statusColor = status === 'resolved' ? colors.secondary : 
                         status === 'active' ? colors.primary : colors.muted;
      
      page.drawText(sanitizeText(thread.name || `Plot Thread ${i + 1}`), { 
        x: margin, y, size: 10, font: fontBold, color: statusColor 
      });
      y -= 13;
      
      if (thread.description) {
        const lines = wrapTextSimple(thread.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 2)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      
      page.drawText(`Status: ${sanitizeText(status).toUpperCase()}`, { 
        x: margin + 10, y, size: 8, font: font, color: statusColor 
      });
      y -= 16;
    }
  }

  return y;
}

// ==================== TIMELINE & TEMPORAL ANALYSIS ====================
function renderTimeline(pdfDoc, page, result, y, margin, contentWidth, font, fontBold, pageHeight) {
  if (!result) return y;

  const events = result.chronologicalEvents || result.timeline || result.events || [];
  const flashbacks = result.flashbacks || [];
  const flashForwards = result.flashForwards || result.flashforwards || [];
  const issues = result.temporalIssues || result.issues || [];
  const causalChains = result.causalChains || [];

  // Story Duration
  if (result.storyDuration || result.duration) {
    page.drawText(`Story Duration: ${result.storyDuration || result.duration}`, { 
      x: margin, y, size: 11, font: fontBold, color: colors.text 
    });
    y -= 20;
  }

  // Narrative Pace
  if (result.narrativePace || result.pacing) {
    page.drawText(`Narrative Pace: ${result.narrativePace || result.pacing}`, { 
      x: margin, y, size: 10, font: font, color: colors.muted 
    });
    y -= 25;
  }

  // Chronological Events
  if (events.length > 0) {
    y = drawSubsectionHeader(page, `Event Timeline (${events.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(events.length, 25); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      
      const event = events[i];
      const name = sanitizeText(event.name || event.description || event.event || `Event ${i + 1}`);
      
      page.drawText(`${i + 1}. ${name.substring(0, 70)}`, { 
        x: margin, y, size: 10, font: fontBold, color: colors.primary 
      });
      y -= 13;
      
      // Event metadata
      const meta = [];
      if (event.chapter) meta.push(`Chapter ${event.chapter}`);
      if (event.timestamp) meta.push(sanitizeText(event.timestamp));
      if (event.location) meta.push(`@ ${sanitizeText(event.location)}`);
      
      if (meta.length > 0) {
        page.drawText(meta.join(' | '), { x: margin + 10, y, size: 9, font: font, color: colors.muted });
        y -= 11;
      }
      
      // Participants
      if (event.participants && event.participants.length > 0) {
        const participantsText = event.participants.map(p => sanitizeText(p)).join(', ');
        page.drawText(`Participants: ${participantsText}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.text 
        });
        y -= 11;
      }
      
      y -= 6;
    }
    
    if (events.length > 25) {
      page.drawText(`...and ${events.length - 25} more events`, { 
        x: margin, y, size: 9, font: font, color: colors.muted 
      });
      y -= 15;
    }
    y -= 10;
  }

  // Flashbacks
  if (flashbacks.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, `Flashbacks (${flashbacks.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(flashbacks.length, 10); i++) {
      const fb = flashbacks[i];
      const event = fb.event || fb;
      page.drawText(`- ${event.name || event.description || 'Flashback'}`, { 
        x: margin, y, size: 10, font: font, color: colors.warning 
      });
      y -= 13;
    }
    y -= 10;
  }

  // Flash-forwards
  if (flashForwards.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, `Flash-forwards (${flashForwards.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(flashForwards.length, 10); i++) {
      const ff = flashForwards[i];
      const event = ff.event || ff;
      page.drawText(`- ${event.name || event.description || 'Flash-forward'}`, { 
        x: margin, y, size: 10, font: font, color: colors.secondary 
      });
      y -= 13;
    }
    y -= 10;
  }

  // Causal Chains
  if (causalChains.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, 'Cause & Effect Chains', y, margin, fontBold);
    
    for (let i = 0; i < Math.min(causalChains.length, 10); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      const chain = causalChains[i];
      const cause = chain.cause || 'Unknown cause';
      const effects = chain.effects || [];
      
      page.drawText(`${i + 1}. ${cause}`, { x: margin, y, size: 10, font: fontBold, color: colors.text });
      y -= 13;
      
      if (effects.length > 0) {
        page.drawText(`   -> ${effects.slice(0, 2).join(', ')}`, { 
          x: margin + 15, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 11;
      }
      y -= 5;
    }
    y -= 10;
  }

  // Temporal Issues
  if (issues.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([595, 842]);
      y = 842 - 50;
    }
    y = drawSubsectionHeader(page, `! Timeline Issues (${issues.length})`, y, margin, fontBold);
    
    for (let i = 0; i < issues.length; i++) {
      if (y < 100) {
        page = pdfDoc.addPage([595, 842]);
        y = 842 - 50;
      }
      
      const issue = issues[i];
      const severity = issue.severity || 'medium';
      const severityColor = severity === 'critical' ? colors.danger : 
                           severity === 'high' ? colors.warning : colors.muted;
      
      page.drawText(`${i + 1}. ${sanitizeText(issue.type || 'Issue')} [${sanitizeText(severity).toUpperCase()}]`, { 
        x: margin, y, size: 10, font: fontBold, color: severityColor 
      });
      y -= 14;
      
      if (issue.description) {
        const lines = wrapTextSimple(issue.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 3)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      
      if (issue.suggestion) {
        const suggestionText = sanitizeText(issue.suggestion).substring(0, 80);
        page.drawText(`Fix: ${suggestionText}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 11;
      }
      y -= 8;
    }
  }

  return y;
}

// ==================== CONTINUITY REPORT ====================
function renderContinuityReport(pdfDoc, page, result, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth) {
  if (!result) return { page, y };

  const issues = result.errors || result.issues || result.contradictions || [];
  const score = result.continuityScore || result.score || 100;
  const recommendations = result.recommendations || [];
  const intentionalChoices = result.intentionalChoices || [];

  // Continuity Score Display
  const scoreColor = score >= 90 ? colors.secondary : score >= 75 ? colors.primary : score >= 60 ? colors.warning : colors.danger;
  
  // Large score number
  page.drawText(`${score}`, { x: margin + 380, y: y + 10, size: 48, font: fontBold, color: scoreColor });
  page.drawText('/100', { x: margin + 435, y: y + 10, size: 24, font: fontBold, color: colors.muted });
  
  // Score label
  page.drawText('Continuity Score', { x: margin + 360, y: y - 10, size: 12, font: font, color: colors.muted });
  
  // Summary stats on left
  page.drawText(`Total Issues: ${issues.length}`, { x: margin, y, size: 12, font: fontBold, color: colors.text });
  y -= 20;
  
  // Categorize issues
  const critical = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  const warnings = issues.filter(i => i.severity === 'medium' || i.severity === 'warning');
  const minor = issues.filter(i => !i.severity || i.severity === 'low' || i.severity === 'minor');

  page.drawText(`Critical: ${critical.length}  |  Warnings: ${warnings.length}  |  Minor: ${minor.length}`, { 
    x: margin, y, size: 10, font: font, color: colors.muted 
  });
  y -= 35;

  // Score interpretation
  let interpretation = '';
  if (score >= 90) {
    interpretation = '[OK] Excellent continuity. Your narrative is consistent and well-structured.';
  } else if (score >= 75) {
    interpretation = '[OK] Good continuity with minor issues to address.';
  } else if (score >= 60) {
    interpretation = '[!] Moderate issues detected. Review and address warnings.';
  } else {
    interpretation = '[!] Significant continuity problems require immediate attention.';
  }
  
  page.drawText(interpretation, { x: margin, y, size: 11, font: font, color: colors.text });
  y -= 30;

  // Intentional Narrative Choices
  if (intentionalChoices.length > 0) {
    y = drawSubsectionHeader(page, 'Intentional Narrative Devices', y, margin, fontBold);
    page.drawText('These elements appear to be deliberate storytelling choices:', { 
      x: margin, y, size: 9, font: font, color: colors.muted 
    });
    y -= 15;
    
    for (let i = 0; i < Math.min(intentionalChoices.length, 5); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      page.drawText(`+ ${intentionalChoices[i]}`, { x: margin, y, size: 9, font: font, color: colors.secondary });
      y -= 13;
    }
    y -= 15;
  }

  // CRITICAL ISSUES
  if (critical.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    page.drawText(`[!] CRITICAL ISSUES (${critical.length})`, { x: margin, y, size: 14, font: fontBold, color: colors.danger });
    page.drawText('These require immediate attention and may confuse readers.', { 
      x: margin, y: y - 18, size: 9, font: font, color: colors.muted 
    });
    y -= 40;
    
    for (let i = 0; i < critical.length; i++) {
      if (y < 120) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      ({ page, y } = renderDetailedIssueItem(pdfDoc, page, critical[i], i + 1, colors.danger, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth));
    }
    y -= 20;
  }

  // WARNINGS
  if (warnings.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    page.drawText(`[!] WARNINGS (${warnings.length})`, { x: margin, y, size: 14, font: fontBold, color: colors.warning });
    page.drawText('Review these potential inconsistencies.', { 
      x: margin, y: y - 18, size: 9, font: font, color: colors.muted 
    });
    y -= 40;
    
    for (let i = 0; i < warnings.length; i++) {
      if (y < 120) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      ({ page, y } = renderDetailedIssueItem(pdfDoc, page, warnings[i], i + 1, colors.warning, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth));
    }
    y -= 20;
  }

  // MINOR ISSUES
  if (minor.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    page.drawText(`[i] MINOR ISSUES (${minor.length})`, { x: margin, y, size: 14, font: fontBold, color: colors.muted });
    y -= 30;
    
    const showCount = Math.min(minor.length, 15);
    for (let i = 0; i < showCount; i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      ({ page, y } = renderDetailedIssueItem(pdfDoc, page, minor[i], i + 1, colors.muted, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth));
    }
    
    if (minor.length > 15) {
      page.drawText(`...and ${minor.length - 15} more minor issues to review`, { 
        x: margin, y, size: 9, font: font, color: colors.muted 
      });
      y -= 20;
    }
  }

  // General Recommendations
  if (recommendations.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, 'General Recommendations', y, margin, fontBold);
    
    for (let i = 0; i < Math.min(recommendations.length, 10); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      page.drawText(`- ${recommendations[i]}`, { x: margin, y, size: 10, font: font, color: colors.text });
      y -= 14;
    }
  }

  return { page, y };
}

function renderDetailedIssueItem(pdfDoc, page, issue, num, accentColor, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth) {
  const type = sanitizeText(issue.type || 'Continuity Error');
  const description = sanitizeText(issue.description || issue.message || '');
  const fix = sanitizeText(issue.recommendation || issue.fix || issue.suggestion || 'Please review and correct');
  const location = sanitizeText(issue.location || issue.chapter || issue.locations?.[0] || '');

  // Issue number and type
  page.drawText(`${num}.`, { x: margin, y, size: 11, font: fontBold, color: accentColor });
  page.drawText(type, { x: margin + 20, y, size: 11, font: fontBold, color: accentColor });
  y -= 15;

  // Description
  if (description) {
    const lines = wrapTextSimple(description, contentWidth - 30, 9, font);
    for (const line of lines.slice(0, 4)) {
      page.drawText(line, { x: margin + 15, y, size: 9, font: font, color: colors.text });
      y -= 11;
    }
    y -= 5;
  }

  // Location
  if (location) {
    page.drawText(`Location: ${location}`, { x: margin + 15, y, size: 9, font: font, color: colors.muted });
    y -= 13;
  }

  // Recommended Fix
  const fixLines = wrapTextSimple(`Fix: ${fix}`, contentWidth - 30, 9, font);
  for (const line of fixLines.slice(0, 3)) {
    page.drawText(line, { x: margin + 15, y, size: 9, font: font, color: colors.secondary });
    y -= 11;
  }
  y -= 10;

  return { page, y };
}

// ==================== CREATIVE SUGGESTIONS ====================
function renderCreativeSuggestions(pdfDoc, page, result, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth) {
  if (!result) return { page, y };

  const scenes = result.sceneSuggestions || result.suggestions || [];
  const dialogues = result.dialogueImprovements || [];
  const plots = result.plotDevelopments || result.plotIdeas || [];
  const characterGuidance = result.characterArcGuidance || result.characterGuidance || [];
  const themes = result.themeReinforcements || result.themeReinforcement || [];
  const alternatives = result.alternativeScenarios || [];
  
  // Check if we have any content at all
  const hasContent = scenes.length > 0 || dialogues.length > 0 || plots.length > 0 || 
                     characterGuidance.length > 0 || themes.length > 0 || alternatives.length > 0;
  
  if (!hasContent) {
    // Show placeholder message when no creative suggestions are available
    page.drawText('Creative analysis in progress. Suggestions will appear after full story processing.', { 
      x: margin, y, size: 10, font: font, color: colors.muted 
    });
    y -= 25;
    return { page, y };
  }

  // Introduction
  page.drawText('AI-powered creative insights to enhance your narrative:', { 
    x: margin, y, size: 10, font: font, color: colors.muted 
  });
  y -= 25;

  // Scene Suggestions
  if (scenes.length > 0) {
    y = drawSubsectionHeader(page, `Scene Ideas (${scenes.length})`, y, margin, fontBold);
    
    for (let i = 0; i < scenes.length; i++) {
      if (y < 140) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      const scene = scenes[i];
      const title = sanitizeText(scene.title || scene.summary || scene.description || `Scene Idea ${i + 1}`);
      
      page.drawText(`${i + 1}. ${title.substring(0, 70)}`, { 
        x: margin, y, size: 11, font: fontBold, color: colors.secondary 
      });
      y -= 14;
      
      if (scene.description && scene.description !== title) {
        const lines = wrapTextSimple(scene.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 2)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      
      if (scene.placement) {
        page.drawText(`Placement: ${sanitizeText(scene.placement)}`, { x: margin + 10, y, size: 9, font: font, color: colors.muted });
        y -= 11;
      }
      
      if (scene.purpose) {
        page.drawText(`Purpose: ${sanitizeText(scene.purpose).substring(0, 70)}`, { x: margin + 10, y, size: 9, font: font, color: colors.text });
        y -= 11;
      }
      
      if (scene.emotionalBeat) {
        page.drawText(`Emotional Beat: ${sanitizeText(scene.emotionalBeat)}`, { x: margin + 10, y, size: 9, font: font, color: colors.primary });
        y -= 11;
      }
      y -= 10;
    }
    y -= 10;
  }

  // Plot Developments
  if (plots.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, `Plot Development Ideas (${plots.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(plots.length, 8); i++) {
      if (y < 110) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      const plot = plots[i];
      page.drawText(`${i + 1}. ${plot.idea || plot.description || 'Plot idea'}`.substring(0, 85), { 
        x: margin, y, size: 10, font: fontBold, color: colors.primary 
      });
      y -= 13;
      
      if (plot.rationale) {
        page.drawText(`Why: ${plot.rationale.substring(0, 75)}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.text 
        });
        y -= 11;
      }
      
      if (plot.impact) {
        page.drawText(`Impact: ${plot.impact.substring(0, 75)}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 11;
      }
      y -= 8;
    }
    y -= 10;
  }

  // Dialogue Improvements
  if (dialogues.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, `Dialogue Enhancements (${dialogues.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(dialogues.length, 8); i++) {
      if (y < 130) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      const d = dialogues[i];
      const character = sanitizeText(d.character || 'Character');
      
      page.drawText(`${i + 1}. ${character}:`, { x: margin, y, size: 10, font: fontBold, color: colors.primary });
      y -= 14;
      
      if (d.original || d.originalLine) {
        const orig = sanitizeText((d.original || d.originalLine)).substring(0, 65);
        page.drawText(`Before: "${orig}${orig.length >= 65 ? '...' : ''}"`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.danger 
        });
        y -= 12;
      }
      
      if (d.improved || d.suggestedLine || d.suggested) {
        const imp = sanitizeText((d.improved || d.suggestedLine || d.suggested)).substring(0, 65);
        page.drawText(`After: "${imp}${imp.length >= 65 ? '...' : ''}"`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 12;
      }
      
      if (d.reason) {
        page.drawText(`Reason: ${sanitizeText(d.reason).substring(0, 65)}`, { 
          x: margin + 10, y, size: 8, font: font, color: colors.muted 
        });
        y -= 11;
      }
      y -= 10;
    }
    y -= 10;
  }

  // Character Arc Guidance
  if (characterGuidance.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, `Character Arc Guidance (${characterGuidance.length})`, y, margin, fontBold);
    
    for (let i = 0; i < Math.min(characterGuidance.length, 5); i++) {
      if (y < 120) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      const cg = characterGuidance[i];
      page.drawText(cg.character || 'Character', { x: margin, y, size: 11, font: fontBold, color: colors.primary });
      y -= 14;
      
      if (cg.currentStage) {
        page.drawText(`Current Stage: ${cg.currentStage}`, { x: margin + 10, y, size: 9, font: font, color: colors.text });
        y -= 12;
      }
      
      const nextSteps = cg.nextSteps || [];
      if (nextSteps.length > 0) {
        page.drawText(`Next Steps: ${nextSteps.slice(0, 2).join('; ')}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 12;
      }
      y -= 10;
    }
    y -= 10;
  }

  // Theme Reinforcements
  if (themes.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, 'Theme Reinforcement Ideas', y, margin, fontBold);
    
    for (let i = 0; i < Math.min(themes.length, 6); i++) {
      const themeText = typeof themes[i] === 'string' ? themes[i] : (themes[i].description || themes[i].theme || String(themes[i]));
      page.drawText(`- ${sanitizeText(themeText).substring(0, 80)}`, { x: margin, y, size: 10, font: font, color: colors.text });
      y -= 13;
    }
    y -= 10;
  }

  // Alternative Scenarios
  if (alternatives.length > 0) {
    if (y < 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, 'Alternative Scenarios to Consider', y, margin, fontBold);
    
    for (let i = 0; i < Math.min(alternatives.length, 5); i++) {
      const altText = typeof alternatives[i] === 'string' ? alternatives[i] : (alternatives[i].description || alternatives[i].scenario || String(alternatives[i]));
      const lines = wrapTextSimple(altText, contentWidth - 20, 9, font);
      for (const line of lines.slice(0, 2)) {
        page.drawText(`${i + 1}. ${line}`, { x: margin, y, size: 9, font: font, color: colors.text });
        y -= 11;
      }
      y -= 8;
    }
  }

  return { page, y };
}

// ==================== INTELLIGENT RECALL ====================
function renderIntelligentRecall(pdfDoc, page, result, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth) {
  if (!result) return { page, y };

  // The intelligent-recall agent returns an array of Q&A objects
  // Each object has: query, answer, confidence, references, relatedInfo
  const isArray = Array.isArray(result);
  const qaItems = isArray ? result : [];
  
  // Also handle legacy format with keyInsights, strengths, etc.
  const insights = !isArray ? (result.keyInsights || result.insights || []) : [];
  const strengths = !isArray ? (result.strengths || []) : [];
  const improvements = !isArray ? (result.improvements || result.weaknesses || []) : [];
  
  // If we have Q&A array format from the agent
  if (qaItems.length > 0) {
    page.drawText('AI-powered insights answering key questions about your story:', { 
      x: margin, y, size: 10, font: font, color: colors.muted 
    });
    y -= 25;
    
    for (let i = 0; i < Math.min(qaItems.length, 10); i++) {
      if (y < 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      const qa = qaItems[i];
      const query = sanitizeText(qa.query || 'Question');
      const answer = sanitizeText(qa.answer || '');
      const confidence = qa.confidence || 0;
      const references = qa.references || [];
      const relatedInfo = qa.relatedInfo || [];
      
      // Question header
      page.drawText(`Q${i + 1}: ${query.substring(0, 75)}`, { 
        x: margin, y, size: 11, font: fontBold, color: colors.primary 
      });
      y -= 15;
      
      // Answer
      if (answer) {
        const answerLines = wrapTextSimple(answer, contentWidth - 15, 10, font);
        for (let j = 0; j < Math.min(answerLines.length, 4); j++) {
          page.drawText(answerLines[j], { x: margin + 10, y, size: 10, font: font, color: colors.text });
          y -= 12;
        }
      }
      
      // Confidence indicator
      if (confidence > 0) {
        const confidencePercent = Math.round(confidence * 100);
        const confidenceColor = confidencePercent >= 80 ? colors.success : confidencePercent >= 50 ? colors.warning : colors.muted;
        page.drawText(`Confidence: ${confidencePercent}%`, { 
          x: margin + 10, y, size: 8, font: font, color: confidenceColor 
        });
        y -= 12;
      }
      
      // References
      if (references.length > 0) {
        const refTexts = references.slice(0, 2).map(r => {
          const refType = r.type || 'ref';
          const refExcerpt = sanitizeText(r.excerpt || r.id || '').substring(0, 40);
          return `[${refType}] ${refExcerpt}`;
        });
        page.drawText(`References: ${refTexts.join('; ')}`, { 
          x: margin + 10, y, size: 8, font: font, color: colors.muted 
        });
        y -= 12;
      }
      
      y -= 10;
    }
    y -= 10;
  }
  
  // Also render legacy format if available
  if (insights.length > 0) {
    y = drawSubsectionHeader(page, 'Key Insights', y, margin, fontBold);
    
    for (let i = 0; i < Math.min(insights.length, 12); i++) {
      const insight = insights[i];
      const insightText = typeof insight === 'string' ? insight : insight.insight || insight.description || '';
      
      if (insightText) {
        page.drawText(`-`, { x: margin, y, size: 10, font: fontBold, color: colors.primary });
        
        const lines = wrapTextSimple(insightText, contentWidth - 15, 10, font);
        for (let j = 0; j < Math.min(lines.length, 2); j++) {
          page.drawText(lines[j], { x: margin + 10, y, size: 10, font: font, color: colors.text });
          y -= 12;
        }
        y -= 3;
      }
    }
    y -= 10;
  }

  if (strengths.length > 0) {
    y = drawSubsectionHeader(page, 'Story Strengths', y, margin, fontBold);
    page.drawText('What your manuscript does exceptionally well:', { 
      x: margin, y, size: 9, font: font, color: colors.muted 
    });
    y -= 20;
    
    for (let i = 0; i < Math.min(strengths.length, 10); i++) {
      const strength = strengths[i];
      const strengthText = typeof strength === 'string' ? strength : strength.description || strength.strength || '';
      
      if (strengthText) {
        page.drawText(`+`, { x: margin, y, size: 11, font: fontBold, color: colors.success });
        
        const lines = wrapTextSimple(strengthText, contentWidth - 15, 10, font);
        for (let j = 0; j < Math.min(lines.length, 2); j++) {
          page.drawText(lines[j], { x: margin + 12, y, size: 10, font: font, color: colors.text });
          y -= 12;
        }
        y -= 3;
      }
    }
    y -= 10;
  }

  if (improvements.length > 0) {
    y = drawSubsectionHeader(page, 'Areas for Improvement', y, margin, fontBold);
    page.drawText('Opportunities to strengthen your narrative:', { 
      x: margin, y, size: 9, font: font, color: colors.muted 
    });
    y -= 20;
    
    for (let i = 0; i < Math.min(improvements.length, 10); i++) {
      const improvement = improvements[i];
      const improvementText = typeof improvement === 'string' ? improvement : improvement.description || improvement.improvement || improvement.suggestion || '';
      
      if (improvementText) {
        page.drawText(`${i + 1}.`, { x: margin, y, size: 10, font: fontBold, color: colors.warning });
        
        const lines = wrapTextSimple(improvementText, contentWidth - 18, 10, font);
        for (let j = 0; j < Math.min(lines.length, 2); j++) {
          page.drawText(lines[j], { x: margin + 15, y, size: 10, font: font, color: colors.text });
          y -= 12;
        }
        
        if (typeof improvement === 'object' && improvement.recommendation) {
          page.drawText(`   -> ${sanitizeText(improvement.recommendation).substring(0, 75)}`, { 
            x: margin + 15, y, size: 9, font: font, color: colors.secondary 
          });
          y -= 11;
        }
        y -= 3;
      }
    }
    y -= 10;
  }

  // If no content at all, show placeholder
  if (qaItems.length === 0 && insights.length === 0 && strengths.length === 0 && improvements.length === 0) {
    page.drawText('Story analysis insights will appear after complete story processing.', { 
      x: margin, y, size: 10, font: font, color: colors.muted 
    });
    y -= 15;
  }

  return { page, y };
}

// ==================== CINEMATIC TEASER ====================
function renderCinematicTeaser(pdfDoc, page, result, y, margin, contentWidth, font, fontBold, fontItalic, pageHeight, pageWidth) {
  if (!result) return { page, y };

  const hookLine = result.hookLine || result.hook || (result.hooks && result.hooks[0]) || '';
  const tagline = result.tagline || '';
  const essence = result.storyEssence || result.essence;
  const prompts = result.visualPrompts || [];

  // Hook Line - Prominent Display
  if (hookLine) {
    page.drawText('CINEMATIC HOOK', { x: margin, y, size: 11, font: fontBold, color: colors.muted });
    y -= 20;
    
    // Large, italic, centered hook
    const hookLines = wrapTextSimple(hookLine, contentWidth - 40, 14, fontItalic);
    for (let i = 0; i < Math.min(hookLines.length, 3); i++) {
      page.drawText(`"${hookLines[i]}"`, { 
        x: margin + 20, y, size: 14, font: fontItalic, color: colors.primary 
      });
      y -= 18;
    }
    y -= 20;
  }

  // Tagline
  if (tagline) {
    page.drawText('TAGLINE', { x: margin, y, size: 11, font: fontBold, color: colors.muted });
    y -= 18;
    page.drawText(sanitizeText(tagline), { x: margin + 10, y, size: 12, font: font, color: colors.text });
    y -= 30;
  }

  // Story Essence
  if (essence) {
    y = drawSubsectionHeader(page, 'Story Essence', y, margin, fontBold);
    page.drawText('What your story is really about:', { 
      x: margin, y, size: 9, font: font, color: colors.muted 
    });
    y -= 20;
    
    const essenceText = typeof essence === 'string' ? essence : (essence.hook || essence.mainConflict || essence.coreTheme || JSON.stringify(essence));
    const lines = wrapTextSimple(essenceText, contentWidth - 10, 10, font);
    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      page.drawText(lines[i], { x: margin + 5, y, size: 10, font: font, color: colors.text });
      y -= 12;
    }
    y -= 20;
  }

  // Visual Prompts / Trailer Concepts
  if (prompts.length > 0) {
    y = drawSubsectionHeader(page, 'Visual Concepts for Trailer', y, margin, fontBold);
    page.drawText('Compelling visual scenes for promotional content:', { 
      x: margin, y, size: 9, font: font, color: colors.muted 
    });
    y -= 25;
    
    for (let i = 0; i < Math.min(prompts.length, 10); i++) {
      if (y < 120) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      const v = prompts[i];
      const scene = typeof v === 'string' ? v : (v.scene || v.description || v.prompt || `Scene ${i + 1}`);
      
      // Scene title/description
      page.drawText(`${i + 1}.`, { x: margin, y, size: 11, font: fontBold, color: colors.primary });
      
      const sceneLines = wrapTextSimple(scene, contentWidth - 25, 10, font);
      for (let j = 0; j < Math.min(sceneLines.length, 2); j++) {
        page.drawText(sceneLines[j], { 
          x: margin + 15, y, size: 10, font: font, color: colors.text 
        });
        y -= 12;
      }
      
      // Additional metadata if available
      if (typeof v === 'object') {
        if (v.mood || v.tone) {
          page.drawText(`   Mood: ${v.mood || v.tone}`, { 
            x: margin + 15, y, size: 9, font: font, color: colors.secondary 
          });
          y -= 11;
        }
        
        if (v.camera || v.cameraAngle || v.shot) {
          page.drawText(`   Camera: ${v.camera || v.cameraAngle || v.shot}`, { 
            x: margin + 15, y, size: 9, font: font, color: colors.muted 
          });
          y -= 11;
        }
        
        if (v.visualStyle || v.lighting) {
          page.drawText(`   Visual: ${v.visualStyle || v.lighting}`, { 
            x: margin + 15, y, size: 9, font: font, color: colors.muted 
          });
          y -= 11;
        }
        
        if (v.emotionalImpact || v.emotion) {
          page.drawText(`   Impact: ${v.emotionalImpact || v.emotion}`, { 
            x: margin + 15, y, size: 9, font: fontItalic, color: colors.primary 
          });
          y -= 11;
        }
      }
      
      y -= 8;
    }
    y -= 15;
  }

  // Hooks array if exists
  if (result.hooks && Array.isArray(result.hooks) && result.hooks.length > 1) {
    y = drawSubsectionHeader(page, 'Alternative Hooks', y, margin, fontBold);
    
    for (let i = 1; i < Math.min(result.hooks.length, 5); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      
      page.drawText(`${i}. "${result.hooks[i]}"`, { 
        x: margin, y, size: 10, font: fontItalic, color: colors.secondary 
      });
      y -= 15;
    }
    y -= 15;
  }

  // Trailer suggestion if available
  if (result.trailerStructure || result.trailerConcept) {
    if (y < 120) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    y = drawSubsectionHeader(page, 'Trailer Structure', y, margin, fontBold);
    
    const trailerText = typeof (result.trailerStructure || result.trailerConcept) === 'string' 
      ? (result.trailerStructure || result.trailerConcept)
      : JSON.stringify(result.trailerStructure || result.trailerConcept, null, 2);
    
    const lines = wrapTextSimple(trailerText, contentWidth, 10, font);
    for (let i = 0; i < Math.min(lines.length, 12); i++) {
      if (y < 80) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      page.drawText(lines[i], { x: margin, y, size: 9, font: font, color: colors.text });
      y -= 11;
    }
  }

  return { page, y };
}

// ==================== ACTION ITEMS GENERATOR ====================
function generateActionItems(agentResults) {
  const actions = { immediate: [], shortTerm: [], optional: [], longTerm: [] };

  // From Continuity Validator
  if (agentResults['continuity-validator']?.result) {
    const cv = agentResults['continuity-validator'].result;
    const issues = cv.errors || cv.issues || cv.contradictions || [];
    
    const critical = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
    critical.forEach(issue => {
      actions.immediate.push({
        task: issue.type || 'Continuity Error',
        description: issue.description || issue.message || '',
        location: issue.location || issue.chapter || '',
        recommendation: issue.recommendation || issue.fix || 'Review and correct'
      });
    });

    const warnings = issues.filter(i => i.severity === 'medium' || i.severity === 'warning');
    warnings.forEach(issue => {
      actions.shortTerm.push({
        task: issue.type || 'Warning',
        description: issue.description || issue.message || '',
        recommendation: issue.recommendation || issue.fix || 'Consider revising'
      });
    });
  }

  // From Temporal Reasoning
  if (agentResults['temporal-reasoning']?.result) {
    const tr = agentResults['temporal-reasoning'].result;
    const temporalIssues = tr.temporalIssues || tr.issues || [];
    
    temporalIssues.forEach(issue => {
      if (issue.severity === 'critical' || issue.severity === 'high') {
        actions.immediate.push({
          task: 'Timeline Issue: ' + (issue.type || 'Temporal Error'),
          description: issue.description || '',
          recommendation: issue.suggestion || 'Fix timeline inconsistency'
        });
      } else {
        actions.shortTerm.push({
          task: issue.type || 'Timeline Check',
          description: issue.description || '',
          recommendation: issue.suggestion || 'Review timing'
        });
      }
    });
  }

  // From Creative Co-Author
  if (agentResults['creative-coauthor']?.result) {
    const cc = agentResults['creative-coauthor'].result;
    
    const scenes = cc.sceneSuggestions || cc.suggestions || [];
    scenes.slice(0, 8).forEach(s => {
      actions.optional.push({
        task: 'Scene Idea: ' + (s.title || s.summary || 'New scene'),
        description: s.description || s.summary || '',
        purpose: s.purpose || 'Story enhancement'
      });
    });

    const dialogues = cc.dialogueImprovements || [];
    dialogues.slice(0, 5).forEach(d => {
      actions.optional.push({
        task: `Enhance dialogue for ${d.character || 'character'}`,
        description: d.reason || 'Improve dialogue authenticity',
        recommendation: d.improved || d.suggestedLine || d.suggested || ''
      });
    });

    const characterGuidance = cc.characterArcGuidance || [];
    characterGuidance.forEach(cg => {
      const nextSteps = cg.nextSteps || [];
      if (nextSteps.length > 0) {
        actions.longTerm.push({
          task: `Develop ${cg.character || 'character'} arc`,
          description: nextSteps.slice(0, 2).join('; '),
          recommendation: cg.emotionalJourney || 'Continue character development'
        });
      }
    });
  }

  // From Knowledge Graph (relationship opportunities)
  if (agentResults['knowledge-graph']?.result) {
    const kg = agentResults['knowledge-graph'].result;
    const entities = kg.entities || kg;
    const characters = entities.characters || kg.characters || [];
    
    // Find under-developed characters
    const minor = characters.filter(c => c.role === 'minor' && (!c.traits || c.traits.length === 0));
    if (minor.length > 0) {
      actions.longTerm.push({
        task: `Develop ${minor.length} minor character(s)`,
        description: `Characters like ${minor.slice(0, 3).map(c => c.name).join(', ')} could use more depth`,
        recommendation: 'Add traits, motivations, and relationships'
      });
    }
  }

  return actions;
}

function renderActionItems(pdfDoc, page, actions, y, margin, contentWidth, font, fontBold, pageHeight, pageWidth) {
  // Introduction
  page.drawText('Prioritized action plan to address findings and enhance your manuscript:', { 
    x: margin, y, size: 10, font: font, color: colors.muted 
  });
  y -= 30;

  // IMMEDIATE ACTIONS
  if (actions.immediate.length > 0) {
    page.drawText(`[!] IMMEDIATE ACTIONS (${actions.immediate.length})`, { 
      x: margin, y, size: 14, font: fontBold, color: colors.danger 
    });
    page.drawText('Address these critical issues before publication.', { 
      x: margin, y: y - 16, size: 9, font: font, color: colors.muted 
    });
    y -= 35;
    
    for (let i = 0; i < actions.immediate.length; i++) {
      if (y < 110) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      const action = actions.immediate[i];
      
      page.drawText(`${i + 1}. ${sanitizeText(action.task)}`, { x: margin, y, size: 11, font: fontBold, color: colors.danger });
      y -= 14;
      
      if (action.description) {
        const lines = wrapTextSimple(action.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 2)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      
      if (action.location) {
        page.drawText(`At: ${sanitizeText(action.location)}`, { x: margin + 10, y, size: 9, font: font, color: colors.muted });
        y -= 11;
      }
      
      page.drawText(`-> ${sanitizeText(action.recommendation).substring(0, 80)}`, { 
        x: margin + 10, y, size: 9, font: font, color: colors.secondary 
      });
      y -= 18;
    }
    y -= 15;
  }

  // SHORT-TERM TASKS
  if (actions.shortTerm.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    page.drawText(`[!] SHORT-TERM TASKS (${actions.shortTerm.length})`, { 
      x: margin, y, size: 14, font: fontBold, color: colors.warning 
    });
    page.drawText('Review and address these warnings in your next revision.', { 
      x: margin, y: y - 16, size: 9, font: font, color: colors.muted 
    });
    y -= 35;
    
    const showCount = Math.min(actions.shortTerm.length, 15);
    for (let i = 0; i < showCount; i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      const action = actions.shortTerm[i];
      
      page.drawText(`${i + 1}. ${sanitizeText(action.task).substring(0, 75)}`, { 
        x: margin, y, size: 10, font: font, color: colors.text 
      });
      y -= 13;
      
      if (action.recommendation) {
        page.drawText(`-> ${sanitizeText(action.recommendation).substring(0, 75)}`, { 
          x: margin + 10, y, size: 9, font: font, color: colors.secondary 
        });
        y -= 11;
      }
      y -= 8;
    }
    
    if (actions.shortTerm.length > 15) {
      page.drawText(`...plus ${actions.shortTerm.length - 15} more tasks`, { 
        x: margin, y, size: 9, font: font, color: colors.muted 
      });
      y -= 15;
    }
    y -= 15;
  }

  // OPTIONAL ENHANCEMENTS
  if (actions.optional.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    page.drawText(`[*] CREATIVE ENHANCEMENTS (${actions.optional.length})`, { 
      x: margin, y, size: 14, font: fontBold, color: colors.secondary 
    });
    page.drawText('Consider these ideas to strengthen your narrative.', { 
      x: margin, y: y - 16, size: 9, font: font, color: colors.muted 
    });
    y -= 35;
    
    for (let i = 0; i < Math.min(actions.optional.length, 12); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      const action = actions.optional[i];
      
      page.drawText(`${i + 1}. ${sanitizeText(action.task).substring(0, 75)}`, { 
        x: margin, y, size: 10, font: font, color: colors.primary 
      });
      y -= 13;
      
      if (action.description) {
        const lines = wrapTextSimple(action.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 1)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.text });
          y -= 11;
        }
      }
      y -= 8;
    }
    y -= 15;
  }

  // LONG-TERM DEVELOPMENT  
  if (actions.longTerm.length > 0) {
    if (y < 150) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
    }
    
    page.drawText(`[+] LONG-TERM DEVELOPMENT (${actions.longTerm.length})`, { 
      x: margin, y, size: 14, font: fontBold, color: colors.primary 
    });
    page.drawText('Areas for ongoing development and polish.', { 
      x: margin, y: y - 16, size: 9, font: font, color: colors.muted 
    });
    y -= 35;
    
    for (let i = 0; i < Math.min(actions.longTerm.length, 8); i++) {
      if (y < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - 50;
      }
      const action = actions.longTerm[i];
      
      page.drawText(`${i + 1}. ${sanitizeText(action.task)}`, { x: margin, y, size: 10, font: font, color: colors.text });
      y -= 13;
      
      if (action.description) {
        const lines = wrapTextSimple(action.description, contentWidth - 20, 9, font);
        for (const line of lines.slice(0, 1)) {
          page.drawText(line, { x: margin + 10, y, size: 9, font: font, color: colors.muted });
          y -= 11;
        }
      }
      y -= 8;
    }
  }

  // Footer guidance
  y -= 30;
  if (y < 100) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - 50;
  }
  
  page.drawText('RECOMMENDED WORKFLOW:', { x: margin, y, size: 12, font: fontBold, color: colors.text });
  y -= 18;
  page.drawText('1. Address all critical issues immediately', { x: margin, y, size: 10, font: font, color: colors.text });
  y -= 14;
  page.drawText('2. Review and fix short-term warnings', { x: margin, y, size: 10, font: font, color: colors.text });
  y -= 14;
  page.drawText('3. Consider creative enhancements that resonate with you', { x: margin, y, size: 10, font: font, color: colors.text });
  y -= 14;
  page.drawText('4. Plan long-term character and plot development', { x: margin, y, size: 10, font: font, color: colors.text });
  y -= 25;
  
  page.drawText('This report was generated by ScriptForge AI - Your intelligent writing partner', { 
    x: margin, y, size: 9, font: font, color: colors.muted 
  });
}

// Simple text wrapper helper
function wrapTextSimple(text, maxWidth, fontSize, font) {
  // Sanitize text to remove newlines and other problematic characters
  const cleanText = sanitizeText(text);
  const words = cleanText.split(' ');
  const lines = [];
  let currentLine = '';
  const charWidth = fontSize * 0.5; // Approximate
  const maxChars = Math.floor(maxWidth / charWidth);

  for (const word of words) {
    if (!word) continue; // Skip empty words
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length > maxChars && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
