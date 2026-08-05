import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://pnsmfpywicppusvifgst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc21mcHl3aWNwcHVzdmlmZ3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NjE0MDIsImV4cCI6MjEwMDAzNzQwMn0.KHZG6SORquWO7UKCYdqEP7DlMW3xzRxqQQ37eF-30bU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const tables = [
  'teachers',
  'school_classes',
  'students',
  'targets',
  'schedules',
  'meetings',
  'attendance_records',
  'memorization_records',
  'payments',
  'lesson_groups',
  'private_students',
  'audit_logs',
  'todos'
];

async function backup() {
  console.log('Starting backup...');
  const backupDir = path.join(__dirname, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  for (const table of tables) {
    console.log(`Fetching data from ${table}...`);
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      console.error(`Error fetching ${table}:`, error.message);
    } else {
      fs.writeFileSync(path.join(backupDir, `${table}.json`), JSON.stringify(data, null, 2));
      console.log(`Successfully backed up ${table} (${data.length} rows).`);
    }
  }
  console.log('Backup completed.');
}

backup();
