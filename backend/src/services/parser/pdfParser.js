import pdfParse from 'pdf-parse';
import { AppError } from '../../middleware/errorHandler.js';

export async function parsePdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();

    // Check for scanned / image-only PDFs with insufficient selectable text
    if (text.length < 50) {
      throw new AppError(
        'The uploaded PDF appears to be scanned or contains no readable text. Please upload a text-based PDF or DOCX resume.',
        400,
        'SCANNED_PDF_UNREADABLE'
      );
    }

    return {
      text,
      pageCount: data.numpages || 1
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
