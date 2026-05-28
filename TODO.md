# TODO

## Fix login tidak terbaca di Railway/Vercel

- [ ] Konfirmasi implementasi JWT Secret: hapus fallback secret yang bisa beda environment (wajib pakai JWT_SECRET)
- [ ] Tambah logging aman (tanpa reveal secret) untuk membandingkan secret availability saat sign/verify
- [ ] Pastikan frontend memakai base URL API yang benar dengan set `VITE_API_BASE_URL` di Vercel
- [ ] Pastikan CORS `CLIENT_URL` di Railway sesuai domain frontend
- [ ] Deploy ulang backend dan frontend, lalu test flow:
  - login → token tersimpan
  - load halaman protected → `/api/auth/me` sukses
