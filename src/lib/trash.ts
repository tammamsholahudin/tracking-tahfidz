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

export async function moveToTrash(tableName: string, itemId: string, itemName: string, deletedBy: string = 'Guru', guruId: string) {
  // We don't cascade delete in frontend anymore, we rely on Supabase ON DELETE CASCADE.
  // We just fetch the item to save its state.
  try {
    const { data: mainItem } = await supabase.from(tableName).select('*').eq('id', itemId).single()
    if (!mainItem) {
      // fallback to local if offline?
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
    mutateData(tableName, 'DELETE', { id: itemId }, tableName)
    
    return true
  } catch (err) {
    console.error('Failed to move to trash', err)
    return false
  }
}

export function restoreFromTrash(trashId: string) {
  // Fetch from local cache first
  const logs = getSync('tahfidz_audit_logs') as any[]
  const trashItem = logs.find(l => l.id === trashId)
  if (!trashItem) return false

  // Restore main item
  mutateData(trashItem.original_table, 'INSERT', trashItem.data, trashItem.original_table)

  // Delete from audit_logs
  mutateData('audit_logs', 'DELETE', { id: trashId }, 'tahfidz_audit_logs')

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

