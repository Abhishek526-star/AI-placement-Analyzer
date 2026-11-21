import crypto from 'crypto';
import { validateFileBuffer } from '../services/parser/magicBytes.js';
import { parsePdf } from '../services/parser/pdfParser.js';
import { parseDocx } from '../services/parser/docxParser.js';
import { extractSectionsAndProfile } from '../services/parser/sectionExtractor.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import { AppError } from '../middleware/errorHandler.js';
import { getServiceClient } from '../config/supabase.js';

export async function uploadResume(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return next(new AppError('No resume file provided.', 400, 'NO_FILE_UPLOADED'));
    }

    const userId = req.user.id;
    const client = req.supabase || getServiceClient();
    const serviceClient = getServiceClient();

    // 1. Magic byte & size validation
    const { fileType, mimeType, hash } = validateFileBuffer(req.file.buffer, req.file.originalname);

    // 2. Duplicate detection
    const { data: existing } = await client
      .from('resumes')
      .select('id, filename, version')
      .eq('user_id', userId)
      .eq('file_hash', hash)
      .maybeSingle();

    const resumeId = crypto.randomUUID();
    const storagePath = `${userId}/${resumeId}.${fileType}`;

    // 3. Upload to private Supabase Storage
    const { error: storageError } = await serviceClient.storage
      .from('resumes')
      .upload(storagePath, req.file.buffer, {
        contentType: mimeType,
        upsert: false
      });

    if (storageError) {
      console.warn('[StorageUploadError]:', storageError);
    }

    // 4. Text extraction (PDF or DOCX)
    let extractedText = '';
    if (fileType === 'pdf') {
      const parsed = await parsePdf(req.file.buffer);
      extractedText = parsed.text;
    } else {
      const parsed = await parseDocx(req.file.buffer);
      extractedText = parsed.text;
    }

    // 5. Extract structured profile & detected skills
    const { parsed_data, skills, extraction_confidence } = extractSectionsAndProfile(extractedText);

    // 6. Insert into resumes table
    const { data: resumeRecord, error: resumeErr } = await client
      .from('resumes')
      .insert({
        id: resumeId,
        user_id: userId,
        filename: req.file.originalname,
        storage_path: storagePath,
        file_type: fileType,
        mime_type: mimeType,
        file_size_bytes: req.file.buffer.length,
        file_hash: hash,
        extracted_text: extractedText,
        parsing_status: 'parsed',
        version: 1,
        is_active: true
      })
      .select('id, filename, file_type, file_size_bytes, parsing_status, version, created_at')
      .single();

    if (resumeErr) {
      console.error('[ResumeInsertError]:', resumeErr);
      return next(new AppError('Failed to record uploaded resume.', 500, 'DB_INSERT_FAILED'));
    }

    // 7. Insert into resume_profiles
    await client
      .from('resume_profiles')
      .insert({
        resume_id: resumeId,
        user_id: userId,
        parsed_data,
        extraction_confidence,
        is_user_confirmed: false
      });

    // 8. Insert extracted skills
    if (skills.length > 0) {
      const skillRows = skills.map((s) => ({
        resume_id: resumeId,
        user_id: userId,
        skill_name: s.skill_name,
        evidence_text: s.evidence_text,
        section: s.section,
        confidence: s.confidence,
        is_user_added: false
      }));

      await client.from('resume_skills').insert(skillRows);
    }

    return sendSuccess(req, res, {
      ...resumeRecord,
      is_duplicate: Boolean(existing),
      skills_count: skills.length
    }, 201);
  } catch (err) {
    next(err);
  }
}

