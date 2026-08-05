import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getSettings } from '@/store/settingsStore'
import { useAuthStore } from '@/store/authStore'
import { getSync } from '@/lib/db'

export function exportAttendancePDF(data: any[], classData: any, filename = 'Laporan_Absensi.pdf', meetingsData: any[] = [], returnBlob = false) {
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
  let finalY = (doc as any).lastAutoTable?.finalY || 60
  
  // --- JURNAL PERTEMUAN SECTION ---
  if (meetingsData && meetingsData.length > 0) {
    doc.addPage()
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('JURNAL MENGAJAR (CATATAN PERTEMUAN)', 14, 20)
    doc.setLineWidth(0.5)
    doc.line(14, 23, doc.internal.pageSize.width - 14, 23)
    
    let jY = 35
    meetingsData.forEach((m: any, idx: number) => {
      // Check page break
      if (jY > doc.internal.pageSize.height - 40) {
        doc.addPage()
        jY = 20
      }
      
      const mDate = new Date(m.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text(`Pertemuan ${meetingsData.length - idx} - ${mDate}`, 14, jY)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const summaryText = m.summary || m.notes || '-'
      // Split text to fit page width
      const splitText = doc.splitTextToSize(summaryText, doc.internal.pageSize.width - 28)
      doc.text(splitText, 14, jY + 6)
      
      jY += 6 + (splitText.length * 4) + 10 // Add spacing for next item
    })
    
    finalY = jY
  }

  // Ensure enough space for signature
  if (finalY + 40 > doc.internal.pageSize.height) {
    doc.addPage()
    finalY = 20
  }

  const printDate = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(`Cetak: ${printDate}`, 14, finalY + 15)

  doc.text('Mengetahui,', 40, finalY + 20)
  doc.text('Wali Kelas', 40, finalY + 25)
  doc.text('ttd', 40, finalY + 35)
  doc.text(homeroom, 40, finalY + 45)

  const teacherNameSign = useAuthStore.getState().profile?.name || 'Guru Tahfidz'
  doc.text('Guru Tahfidz', doc.internal.pageSize.width - 80, finalY + 25)
  doc.text('ttd', doc.internal.pageSize.width - 80, finalY + 35)
  doc.text(teacherNameSign, doc.internal.pageSize.width - 80, finalY + 45)

  // Footer page numbers
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Halaman ${i} dari ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10)
  }

  if (returnBlob) return doc.output('blob')
  doc.save(filename)
}

export function exportProgressPDF(data: any[], classData: any, filename = 'Laporan_Progress_Hafalan.pdf', returnBlob = false) {
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

  if (returnBlob) return doc.output('blob')
  doc.save(filename)
}

export function exportJournalPDF(meetings: any[], students: any[], allAtt: any[], allMem: any[], classData: any, filename: string, returnBlob = false) {
  const doc = new jsPDF()
  const { institutionName: instName, institutionSubtitle: instSub } = getSettings()
  const homeroom = getSync('tahfidz_users').find((u: any) => u.id === classData.wali_kelas_id)?.name || 'Wali Kelas'
  const teacherName = useAuthStore.getState().profile?.name || 'Guru Tahfidz'
  const academicYear = '2026/2027'

  if (meetings.length === 0) {
    doc.text("Tidak ada data jurnal", 14, 20)
    doc.save(filename)
    return
  }

  meetings.forEach((m, index) => {
    if (index > 0) doc.addPage()
    
    // Header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(instName, 14, 15)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(instSub, 14, 20)
    doc.setLineWidth(0.5)
    doc.line(14, 23, doc.internal.pageSize.width - 14, 23)

    // Title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('JURNAL PEMBELAJARAN TAHFIDZ', doc.internal.pageSize.width / 2, 33, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    
    // Left col
    doc.text(`Nama Sekolah : ${instName}`, 14, 45)
    doc.text(`Tahun Ajaran : ${academicYear}`, 14, 50)
    doc.text(`Semester     : Semua`, 14, 55)
    doc.text(`Kelas        : ${classData.name}`, 14, 60)
    doc.text(`Guru         : ${teacherName}`, 14, 65)
    
    // Right col
    const dateStr = new Date(m.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    doc.text(`Hari/Tanggal : ${dateStr}`, 110, 45)
    doc.text(`Jam          : ..........................`, 110, 50)
    doc.text(`Materi       : Tahfidz / Murojaah`, 110, 55)
    doc.text(`Pertemuan Ke : ${meetings.length - index}`, 110, 60)

    // Jurnal Fields
    let startY = 75
    doc.setFont('helvetica', 'bold')
    doc.text('I. RENCANA & PELAKSANAAN PEMBELAJARAN', 14, startY)
    doc.setFont('helvetica', 'normal')
    
    const lines = [
      'Tujuan Pembelajaran : ....................................................................................................................',
      'Metode              : Talaqqi / Murojaah / Tasmi / .......................................................................',
      'Kegiatan            : ....................................................................................................................',
      'Evaluasi            : ....................................................................................................................',
      'Kendala             : ....................................................................................................................',
      'Catatan Guru        : ' + (m.summary || '....................................................................................................................'),
      'Target Berikutnya   : ....................................................................................................................'
    ]
    
    startY += 8
    lines.forEach(l => {
      doc.text(l, 14, startY)
      startY += 8
    })

    // Rekapitulasi
    startY += 5
    doc.setFont('helvetica', 'bold')
    doc.text('II. REKAPITULASI PERTEMUAN', 14, startY)
    doc.setFont('helvetica', 'normal')
    
    const mAtt = allAtt.filter(a => a.meeting_id === m.id)
    const hadir = mAtt.filter(a => a.status === 'hadir').length
    const izin = mAtt.filter(a => a.status === 'izin').length
    const sakit = mAtt.filter(a => a.status === 'sakit').length
    const alpa = mAtt.filter(a => a.status === 'alpa').length
    const setoranCount = allMem.filter(mem => mem.class_id === classData.id && new Date(mem.created_at || mem.date).toDateString() === new Date(m.date).toDateString()).length

    startY += 8
    doc.text(`Total Siswa   : ${students.length}`, 14, startY)
    doc.text(`Hadir : ${hadir}`, 60, startY)
    doc.text(`Izin : ${izin}`, 80, startY)
    doc.text(`Sakit : ${sakit}`, 100, startY)
    doc.text(`Alpa : ${alpa}`, 120, startY)
    doc.text(`Jumlah Setoran: ${setoranCount}`, 140, startY)

    // Signatures
    let finalY = startY + 25
    doc.text('Mengetahui,', 40, finalY)
    doc.text('Wali Kelas', 40, finalY + 5)
    doc.text('ttd', 40, finalY + 20)
    doc.text(homeroom, 35, finalY + 30)

    doc.text('Guru Tahfidz', doc.internal.pageSize.width - 70, finalY + 5)
    doc.text('ttd', doc.internal.pageSize.width - 65, finalY + 20)
    doc.text(teacherName, doc.internal.pageSize.width - 75, finalY + 30)

    // Footer
    doc.setFontSize(8)
    doc.text(`Tracking Tahfidz MAM! - Dicetak: ${new Date().toLocaleDateString('id-ID')}`, 14, doc.internal.pageSize.height - 10)
  })
  if (returnBlob) return doc.output('blob')
  doc.save(filename)
}
