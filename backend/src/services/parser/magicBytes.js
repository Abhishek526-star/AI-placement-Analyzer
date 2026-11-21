import crypto from 'crypto';
import { AppError } from '../../middleware/errorHandler.js';

export function validateFileBuffer(buffer, originalname) {
  if (!buffer || buffer.length === 0) {
    throw new AppError('The uploaded file is empty or corrupted.', 400, 'EMPTY_OR_CORRUPT_FILE');
  }

  if (buffer.length > 10 * 1024 * 1024) {
    throw new AppError('File size exceeds the 10 MB limit.', 400, 'FILE_TOO_LARGE');
  }

  // Calculate SHA-256 hash for duplicate detection
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  // Check magic bytes
  // PDF: %PDF- (0x25 0x50 0x44 0x46 0x2D)
  const isPdf = buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d;

  // DOCX: ZIP archive header PK\x03\x04 (0x50 0x4B 0x03 0x04)
  const isZip = buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4B &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04;

  if (isPdf) {
    return {
      fileType: 'pdf',
      mimeType: 'application/pdf',
      hash
    };
  }

  if (isZip && originalname.toLowerCase().endsWith('.docx')) {
    return {
      fileType: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      hash
    };
  }

  throw new AppError(
    'Only genuine PDF and DOCX files up to 10 MB are supported. The file format could not be verified.',
    400,
    'INVALID_FILE_TYPE',
    [{ field: 'file', issue: 'Failed magic-byte signature check.' }]
  );
}
