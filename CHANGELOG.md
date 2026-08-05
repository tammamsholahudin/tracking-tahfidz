# Changelog

## v1.2.0 (5 Agustus 2026)
- **Feat**: Redesign UI untuk alur kerja guru, menambahkan menu Arsip Pertemuan.
- **Feat**: Tab Laporan kini hanya memuat tombol Ekspor.
- **Feat**: Menambahkan ekspor Laporan Jurnal Pembelajaran (Excel dan multi-page PDF).
- **Feat**: Menstandarkan penamaan file laporan ekspor (`Laporan - Jenis - Kelas - TA - Tanggal`).
- **Refactor**: Menghilangkan tab Absensi dan Setoran Hafalan yang redundan dari Dashboard Kelas utama.

Semua catatan perubahan dari versi ke versi.

## Version 1.1 (5 Agustus 2026)

Pembaruan besar (Production Release) yang memuat perbaikan antarmuka, penambahan fitur administratif, dan pengamanan database.

### Fitur Baru & Peningkatan
- **Dashboard Analytics**: Penambahan _sorting_ untuk melihat daftar "Hafalan Terbanyak", "Hafalan Tersedikit", "Paling Banyak Diulangi", "Juz Tertinggi", serta "Kehadiran Terbaik" dan "Kehadiran Terburuk".
- **Laporan PDF & Excel**: Menambahkan fitur ekspor format PDF dan Excel untuk Jurnal Pembelajaran Kelas di laman Laporan/Jurnal.
- **Progress Hafalan (Advanced)**: Detail progress siswa kini mencakup informasi Surat Tertinggi, Juz Tertinggi, Ayat Terakhir yang dihafal, dan Total Ayat yang diselesaikan.
- **Master Data (Recovery Data)**: Modul Admin baru untuk mendeteksi data _orphan_ (yatim piatu) seperti absensi atau hafalan yang kehilangan kelas induknya, dan menyediakan fitur _1-click Restore_.
- **Recycle Bin**: Menyempurnakan pemulihan data dan penghapusan permanen dengan retensi otomatis 30 hari.
- **Role Wali Kelas**: Mengunci fungsi ubah/hapus (Read-Only) khusus untuk _role_ Wali Kelas pada daftar hadir, _progress_, dan laporan.
- **RLS Supabase**: Skrip sekuriti di _database_ yang secara ketat membatasi modifikasi row berdasarkan profil autentikasi (Admin/Guru/Wali Kelas).
- **Dashboard Default Day**: Tab jadwal secara _default_ difokuskan ke hari ini (Day View).

### Perbaikan Bug (Bug Fixes)
- **Perbaikan Dashboard**: Memperbaiki sintaks JSX Fragment yang mencegah antarmuka _Class Dashboard_ ter-render sempurna.
- **Perbaikan Responsive Mobile**: Grid kalender pada mode _Week View_ kini tidak lagi bertumpuk/menciut, melainkan menggunakan _horizontal scroll_ agar nyaman dibaca di layar kecil.
- **Auto-Restore Berbahaya**: Menghapus mekanisme _Auto Restore_ pada `AppLayout.tsx` yang rentan merusak dan menduplikasi data secara masif pada inisialisasi aplikasi.
- **TypeScript Errors**: Resolusi berbagai error _TypeScript_ (seperti `entityType` dan `Database` missing import) agar proses _build_ (CI/CD) Vercel berjalan lancar tanpa terhenti.
- **Optimasi Performa**: Membersihkan kode _redundant_ dan memastikan fungsi-fungsi impor tidak bertumpuk berulang.

### Lain-lain
- Penyesuaian antarmuka untuk fitur Portal Wali Murid.
- _Cloud First Sync_ dengan antrian sinkronisasi offline (Offline Queue) yang lebih stabil.
- Sinkronisasi _backup database_ ke penyimpanan _local state_ yang diamankan.
