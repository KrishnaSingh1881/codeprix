import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
console.log('Absolute path to .env.local:', envPath);

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log('File read successfully. Length:', envContent.length);
  
  const env = {};
  const lines = envContent.split(/\r?\n/);
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) continue;
    
    const firstEquals = trimmedLine.indexOf('=');
    if (firstEquals !== -1) {
      const key = trimmedLine.substring(0, firstEquals).trim();
      const value = trimmedLine.substring(firstEquals + 1).trim();
      env[key] = value;
      console.log(`Parsed key: [${key}]`);
    }
  }

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase URL:', supabaseUrl ? 'FOUND' : 'MISSING');
  console.log('Supabase Key:', supabaseKey ? 'FOUND' : 'MISSING');

  if (!supabaseUrl || !supabaseKey) {
    console.error('Available keys:', Object.keys(env));
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function checkConfig() {
    console.log('Querying event_config...');
    const { data, error } = await supabase.from('event_config').select('*');
    if (error) {
      console.error('Error fetching event_config:', error);
    } else {
      console.log('Event Config Data:', JSON.stringify(data, null, 2));
    }
  }

  checkConfig();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
