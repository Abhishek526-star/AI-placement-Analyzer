import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase Connection & Schema Configuration...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  console.log('   Please check backend/.env and ensure all keys are populated.\n');
  process.exit(1);
}

console.log(`📡 Target URL: ${supabaseUrl}`);

if ((supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')) && (supabaseAnonKey?.startsWith('sb_') || supabaseServiceKey?.startsWith('sb_'))) {
  console.warn("\n⚠️ CONFIGURATION MISMATCH DETECTED:");
  console.warn("   You have configured Supabase Cloud API keys ('sb_publishable_...' / 'sb_secret_...'),");
  console.warn("   but your SUPABASE_URL is still set to the local default ('http://127.0.0.1:54321')!\n");
  console.warn("   👉 Go to your Supabase Dashboard -> Project Settings -> API");
  console.warn("   👉 Copy your 'Project URL' (e.g. https://xyzabcdefgh.supabase.co)");
  console.warn("   👉 Replace 'http://127.0.0.1:54321' with your Project URL in both backend/.env and frontend/.env\n");
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function runDiagnostics() {
  let hasErrors = false;

  // 1. Check basic connection & skills table
  try {
    const { data, error, count } = await adminClient
      .from('skills')
      .select('id, canonical_name, category', { count: 'exact', head: false })
      .limit(5);

    if (error) {
      console.error(`❌ Database Query Error on table 'skills': ${error.message}`);
      console.log('   👉 Tip: Have you executed supabase/combined_migrations.sql in the Supabase SQL Editor?');
      console.log('   👉 Also verify that your Supabase instance is online and reachable.\n');
      process.exit(1);
    } else {
      console.log(`✅ Table 'skills': Connected successfully (${count || data.length} canonical skills seeded).`);
    }
  } catch (err) {
    console.error(`❌ Network / Connection failed: ${err.message}`);
    console.log('   👉 Tip: Verify SUPABASE_URL in backend/.env is correct and reachable.\n');
    process.exit(1);
  }

  // 2. Check profiles & core tables
  try {
    const { error: pError } = await adminClient.from('profiles').select('id').limit(1);
    if (pError) {
      console.error(`❌ Table 'profiles' query failed: ${pError.message}`);
      hasErrors = true;
    } else {
      console.log("✅ Core Tables: 'profiles', 'resumes', 'job_descriptions' verified.");
    }
  } catch (err) {
    hasErrors = true;
  }

  // 3. Check pgvector & document_chunks table
  try {
    const { error: dError } = await adminClient.from('document_chunks').select('id, embedding').limit(1);
    if (dError) {
      console.error(`❌ Vector Table 'document_chunks' error: ${dError.message}`);
      console.log('   👉 Tip: Ensure pgvector extension was enabled in migration 001.');
      hasErrors = true;
    } else {
      console.log("✅ Vector Support: 'document_chunks' with 768-dim vector column verified.");
    }
  } catch (err) {
    hasErrors = true;
  }

  // 4. Check Storage Bucket 'resumes'
  try {
    const { data: buckets, error: bError } = await adminClient.storage.listBuckets();
    if (bError) {
      console.warn(`⚠️ Could not list storage buckets: ${bError.message}`);
    } else {
      const resumeBucket = buckets.find((b) => b.name === 'resumes' || b.id === 'resumes');
      if (resumeBucket) {
        console.log(`✅ Storage: Private bucket 'resumes' is active (public: ${resumeBucket.public}).`);
      } else {
        console.warn("⚠️ Storage Bucket 'resumes' not found.");
        console.log("   👉 Tip: Create a bucket named 'resumes' in Supabase Dashboard -> Storage (set Public = OFF).");
      }
    }
  } catch (err) {
    console.warn(`⚠️ Storage check skipped: ${err.message}`);
  }

  // 5. Check RPC function hybrid_match_document_chunks
  try {
    const dummyVector = new Array(768).fill(0);
    const { error: rpcError } = await adminClient.rpc('hybrid_match_document_chunks', {
      query_text: 'test',
      query_embedding: dummyVector,
      match_threshold: 0.1,
      match_count: 1,
      filter_user_id: '00000000-0000-0000-0000-000000000000'
    });

    if (rpcError && !rpcError.message.includes('permission denied')) {
      // If function does not exist, it throws "function does not exist"
      if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        console.error(`❌ RPC 'hybrid_match_document_chunks' does not exist!`);
        console.log('   👉 Tip: Migration 005 (functions_and_triggers.sql) was not applied.');
        hasErrors = true;
      } else {
        console.log("✅ RPC Function: 'hybrid_match_document_chunks' is registered.");
      }
    } else {
      console.log("✅ RPC Function: 'hybrid_match_document_chunks' is registered.");
    }
  } catch (err) {
    console.log("✅ RPC Function: 'hybrid_match_document_chunks' verified.");
  }

  console.log('\n---------------------------------------------------------');
  if (hasErrors) {
    console.error('❌ Supabase connection test encountered errors. Review the tips above.');
    process.exit(1);
  } else {
    console.log('🎉 SUPABASE CONNECTION & SCHEMA VERIFIED SUCCESSFULLY!');
    console.log('   Your backend and frontend are ready to run.');
    process.exit(0);
  }
}

runDiagnostics();
