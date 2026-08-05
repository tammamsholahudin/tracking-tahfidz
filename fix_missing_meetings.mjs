import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://pnsmfpywicppusvifgst.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc21mcHl3aWNwcHVzdmlmZ3N0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NjE0MDIsImV4cCI6MjEwMDAzNzQwMn0.KHZG6SORquWO7UKCYdqEP7DlMW3xzRxqQQ37eF-30bU'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function fix() {
  console.log('Fetching all meetings from Supabase...')
  const { data: meetings, error: mErr } = await supabase.from('meetings').select('id')
  if (mErr) { console.error('Error fetching meetings:', mErr); return }
  
  const meetingIds = new Set(meetings.map(m => m.id))
  console.log(`Found ${meetingIds.size} meetings.`)
  
  console.log('Fetching all attendance records...')
  const { data: attendances, error: aErr } = await supabase.from('attendance_records').select('*')
  if (aErr) { console.error('Error fetching attendance:', aErr); return }
  
  const missingMap = new Map()
  attendances.forEach(att => {
    if (att.meeting_id && !meetingIds.has(att.meeting_id)) {
      if (!missingMap.has(att.meeting_id)) {
        missingMap.set(att.meeting_id, {
          id: att.meeting_id,
          class_id: att.class_id,
          guru_id: att.guru_id,
          date: att.created_at || new Date().toISOString(),
          summary: 'Data hasil pemulihan otomatis (Recovered)',
          status: 'Pembelajaran',
          created_at: att.created_at || new Date().toISOString()
        })
      }
    }
  })
  
  const orphans = Array.from(missingMap.values())
  console.log(`Found ${orphans.length} missing meetings from attendance records.`)
  
  if (orphans.length > 0) {
    console.log('Inserting missing meetings into Supabase...')
    const { error: insErr } = await supabase.from('meetings').insert(orphans)
    if (insErr) {
      console.error('Failed to insert missing meetings:', insErr)
      // Check RLS
      if (insErr.code === '42501' || insErr.message.includes('row-level security')) {
        console.log('RLS blocked the insert. This means the user must restore it from the app UI while logged in as admin.')
      }
    } else {
      console.log('SUCCESSFULLY RESTORED MISSING MEETINGS TO SUPABASE!')
    }
  } else {
    console.log('No missing meetings found. Data might already be restored.')
  }
}

fix()
