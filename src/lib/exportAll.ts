import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { exportAttendancePDF, exportProgressPDF, exportJournalPDF } from './pdf'
import { exportAttendanceExcel, exportMemorizationExcel, exportJournalExcel } from './excel'

export async function downloadMassZip(options: {
  classData: any,
  students: any[],
  meetings: any[],
  attendanceData: any[],
  memorizationData: any[]
}) {
  const { classData, students, meetings, attendanceData, memorizationData } = options
  const zip = new JSZip()
  const className = classData?.name || 'Kelas'
  const academicYear = classData?.academic_year || '2026-2027'
  const semester = classData?.semester || 'Ganjil'
  
  const safeName = className.replace(/[^a-zA-Z0-9_-]/g, '_')
  const dateStr = new Date().toISOString().split('T')[0]
  
  const baseFilename = `Laporan - ${safeName} - Semester ${semester} - Tahun Ajaran ${academicYear.replace('/', '-')} - Diunduh ${dateStr}`

  // --- PDF ---
  const pdfFolder = zip.folder('PDF')
  
  // 1. Absensi PDF
  const attPdfBlob = exportAttendancePDF(students, classData, '', meetings, true) as unknown as Blob
  if (attPdfBlob) pdfFolder?.file(`Absensi - ${baseFilename}.pdf`, attPdfBlob)

  // 2. Progress PDF
  const memPdfBlob = exportProgressPDF(memorizationData, classData, '', true) as unknown as Blob
  if (memPdfBlob) pdfFolder?.file(`Progress Hafalan - ${baseFilename}.pdf`, memPdfBlob)

  // 3. Journal PDF
  const journalPdfBlob = exportJournalPDF(meetings, students, attendanceData, memorizationData, classData, '', true) as unknown as Blob
  if (journalPdfBlob) pdfFolder?.file(`Jurnal Pembelajaran - ${baseFilename}.pdf`, journalPdfBlob)

  // --- EXCEL ---
  const excelFolder = zip.folder('Excel')

  // 1. Absensi Excel
  const attExcelBlob = exportAttendanceExcel(students, classData, '', true) as unknown as Blob
  if (attExcelBlob) excelFolder?.file(`Absensi - ${baseFilename}.xlsx`, attExcelBlob)

  // 2. Hafalan Excel
  const memExcelBlob = exportMemorizationExcel(memorizationData, classData, '', true) as unknown as Blob
  if (memExcelBlob) excelFolder?.file(`Setoran Hafalan - ${baseFilename}.xlsx`, memExcelBlob)

  // 3. Jurnal Excel
  const journalExcelBlob = exportJournalExcel(meetings, students, attendanceData, memorizationData, classData, '', true) as unknown as Blob
  if (journalExcelBlob) excelFolder?.file(`Jurnal Pembelajaran - ${baseFilename}.xlsx`, journalExcelBlob)

  // Generate and download
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `${baseFilename}.zip`)
}
