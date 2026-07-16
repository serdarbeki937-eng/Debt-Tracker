# 🚀 Debt-Tracker - Render'da Deploy Qilish Qo'llanma

## O'zbek Tilida To'liq Qo'llanma

---

## 1️⃣ **Ön Tayyorlik**

### Kerak bo'ladigan narsalar:
- ✅ GitHub Account (allaqachon bor)
- ✅ Neon.tech PostgreSQL Account (allaqachon bor)
- ✅ Clerk Authentication Account (allaqachon bor)
- ✅ Render.com Account (yaratish kerak)

---

## 2️⃣ **Render.com'da Account Yaratish**

### A-variant: GitHub bilan Sign Up (OSON)

1. **https://render.com** ga o'ting
2. **Sign up** tugmasini bosing
3. **"Sign up with GitHub"** bosing
4. GitHub hisobingiz bilan authorize qiling
5. Render dashboard'ga kirasiz ✅

### B-variant: Email bilan Sign Up

1. **https://render.com** ga o'ting
2. **Sign up** tugmasini bosing
3. Email va parol kiriting
4. Email'ni tasdiqlang
5. Render dashboard'ga kirasiz ✅

---

## 3️⃣ **Render'da Web Service Yaratish**

### Qadam-qadam:

1. **Render Dashboard'ga kirish**
   - https://dashboard.render.com
   - Login qiling

2. **Yangi Service Yaratish**
   - **+ New** tugmasini bosing
   - **Web Service** tanlang

3. **GitHub Repo Ulantirib:**
   - "Connect your code repository" ga bosing
   - **serdarbeki937-eng/Debt-Tracker** tanlang
   - **main** branch tanlang

4. **Service Sozlamalari:**

```
┌─────────────────────────────────────────┐
│ Name: debt-tracker-api                  │
│ Environment: Node                       │
│ Build Command:                          │
│   pnpm install && pnpm run build        │
│ Start Command:                          │
│   cd artifacts/api-server && pnpm start │
│ Plan: Free (yoki Paid)                  │
└─────────────────────────────────────────┘
```

5. **Environment Variables Qo'shish**

   Quyidagi variables'ni qo'shing:

   ```
   DATABASE_URL
   postgresql://neondb_owner:npg_cKOp28qLDUnG@ep-jolly-term-ahylujz9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   
   NODE_ENV
   production
   
   PORT
   3000
   
   CLERK_SECRET_KEY
   sk_test_hbwx5qhs7BNh2B2Mg64tidJmgLTDwD49SfmlYw1eTS
   
   CLERK_PUBLISHABLE_KEY
   pk_test_bGlrZWQtc25haWwtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA
   
   CORS_ORIGIN
   https://debt-tracker-api.onrender.com
   ```

6. **"Create Web Service" Bosing**

---

## 4️⃣ **Deploy Qilish**

### A-variant: Avtomatik Deploy

```bash
# 1. Repository'ni clone qiling (agar o'rnatmagan bo'lsangiz)
git clone https://github.com/serdarbeki937-eng/Debt-Tracker.git
cd Debt-Tracker

# 2. Deploy script'ni ishga tushiring
bash scripts/render-deploy.sh
```

### B-variant: Manual Deploy

1. **Render Dashboard'da** service'ni tanlang
2. **Manual Deploy** tugmasini bosing
3. Deploy jarayoni boshlansadi

### C-variant: Git Push orqali (Avtomatik)

```bash
# Code o'zgarishlarini push qiling
git add .
git commit -m "Update code"
git push origin main

# Render avtomatik deploy qiladi!
```

---

## 5️⃣ **Deploy Holatini Tekshirish**

### Render Dashboard'da:

1. https://dashboard.render.com ga o'ting
2. **debt-tracker-api** service'ni bosing
3. **Logs** tab'da deploy logs'ni ko'ring

### Holatlar:

| Status | Ma'nosi |
|--------|----------|
| **Building** | Build qilishda... |
| **Deploying** | Deploy qilishda... |
| **Live** | ✅ Deploy tugallandi! |
| **Build failed** | ❌ Build xatosi |
| **Runtime error** | ❌ Runtime xatosi |

---

## 6️⃣ **Deploy Tugallangach**

### Loyihangiz ishga tushdi! 🎉

- **API URL:** https://debt-tracker-api.onrender.com
- **API Health Check:** https://debt-tracker-api.onrender.com/health
- **Dashboard:** https://dashboard.render.com

### Frontend'ni Ulantirib:

Frontend environment'iga quyidagi URL'ni qo'shing:

```
REACT_APP_API_URL=https://debt-tracker-api.onrender.com
```

---

## 🆘 **Xato Tutuv**

### 1. **Build Failed Xatosi**

```bash
# Logs'ni ko'ring
# Render Dashboard → Logs tab

# Umumiy sabablar:
- pnpm kerak (npm o'rniga)
- build command'i noto'g'ri
- missing dependencies
```

**Hal qilish:**
```bash
# Local test qiling
pnpm install
pnpm run build
```

### 2. **Start Command Xatosi**

```
Error: Cannot find module
```

**Hal qilish:**
- Start Command'ni tekshiring
- Working directory to'g'riligi

### 3. **Database Connection Xatosi**

```
Error: connect ECONNREFUSED
```

**Hal qilish:**
- DATABASE_URL to'g'riligi
- Neon.tech'da database ishlayotgani

### 4. **Port Xatosi**

```
Error: listen EADDRINUSE
```

**Hal qilish:**
- `process.env.PORT` ishlatish kerak
- Default port 3000 emas

---

## 📚 **Foydalı Linklar**

- [Render Dokumentatsiya](https://render.com/docs)
- [Render API Docs](https://render.com/docs/api)
- [Neon.tech PostgreSQL](https://neon.tech)
- [Clerk Authentication](https://clerk.com)
- [Your Dashboard](https://dashboard.render.com)

---

## ✅ **Checklist - Deploy Qilishdan Oldin**

- [ ] GitHub account ulantirilgan
- [ ] Clerk keys olindi
- [ ] Neon PostgreSQL database yaratilgan
- [ ] Render account yaratilgan
- [ ] render.yaml fayli repository'da bor
- [ ] Environment variables sozlandi
- [ ] Build command to'g'ri
- [ ] Start command to'g'ri
- [ ] PORT environment variable ishlatilgan

---

## 🎉 **Boshqa Qo'llanmalar**

- **Frontend Deploy:** `FRONTEND_DEPLOYMENT.md`
- **Database Setup:** `DATABASE_SETUP.md`
- **CI/CD:** `CI_CD_SETUP.md`

---

**Savollar bo'lsa, GitHub Issues'da savol bering!** 💬
