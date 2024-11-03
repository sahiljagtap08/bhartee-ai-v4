// File: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const saveTranscript = async (
  candidateId: string,
  transcript: string[]
) => {
  return await supabase
    .from('transcripts')
    .insert({
      candidate_id: candidateId,
      content: transcript,
      created_at: new Date().toISOString()
    });
};