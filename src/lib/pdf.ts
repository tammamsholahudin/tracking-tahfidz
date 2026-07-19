import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'

export function exportAttendancePDF(data: any[], classData: any, filename = 'Laporan_Absensi.pdf') {
  const doc = new jsPDF('landscape')

  // --- HEADER ---
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  const { institutionName, institutionSubtitle } = getSettings()
  // Nama Sekolah (Mock or from classData if available)
  doc.text(institutionName, 14, 15)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(institutionSubtitle, 14, 20)

  // Separator Line
  doc.setLineWidth(0.5)
  doc.line(14, 23, doc.internal.pageSize.width - 14, 23)

  // Identitas Kelas (Grid Layout)
  doc.setFontSize(9)
  const leftColX = 14
  const rightColX = 120

  const academicYear = classData.academic_year || '2026/2027'
  const homeroom = classData.homeroom_teacher || '-'
  const studentsCount = data.length
  
  // Get number of meetings from keys (P1, P2, etc.)
  const meetingCount = Object.keys(data[0] || {}).filter(k => k.match(/^P\d+\n/)).length

  doc.text(`Nama Kelas : ${classData.name}`, leftColX, 30)
  doc.text(`Tingkat : Kelas ${classData.grade_level || '-'}`, leftColX, 35)
  doc.text(`Wali Kelas : ${homeroom}`, leftColX, 40)
  const teacherName = useAuthStore.getState().profile?.name || 'Guru Tahfidz'
  doc.text(`Guru Tahfidz : ${teacherName}`, leftColX, 45)
  
  doc.text(`Tahun Ajaran : ${academicYear}`, rightColX, 30)
  doc.text(`Jumlah Siswa : ${studentsCount} | Pertemuan : ${meetingCount}`, rightColX, 35)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('LAPORAN REKAPITULASI ABSENSI', doc.internal.pageSize.width / 2, 50, { align: 'center' })

  // --- TABLE ---
  if (data.length > 0) {
    const headers = Object.keys(data[0])
    const rows = data.map(obj => headers.map(h => obj[h]))

    autoTable(doc, {
      startY: 55,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 7, font: 'helvetica', cellPadding: 2 },
      headStyles: { fillColor: [23, 94, 59], textColor: 255, halign: 'center' }, // Islamic Green
      horizontalPageBreak: true, // Handle > 50 columns
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' }, // No
        1: { cellWidth: 35 }, // Nama
      }
    })
  } else {
    doc.setFont('helvetica', 'italic')
    doc.text('Belum ada data absensi', 14, 55)
  }

  // --- FOOTER ---
  const finalY = (doc as any).lastAutoTable?.finalY || 60
  if (finalY + 40 < doc.internal.pageSize.height) {
    const printDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Cetak: ${printDate}`, 14, finalY + 15)

    doc.text('Mengetahui,', 40, finalY + 20)
    doc.text('Wali Kelas', 40, finalY + 25)
    doc.text('ttd', 40, finalY + 35)
    doc.text(homeroom, 40, finalY + 45)

    const teacherName = useAuthStore.getState().profile?.name || 'Guru Tahfidz'
    doc.text('Guru Tahfidz', doc.internal.pageSize.width - 80, finalY + 25)
    doc.text('ttd', doc.internal.pageSize.width - 80, finalY + 35)
    doc.text(teacherName, doc.internal.pageSize.width - 80, finalY + 45)
  }

  // Footer page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
  }

  doc.save(filename)
}

export function exportProgressPDF(data: any[], classData: any, filename = 'Laporan_Progress_Hafalan.pdf') {
  const doc = new jsPDF('portrait')

  const academicYear = classData.academic_year || '2026/2027'
  const homeroom = classData.homeroom_teacher || '-'
  const printDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })

  let lastY = 60

  // Iterate over each student
  data.forEach((student, index) => {
    if (index > 0) {
      doc.addPage()
    }

    // --- HEADER ---
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const { institutionName: instName, institutionSubtitle: instSub } = getSettings()
    doc.text(instName, 14, 15)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(instSub, 14, 20)
    doc.setLineWidth(0.5)
    doc.line(14, 23, doc.internal.pageSize.width - 14, 23)

    // Identitas
    doc.setFontSize(9)
    doc.text(`Nama Kelas : ${classData.name}`, 14, 30)
    doc.text(`Wali Kelas : ${homeroom}`, 14, 35)
    const teacherName = useAuthStore.getState().profile?.name || 'Guru Tahfidz'
    doc.text(`Guru Tahfidz : ${teacherName}`, 14, 40)
    doc.text(`Nama Siswa : ${student.Nama}`, 14, 45)
    
    doc.text(`Tahun Ajaran : ${academicYear}`, 120, 30)
    doc.text(`Tanggal Cetak : ${printDate}`, 120, 35)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN PERKEMBANGAN HAFALAN', doc.internal.pageSize.width / 2, 52, { align: 'center' })

    const history = student._history || []
    
    let startY = 60

    if (history.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('Belum ada riwayat setoran.', 14, startY)
      doc.setFont('helvetica', 'normal')
      startY += 25
    } else {
      // Table for history
      const hHeaders = ['No', 'Tanggal', 'Surat', 'Ayat', 'Juz', 'Status', 'Nilai', 'Catatan']
      const hRows = history.map((h: any, idx: number) => [
        idx + 1,
        new Date(h.created_at || h.date).toLocaleDateString('id-ID'),
        h.surah_name || h.surah,
        `${h.verse_start || h.verse} - ${h.verse_end || ''}`,
        h.juz || 30,
        (h.status || '').split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        h.score || '-',
        h.note || '-'
      ])

      autoTable(doc, {
        startY: startY,
        head: [hHeaders],
        body: hRows,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [40, 40, 40], textColor: 255 },
        margin: { left: 14, right: 14 },
        columnStyles: { 0: { cellWidth: 8, halign: 'center' } }
      })

      // Summary after history
      startY = (doc as any).lastAutoTable.finalY + 10
      
      // Calculate Stats
      const totalScore = history.reduce((acc: number, h: any) => acc + (parseInt(h.score) || 0), 0)
      const avgScore = history.length > 0 ? Math.round(totalScore / history.length) : 0
      const lastRec = history[history.length - 1]

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('RINGKASAN HAFALAN', 14, startY)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(`Jumlah Setoran : ${history.length} kali`, 14, startY + 6)
      doc.text(`Nilai Rata-rata : ${avgScore}`, 14, startY + 11)
      doc.text(`Juz Terakhir : ${lastRec.juz || 30}`, 14, startY + 16)
      
      doc.text(`Surat Terakhir : ${lastRec.surah_name || lastRec.surah}`, 100, startY + 6)
      doc.text(`Target Hafalan Kelas : ${student['Target Semester'] || '-'}`, 100, startY + 11)
      doc.text(`Progress Target : ${student['Persentase Progress'] || '0'}`, 100, startY + 16)
      
      startY += 25
    }

    lastY = startY
  })

  // Add global signatures at the very end of the entire document
  let finalY = lastY
  if (finalY + 40 > doc.internal.pageSize.height) {
    doc.addPage()
    finalY = 20
  }

  const teacherName = useAuthStore.getState().profile?.name || 'Guru Tahfidz'

  doc.setFontSize(9)
  doc.text('Mengetahui,', 40, finalY + 10)
  doc.text('Wali Kelas', 40, finalY + 15)
  doc.text('ttd', 40, finalY + 25)
  doc.text(homeroom, 40, finalY + 35)

  doc.text('Guru Tahfidz', doc.internal.pageSize.width - 80, finalY + 15)
  doc.text('ttd', doc.internal.pageSize.width - 80, finalY + 25)
  doc.text(teacherName, doc.internal.pageSize.width - 80, finalY + 35)

  // Footer page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text('Tracking Tahfidz MAM! - Halaman ' + String(i) + ' dari ' + String(pageCount), 14, doc.internal.pageSize.height - 10)
  }

  doc.save(filename)
}
