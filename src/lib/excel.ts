import * as XLSX from 'xlsx'
import { getSettings } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'

export function exportAttendanceExcel(data: any[], classData: any, filename = 'Laporan_Absensi.xlsx') {
  // Create a new workbook
  const wb = XLSX.utils.book_new()
  
  const semester = classData.semester || 'Ganjil'
  const academicYear = classData.academic_year || '2026/2027'
  const homeroom = classData.homeroom_teacher || '-'
  const studentsCount = data.length
  // Get number of meetings from keys (P1, P2, etc.)
  const meetingCount = Object.keys(data[0] || {}).filter(k => k.match(/^P\d+\n/)).length
  const printDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  const { institutionName, institutionSubtitle } = getSettings()

  // Define Header Rows
  const wsData: any[][] = [
    [institutionName],
    [institutionSubtitle],
    [],
    ['LAPORAN REKAPITULASI ABSENSI'],
    [],
    ['Nama Kelas', classData.name, '', 'Semester', semester],
    ['Tingkat', `Kelas ${classData.grade_level || '-'}`, '', 'Tahun Ajaran', academicYear],
    ['Wali Kelas', homeroom, '', 'Jumlah Siswa', studentsCount],
    ['Guru Tahfidz', useAuthStore.getState().profile?.name || 'Guru Tahfidz', '', 'Jumlah Pertemuan', meetingCount],
    ['Tanggal Cetak', printDate],
    []
  ]

  // Add Column Headers
  const headers = Object.keys(data[0] || {})
  wsData.push(headers)

  // Add Data Rows
  data.forEach(item => {
    wsData.push(headers.map(h => item[h]))
  })

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Setup Column Widths
  const colWidths = headers.map(h => {
    if (h === 'No') return { wch: 5 }
    if (h === 'Nama') return { wch: 25 }
    return { wch: Math.max(h.length + 2, 12) }
  })
  ws['!cols'] = colWidths

  // Freeze rows below headers
  ws['!freeze'] = { xSplit: 2, ySplit: 12, topLeftCell: 'C13', activePane: 'bottomRight', state: 'frozen' }

  XLSX.utils.book_append_sheet(wb, ws, 'Absensi')
  XLSX.writeFile(wb, filename)
}

export function exportMemorizationExcel(data: any[], classData: any, filename = 'Laporan_Hafalan.xlsx') {
  const wb = XLSX.utils.book_new()
  
  const semester = classData.semester || 'Ganjil'
  const academicYear = classData.academic_year || '2026/2027'
  const homeroom = classData.homeroom_teacher || '-'
  const printDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  const { institutionName, institutionSubtitle } = getSettings()

  // Define Header Rows
  const wsData: any[][] = [
    [institutionName],
    [institutionSubtitle],
    [],
    ['LAPORAN RIWAYAT HAFALAN SISWA'],
    [],
    ['Nama Kelas', classData.name, '', 'Semester', semester],
    ['Tingkat', `Kelas ${classData.grade_level || '-'}`, '', 'Tahun Ajaran', academicYear],
    ['Wali Kelas', homeroom],
    ['Guru Tahfidz', useAuthStore.getState().profile?.name || 'Guru Tahfidz'],
    ['Tanggal Cetak', printDate],
    []
  ]

  // Add Column Headers
  const headers = ['No', 'Nama Siswa', 'Tanggal', 'Surat', 'Ayat Awal', 'Ayat Akhir', 'Juz', 'Status Hafalan', 'Nilai', 'Catatan Guru']
  wsData.push(headers)

  // Add Data Rows (Flatten history)
  let rowCount = 1
  data.forEach((student) => {
    const history = student._history || []
    if (history.length === 0) {
      wsData.push([
        rowCount++, 
        student.Nama, 
        '-', '-', '-', '-', '-', 'Belum ada setoran', '-', '-'
      ])
    } else {
      history.forEach((h: any) => {
        wsData.push([
          rowCount++,
          student.Nama,
          new Date(h.created_at || h.date).toLocaleDateString('id-ID'),
          h.surah_name || h.surah,
          h.verse_start || h.verse,
          h.verse_end || '-',
          h.juz || 30,
          (h.status || '').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          h.score || '-',
          h.note || '-'
        ])
      })
    }
  })

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  ws['!cols'] = [
    { wch: 5 }, // No
    { wch: 25 }, // Nama
    { wch: 15 }, // Tanggal
    { wch: 20 }, // Surat
    { wch: 10 }, // Ayat Awal
    { wch: 10 }, // Ayat Akhir
    { wch: 8 },  // Juz
    { wch: 20 }, // Status
    { wch: 8 },  // Nilai
    { wch: 30 }  // Catatan
  ]

  ws['!freeze'] = { xSplit: 2, ySplit: 12, topLeftCell: 'C13', activePane: 'bottomRight', state: 'frozen' }

  XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Hafalan')
  XLSX.writeFile(wb, filename)
}

export interface StudentImportData {
  nis: string
  nama: string
  jenisKelamin: string
  kelas: string
}

export function generateStudentTemplate() {
  const headers = [['NIS', 'Nama', 'Jenis Kelamin (L/P)', 'Kelas']]
  const sampleData = [
    ['12345', 'Ahmad Fauzi', 'L', '10-A'],
    ['12346', 'Siti Aminah', 'P', '10-A']
  ]
  const wsData = [...headers, ...sampleData]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  ws['!cols'] = [
    { wch: 15 }, // NIS
    { wch: 25 }, // Nama
    { wch: 20 }, // Jenis Kelamin
    { wch: 15 }  // Kelas
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa')
  XLSX.writeFile(wb, 'Template_Import_Siswa.xlsx')
}

export function parseStudentExcel(file: File): Promise<StudentImportData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        const data = new Uint8Array(arrayBuffer)
        // Use 'array' type — readAsArrayBuffer is the modern standard
        // 'binary' / readAsBinaryString is deprecated in Chromium 120+
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 })

        // Skip header row (row 0)
        const rows = (jsonData as any[][]).slice(1)

        const students: StudentImportData[] = rows
          .filter((row) => Array.isArray(row) && row.length > 0 && row[1]) // must have name in col B
          .map((row) => ({
            nis: row[0] != null ? String(row[0]).trim() : '',
            nama: row[1] != null ? String(row[1]).trim() : '',
            jenisKelamin: row[2] != null ? String(row[2]).trim() : '',
            kelas: row[3] != null ? String(row[3]).trim() : '',
          }))

        resolve(students)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (err) => reject(err)
    reader.readAsArrayBuffer(file)  // ← was readAsBinaryString (deprecated)
  })
}

