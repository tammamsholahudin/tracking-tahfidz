import { mutateData, getSync } from './db'
import { supabase } from './supabase'

export interface TrashItem {
  id: string
  original_table: string
  item_name: string
  data: any
  deleted_at: string
  deleted_by: string
  guru_id: string
}

export const getCacheKeyForTable = (table: string) => {
  const map: Record<string, string> = {
    'school_classes': 'tahfidz_classes',
    'students': 'tahfidz_students',
    'targets': 'tahfidz_targets',
    'schedules': 'tahfidz_schedules',
    'meetings': 'tahfidz_meetings',
    'attendance_records': 'tahfidz_attendance_records',
    'memorization_records': 'tahfidz_memorization_records',
    'payments': 'tahfidz_payments',
    'lesson_groups': 'tahfidz_lesson_groups',
    'private_students': 'tahfidz_private_students',
    'audit_logs': 'tahfidz_audit_logs',
    'todos': 'tahfidz_todos'
  }
  return map[table] || table
}

export async function moveToTrash(tableName: string, itemId: string, itemName: string, deletedBy: string = 'Guru', guruId: string) {
  try {
    const { data: mainItem } = await supabase.from(tableName).select('*').eq('id', itemId).single()
    if (!mainItem) {
      console.warn('Item not found in supabase, deleting from cache anyway')
    }

    const trashData = {
      id: `trash-${Date.now()}-${itemId}`,
      original_table: tableName,
      item_id: itemId,
      item_name: itemName,
      data: mainItem || { id: itemId },
      deleted_by: deletedBy,
      guru_id: guruId
    }

    // Insert to audit_logs
    mutateData('audit_logs', 'INSERT', trashData, 'tahfidz_audit_logs')

    // Delete from original table
    mutateData(tableName, 'DELETE', { id: itemId }, getCacheKeyForTable(tableName))
    
    return true
  } catch (err) {
    console.error('Failed to move to trash', err)
    return false
  }
}

export async function moveMeetingToTrash(meetingId: string, meetingName: string, deletedBy: string, guruId: string) {
  // 1. Dapatkan data sinkron dari cache lokal secara instan
  const meeting = getSync('tahfidz_meetings').find((m: any) => m.id === meetingId)
  const attendances = getSync('tahfidz_attendance_records').filter((a: any) => a.meeting_id === meetingId)
  const memorizations = getSync('tahfidz_memorization_records').filter((m: any) => m.meeting_id === meetingId)

  const now = Date.now()
  const trashItems: any[] = []

  // Siapkan data meeting untuk trash
  trashItems.push({
    id: `trash-${now}-${meetingId}`,
    original_table: 'meetings',
    item_id: meetingId,
    item_name: meetingName,
    data: meeting || { id: meetingId },
    deleted_by: deletedBy,
    guru_id: guruId
  })

  // Siapkan data absensi untuk trash
  attendances.forEach((a: any) => {
    trashItems.push({
      id: `trash-${now}-${a.id}`,
      original_table: 'attendance_records',
      item_id: a.id,
      item_name: `Absensi ${a.student_id}`,
      data: a,
      deleted_by: deletedBy,
      guru_id: guruId
    })
  })

  // Siapkan data setoran untuk trash
  memorizations.forEach((m: any) => {
    trashItems.push({
      id: `trash-${now}-${m.id}`,
      original_table: 'memorization_records',
      item_id: m.id,
      item_name: `Setoran ${m.student_id}`,
      data: m,
      deleted_by: deletedBy,
      guru_id: guruId
    })
  })

  // 2. Simpan semuanya ke dalam Trash secara massal (Batch Insert)
  mutateData('audit_logs', 'INSERT', trashItems, 'tahfidz_audit_logs')

  // 3. Update UI secara INSTAN dengan menghapus dari local cache 
  // Kita bypass Supabase direct query dan hanya update localStorage untuk kecepatan maksimum di frontend
  const oldAttCache = getSync('tahfidz_attendance_records')
  localStorage.setItem('tahfidz_attendance_records', JSON.stringify(oldAttCache.filter((a: any) => a.meeting_id !== meetingId)))
  
  const oldMemCache = getSync('tahfidz_memorization_records')
  localStorage.setItem('tahfidz_memorization_records', JSON.stringify(oldMemCache.filter((m: any) => m.meeting_id !== meetingId)))

  // 4. Hapus meeting utama (Supabase ON DELETE CASCADE akan membersihkan sisanya di backend)
  mutateData('meetings', 'DELETE', { id: meetingId }, 'tahfidz_meetings')

  return true
}

export function restoreFromTrash(trashId: string) {
  // Fetch from local cache first
  const logs = getSync('tahfidz_audit_logs') as any[]
  const trashItem = logs.find(l => l.id === trashId)
  if (!trashItem) return false

  // Restore main item
  mutateData(trashItem.original_table, 'INSERT', trashItem.data, getCacheKeyForTable(trashItem.original_table))
  mutateData('audit_logs', 'DELETE', { id: trashId }, 'tahfidz_audit_logs')

  // Cascade Restore for Meetings
  if (trashItem.original_table === 'meetings') {
    const meetingId = trashItem.data.id
    
    // Find all children in trash that belong to this meeting
    const childrenToRestore = logs.filter(l => {
      if (l.id === trashId) return false
      
      const isAttendance = l.original_table === 'attendance_records' && l.data?.meeting_id === meetingId
      const isMemorization = l.original_table === 'memorization_records' && l.data?.meeting_id === meetingId
      // note: journal is currently part of meeting.summary, but if it was separated, we'd check here
      
      return isAttendance || isMemorization
    })

    // Restore them all
    childrenToRestore.forEach(child => {
      mutateData(child.original_table, 'INSERT', child.data, getCacheKeyForTable(child.original_table))
      mutateData('audit_logs', 'DELETE', { id: child.id }, 'tahfidz_audit_logs')
    })
  }

  return true
}

export function hardDeleteTrash(trashId: string) {
  mutateData('audit_logs', 'DELETE', { id: trashId }, 'tahfidz_audit_logs')
  return true
}

export function getTrashItems(): TrashItem[] {
  return (getSync('tahfidz_audit_logs') as TrashItem[]).sort((a, b) => {
    return new Date(b.deleted_at || 0).getTime() - new Date(a.deleted_at || 0).getTime()
  })
}

// Very simple audit log system
export function logAudit(action: string, user: string, guruId: string) {
  const logData = {
    id: `log-${Date.now()}`,
    original_table: 'system',
    item_id: 'sys',
    item_name: action,
    deleted_by: user,
    guru_id: guruId,
    data: { action }
  }
  mutateData('audit_logs', 'INSERT', logData, 'tahfidz_audit_logs')
}

