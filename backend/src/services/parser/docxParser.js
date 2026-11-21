import mammoth from 'mammoth';
import { AppError } from '../../middleware/errorHandler.js';

export async function parseDocx(buffer) {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = (result.value || '').trim();

    if (text.length < 50) {
      throw new AppError(
        'The uploaded DOCX contains insufficient text to extract resume details.',
        400,
        'EMPTY_OR_CORRUPT_FILE'
      );
    }

    return {
      text,
      pageCount: 1 // DOCX has no strict page concept in raw text extraction
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      'Failed to parse DOCX document. It may be corrupted.',
      400,
      'EMPTY_OR_CORRUPT_FILE',
      [{ field: 'file', issue: err.message }]
    );
  }
}
