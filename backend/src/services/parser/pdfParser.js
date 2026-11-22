import * as pdfModule from 'pdf-parse';
import { AppError } from '../../middleware/errorHandler.js';

export async function parsePdf(buffer) {
  try {
    let text = '';
    let pageCount = 1;
    let links = [];

    // pdf-parse v2+ exports PDFParse class
    if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      try {
        const data = await parser.getText();
        text = (data.text || '').replace(/--\s*\d+\s+of\s+\d+\s*--/g, '').trim();
        pageCount = data.total || (data.pages ? data.pages.length : 1);

        try {
          const info = await parser.getInfo({ parsePageInfo: true });
          if (info && Array.isArray(info.pages)) {
            links = info.pages.flatMap((p) => p.links || []);
          }
        } catch {
          // Gracefully continue if getInfo fails
        }
      } finally {
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    } else {
      // Fallback for pdf-parse v1 / default export
      const parseFn = typeof pdfModule.default === 'function'
        ? pdfModule.default
        : (typeof pdfModule === 'function' ? pdfModule : null);

      if (!parseFn) {
        throw new Error('Unable to resolve PDF parsing function from pdf-parse');
      }

      const data = await parseFn(buffer);
      text = (data.text || '').trim();
      pageCount = data.numpages || 1;
    }

    // Check for scanned / image-only PDFs with insufficient selectable text (PRD Section 16 & FR-02)
    if (text.length < 50) {
      throw new AppError(
        'The uploaded PDF appears to be scanned or contains no readable text. Please upload a text-based PDF or DOCX resume.',
        400,
        'SCANNED_PDF_UNREADABLE'
      );
    }

    return {
      text,
      pageCount,
      links
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      'Failed to parse PDF document. It may be password-protected or corrupted.',
      400,
      'EMPTY_OR_CORRUPT_FILE',
      [{ field: 'file', issue: err.message }]
    );
  }
}
