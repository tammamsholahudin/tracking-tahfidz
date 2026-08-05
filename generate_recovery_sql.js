import fs from 'fs'

const att = JSON.parse(fs.readFileSync('backup/attendance_records.json', 'utf-8'))

// Find all unique meeting_ids from attendance
const allMeetingIds = [...new Set(att.map(a => a.meeting_id).filter(Boolean))]
console.log('Total unique meeting IDs referenced by attendance:', allMeetingIds.length)

// Build meeting info from attendance records
const meetingMap = new Map()
att.forEach(a => {
  if (!a.meeting_id) return
  if (!meetingMap.has(a.meeting_id)) {
    meetingMap.set(a.meeting_id, {
      id: a.meeting_id,
      class_id: a.class_id,
      guru_id: a.guru_id,
      created_at: a.created_at,
      attCount: 0
    })
  }
  meetingMap.get(a.meeting_id).attCount++
})

// Generate SQL INSERT for ALL missing meetings
const values = []
meetingMap.forEach((m) => {
  const date = m.created_at ? m.created_at.split('T')[0] : '2026-08-05'
  values.push(`  ('${m.id}', '${m.class_id}', '${m.guru_id}', 'Pembelajaran', '${m.created_at}', '${date}')`)
})

const sql = `-- RECOVERY: Insert semua meeting records yang hilang
-- Jalankan SQL ini di Supabase SQL Editor
-- Total: ${values.length} meetings

INSERT INTO public.meetings (id, class_id, guru_id, status, created_at, date)
VALUES
${values.join(',\n')}
ON CONFLICT (id) DO NOTHING;
`

fs.writeFileSync('recover_all_meetings.sql', sql)
console.log('SQL written to recover_all_meetings.sql')
console.log('Total meetings to recover:', values.length)
