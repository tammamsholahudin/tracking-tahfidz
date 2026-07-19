// 114 Surat Al-Qur'an — Lengkap
export const SURAHS = [
  { number: 1,   name_arabic: 'الفاتحة',    name_latin: 'Al-Fatihah',   name_indonesian: 'Pembukaan',        total_verses: 7,   type: 'Makkiyah' },
  { number: 2,   name_arabic: 'البقرة',     name_latin: 'Al-Baqarah',   name_indonesian: 'Sapi Betina',      total_verses: 286, type: 'Madaniyah' },
  { number: 3,   name_arabic: 'آل عمران',   name_latin: 'Ali Imran',    name_indonesian: 'Keluarga Imran',   total_verses: 200, type: 'Madaniyah' },
  { number: 4,   name_arabic: 'النساء',     name_latin: 'An-Nisa',      name_indonesian: 'Perempuan',        total_verses: 176, type: 'Madaniyah' },
  { number: 5,   name_arabic: 'المائدة',    name_latin: 'Al-Maidah',    name_indonesian: 'Hidangan',         total_verses: 120, type: 'Madaniyah' },
  { number: 6,   name_arabic: 'الأنعام',    name_latin: 'Al-Anam',      name_indonesian: 'Binatang Ternak',  total_verses: 165, type: 'Makkiyah' },
  { number: 7,   name_arabic: 'الأعراف',    name_latin: 'Al-Araf',      name_indonesian: 'Tempat Tertinggi', total_verses: 206, type: 'Makkiyah' },
  { number: 8,   name_arabic: 'الأنفال',    name_latin: 'Al-Anfal',     name_indonesian: 'Rampasan Perang',  total_verses: 75,  type: 'Madaniyah' },
  { number: 9,   name_arabic: 'التوبة',     name_latin: 'At-Taubah',    name_indonesian: 'Pengampunan',      total_verses: 129, type: 'Madaniyah' },
  { number: 10,  name_arabic: 'يونس',       name_latin: 'Yunus',        name_indonesian: 'Nabi Yunus',       total_verses: 109, type: 'Makkiyah' },
  { number: 11,  name_arabic: 'هود',        name_latin: 'Hud',          name_indonesian: 'Nabi Hud',         total_verses: 123, type: 'Makkiyah' },
  { number: 12,  name_arabic: 'يوسف',       name_latin: 'Yusuf',        name_indonesian: 'Nabi Yusuf',       total_verses: 111, type: 'Makkiyah' },
  { number: 13,  name_arabic: 'الرعد',      name_latin: 'Ar-Rad',       name_indonesian: 'Guruh',            total_verses: 43,  type: 'Madaniyah' },
  { number: 14,  name_arabic: 'إبراهيم',    name_latin: 'Ibrahim',      name_indonesian: 'Nabi Ibrahim',     total_verses: 52,  type: 'Makkiyah' },
  { number: 15,  name_arabic: 'الحجر',      name_latin: 'Al-Hijr',      name_indonesian: 'Daerah Hijr',      total_verses: 99,  type: 'Makkiyah' },
  { number: 16,  name_arabic: 'النحل',      name_latin: 'An-Nahl',      name_indonesian: 'Lebah',            total_verses: 128, type: 'Makkiyah' },
  { number: 17,  name_arabic: 'الإسراء',    name_latin: 'Al-Isra',      name_indonesian: 'Perjalanan Malam', total_verses: 111, type: 'Makkiyah' },
  { number: 18,  name_arabic: 'الكهف',      name_latin: 'Al-Kahf',      name_indonesian: 'Goa',              total_verses: 110, type: 'Makkiyah' },
  { number: 19,  name_arabic: 'مريم',       name_latin: 'Maryam',       name_indonesian: 'Maryam',           total_verses: 98,  type: 'Makkiyah' },
  { number: 20,  name_arabic: 'طه',         name_latin: 'Ta-Ha',        name_indonesian: 'Ta Ha',            total_verses: 135, type: 'Makkiyah' },
  { number: 21,  name_arabic: 'الأنبياء',   name_latin: 'Al-Anbiya',    name_indonesian: 'Para Nabi',        total_verses: 112, type: 'Makkiyah' },
  { number: 22,  name_arabic: 'الحج',       name_latin: 'Al-Hajj',      name_indonesian: 'Haji',             total_verses: 78,  type: 'Madaniyah' },
  { number: 23,  name_arabic: 'المؤمنون',   name_latin: 'Al-Muminun',   name_indonesian: 'Orang Beriman',    total_verses: 118, type: 'Makkiyah' },
  { number: 24,  name_arabic: 'النور',      name_latin: 'An-Nur',       name_indonesian: 'Cahaya',           total_verses: 64,  type: 'Madaniyah' },
  { number: 25,  name_arabic: 'الفرقان',    name_latin: 'Al-Furqan',    name_indonesian: 'Pembeda',          total_verses: 77,  type: 'Makkiyah' },
  { number: 26,  name_arabic: 'الشعراء',    name_latin: 'Asy-Syuara',   name_indonesian: 'Para Penyair',     total_verses: 227, type: 'Makkiyah' },
  { number: 27,  name_arabic: 'النمل',      name_latin: 'An-Naml',      name_indonesian: 'Semut',            total_verses: 93,  type: 'Makkiyah' },
  { number: 28,  name_arabic: 'القصص',      name_latin: 'Al-Qasas',     name_indonesian: 'Kisah',            total_verses: 88,  type: 'Makkiyah' },
  { number: 29,  name_arabic: 'العنكبوت',   name_latin: 'Al-Ankabut',   name_indonesian: 'Laba-Laba',        total_verses: 69,  type: 'Makkiyah' },
  { number: 30,  name_arabic: 'الروم',      name_latin: 'Ar-Rum',       name_indonesian: 'Romawi',           total_verses: 60,  type: 'Makkiyah' },
  { number: 31,  name_arabic: 'لقمان',      name_latin: 'Luqman',       name_indonesian: 'Luqman',           total_verses: 34,  type: 'Makkiyah' },
  { number: 32,  name_arabic: 'السجدة',     name_latin: 'As-Sajdah',    name_indonesian: 'Sujud',            total_verses: 30,  type: 'Makkiyah' },
  { number: 33,  name_arabic: 'الأحزاب',    name_latin: 'Al-Ahzab',     name_indonesian: 'Golongan Bersekutu',total_verses: 73, type: 'Madaniyah' },
  { number: 34,  name_arabic: 'سبأ',        name_latin: 'Saba',         name_indonesian: 'Kaum Saba',        total_verses: 54,  type: 'Makkiyah' },
  { number: 35,  name_arabic: 'فاطر',       name_latin: 'Fatir',        name_indonesian: 'Pencipta',         total_verses: 45,  type: 'Makkiyah' },
  { number: 36,  name_arabic: 'يس',         name_latin: 'Ya-Sin',       name_indonesian: 'Ya Sin',           total_verses: 83,  type: 'Makkiyah' },
  { number: 37,  name_arabic: 'الصافات',    name_latin: 'As-Saffat',    name_indonesian: 'Yang Bershaf-shaf',total_verses: 182, type: 'Makkiyah' },
  { number: 38,  name_arabic: 'ص',          name_latin: 'Sad',          name_indonesian: 'Sad',              total_verses: 88,  type: 'Makkiyah' },
  { number: 39,  name_arabic: 'الزمر',      name_latin: 'Az-Zumar',     name_indonesian: 'Rombongan',        total_verses: 75,  type: 'Makkiyah' },
  { number: 40,  name_arabic: 'غافر',       name_latin: 'Ghafir',       name_indonesian: 'Maha Pengampun',   total_verses: 85,  type: 'Makkiyah' },
  { number: 41,  name_arabic: 'فصلت',       name_latin: 'Fussilat',     name_indonesian: 'Dijelaskan',       total_verses: 54,  type: 'Makkiyah' },
  { number: 42,  name_arabic: 'الشورى',     name_latin: 'Asy-Syura',    name_indonesian: 'Musyawarah',       total_verses: 53,  type: 'Makkiyah' },
  { number: 43,  name_arabic: 'الزخرف',     name_latin: 'Az-Zukhruf',   name_indonesian: 'Perhiasan',        total_verses: 89,  type: 'Makkiyah' },
  { number: 44,  name_arabic: 'الدخان',     name_latin: 'Ad-Dukhan',    name_indonesian: 'Kabut',            total_verses: 59,  type: 'Makkiyah' },
  { number: 45,  name_arabic: 'الجاثية',    name_latin: 'Al-Jatsiyah',  name_indonesian: 'Berlutut',         total_verses: 37,  type: 'Makkiyah' },
  { number: 46,  name_arabic: 'الأحقاف',    name_latin: 'Al-Ahqaf',     name_indonesian: 'Bukit Pasir',      total_verses: 35,  type: 'Makkiyah' },
  { number: 47,  name_arabic: 'محمد',       name_latin: 'Muhammad',     name_indonesian: 'Nabi Muhammad',    total_verses: 38,  type: 'Madaniyah' },
  { number: 48,  name_arabic: 'الفتح',      name_latin: 'Al-Fath',      name_indonesian: 'Kemenangan',       total_verses: 29,  type: 'Madaniyah' },
  { number: 49,  name_arabic: 'الحجرات',    name_latin: 'Al-Hujurat',   name_indonesian: 'Kamar-Kamar',      total_verses: 18,  type: 'Madaniyah' },
  { number: 50,  name_arabic: 'ق',          name_latin: 'Qaf',          name_indonesian: 'Qaf',              total_verses: 45,  type: 'Makkiyah' },
  { number: 51,  name_arabic: 'الذاريات',   name_latin: 'Az-Zariyat',   name_indonesian: 'Angin yang Menerbangkan', total_verses: 60, type: 'Makkiyah' },
  { number: 52,  name_arabic: 'الطور',      name_latin: 'At-Tur',       name_indonesian: 'Gunung',           total_verses: 49,  type: 'Makkiyah' },
  { number: 53,  name_arabic: 'النجم',      name_latin: 'An-Najm',      name_indonesian: 'Bintang',          total_verses: 62,  type: 'Makkiyah' },
  { number: 54,  name_arabic: 'القمر',      name_latin: 'Al-Qamar',     name_indonesian: 'Bulan',            total_verses: 55,  type: 'Makkiyah' },
  { number: 55,  name_arabic: 'الرحمن',     name_latin: 'Ar-Rahman',    name_indonesian: 'Yang Maha Pengasih',total_verses: 78, type: 'Madaniyah' },
  { number: 56,  name_arabic: 'الواقعة',    name_latin: 'Al-Waqiah',    name_indonesian: 'Hari Kiamat',      total_verses: 96,  type: 'Makkiyah' },
  { number: 57,  name_arabic: 'الحديد',     name_latin: 'Al-Hadid',     name_indonesian: 'Besi',             total_verses: 29,  type: 'Madaniyah' },
  { number: 58,  name_arabic: 'المجادلة',   name_latin: 'Al-Mujadilah', name_indonesian: 'Wanita yang Mengajukan Gugatan', total_verses: 22, type: 'Madaniyah' },
  { number: 59,  name_arabic: 'الحشر',      name_latin: 'Al-Hasyr',     name_indonesian: 'Pengusiran',       total_verses: 24,  type: 'Madaniyah' },
  { number: 60,  name_arabic: 'الممتحنة',   name_latin: 'Al-Mumtahanah',name_indonesian: 'Perempuan yang Diuji', total_verses: 13, type: 'Madaniyah' },
  { number: 61,  name_arabic: 'الصف',       name_latin: 'As-Saf',       name_indonesian: 'Barisan',          total_verses: 14,  type: 'Madaniyah' },
  { number: 62,  name_arabic: 'الجمعة',     name_latin: 'Al-Jumuah',    name_indonesian: 'Jumat',            total_verses: 11,  type: 'Madaniyah' },
  { number: 63,  name_arabic: 'المنافقون',  name_latin: 'Al-Munafiqun', name_indonesian: 'Orang Munafik',    total_verses: 11,  type: 'Madaniyah' },
  { number: 64,  name_arabic: 'التغابن',    name_latin: 'At-Tagabun',   name_indonesian: 'Hari Dinampakkan', total_verses: 18,  type: 'Madaniyah' },
  { number: 65,  name_arabic: 'الطلاق',     name_latin: 'At-Talaq',     name_indonesian: 'Talak',            total_verses: 12,  type: 'Madaniyah' },
  { number: 66,  name_arabic: 'التحريم',    name_latin: 'At-Tahrim',    name_indonesian: 'Mengharamkan',     total_verses: 12,  type: 'Madaniyah' },
  { number: 67,  name_arabic: 'الملك',      name_latin: 'Al-Mulk',      name_indonesian: 'Kerajaan',         total_verses: 30,  type: 'Makkiyah' },
  { number: 68,  name_arabic: 'القلم',      name_latin: 'Al-Qalam',     name_indonesian: 'Pena',             total_verses: 52,  type: 'Makkiyah' },
  { number: 69,  name_arabic: 'الحاقة',     name_latin: 'Al-Haqqah',    name_indonesian: 'Hari Kiamat',      total_verses: 52,  type: 'Makkiyah' },
  { number: 70,  name_arabic: 'المعارج',    name_latin: "Al-Ma'arij",   name_indonesian: 'Tempat Naik',      total_verses: 44,  type: 'Makkiyah' },
  { number: 71,  name_arabic: 'نوح',        name_latin: 'Nuh',          name_indonesian: 'Nabi Nuh',         total_verses: 28,  type: 'Makkiyah' },
  { number: 72,  name_arabic: 'الجن',       name_latin: 'Al-Jin',       name_indonesian: 'Jin',              total_verses: 28,  type: 'Makkiyah' },
  { number: 73,  name_arabic: 'المزمل',     name_latin: 'Al-Muzzammil', name_indonesian: 'Orang yang Berselimut', total_verses: 20, type: 'Makkiyah' },
  { number: 74,  name_arabic: 'المدثر',     name_latin: 'Al-Muddaththir',name_indonesian: 'Orang Berkemul',  total_verses: 56,  type: 'Makkiyah' },
  { number: 75,  name_arabic: 'القيامة',    name_latin: 'Al-Qiyamah',   name_indonesian: 'Hari Kiamat',      total_verses: 40,  type: 'Makkiyah' },
  { number: 76,  name_arabic: 'الإنسان',    name_latin: 'Al-Insan',     name_indonesian: 'Manusia',          total_verses: 31,  type: 'Madaniyah' },
  { number: 77,  name_arabic: 'المرسلات',   name_latin: 'Al-Mursalat',  name_indonesian: 'Yang Diutus',      total_verses: 50,  type: 'Makkiyah' },
  { number: 78,  name_arabic: 'النبأ',      name_latin: "An-Naba'",     name_indonesian: 'Berita Besar',     total_verses: 40,  type: 'Makkiyah' },
  { number: 79,  name_arabic: 'النازعات',   name_latin: "An-Nazi'at",   name_indonesian: 'Yang Mencabut',    total_verses: 46,  type: 'Makkiyah' },
  { number: 80,  name_arabic: 'عبس',        name_latin: 'Abasa',        name_indonesian: 'Bermuka Masam',    total_verses: 42,  type: 'Makkiyah' },
  { number: 81,  name_arabic: 'التكوير',    name_latin: 'At-Takwir',    name_indonesian: 'Menggulung',       total_verses: 29,  type: 'Makkiyah' },
  { number: 82,  name_arabic: 'الانفطار',   name_latin: 'Al-Infitar',   name_indonesian: 'Terbelah',         total_verses: 19,  type: 'Makkiyah' },
  { number: 83,  name_arabic: 'المطففين',   name_latin: 'Al-Mutaffifin',name_indonesian: 'Orang yang Curang',total_verses: 36,  type: 'Makkiyah' },
  { number: 84,  name_arabic: 'الانشقاق',   name_latin: 'Al-Insyiqaq',  name_indonesian: 'Terbelah',         total_verses: 25,  type: 'Makkiyah' },
  { number: 85,  name_arabic: 'البروج',     name_latin: 'Al-Buruj',     name_indonesian: 'Gugusan Bintang',  total_verses: 22,  type: 'Makkiyah' },
  { number: 86,  name_arabic: 'الطارق',     name_latin: 'At-Tariq',     name_indonesian: 'Yang Datang Malam',total_verses: 17,  type: 'Makkiyah' },
  { number: 87,  name_arabic: 'الأعلى',     name_latin: 'Al-Ala',       name_indonesian: 'Yang Paling Tinggi',total_verses: 19, type: 'Makkiyah' },
  { number: 88,  name_arabic: 'الغاشية',    name_latin: 'Al-Ghasyiyah', name_indonesian: 'Hari Pembalasan',  total_verses: 26,  type: 'Makkiyah' },
  { number: 89,  name_arabic: 'الفجر',      name_latin: 'Al-Fajr',      name_indonesian: 'Fajar',            total_verses: 30,  type: 'Makkiyah' },
  { number: 90,  name_arabic: 'البلد',      name_latin: 'Al-Balad',     name_indonesian: 'Negeri',           total_verses: 20,  type: 'Makkiyah' },
  { number: 91,  name_arabic: 'الشمس',      name_latin: 'Asy-Syams',    name_indonesian: 'Matahari',         total_verses: 15,  type: 'Makkiyah' },
  { number: 92,  name_arabic: 'الليل',      name_latin: 'Al-Lail',      name_indonesian: 'Malam',            total_verses: 21,  type: 'Makkiyah' },
  { number: 93,  name_arabic: 'الضحى',      name_latin: 'Ad-Duha',      name_indonesian: 'Waktu Dhuha',      total_verses: 11,  type: 'Makkiyah' },
  { number: 94,  name_arabic: 'الشرح',      name_latin: 'Asy-Syarh',    name_indonesian: 'Melapangkan',      total_verses: 8,   type: 'Makkiyah' },
  { number: 95,  name_arabic: 'التين',      name_latin: 'At-Tin',       name_indonesian: 'Buah Tin',         total_verses: 8,   type: 'Makkiyah' },
  { number: 96,  name_arabic: 'العلق',      name_latin: 'Al-Alaq',      name_indonesian: 'Segumpal Darah',   total_verses: 19,  type: 'Makkiyah' },
  { number: 97,  name_arabic: 'القدر',      name_latin: 'Al-Qadr',      name_indonesian: 'Kemuliaan',        total_verses: 5,   type: 'Makkiyah' },
  { number: 98,  name_arabic: 'البينة',     name_latin: 'Al-Bayyinah',  name_indonesian: 'Bukti Nyata',      total_verses: 8,   type: 'Madaniyah' },
  { number: 99,  name_arabic: 'الزلزلة',    name_latin: 'Az-Zalzalah',  name_indonesian: 'Goncangan',        total_verses: 8,   type: 'Madaniyah' },
  { number: 100, name_arabic: 'العاديات',   name_latin: "Al-'Adiyat",   name_indonesian: 'Kuda Perang',      total_verses: 11,  type: 'Makkiyah' },
  { number: 101, name_arabic: 'القارعة',    name_latin: "Al-Qari'ah",   name_indonesian: 'Hari Kiamat',      total_verses: 11,  type: 'Makkiyah' },
  { number: 102, name_arabic: 'التكاثر',    name_latin: 'At-Takatsur',  name_indonesian: 'Bermegah-Megahan', total_verses: 8,   type: 'Makkiyah' },
  { number: 103, name_arabic: 'العصر',      name_latin: 'Al-Asr',       name_indonesian: 'Masa',             total_verses: 3,   type: 'Makkiyah' },
  { number: 104, name_arabic: 'الهمزة',     name_latin: 'Al-Humazah',   name_indonesian: 'Pengumpat',        total_verses: 9,   type: 'Makkiyah' },
  { number: 105, name_arabic: 'الفيل',      name_latin: 'Al-Fil',       name_indonesian: 'Gajah',            total_verses: 5,   type: 'Makkiyah' },
  { number: 106, name_arabic: 'قريش',       name_latin: 'Quraisy',      name_indonesian: 'Suku Quraisy',     total_verses: 4,   type: 'Makkiyah' },
  { number: 107, name_arabic: 'الماعون',    name_latin: "Al-Ma'un",     name_indonesian: 'Barang yang Berguna',total_verses: 7, type: 'Makkiyah' },
  { number: 108, name_arabic: 'الكوثر',     name_latin: 'Al-Kautsar',   name_indonesian: 'Nikmat yang Banyak',total_verses: 3,  type: 'Makkiyah' },
  { number: 109, name_arabic: 'الكافرون',   name_latin: 'Al-Kafirun',   name_indonesian: 'Orang Kafir',      total_verses: 6,   type: 'Makkiyah' },
  { number: 110, name_arabic: 'النصر',      name_latin: 'An-Nasr',      name_indonesian: 'Pertolongan',      total_verses: 3,   type: 'Madaniyah' },
  { number: 111, name_arabic: 'المسد',      name_latin: 'Al-Masad',     name_indonesian: 'Sabut',            total_verses: 5,   type: 'Makkiyah' },
  { number: 112, name_arabic: 'الإخلاص',    name_latin: 'Al-Ikhlas',    name_indonesian: 'Ikhlas',           total_verses: 4,   type: 'Makkiyah' },
  { number: 113, name_arabic: 'الفلق',      name_latin: 'Al-Falaq',     name_indonesian: 'Waktu Subuh',      total_verses: 5,   type: 'Makkiyah' },
  { number: 114, name_arabic: 'الناس',      name_latin: 'An-Nas',       name_indonesian: 'Manusia',          total_verses: 6,   type: 'Makkiyah' },
] as const

export type Surah = typeof SURAHS[number]

export function getSurahByNumber(number: number) {
  return SURAHS.find(s => s.number === number)
}

export function searchSurahs(query: string) {
  const q = query.toLowerCase()
  return SURAHS.filter(s =>
    s.name_latin.toLowerCase().includes(q) ||
    s.name_indonesian.toLowerCase().includes(q) ||
    s.name_arabic.includes(query) ||
    s.number.toString().includes(q)
  )
}

export function getVerseOptions(surahNumber: number): number[] {
  const surah = getSurahByNumber(surahNumber)
  if (!surah) return []
  return Array.from({ length: surah.total_verses }, (_, i) => i + 1)
}

export const HARI = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export function formatTanggal(date: Date): string {
  return `${HARI[date.getDay()]}, ${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`
}

export function formatWaktu(date: Date): string {
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
