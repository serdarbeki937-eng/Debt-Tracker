# Render'da Deploy qilish - Qadam-qadam qo'llanma

## ✅ 1-QADAM: Render Account yarating
1. https://render.com ga o'ting
2. **Sign up** → GitHub bilan kirish
3. Email tasdiqlang

## ✅ 2-QADAM: Loyihani Deploy qiling
1. Render dashboard'ga o'ting
2. **+ New** → **Web Service** bosing
3. **Connect Git repository** → `serdarbeki937-eng/Debt-Tracker` tanlang
4. Quyidagi sozlamalarni kiriting:

   | Setting | Value |
   |---------|-------|
   | **Name** | debt-tracker-api |
   | **Runtime** | Node |
   | **Build Command** | `pnpm install && pnpm run build` |
   | **Start Command** | `cd artifacts/api-server && pnpm run start` |
   | **Plan** | Free |

5. **Create Web Service** bosing

## ✅ 3-QADAM: PostgreSQL Database qo'shish
1. Render dashboard'da **+ New** → **PostgreSQL** bosing
2. Sozlamalar:
   - **Name:** debt-tracker-db
   - **Database:** debt_tracker
   - **User:** postgres
   - **Plan:** Free

3. **Create Database** bosing
4. Database yaratilgach, **Internal Connection String** nusxalang

## ✅ 4-QADAM: Environment Variables sozlang

Web Service'ga qayit:
1. **Environment** tab'ga o'ting
2. Quyidagi variable'larni qo'shing:

```
DATABASE_URL = [PostgreSQL'dan nusxalagan connection string]
NODE_ENV = production
PORT = 3000
CLERK_SECRET_KEY = [clerk.com'dan oladiganiz]
CLERK_PUBLISHABLE_KEY = [clerk.com'dan oladiganiz]
CORS_ORIGIN = https://your-domain-here.onrender.com
```

### 🔐 Clerk Keys qanday olish?
1. https://dashboard.clerk.com ga o'ting
2. **API Keys** → **Credentials** qismiga o'ting
3. `Secret Key` va `Publishable Key` nusxalang
4. Render'da qo'shing

## ✅ 5-QADAM: Deploy qiling
1. Web Service page'da **Manual Deploy** → **Deploy latest commit** bosing
2. Logs'da jarayon ko'rinadi

## ✅ 6-QADAM: Tekshiring
Deploy tugallangach:
1. Render sizga URL beradi: `https://debt-tracker-api.onrender.com`
2. Test qiling:
```bash
curl https://debt-tracker-api.onrender.com/health
```

---

## 🔧 Muammolar va Yechimlar

### ❌ "Build failed"
**Sabab:** pnpm install xatosi
**Yechim:** Render logs'da xatani o'qing va .gitignore'ni tekshiring

### ❌ "Database connection error"
**Sabab:** DATABASE_URL xato
**Yechim:** PostgreSQL connection string'ni qayta nusxalang

### ❌ "Clerk authentication failed"
**Sabab:** CLERK_SECRET_KEY xato
**Yechim:** Clerk dashboard'da key'larni qayta tekshiring

---

## 📊 Logs ko'rish
1. Web Service page'da **Logs** tab'ni bosing
2. Barcha xatolarni real-time ko'rishingiz mumkin

## 🚀 Bitti!
Loyihangiz deploy bo'ldi! URL: `https://debt-tracker-api.onrender.com`
