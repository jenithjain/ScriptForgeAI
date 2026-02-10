import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let extractedText = '';
    let fileType = 'unknown';

    // Handle different file types
    if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.csv')) {
      // Plain text files
      extractedText = buffer.toString('utf-8');
      fileType = 'text';
    }
    else if (fileName.endsWith('.pdf')) {
      // PDF files
      try {
        console.log('Using pdf-parse module...');
        const { default: pdfParse } = await import('pdf-parse');
        const pdfData = await pdfParse(buffer);
        extractedText = pdfData.text;
        fileType = 'pdf';
      } catch (pdfError) {
        console.error('PDF parsing error:', pdfError);
        return NextResponse.json(
          { success: false, error: 'Failed to parse PDF file' },
          { status: 400 }
        );
      }
    }
    else if (fileName.endsWith('.docx')) {
      // Word documents (.docx)
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
        fileType = 'docx';
      } catch (docxError) {
        console.error('DOCX parsing error:', docxError);
        return NextResponse.json(
          { success: false, error: 'Failed to parse Word document' },
          { status: 400 }
        );
      }
    }
    else if (fileName.endsWith('.doc')) {
      // Old Word format - mammoth doesn't support .doc well
      return NextResponse.json(
        { success: false, error: 'Please convert .doc files to .docx format' },
        { status: 400 }
      );
    }
    else if (fileName.endsWith('.rtf')) {
      // RTF files - basic text extraction
      const rtfContent = buffer.toString('utf-8');
      // Simple RTF to text conversion (removes RTF tags)
      extractedText = rtfContent
        .replace(/\\[a-z]+\d* ?/gi, '')
        .replace(/[{}]/g, '')
        .replace(/\\\\/g, '\\')
        .trim();
      fileType = 'rtf';
    }
    else if (fileName.endsWith('.json')) {
      // JSON files
      try {
        const jsonContent = JSON.parse(buffer.toString('utf-8'));
        extractedText = JSON.stringify(jsonContent, null, 2);
        fileType = 'json';
      } catch {
        extractedText = buffer.toString('utf-8');
        fileType = 'json';
      }
    }
    else {
      // Try to read as text for unknown formats
      try {
        extractedText = buffer.toString('utf-8');
        fileType = 'text';
      } catch {
        return NextResponse.json(
          { success: false, error: 'Unsupported file format' },
          { status: 400 }
        );
      }
    }

    // Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      success: true,
      text: extractedText,
      fileType,
      fileName: file.name,
      charCount: extractedText.length,
      wordCount: extractedText.split(/\s+/).filter(w => w.length > 0).length
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to extract text from file' },
      { status: 500 }
    );
  }
}
