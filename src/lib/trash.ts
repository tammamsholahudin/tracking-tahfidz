export interface TrashItem {
  id: string
  original_table: string
  item_name: string // For display purposes in the UI
  data: any
  deleted_at: string
  deleted_by: string
  relations: { table: string, data: any[] }[] 
}

const TRASH_KEY = 'tahfidz_trash'

// Helper to pull data and filter out
const popFromStorage = (key: string, predicate: (item: any) => boolean) => {
  const all = JSON.parse(localStorage.getItem(key) || '[]')
  const toDelete = all.filter(predicate)
  const remaining = all.filter((item: any) => !predicate(item))
  if (toDelete.length > 0) {
    localStorage.setItem(key, JSON.stringify(remaining))
  }
  return toDelete
}

// Helper to push data back
const pushToStorage = (key: string, items: any[]) => {
  if (items.length === 0) return
  const all = JSON.parse(localStorage.getItem(key) || '[]')
  localStorage.setItem(key, JSON.stringify([...all, ...items]))
}

export function moveToTrash(tableName: string, itemId: string, itemName: string, deletedBy: string = 'Guru') {
  // 1. Pop the main item
  const mainItems = popFromStorage(tableName, (i: any) => i.id === itemId)
  if (mainItems.length === 0) return false
  const mainItem = mainItems[0]

  const relations: { table: string, data: any[] }[] = []

  // 2. Cascade delete based on table
  if (tableName === 'tahfidz_classes') {
    relations.push({ table: 'tahfidz_students', data: popFromStorage('tahfidz_students', i => i.class_id === itemId) })
    relations.push({ table: 'tahfidz_targets', data: popFromStorage('tahfidz_targets', i => i.class_id === itemId) })
    relations.push({ table: 'tahfidz_meetings', data: popFromStorage('tahfidz_meetings', i => i.class_id === itemId) })
    relations.push({ table: 'tahfidz_schedules', data: popFromStorage('tahfidz_schedules', i => i.class_id === itemId) })
    relations.push({ table: 'tahfidz_attendance_records', data: popFromStorage('tahfidz_attendance_records', i => i.class_id === itemId) })
    relations.push({ table: 'tahfidz_memorization_records', data: popFromStorage('tahfidz_memorization_records', i => i.class_id === itemId) })
  } 
  else if (tableName === 'tahfidz_students') {
    relations.push({ table: 'tahfidz_attendance_records', data: popFromStorage('tahfidz_attendance_records', i => i.student_id === itemId) })
    relations.push({ table: 'tahfidz_memorization_records', data: popFromStorage('tahfidz_memorization_records', i => i.student_id === itemId) })
  }
  else if (tableName === 'tahfidz_meetings') {
    relations.push({ table: 'tahfidz_attendance_records', data: popFromStorage('tahfidz_attendance_records', i => i.meeting_id === itemId) })
    relations.push({ table: 'tahfidz_memorization_records', data: popFromStorage('tahfidz_memorization_records', i => i.meeting_id === itemId) })
  }
  else if (tableName === 'tahfidz_lesson_groups') {
    relations.push({ table: 'tahfidz_lesson_students', data: popFromStorage('tahfidz_lesson_students', i => i.group_id === itemId) })
  }

  // Filter out empty relations
  const validRelations = relations.filter(r => r.data.length > 0)

  // 3. Create Trash Item
  const trashItem: TrashItem = {
    id: `trash-${Date.now()}-${itemId}`,
    original_table: tableName,
    item_name: itemName,
    data: mainItem,
    deleted_at: new Date().toISOString(),
    deleted_by: deletedBy,
    relations: validRelations
  }

  pushToStorage(TRASH_KEY, [trashItem])
  
  // Log Audit
  logAudit(`Memindahkan ${itemName} ke Sampah`, deletedBy)
  
  return true
}

export function restoreFromTrash(trashId: string, restoredBy: string = 'Guru') {
  const trashItems = popFromStorage(TRASH_KEY, i => i.id === trashId)
  if (trashItems.length === 0) return false
  const trashItem: TrashItem = trashItems[0]

  // Restore main item
  pushToStorage(trashItem.original_table, [trashItem.data])

  // Restore relations
  if (trashItem.relations) {
    trashItem.relations.forEach(rel => {
      pushToStorage(rel.table, rel.data)
    })
  }

  logAudit(`Memulihkan ${trashItem.item_name} dari Sampah`, restoredBy)
  return true
}

export function hardDeleteTrash(trashId: string, deletedBy: string = 'Admin') {
  const trashItems = popFromStorage(TRASH_KEY, i => i.id === trashId)
  if (trashItems.length === 0) return false
  logAudit(`Menghapus permanen ${trashItems[0].item_name}`, deletedBy)
  return true
}

export function getTrashItems(): TrashItem[] {
  return JSON.parse(localStorage.getItem(TRASH_KEY) || '[]')
}

// Very simple audit log system
export function logAudit(action: string, user: string) {
  const logs = JSON.parse(localStorage.getItem('tahfidz_audit_logs') || '[]')
  logs.push({
    id: `log-${Date.now()}`,
    time: new Date().toISOString(),
    user,
    action
  })
  localStorage.setItem('tahfidz_audit_logs', JSON.stringify(logs))
}

export function getAuditLogs() {
  return JSON.parse(localStorage.getItem('tahfidz_audit_logs') || '[]').reverse()
}