export async function listResumes(req, res, next) {
  try {
    const userId = req.user.id;
    const client = req.supabase || getServiceClient();
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '10', 10)));
    const offset = (page - 1) * limit;

    const { data, error, count } = await client
      .from('resumes')
      .select('id, filename, file_type, file_size_bytes, parsing_status, version, is_active, created_at, updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return sendPaginated(req, res, [], { page, limit, total: 0, total_pages: 0 });
    }

    const total = count || 0;
    return sendPaginated(req, res, data || [], {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
}

export async function getResume(req, res, next) {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;
    const client = req.supabase || getServiceClient();
    const serviceClient = getServiceClient();
    const includeSignedUrl = req.query.include_signed_url === 'true';

    const { data: resume, error: resumeErr } = await client
      .from('resumes')
      .select('id, filename, file_type, storage_path, file_size_bytes, parsing_status, version, is_active, created_at, updated_at')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (resumeErr || !resume) {
      return next(new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND'));
    }

    const [profileRes, skillsRes] = await Promise.all([
      client.from('resume_profiles').select('*').eq('resume_id', resumeId).maybeSingle(),
      client.from('resume_skills').select('*').eq('resume_id', resumeId)
    ]);

    let signedUrl = null;
    if (includeSignedUrl && resume.storage_path) {
      const { data: urlData } = await serviceClient.storage
        .from('resumes')
        .createSignedUrl(resume.storage_path, 60);
      signedUrl = urlData?.signedUrl || null;
    }

    return sendSuccess(req, res, {
      ...resume,
      signed_url: signedUrl,
      profile: profileRes.data || null,
      skills: skillsRes.data || []
    });
  } catch (err) {
    next(err);
  }
}

export async function updateResume(req, res, next) {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;
    const client = req.supabase || getServiceClient();
    const { is_user_confirmed, parsed_data, skills_upsert, skill_ids_delete } = req.body;

    // 1. Verify existence
    const { data: resume, error: checkErr } = await client
      .from('resumes')
      .select('id, version')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (checkErr || !resume) {
      return next(new AppError('Resume not found.', 404, 'RESUME_NOT_FOUND'));
    }

    // 2. Update profile
    if (parsed_data || is_user_confirmed !== undefined) {
      await client
        .from('resume_profiles')
        .update({
          ...(parsed_data ? { parsed_data } : {}),
          ...(is_user_confirmed !== undefined ? { is_user_confirmed } : {})
        })
        .eq('resume_id', resumeId)
        .eq('user_id', userId);
    }

    // 3. Upsert skills
    if (Array.isArray(skills_upsert) && skills_upsert.length > 0) {
      const rows = skills_upsert.map((s) => ({
        resume_id: resumeId,
        user_id: userId,
        skill_name: s.skill_name,
        section: s.section || 'general',
        evidence_text: s.evidence_text || '',
        confidence: 1.0,
        is_user_added: true
      }));

      await client.from('resume_skills').upsert(rows, {
        onConflict: 'resume_id,skill_name,section'
      });
    }

    // 4. Delete removed skills
    if (Array.isArray(skill_ids_delete) && skill_ids_delete.length > 0) {
      await client
        .from('resume_skills')
        .delete()
        .in('id', skill_ids_delete)
        .eq('user_id', userId);
    }

    // 5. Increment version
    const { data: updatedResume } = await client
      .from('resumes')
      .update({ version: resume.version + 1 })
      .eq('id', resumeId)
      .eq('user_id', userId)
      .select('id, filename, version, updated_at')
      .single();

    return sendSuccess(req, res, updatedResume);
  } catch (err) {
    next(err);
  }
}

export async function deleteResume(req, res, next) {
  try {
    const userId = req.user.id;
    const resumeId = req.params.id;
    const client = req.supabase || getServiceClient();
    const serviceClient = getServiceClient();

    const { data: resume } = await client
      .from('resumes')
      .select('storage_path')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (resume?.storage_path) {
      await serviceClient.storage.from('resumes').remove([resume.storage_path]);
    }

    await client.from('resumes').delete().eq('id', resumeId).eq('user_id', userId);

    return sendSuccess(req, res, { deleted_id: resumeId });
  } catch (err) {
    next(err);
  }
}
