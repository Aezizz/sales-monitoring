# TODO

## Prisma & Railway build/start order

- [x] Ubah `package.json`:
  - [x] Tambahkan script `prisma:prepare` = generate + migrate deploy + db seed (schema konsisten: `./prisma/schema.prisma`)
  - [x] Tambahkan script `start:prod` yang menjalankan `prisma:prepare` lalu start server
  - [x] Pastikan seed pakai `node prisma/seed.js` (bukan `prisma db seed`)
- [x] Rapikan konsistensi path schema di seluruh script Prisma
- [x] Update Railway:
  - [x] Set Build Command: `npm install`
  - [x] Set Start Command: `npm run start:prod`
- [ ] Verifikasi produksi:
  - [ ] Pastikan log Prisma connect ke `DATABASE_URL` (bukan `localhost:5432`)
  - [ ] Pastikan admin/staff/owner seed muncul
