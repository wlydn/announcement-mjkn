# 🔊 Sistem Pengumuman Otomatis

Aplikasi web untuk memutar pengumuman audio secara otomatis dengan dukungan jadwal waktu shalat. Dibangun dengan React dan Next.js, menggunakan **Vercel Blob Storage** untuk penyimpanan file audio.

## ✨ Fitur Utama

- 🎵 **Upload & Putar Audio**: Upload file MP3, WAV, OGG, M4A hingga 50MB
- ⏰ **Jadwal Otomatis**: Putar pengumuman dengan interval yang dapat diatur (15, 30, 60 menit)
- 🕌 **Integrasi Waktu Shalat**: Otomatis pause selama waktu shalat berdasarkan lokasi GPS
- 🌐 **Responsive Design**: Dapat diakses dari desktop dan mobile
- ☁️ **Cloud Storage**: Menggunakan Vercel Blob Storage untuk reliabilitas tinggi
- 🔄 **Auto-loop**: Putar pengumuman secara berulang dengan countdown timer

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd announcement-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
```bash
# Copy template environment file
cp .env.local.example .env.local

# Edit .env.local dan isi dengan token Vercel Blob Anda
# BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### 4. Dapatkan Vercel Blob Token
Lihat panduan lengkap di [VERCEL_BLOB_SETUP.md](./VERCEL_BLOB_SETUP.md)

### 5. Jalankan Development Server
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## 📋 Available Scripts

### Development
- `npm run dev` - Jalankan development server
- `npm run react-start` - Jalankan React development server
- `npm test` - Jalankan test suite

### Production
- `npm run build` - Build aplikasi untuk production
- `npm start` - Jalankan production server
- `npm run server` - Alias untuk npm start

### Maintenance
- `npm run cleanup-blob` - Bersihkan file lama dari Vercel Blob Storage
- `npm run lint` - Jalankan ESLint

## 🏗️ Arsitektur

```
announcement-app/
├── pages/api/          # Next.js API routes
│   └── upload.js       # Upload endpoint untuk Vercel Blob
├── src/                # React components
│   ├── App.js          # Main application component
│   └── App.css         # Styling
├── scripts/            # Utility scripts
│   └── cleanup-blob.js # Blob storage cleanup
├── public/             # Static assets
└── docs/
    └── VERCEL_BLOB_SETUP.md  # Setup guide
```

## 🔧 Konfigurasi

### Environment Variables
- `BLOB_READ_WRITE_TOKEN` - Token untuk Vercel Blob Storage (Required)

### Upload Limits
- **File Size**: 50MB per file (dapat diubah di code)
- **File Types**: MP3, WAV, OGG, M4A
- **Storage**: Unlimited (tergantung plan Vercel)

## 🌍 Deployment

### Deploy ke Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables di Production
1. Masuk ke Vercel Dashboard
2. Pilih project → Settings → Environment Variables
3. Tambahkan `BLOB_READ_WRITE_TOKEN` dengan value token Anda

## 📱 Cara Penggunaan

1. **Upload Audio**: Klik area upload atau drag & drop file audio
2. **Atur Interval**: Pilih interval pemutaran (15/30/60 menit)
3. **Mulai Pemutaran**: Klik tombol "Mulai Pemutaran"
4. **Monitor**: Lihat countdown timer dan status pemutaran
5. **Kelola File**: Play individual atau hapus file dari daftar

### Fitur Waktu Shalat
- Aplikasi otomatis detect lokasi GPS
- Pemutaran akan di-pause selama waktu shalat
- Countdown akan restart setelah waktu shalat selesai

## 🔄 Migrasi dari Cloudinary

Aplikasi ini telah dimigrasi dari Cloudinary ke Vercel Blob Storage:

### ✅ Yang Tetap Sama:
- Interface pengguna
- Fitur upload dan playback
- API endpoints
- File validation

### 🔄 Yang Berubah:
- Storage backend: Cloudinary → Vercel Blob
- Environment variables: `CLOUDINARY_*` → `BLOB_READ_WRITE_TOKEN`
- File URLs: Cloudinary URLs → Vercel Blob URLs

### 📦 Existing Data:
- File lama di localStorage tetap menggunakan Cloudinary URLs
- Upload baru akan menggunakan Vercel Blob URLs
- Tidak ada downtime atau data loss

## 🛠️ Maintenance

### Cleanup File Lama
```bash
# Lihat file yang bisa dihapus (dry run)
npm run cleanup-blob

# Edit scripts/cleanup-blob.js untuk aktifkan penghapusan
```

### Monitoring Usage
- Cek usage di Vercel Dashboard → Analytics
- Monitor storage dan bandwidth usage
- Set up alerts untuk usage limits

## 🐛 Troubleshooting

### Upload Gagal
- Pastikan `BLOB_READ_WRITE_TOKEN` sudah diset
- Check file size (max 50MB)
- Pastikan format file didukung

### Waktu Shalat Tidak Akurat
- Allow location access di browser
- Check koneksi internet untuk API shalat
- Fallback ke jadwal default jika GPS gagal

### Performance Issues
- Compress audio files sebelum upload
- Clear browser cache
- Check network connection

## 📄 Lisensi

© 2023 Sistem Pengumuman Otomatis. Dibangun untuk masjid dan lembaga keagamaan.

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## 📞 Support

Untuk bantuan teknis atau pertanyaan, silakan buat issue di repository ini.
