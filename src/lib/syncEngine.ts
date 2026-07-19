import { supabase } from './supabase'
import toast from 'react-hot-toast'

/**
 * Sync Engine: Menyinkronkan LocalStorage dengan Supabase
 */

export const pullFromCloud = async () => {
  try {
    const collections = [
      { table: 'school_classes', key: 'tahfidz_classes' },
      { table: 'students', key: 'tahfidz_students' },
      { table: 'lesson_groups', key: 'tahfidz_lesson_groups' },
      { table: 'private_students', key: 'tahfidz_private_students' },
      { table: 'meetings', key: 'tahfidz_meetings' },
      { table: 'attendance', key: 'tahfidz_attendance_records' },
      { table: 'memorization_records', key: 'tahfidz_memorization_records' },
      { table: 'targets', key: 'tahfidz_targets' },
    ]

    for (const col of collections) {
      const { data, error } = await supabase.from(col.table).select('*')
      if (!error && data) {
        localStorage.setItem(col.key, JSON.stringify(data))
      }
    }
    
    // Khusus untuk teachers
    const { data: teachersData } = await supabase.from('teachers').select('*')
    if (teachersData) {
      localStorage.setItem('tahfidz_teachers', JSON.stringify(teachersData))
    }

    return true
  } catch (error) {
    console.error('Error pulling from cloud:', error)
    return false
  }
}

export const pushToCloud = async () => {
  try {
    const collections = [
      { table: 'school_classes', key: 'tahfidz_classes' },
      { table: 'students', key: 'tahfidz_students' },
      { table: 'lesson_groups', key: 'tahfidz_lesson_groups' },
      { table: 'private_students', key: 'tahfidz_private_students' },
      { table: 'meetings', key: 'tahfidz_meetings' },
      { table: 'attendance', key: 'tahfidz_attendance_records' },
      { table: 'memorization_records', key: 'tahfidz_memorization_records' },
      { table: 'targets', key: 'tahfidz_targets' },
    ]

    for (const col of collections) {
      const localData = JSON.parse(localStorage.getItem(col.key) || '[]')
      if (localData.length > 0) {
        const { error } = await supabase.from(col.table).upsert(localData)
        if (error) console.error(`Error syncing ${col.table}:`, error)
      }
    }
    
    const teachersData = JSON.parse(localStorage.getItem('tahfidz_teachers') || '[]')
    if (teachersData.length > 0) {
       await supabase.from('teachers').upsert(teachersData)
    }

    toast.success('Data berhasil disinkronkan ke Cloud!')
    return true
  } catch (error) {
    console.error('Error pushing to cloud:', error)
    toast.error('Gagal menyinkronkan data')
    return false
  }
}
