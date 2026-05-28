Progress:

- Updated import to use Prisma createMany (skipDuplicates) ✅
- Updated dashboard summary KPIs to only count status=Completed ✅
- Updated dashboard summary date filter to end-exclusive ✅
- Pending: update dashboard trends/top-products/platform-comparison date filters and completed-order filtering

---

- [ ] Login deploy fix: pastikan /api/auth/me sukses
- [ ] Set env di Vercel: VITE_API_BASE_URL = https://sales-monitoring.up.railway.app/api
- [ ] Pastikan env di Railway: JWT_SECRET terisi (sudah ada)
- [ ] Pastikan env di Railway: CLIENT_URL sesuai domain frontend Vercel
