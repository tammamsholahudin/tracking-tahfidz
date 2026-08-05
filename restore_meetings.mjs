import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=')
  if (key && value) {
    env[key.trim()] = value.join('=').trim()
  }
})

const supabaseUrl = env['VITE_SUPABASE_URL']
const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

const supabase = createClient(supabaseUrl, supabaseKey)

async function run() {
  console.log('Fetching attendance records...')
  const { data: attData, error: err1 } = await supabase.from('attendance_records').select('*')
  if (err1) { console.error(err1); return }
  
  const meetingsMap = new Map()
  
  attData.forEach(att => {
    if (att.meeting_id && !meetingsMap.has(att.meeting_id)) {
      meetingsMap.set(att.meeting_id, {
        id: att.meeting_id,
        class_id: att.class_id,
        guru_id: att.guru_id,
        date: att.created_at, // Use created_at as the meeting date
        summary: 'Data hasil pemulihan otomatis',
        status: 'Pembelajaran',
        created_at: att.created_at
      })
    }
  })
  
  const meetingsToInsert = Array.from(meetingsMap.values())
  console.log(`Found ${meetingsToInsert.length} unique meetings to reconstruct.`)
  
  if (meetingsToInsert.length > 0) {
    const { error: err2 } = await supabase.from('meetings').insert(meetingsToInsert)
    if (err2) {
      console.error('Failed to restore meetings:', err2)
    } else {
      console.log('Successfully restored meetings to Supabase!')
    }
  } else {
    console.log('No meetings needed to be restored.')
  }
}

run()
