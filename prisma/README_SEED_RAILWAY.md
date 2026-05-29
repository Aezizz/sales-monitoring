# Seed Prisma di Railway (Production)

## Tujuan

Pastikan user demo tersedia agar login berhasil:

- admin@insight.com / password123
- staff@insight.com / password123
- owner@insight.com / password123

## Langkah

1. Pastikan migrasi sudah jalan

- `npx prisma migrate deploy`

2. Jalankan seed

- `npx prisma db seed`

## Catatan penting

Project ini **belum punya** script seed di `package.json`, sehingga perintah `prisma db seed` mungkin gagal tergantung konfigurasi Prisma.

Pastikan `prisma/seed.js` terdaftar sebagai seed script di salah satu cara berikut:

- lewat `package.json` (opsional, yang direkomendasikan), atau
- konfigurasi `prisma` yang disediakan oleh Prisma.
