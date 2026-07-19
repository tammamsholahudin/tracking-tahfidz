interface Schedule {
  id: string
  entity_type: 'sekolah' | 'les' | 'privat' | 'manual'
  entity_id?: string
  title: string
  day: string
  start_time: string
  end_time: string
  location?: string
  color: string
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  return (h * 60) + (m || 0)
}

/**
 * Checks if a new schedule collides with any existing schedules.
 * Returns the colliding schedule if found, null otherwise.
 */
export function checkCollision(newSched: Partial<Schedule>, existingSchedules: Schedule[], excludeId?: string): Schedule | null {
  const newStart = timeToMinutes(newSched.start_time || '00:00')
  const newEnd = timeToMinutes(newSched.end_time || '00:00')

  for (const s of existingSchedules) {
    if (s.id === excludeId) continue // skip self when editing
    if (s.day !== newSched.day) continue // only check same day

    const sStart = timeToMinutes(s.start_time)
    const sEnd = timeToMinutes(s.end_time)

    // Collision logic: 
    // Two intervals [A, B] and [C, D] overlap if max(A, C) < min(B, D)
    // (Assuming end time is exclusive, i.e., 09:00-10:00 and 10:00-11:00 do NOT overlap)
    if (Math.max(newStart, sStart) < Math.min(newEnd, sEnd)) {
      return s
    }
  }

  return null
}

/**
 * Generates an iCalendar (.ics) string from the schedules.
 */
export function exportToICS(schedules: Schedule[]) {
  // Map days to ICS format RRULE (Recurring Rule)
  const dayMap: Record<string, string> = {
    'Minggu': 'SU',
    'Senin': 'MO',
    'Selasa': 'TU',
    'Rabu': 'WE',
    'Kamis': 'TH',
    'Jumat': 'FR',
    'Sabtu': 'SA'
  }

  let icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Tahfidz MAM//ID
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Jadwal Tahfidz MAM
X-WR-TIMEZONE:Asia/Jakarta
`

  // Base date for generating events. We just need a recent week that matches the day.
  // We'll use 2026-07-13 (Monday) to 2026-07-19 (Sunday) as a base for RRULE.
  const baseDates: Record<string, string> = {
    'Senin': '20260713',
    'Selasa': '20260714',
    'Rabu': '20260715',
    'Kamis': '20260716',
    'Jumat': '20260717',
    'Sabtu': '20260718',
    'Minggu': '20260719'
  }

  schedules.forEach(s => {
    const baseDate = baseDates[s.day] || '20260713'
    const startStr = s.start_time.replace(':', '') + '00'
    const endStr = s.end_time.replace(':', '') + '00'
    const byDay = dayMap[s.day] || 'MO'

    icsContent += 
`BEGIN:VEVENT
UID:${s.id}@tahfidzmam
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;TZID=Asia/Jakarta:${baseDate}T${startStr}
DTEND;TZID=Asia/Jakarta:${baseDate}T${endStr}
RRULE:FREQ=WEEKLY;BYDAY=${byDay}
SUMMARY:${s.title}
DESCRIPTION:Tipe: ${s.entity_type}
LOCATION:${s.location || '-'}
END:VEVENT
`
  })

  icsContent += 'END:VCALENDAR'

  // Trigger download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Jadwal_Tahfidz_${new Date().toISOString().slice(0,10)}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
