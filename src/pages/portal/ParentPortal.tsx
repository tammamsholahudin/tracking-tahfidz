import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowLeft, Download, BookOpen, Search, Users, CheckCircle, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import styles from './ParentPortal.module.css'

// ── Types ──────────────────────────────────────────────
interface Student { id: string; name: string; class_id: string; }
interface ClassData { id: string; name: string; homeroom_teacher?: string; academic_year?: string; grade_level?: string; semester?: string; guru_id?: string; teacher_name_actual?: string; }
interface AttRecord { student_id: string; status: 'hadir' | 'izin' | 'sakit' | 'alpa'; meeting_id: string; }
interface MemRecord { student_id: string; surah_name: string; verse_start?: number | string; verse_end?: number | string; status?: string; note?: string; date?: string; created_at?: string; surat_selesai?: boolean; }
interface Target { id: string; class_id: string; surah: string; semester?: string; }

// ── Name normalization ──────────────────────────────────
function normalizeName(s: string) {
  return s.toLowerCase().trim().replace(/\s+/g, ' ')
}

// ── Format date ────────────────────────────────────────
function fmtDate(d?: string) {
  if (!d) return '-'
  try {
    return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return d }
}

// ── Circular Progress SVG ─────────────────────────────
function CircleProgress({ pct, size = 88, stroke = 8 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(pct, 100) / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8eff1" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#316342" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${circ}`} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className={styles.circleCenter}>
        <span className={styles.circlePct}>{pct}%</span>
      </div>
    </div>
  )
}

// ── PDF Export ─────────────────────────────────────────
async function generatePDF(student: Student, cls: ClassData, attData: {hadir:number;izin:number;sakit:number;alpa:number;total:number}, records: MemRecord[], targets: Target[], progressPct: number, teacherName: string) {
  // Dynamically import jsPDF and autoTable
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const doc = new jsPDF('portrait', 'mm', 'a4')
  const pw = doc.internal.pageSize.width
  const ph = doc.internal.pageSize.height
  const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  // ── Header bar ──
  doc.setFillColor(49, 99, 66)
  doc.rect(0, 0, pw, 28, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('Laporan Perkembangan Tahfidz', 14, 12)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Tahun Ajaran: ${cls.academic_year || '-'}`, 14, 19)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Tracking Tahfidz MAM!', pw - 14, 17, { align: 'right' })

  // ── Student identity block ──
  let y = 36
  // Avatar circle
  doc.setFillColor(74, 124, 89)
  doc.circle(24, y + 8, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  const initials = (student.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
  doc.text(initials, 24, y + 12, { align: 'center' })

  // Name + meta
  doc.setTextColor(22, 29, 31)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(student.name, 38, y + 2)
  
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(65, 73, 66)
  
  // Custom layout requested
  doc.text(`Kelas: ${cls.name}`, 38, y + 8)
  doc.text(`Wali Kelas: ${cls.homeroom_teacher || '-'}`, 38, y + 13)
  doc.text(`Guru Tahfidz: ${teacherName}`, 38, y + 18)
  doc.text(`Semester: ${cls.semester || 'Ganjil'}`, 38, y + 23)
  doc.text(`Tahun Ajaran: ${cls.academic_year || '-'}`, 38, y + 28)
  doc.text(`Tanggal Laporan: ${printDate}`, 38, y + 33)

  // Progress circle (right)
  const circX = pw - 30, circY = y + 12
  doc.setDrawColor(232, 239, 241)
  doc.setLineWidth(4)
  doc.circle(circX, circY, 14, 'D')
  doc.setDrawColor(49, 99, 66)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(49, 99, 66)
  doc.text(`${progressPct}%`, circX, circY + 3, { align: 'center' })
  doc.setFontSize(8)
  doc.setTextColor(65, 73, 66)
  doc.text('Target', circX, circY + 8, { align: 'center' })

  y += 40
  doc.setDrawColor(232, 239, 241)
  doc.setLineWidth(0.3)
  doc.line(14, y, pw - 14, y)

  // ── Stats row ──
  y += 8
  const cols = 4
  const colW = (pw - 28) / cols
  const stats = [
    { label: 'Hadir', value: String(attData.hadir), color: [22, 101, 52] as [number,number,number] },
    { label: 'Izin', value: String(attData.izin), color: [133, 77, 14] as [number,number,number] },
    { label: 'Sakit', value: String(attData.sakit), color: [30, 64, 175] as [number,number,number] },
    { label: 'Alpa', value: String(attData.alpa), color: [153, 27, 27] as [number,number,number] },
  ]
  stats.forEach((s, i) => {
    const sx = 14 + i * colW
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(sx, y, colW - 4, 20, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.setTextColor(...s.color)
    doc.text(s.value, sx + (colW - 4) / 2, y + 11, { align: 'center' })
    doc.setFontSize(8)
    doc.setTextColor(113, 121, 113)
    doc.text(s.label, sx + (colW - 4) / 2, y + 17, { align: 'center' })
  })

  y += 28
  doc.setDrawColor(232, 239, 241)
  doc.line(14, y, pw - 14, y)

  // ── Memorization history table ──
  y += 6
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(22, 29, 31)
  doc.setFillColor(49, 99, 66)
  doc.rect(14, y, 4, 10, 'F')
  doc.text('Riwayat Setoran Hafalan', 21, y + 8)
  y += 14

  const tableRows = records.slice(0, 20).map(r => [
    r.surah_name || '-',
    (r.verse_start && r.verse_end) ? `${r.verse_start}–${r.verse_end}` : (r.verse_start ? String(r.verse_start) : '-'),
    r.status === 'selesai' ? 'Selesai' : (r.status ? r.status : '-'),
    fmtDate(r.date || r.created_at),
    r.note || '-',
  ])

  if (tableRows.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(113, 121, 113)
    doc.text('Belum ada catatan setoran hafalan.', 14, y + 8)
    y += 18
  } else {
    autoTable(doc as any, {
      startY: y,
      head: [['Surat', 'Ayat', 'Status', 'Tanggal', 'Catatan']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [232, 239, 241], textColor: [65, 73, 66], fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
      bodyStyles: { fontSize: 9, cellPadding: 4, textColor: [22, 29, 31] },
      columnStyles: { 0: { fontStyle: 'bold' }, 4: { fontStyle: 'italic', textColor: [65, 73, 66] } },
      margin: { left: 14, right: 14 },
      alternateRowStyles: { fillColor: [244, 250, 253] },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Target Hafalan ──
  if (targets.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(22, 29, 31)
    doc.setFillColor(49, 99, 66)
    doc.rect(14, y, 4, 10, 'F')
    doc.text('Target Hafalan Kelas', 21, y + 8)
    y += 14
    autoTable(doc as any, {
      startY: y,
      head: [['Surat Target']],
      body: targets.map(t => [t.surah]),
      theme: 'grid',
      headStyles: { fillColor: [232, 239, 241], textColor: [65, 73, 66], fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
      bodyStyles: { fontSize: 9, cellPadding: 4, textColor: [22, 29, 31] },
      margin: { left: 14, right: 14 },
    })
    y = (doc as any).lastAutoTable.finalY + 8
  }

  // ── Footer ──
  const footerY = ph - 18
  doc.setDrawColor(193, 201, 191)
  doc.setLineWidth(0.3)
  doc.line(14, footerY - 4, pw - 14, footerY - 4)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(113, 121, 113)
  doc.text(`Dicetak otomatis oleh Tracking Tahfidz MAM! pada ${printDate}`, pw / 2, footerY, { align: 'center' })
  doc.setFont('helvetica', 'italic')
  doc.text('"Sebaik-baik kalian adalah yang mempelajari Al-Qur\'an dan mengajarkannya." (HR. Bukhari)', pw / 2, footerY + 5, { align: 'center' })

  doc.save(`Laporan_${student.name.replace(/\s+/g, '_')}.pdf`)
}

// ── Main Component ──────────────────────────────────────
export default function ParentPortal() {
  const { classId } = useParams<{ classId: string }>()

  const [cls, setCls] = useState<ClassData | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [targets, setTargets] = useState<Target[]>([])

  const [view, setView] = useState<'search' | 'multiple' | 'report'>('search')
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState<Student[]>([])
  const [selected, setSelected] = useState<Student | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [allAtt, setAllAtt] = useState<AttRecord[]>([])
  const [allMem, setAllMem] = useState<MemRecord[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load data from Supabase on mount
  useEffect(() => {
    async function fetchPortalData() {
      setLoadingData(true)
      try {
        const { data: clsData } = await supabase.from('school_classes').select('*').eq('id', classId).single()
        
        if (clsData) {
          const foundCls = clsData as ClassData
          
          if (foundCls.guru_id) {
            const { data: teacher } = await supabase.from('teachers').select('*').eq('id', foundCls.guru_id).single()
            if (teacher) {
              foundCls.teacher_name_actual = teacher.name
            }
          }
          setCls(foundCls)

          const { data: studentsData } = await supabase.from('students').select('*').eq('class_id', classId)
          if (studentsData) setStudents((studentsData as Student[]).filter(s => s.name))

          const activeSemester = foundCls.semester || 'Ganjil'
          const { data: targetsData } = await supabase.from('targets').select('*').eq('class_id', classId).eq('semester', activeSemester)
          if (targetsData) setTargets(targetsData as Target[])

          const { data: attData } = await supabase.from('attendance_records').select('*').eq('class_id', classId)
          if (attData) setAllAtt(attData as AttRecord[])

          const { data: memData } = await supabase.from('memorization_records').select('*').eq('class_id', classId)
          if (memData) setAllMem(memData as MemRecord[])
        }
      } catch (err) {
        console.error('Error fetching portal data:', err)
      } finally {
        setLoadingData(false)
      }
    }
    
    if (classId) {
      fetchPortalData()
    }
  }, [classId])

  function getStudentAtt(studentId: string) {
    return allAtt.filter(a => a.student_id === studentId)
  }
  function getStudentMem(studentId: string): MemRecord[] {
    return allMem.filter(m => m.student_id === studentId).sort((a, b) => {
      const da = new Date(a.date || a.created_at || 0).getTime()
      const db = new Date(b.date || b.created_at || 0).getTime()
      return db - da
    })
  }

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setNotFound(false)
    if (!query.trim()) return
    const q = normalizeName(query)
    const found = students.filter(s => normalizeName(s.name).includes(q))
    if (found.length === 0) {
      setNotFound(true)
    } else if (found.length === 1) {
      setSelected(found[0])
      setView('report')
    } else {
      setMatches(found)
      setView('multiple')
    }
  }

  if (loadingData) {
    return (
      <div className={styles.portalRoot} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Loader2 size={48} className="animate-spin" color="var(--clr-primary-600)" />
      </div>
    )
  }

  // ── Render: Class not found ──
  if (!cls) {
    return (
      <div className={styles.portalRoot}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.topbarLogo}>📖 Tracking Tahfidz MAM!</div>
            <div className={styles.topbarSub}>Portal Laporan Tahfidz</div>
          </div>
        </div>
        <div className={styles.searchPage}>
          <div className={styles.searchCard}>
            <div className={styles.searchIcon}>❌</div>
            <div className={styles.searchTitle}>Kelas Tidak Ditemukan</div>
            <p className={styles.searchSub}>Link portal ini tidak valid atau kelas sudah tidak aktif. Silakan hubungi Guru Tahfidz untuk mendapatkan link yang benar.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Search Form ──
  if (view === 'search') {
    return (
      <div className={styles.portalRoot}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.topbarLogo}>📖 Tracking Tahfidz MAM!</div>
            <div className={styles.topbarSub}>Portal Laporan Tahfidz</div>
          </div>
        </div>
        <div className={styles.searchPage}>
          <div className={styles.searchCard}>
            <div className={styles.searchIcon}>📋</div>
            <div className={styles.searchTitle}>Portal Laporan Tahfidz</div>
            <p className={styles.searchSub}>Masukkan nama lengkap anak Anda untuk melihat laporan perkembangan hafalan.</p>
            <div className={styles.classChip}>🏫 {cls.name}</div>

            <form className={styles.searchForm} onSubmit={handleSearch}>
              <div>
                <label className={styles.inputLabel} htmlFor="nama-anak">Nama Lengkap Anak</label>
                <input
                  id="nama-anak"
                  ref={inputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Contoh: Muhammad Ahmad Fauzi"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setNotFound(false) }}
                  autoFocus
                  autoComplete="off"
                />
              </div>
              {notFound && (
                <div className={styles.notFound}>
                  <span className={styles.notFoundIcon}>❌</span>
                  <div className={styles.notFoundText}>
                    <h4>Data siswa tidak ditemukan.</h4>
                    <p>Silakan cek kembali nama anak Anda. Jika masih mengalami kendala, silakan hubungi Guru Tahfidz.</p>
                  </div>
                </div>
              )}
              <button type="submit" className={styles.searchBtn} disabled={!query.trim()}>
                <Search size={16} /> Lihat Laporan
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Multiple matches ──
  if (view === 'multiple') {
    return (
      <div className={styles.portalRoot}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.topbarLogo}>📖 Tracking Tahfidz MAM!</div>
            <div className={styles.topbarSub}>Portal Laporan Tahfidz</div>
          </div>
        </div>
        <div className={styles.multiPage}>
          <div className={styles.multiCard}>
            <Users size={32} color="#316342" style={{ marginBottom: 12 }} />
            <div className={styles.multiTitle}>Pilih Siswa</div>
            <div className={styles.multiSub}>Ditemukan {matches.length} siswa dengan nama yang mirip. Pilih nama anak Anda:</div>
            <div className={styles.studentList}>
              {matches.map(s => (
                <div key={s.id} className={styles.studentChoice} onClick={() => { setSelected(s); setView('report') }}>
                  <div className={styles.choiceAvatar}>{(s.name || '?').charAt(0).toUpperCase()}</div>
                  <div>
                    <div className={styles.choiceName}>{s.name}</div>
                    <div className={styles.choiceClass}>{cls.name}</div>
                  </div>
                  <CheckCircle size={18} color="#c1c9bf" style={{ marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
            <button className={styles.backBtn} onClick={() => { setView('search'); setNotFound(false) }}>
              <ArrowLeft size={15} /> Kembali
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: Full Report ──
  if (view === 'report' && selected) {
    const stuAtt = getStudentAtt(selected.id)
    const stuMem = getStudentMem(selected.id)

    const attSummary = {
      hadir: stuAtt.filter(a => a.status === 'hadir').length,
      izin: stuAtt.filter(a => a.status === 'izin').length,
      sakit: stuAtt.filter(a => a.status === 'sakit').length,
      alpa: stuAtt.filter(a => a.status === 'alpa').length,
      total: stuAtt.length,
    }
    const attendancePct = attSummary.total > 0 ? Math.round((attSummary.hadir / attSummary.total) * 100) : 0

    // Progress: count surahs from targets that student has completed
    const targetSurahNames = targets.map(t => t.surah)
    const validRecords = stuMem.filter(m => 
      targetSurahNames.includes(m.surah_name) &&
      (m.surat_selesai === true || m.status === 'selesai')
    )
    const completedSurahs = new Set(validRecords.map(m => m.surah_name))
    const targetProgress = targets.length > 0 ? Math.round((completedSurahs.size / targets.length) * 100) : 0

    const teacherName = cls.teacher_name_actual || 'Guru Tahfidz'
    const printDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

    return (
      <div className={styles.portalRoot}>
        <div className={styles.topbar}>
          <div>
            <div className={styles.topbarLogo}>📖 Tracking Tahfidz MAM!</div>
            <div className={styles.topbarSub}>Portal Laporan Tahfidz</div>
          </div>
        </div>

        <div className={styles.reportPage}>
          {/* Action bar */}
          <div className={styles.reportHeader}>
            <div className={styles.reportHeaderLeft}>
              <button className={styles.reportBackBtn} onClick={() => { setView('search'); setQuery(''); setNotFound(false) }}>
                <ArrowLeft size={15} /> Cari Siswa Lain
              </button>
            </div>
            <button
              className={styles.downloadBtn}
              disabled={downloading}
              onClick={async () => {
                setDownloading(true)
                try {
                  await generatePDF(selected, cls, attSummary, stuMem, targets, targetProgress, teacherName)
                } catch (err) {
                  console.error('Failed to generate PDF:', err)
                  alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.')
                } finally {
                  setDownloading(false)
                }
              }}
            >
              <Download size={15} />
              {downloading ? 'Memproses...' : 'Download PDF'}
            </button>
          </div>

          {/* Main report card */}
          <div className={styles.reportCard}>
            {/* Green header */}
            <div className={styles.reportCardHeader}>
              <div className={styles.reportCardTitle}>Laporan Perkembangan Tahfidz</div>
              <div className={styles.reportCardPeriod}>Tahun Ajaran: {cls.academic_year || '-'}</div>
              <div className={styles.reportCardBrand}>Tracking Tahfidz MAM!</div>
            </div>

            {/* Identity block */}
            <div className={styles.identityBlock}>
              <div className={styles.identityLeft}>
                <div className={styles.studentAvatar}>
                  {(selected.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <div className={styles.studentName}>{selected.name}</div>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Kelas</span>
                      <span className={styles.infoValue}>{cls.name}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Wali Kelas</span>
                      <span className={styles.infoValue}>{cls.homeroom_teacher || '-'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Guru Tahfidz</span>
                      <span className={styles.infoValue}>{teacherName}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Semester</span>
                      <span className={styles.infoValue}>{cls.semester || 'Ganjil'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Tahun Ajaran</span>
                      <span className={styles.infoValue}>{cls.academic_year || '-'}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Tanggal Laporan</span>
                      <span className={styles.infoValue}>{printDate}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Circular Progress */}
              <div className={styles.circleWrap}>
                <CircleProgress pct={targetProgress} size={88} stroke={8} />
                <span className={styles.circleLabel}>Target Hafalan<br/>Kelas</span>
              </div>
            </div>

            {/* Stats row */}
            <div className={styles.statsGrid}>
              <div className={styles.statCell}>
                <div className={styles.statCellLabel}>Total Setoran</div>
                <div className={styles.statCellValue}>{stuMem.length}</div>
                <div className={styles.statCellSub}>catatan setoran</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statCellLabel}>Surat Selesai</div>
                <div className={styles.statCellValue}>{completedSurahs.size}</div>
                <div className={styles.statCellSub}>dari {targets.length} target</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statCellLabel}>Kehadiran</div>
                <div className={styles.statCellValue}>{attendancePct}%</div>
                <div className={styles.statCellSub}>{attSummary.hadir} dari {attSummary.total} pertemuan</div>
              </div>
              <div className={styles.statCell}>
                <div className={styles.statCellLabel}>Progress Target</div>
                <div className={styles.statCellValue}>{targetProgress}%</div>
                <div className={styles.statCellSub}>pencapaian target</div>
              </div>
            </div>

            {/* Absensi */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Rekap Absensi</div>
              <div className={styles.attGrid}>
                <div className={`${styles.attChip} ${styles.green}`}>
                  <span className={styles.attChipVal}>{attSummary.hadir}</span>
                  <span className={styles.attChipLabel}>Hadir</span>
                </div>
                <div className={`${styles.attChip} ${styles.yellow}`}>
                  <span className={styles.attChipVal}>{attSummary.izin}</span>
                  <span className={styles.attChipLabel}>Izin</span>
                </div>
                <div className={`${styles.attChip} ${styles.blue}`}>
                  <span className={styles.attChipVal}>{attSummary.sakit}</span>
                  <span className={styles.attChipLabel}>Sakit</span>
                </div>
                <div className={`${styles.attChip} ${styles.red}`}>
                  <span className={styles.attChipVal}>{attSummary.alpa}</span>
                  <span className={styles.attChipLabel}>Alpa</span>
                </div>
              </div>
            </div>

            {/* Memorization History */}
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Riwayat Setoran Hafalan</div>
              {stuMem.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}><BookOpen size={36} color="#c1c9bf" /></div>
                  <p>Belum ada catatan setoran hafalan.</p>
                </div>
              ) : (
                <div className={styles.timelineWrap}>
                  {stuMem.map((m, idx) => (
                    <div key={idx} className={styles.timelineItem}>
                      <div className={styles.timelineDot}></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineHeader}>
                          <div className={styles.timelineDate}>{fmtDate(m.date || m.created_at)}</div>
                          <span className={`${styles.badge} ${m.status === 'selesai' ? styles.selesai : styles.muroja}`}>
                            {m.status === 'selesai' ? 'Selesai' : (m.status || '-')}
                          </span>
                        </div>
                        <div className={styles.timelineTitle}>
                          <span className={styles.surahName}>{m.surah_name || '-'}</span>
                          <span className={styles.surahVerse}>
                            Ayat {m.verse_start && m.verse_end ? `${m.verse_start}–${m.verse_end}` : (m.verse_start ? String(m.verse_start) : '-')}
                          </span>
                        </div>
                        {m.note && (
                          <div className={styles.timelineNote}>
                            <span className={styles.noteText}>"{m.note}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Targets */}
            {targets.length > 0 && (
              <div className={styles.section}>
                <div className={styles.sectionTitle}>Target Hafalan Kelas</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {targets.map(t => {
                    const done = completedSurahs.has(t.surah)
                    return (
                      <span key={t.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 20,
                        background: done ? '#e1ffe5' : '#e8eff1',
                        color: done ? '#166534' : '#414942',
                        fontSize: 12, fontWeight: 600,
                        border: `1px solid ${done ? '#b9efc5' : '#c1c9bf'}`,
                      }}>
                        {done ? '✓' : '○'} {t.surah}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className={styles.reportFooter}>
              <div className={styles.reportFooterText}>
                Dicetak otomatis oleh Tracking Tahfidz MAM! pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <div className={styles.reportFooterHadith}>
                "Sebaik-baik kalian adalah yang mempelajari Al-Qur'an dan mengajarkannya." (HR. Bukhari)
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
