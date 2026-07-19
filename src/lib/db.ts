import { supabase } from './supabase'

export interface OfflineMutation {
  id: string
  table: string
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  payload: any
  timestamp: number
}

export const getOfflineQueue = (): OfflineMutation[] => {
  return JSON.parse(localStorage.getItem('offline_queue') || '[]')
}

export const addToOfflineQueue = (mutation: Omit<OfflineMutation, 'id' | 'timestamp'>) => {
  const queue = getOfflineQueue()
  queue.push({
    ...mutation,
    id: `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  })
  localStorage.setItem('offline_queue', JSON.stringify(queue))
  window.dispatchEvent(new Event('offline_queue_updated'))
}

export const flushOfflineQueue = async () => {
  const queue = getOfflineQueue()
  if (queue.length === 0) return

  const newQueue = [...queue]

  for (const mut of queue) {
    try {
      if (mut.type === 'INSERT') {
        const { error } = await supabase.from(mut.table).insert(mut.payload)
        if (error) console.error(`DB Error flushing queue for ${mut.table}:`, error)
      } else if (mut.type === 'UPDATE') {
        const { error } = await supabase.from(mut.table).update(mut.payload).eq('id', mut.payload.id)
        if (error) console.error(`DB Error flushing queue for ${mut.table}:`, error)
      } else if (mut.type === 'DELETE') {
        const { error } = await supabase.from(mut.table).delete().eq('id', mut.payload.id)
        if (error) console.error(`DB Error flushing queue for ${mut.table}:`, error)
      }
      
      // Remove from queue upon processing (whether success or DB error like duplicate constraint)
      // Only keep in queue if there's a true network exception
      const index = newQueue.findIndex(q => q.id === mut.id)
      if (index !== -1) newQueue.splice(index, 1)
    } catch (err) {
      console.error('Network error while flushing mutation', mut, err)
      console.error('Network error while flushing mutation', mut, err)
      break // Stop flushing if offline to preserve order
    }
  }

  localStorage.setItem('offline_queue', JSON.stringify(newQueue))
  window.dispatchEvent(new Event('offline_queue_updated'))
}

// Event listener for coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', flushOfflineQueue)
}

/**
 * Universal Mutator: Handles optimistic UI updates, Supabase mutation, and offline queueing.
 */
export const mutateData = async (
  table: string, 
  type: 'INSERT' | 'UPDATE' | 'DELETE', 
  payload: any, 
  cacheKey: string
) => {
  // 1. Optimistic Update Local Cache
  const currentCache = JSON.parse(localStorage.getItem(cacheKey) || '[]')
  let newCache = [...currentCache]
  
  if (type === 'INSERT') {
    if (Array.isArray(payload)) {
      newCache.push(...payload)
    } else {
      newCache.push(payload)
    }
  } else if (type === 'UPDATE') {
    if (Array.isArray(payload)) {
      payload.forEach(p => {
        const idx = newCache.findIndex((item: any) => item.id === p.id)
        if (idx !== -1) newCache[idx] = { ...newCache[idx], ...p }
      })
    } else {
      const idx = newCache.findIndex((item: any) => item.id === payload.id)
      if (idx !== -1) {
        newCache[idx] = { ...newCache[idx], ...payload }
      }
    }
  } else if (type === 'DELETE') {
    if (Array.isArray(payload)) {
      const idsToDelete = payload.map(p => p.id)
      newCache = newCache.filter((item: any) => !idsToDelete.includes(item.id))
    } else {
      newCache = newCache.filter((item: any) => item.id !== payload.id)
    }
  }
  
  localStorage.setItem(cacheKey, JSON.stringify(newCache))
  window.dispatchEvent(new Event('local_cache_updated')) // Trigger re-render

  // 2. Check explicitly if offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    addToOfflineQueue({ table, type, payload })
    return { success: true, offline: true }
  }

  // 3. Try to execute directly to Supabase
  try {
    if (type === 'INSERT') {
      const { error } = await supabase.from(table).insert(payload)
      if (error) return { success: false, error }
    } else if (type === 'UPDATE') {
      const { error } = await supabase.from(table).update(payload).eq('id', payload.id)
      if (error) return { success: false, error }
    } else if (type === 'DELETE') {
      const { error } = await supabase.from(table).delete().eq('id', payload.id)
      if (error) return { success: false, error }
    }
    return { success: true, offline: false }
  } catch (err) {
    // True network exception
    console.error('Network exception during mutation, queueing...', err)
    addToOfflineQueue({ table, type, payload })
    return { success: true, offline: true }
  }
}

/**
 * Mendapatkan data langsung dari local cache secara sinkron (agar performa tetap cepat)
 */
export const getSync = (cacheKey: string) => {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem(cacheKey) || '[]')
}

/**
 * Meminta update terbaru dari Cloud (Supabase) secara background.
 * Jika ada perubahan, akan menimpa cache lokal dan men-trigger event 'local_cache_updated'.
 */
export const fetchBackground = async (
  table: string, 
  cacheKey: string,
  options?: { filterColumn?: string; filterValue?: any }
) => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return

  try {
    let query = supabase.from(table).select('*')
    if (options?.filterColumn && options?.filterValue) {
      query = query.eq(options.filterColumn, options.filterValue)
    }

    const { data, error } = await query
    if (error) throw error

    if (data) {
      const currentCache = localStorage.getItem(cacheKey)
      const newDataStr = JSON.stringify(data)
      
      // Update if data changed
      if (currentCache !== newDataStr) {
        localStorage.setItem(cacheKey, newDataStr)
        window.dispatchEvent(new Event('local_cache_updated'))
      }
    }
  } catch (err) {
    console.error('fetchBackground error', err)
  }
}

export const fetchAllBackground = async () => {
  const tables = [
    { table: 'school_classes', cacheKey: 'tahfidz_classes' },
    { table: 'students', cacheKey: 'tahfidz_students' },
    { table: 'teachers', cacheKey: 'tahfidz_teachers' },
    { table: 'targets', cacheKey: 'tahfidz_targets' },
    { table: 'schedules', cacheKey: 'tahfidz_schedules' },
    { table: 'meetings', cacheKey: 'tahfidz_meetings' },
    { table: 'attendance_records', cacheKey: 'tahfidz_attendance_records' },
    { table: 'memorization_records', cacheKey: 'tahfidz_memorization_records' },
    { table: 'payments', cacheKey: 'tahfidz_payments' },
    { table: 'lesson_groups', cacheKey: 'tahfidz_lesson_groups' },
    { table: 'private_students', cacheKey: 'tahfidz_private_students' },
    { table: 'audit_logs', cacheKey: 'tahfidz_audit_logs' }
  ]
  for (const { table, cacheKey } of tables) {
    await fetchBackground(table, cacheKey)
  }
}
