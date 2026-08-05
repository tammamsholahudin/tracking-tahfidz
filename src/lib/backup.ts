import JSZip from 'jszip'
import { getSync } from './db'
import { saveAs } from 'file-saver'
import { supabase } from './supabase'

export async function generateBackup(options: { 
  guruId?: string, 
  includeAll?: boolean 
}) {
  const zip = new JSZip()
  
  // 1. Metadata
  const metadata = {
    version: '1.2.0',
    type: 'tahfidz_backup',
    created_at: new Date().toISOString(),
    generator: 'Tahfidz MAM! Backup Engine',
    options
  }
  zip.file('metadata.json', JSON.stringify(metadata, null, 2))

  // 2. Fetch all required tables
  const tables = [
    'tahfidz_classes', 'tahfidz_students', 'tahfidz_targets', 
    'tahfidz_schedules', 'tahfidz_meetings', 'tahfidz_attendance_records', 
    'tahfidz_memorization_records', 'tahfidz_teachers',
    'tahfidz_payments', 'tahfidz_lesson_groups', 'tahfidz_private_students'
  ]

  const dbData: Record<string, any[]> = {}
  
  for (const table of tables) {
    let data = getSync(table) || []
    if (!options.includeAll && options.guruId && table !== 'tahfidz_teachers') {
      // Filter by guru_id if applicable
      if (data.length > 0 && 'guru_id' in data[0]) {
        data = data.filter((d: any) => d.guru_id === options.guruId)
      }
    }
    dbData[table] = data
  }

  zip.file('database.json', JSON.stringify(dbData, null, 2))

  // 3. Generate ZIP (.ttm)
  const content = await zip.generateAsync({ type: 'blob' })
  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `TrackingTahfidz_Backup_${dateStr}.ttm`
  
  saveAs(content, fileName)
  
  return { success: true, fileName }
}

export async function restoreBackup(file: File): Promise<{ success: boolean, message: string }> {
  try {
    const zip = await JSZip.loadAsync(file)
    
    // Validasi file
    if (!zip.file('metadata.json') || !zip.file('database.json')) {
      return { success: false, message: 'Format file backup tidak valid. Harus berekstensi .ttm atau berisi metadata yang benar.' }
    }

    const metadataStr = await zip.file('metadata.json')!.async('string')
    const metadata = JSON.parse(metadataStr)

    if (metadata.type !== 'tahfidz_backup') {
      return { success: false, message: 'File ini bukan backup Tracking Tahfidz MAM.' }
    }

    const dbStr = await zip.file('database.json')!.async('string')
    const dbData = JSON.parse(dbStr)

    // Logika Restore: Karena kita ingin non-destructive, kita melakukan UPSERT ke Supabase.
    // Supabase client (db.ts) mutateData dengan array akan melakukan INSERT (yang otomatis upsert di Postgres jika di-handle).
    // Untuk lebih aman, kita langsung panggil Supabase massal atau biarkan db.ts yang handle.
    // Untuk saat ini, mari kita loop table dan mutateData
    let successCount = 0
    for (const [cacheKey, data] of Object.entries(dbData)) {
      if (Array.isArray(data) && data.length > 0) {
        const tableName = cacheKey.replace('tahfidz_', '') // asumsikan table name = cacheKey minus tahfidz_
        // Catatan: attendance_records, memorization_records, dll match.
        
        // Kita langsung upsert via supabase untuk efisiensi
        const { error } = await supabase.from(tableName).upsert(data)
        if (!error) {
          successCount++
        } else {
          console.error(`Gagal restore tabel ${tableName}:`, error)
        }
      }
    }

    // Paksa refresh local cache
    window.dispatchEvent(new Event('offline_queue_updated'))
    
    return { success: true, message: `Restore berhasil untuk ${successCount} tabel. Silakan muat ulang halaman.` }

  } catch (error: any) {
    console.error('Restore Error:', error)
    return { success: false, message: `Terjadi kesalahan saat membaca file backup: ${error.message}` }
  }
}
