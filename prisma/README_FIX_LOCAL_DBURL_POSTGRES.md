# Perbaikan Local `DATABASE_URL` untuk Prisma (Postgres)

## Masalah

Schema Prisma memakai `provider = "postgresql"`, tapi file `.env` lokal berisi:
`DATABASE_URL="file:./dev.db"`

Itu invalid untuk Prisma/Postgres dan bikin:

- `prisma migrate deploy` gagal
- seed gagal

## Solusi

1. Ubah `.env` lokal menjadi Postgres URL (harus pakai prefix `postgres://` atau `postgresql://`).

Contoh (format):
`DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"`

2. Setelah itu jalankan:

- `npx prisma migrate deploy`
- `npx prisma db seed`

## Catatan

- Kalau kamu tidak ingin connect ke DB Postgres dari local, jangan jalankan migrate/seed dari local.
- Seed harus dijalankan di environment deployment yang Postgres-nya benar (Railway).
