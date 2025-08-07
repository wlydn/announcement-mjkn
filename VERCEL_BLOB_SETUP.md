# Setup Vercel Blob Storage untuk Production

## 1. Persiapan Environment Variables

### Untuk Development (Local)
Buat file `.env.local` di root project:

```env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

### Untuk Production (Vercel)
1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Masuk ke **Settings** → **Environment Variables**
4. Tambahkan variable baru:
   - **Name**: `BLOB_READ_WRITE_TOKEN`
   - **Value**: Token Vercel Blob Anda
   - **Environment**: Production (atau All jika ingin untuk semua environment)

## 2. Cara Mendapatkan Vercel Blob Token

### Melalui Vercel CLI:
```bash
# Install Vercel CLI jika belum ada
npm i -g vercel

# Login ke Vercel
vercel login

# Link project ke Vercel (jika belum)
vercel link

# Generate Blob token
vercel env add BLOB_READ_WRITE_TOKEN
```

### Melalui Vercel Dashboard:
1. Masuk ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Pilih project Anda
3. Masuk ke **Storage** tab
4. Klik **Create Database** → **Blob**
5. Ikuti instruksi untuk membuat Blob store
6. Copy token yang diberikan

## 3. Fitur Vercel Blob Storage

### Keunggulan:
- **Terintegrasi** dengan Vercel platform
- **Unlimited bandwidth** untuk Vercel deployments
- **Global CDN** untuk akses cepat
- **Automatic scaling**
- **Pay-per-use** pricing model

### Batasan:
- **File size limit**: 500MB per file (lebih dari cukup untuk audio)
- **Storage limit**: Tergantung plan Vercel Anda
- **Pricing**: $0.15 per GB stored per month

## 4. Struktur File yang Diupload

File audio akan disimpan dengan struktur:
```
announcements/
├── announcement_1703123456789.mp3
├── announcement_1703123567890.wav
└── announcement_1703123678901.m4a
```

## 5. Migration dari Cloudinary

### Yang Berubah:
- ✅ Upload endpoint tetap sama (`/api/upload`)
- ✅ Response format tetap kompatibel
- ✅ Frontend tidak perlu perubahan besar
- ✅ File validation tetap sama

### Yang Perlu Diperhatikan:
- 🔄 Existing files di localStorage masih menggunakan Cloudinary URLs
- 🔄 New uploads akan menggunakan Vercel Blob URLs
- 🔄 Environment variables berubah dari Cloudinary ke Vercel Blob

## 6. Testing

### Local Testing:
```bash
# Pastikan .env.local sudah disetup
npm run dev

# Test upload file audio melalui interface
```

### Production Testing:
```bash
# Deploy ke Vercel
vercel --prod

# Test upload di production environment
```

## 7. Troubleshooting

### Error: "Missing BLOB_READ_WRITE_TOKEN"
- Pastikan environment variable sudah diset
- Untuk local: check `.env.local`
- Untuk production: check Vercel dashboard settings

### Error: "Network error during upload"
- Check koneksi internet
- Pastikan token masih valid
- Check Vercel status page

### Error: "File size exceeds limit"
- Vercel Blob limit: 500MB per file
- App limit: 50MB per file (bisa diubah di code)

## 8. Monitoring & Analytics

Vercel menyediakan monitoring untuk Blob storage:
- Storage usage
- Bandwidth usage
- Request analytics
- Error tracking

Akses melalui Vercel Dashboard → Analytics → Functions/Storage

## 9. Backup Strategy

Untuk backup data:
1. Export announcement list dari localStorage
2. Download files dari Vercel Blob URLs
3. Store backup di external storage (Google Drive, etc.)

## 10. Cost Optimization

Tips menghemat biaya:
- Compress audio files sebelum upload
- Delete unused files secara berkala
- Monitor usage melalui Vercel dashboard
- Set up alerts untuk usage limits
