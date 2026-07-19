import { SURAHS } from '@/data/surahs'

export interface TargetHafalan {
  id: string
  class_id: string
  semester: string // 'Ganjil' | 'Genap'
  surah: string // name_latin
  order?: number
}

export interface ProgressResult {
  pct: number
  suratSelesai: number
  suratTarget: number
  completedSurahs: string[]
  status: 'belum_mulai' | 'tahap_awal' | 'dalam_proses' | 'hampir_tercapai' | 'tercapai'
}

export interface OverallProgressResult {
  totalSurat: number
  juzTertinggi: number
  suratTerakhir: string
  tanggalTerakhir: string
  jumlahSetoran: number
  nilaiRataRata: number
  riwayat: any[]
}

export function getProgressStatus(pct: number): ProgressResult['status'] {
  if (pct === 0) return 'belum_mulai'
  if (pct < 50) return 'tahap_awal'
  if (pct < 80) return 'dalam_proses'
  if (pct < 100) return 'hampir_tercapai'
  return 'tercapai'
}

export function getStatusLabel(status: ProgressResult['status']): string {
  const map: Record<ProgressResult['status'], string> = {
    belum_mulai: 'Belum Mulai',
    tahap_awal: 'Tahap Awal',
    dalam_proses: 'Dalam Proses',
    hampir_tercapai: 'Hampir Tercapai',
    tercapai: 'Target Tercapai',
  }
  return map[status]
}

export function getStatusColor(status: ProgressResult['status']): string {
  const map: Record<ProgressResult['status'], string> = {
    belum_mulai: '#9ca3af', // gray-400
    tahap_awal: '#ef4444', // red-500
    dalam_proses: '#eab308', // yellow-500
    hampir_tercapai: '#3b82f6', // blue-500
    tercapai: '#22c55e', // green-500
  }
  return map[status]
}

// Rough estimate for Juz based on Surah Number
export function getJuzFromSurah(surahNumber: number): number {
  if (surahNumber >= 78) return 30
  if (surahNumber >= 67) return 29
  if (surahNumber >= 58) return 28
  if (surahNumber >= 51) return 27
  if (surahNumber >= 46) return 26
  if (surahNumber >= 41) return 25
  if (surahNumber >= 39) return 24
  if (surahNumber >= 36) return 23
  if (surahNumber >= 33) return 22
  if (surahNumber >= 29) return 21
  if (surahNumber >= 27) return 20
  if (surahNumber >= 25) return 19
  if (surahNumber >= 23) return 18
  if (surahNumber >= 21) return 17
  if (surahNumber >= 18) return 16
  if (surahNumber >= 17) return 15
  if (surahNumber >= 15) return 14
  if (surahNumber >= 13) return 13
  if (surahNumber >= 11) return 12
  if (surahNumber >= 10) return 11
  if (surahNumber >= 8) return 10
  if (surahNumber >= 7) return 9
  if (surahNumber >= 6) return 7
  if (surahNumber >= 5) return 6
  if (surahNumber >= 4) return 4
  if (surahNumber >= 3) return 3
  if (surahNumber >= 2) return 1
  return 1
}

/**
 * Validates surah existence. Used when setting targets.
 */
export function validateTargetSurah(surahName: string): { valid: boolean, error: string | null } {
  const surah = SURAHS.find(s => s.name_latin === surahName)
  if (!surah) return { valid: false, error: 'Surat tidak ditemukan' }
  return { valid: true, error: null }
}

/**
 * Calculates a single student's TARGET SEMESTER progress.
 * Logic: Checks how many target SURAHS have been completely memorized (all verses).
 */
export function calculateStudentProgress(
  studentId: string,
  classTargets: TargetHafalan[],
  memorizationRecords: any[],
  semester?: string
): ProgressResult {
  const activeTargets = semester ? classTargets.filter(t => t.semester === semester) : classTargets;
  
  if (!activeTargets || activeTargets.length === 0) {
    return { pct: 0, suratSelesai: 0, suratTarget: 0, completedSurahs: [], status: 'belum_mulai' }
  }

  const suratTarget = activeTargets.length
  const targetSurahNames = activeTargets.map(t => t.surah)
  
  const validRecords = memorizationRecords.filter(r => 
    r.student_id === studentId && 
    targetSurahNames.includes(r.surah_name) &&
    (r.surat_selesai === true || r.status === 'selesai')
  )

  const completedSurahs: string[] = []
  
  targetSurahNames.forEach(surah => {
    const isSelesai = validRecords.some(r => r.surah_name === surah)
    if (isSelesai) {
      completedSurahs.push(surah)
    }
  })

  const suratSelesai = completedSurahs.length
  const pct = suratTarget > 0 ? Math.round((suratSelesai / suratTarget) * 100) : 0
  
  return {
    pct,
    suratSelesai,
    suratTarget,
    completedSurahs,
    status: getProgressStatus(pct)
  }
}

/**
 * Calculates a student's OVERALL memorization progress (Hafalan Keseluruhan).
 * No targets, just real accumulated data.
 */
export function calculateOverallProgress(
  studentId: string,
  memorizationRecords: any[]
): OverallProgressResult {
  const studentRecords = memorizationRecords.filter(r => r.student_id === studentId)
  // Sort by created_at desc (newest first)
  studentRecords.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
  
  const validRecords = studentRecords.filter(r => r.status === 'lancar' || r.status === 'sangat_lancar')
  
  let totalSurat = 0
  let highestJuz = 0
  
  const surahGroups = validRecords.reduce((acc, curr) => {
    if (!acc[curr.surah_name]) acc[curr.surah_name] = { verses: new Set<number>(), selesai: false }
    for (let i = curr.verse_start; i <= curr.verse_end; i++) acc[curr.surah_name].verses.add(i)
    if (curr.surat_selesai || curr.status === 'selesai') acc[curr.surah_name].selesai = true
    return acc
  }, {} as Record<string, { verses: Set<number>, selesai: boolean }>)

  Object.keys(surahGroups).forEach(surahName => {
    const sData = SURAHS.find(s => s.name_latin === surahName)
    if (sData) {
      if (surahGroups[surahName].selesai || surahGroups[surahName].verses.size >= sData.total_verses) {
        totalSurat++
      }
      const juz = getJuzFromSurah(sData.number)
      if (juz > highestJuz) highestJuz = juz
    }
  })

  const lastRecord = studentRecords[0]
  
  const sumScores = studentRecords.reduce((acc, curr) => acc + (curr.score || 0), 0)
  const averageScore = studentRecords.length > 0 ? Math.round(sumScores / studentRecords.length) : 0

  return {
    totalSurat,
    juzTertinggi: highestJuz,
    suratTerakhir: lastRecord ? lastRecord.surah_name : '-',
    tanggalTerakhir: lastRecord ? lastRecord.created_at : '-',
    jumlahSetoran: studentRecords.length,
    nilaiRataRata: averageScore,
    riwayat: studentRecords
  }
}

/**
 * Calculates overall class summary based on Target Semester
 */
export function calculateClassProgress(
  students: any[],
  classTargets: TargetHafalan[],
  memorizationRecords: any[],
  semester?: string
): number {
  if (students.length === 0 || classTargets.length === 0) return 0
  
  let totalPct = 0
  students.forEach(s => {
    const p = calculateStudentProgress(s.id, classTargets, memorizationRecords, semester)
    totalPct += p.pct
  })
  
  return Math.round(totalPct / students.length)
}
