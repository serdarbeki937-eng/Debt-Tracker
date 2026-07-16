#!/bin/bash

# Render'da Deploy qilish Script
# Ishlatish: bash scripts/render-deploy.sh

set -e

echo "🚀 RENDER'DA DEPLOY QILISH BOSHLANDI"
echo "====================================="

# Sozlamalar
RENDER_API_TOKEN="rnd_h97UUXNypgaX4k5I4CipHjUq0pCR"
RENDER_API_URL="https://api.render.com/v1"

echo "📋 Mavjud servicelarni tekshirish..."

# Mavjud servicelarni olish
SERVICES=$(curl -s -X GET "$RENDER_API_URL/services" \
  -H "Authorization: Bearer $RENDER_API_TOKEN" \
  -H "Content-Type: application/json")

# debt-tracker-api qidirish
SERVICE_ID=$(echo "$SERVICES" | grep -o '"id":"[^"]*"' | grep -A1 '"name":"debt-tracker-api"' | head -1 | cut -d'"' -f4)

if [ -z "$SERVICE_ID" ]; then
  echo "🆕 Yangi Web Service yaratilmoqda..."
  
  SERVICE=$(curl -s -X POST "$RENDER_API_URL/services" \
    -H "Authorization: Bearer $RENDER_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "debt-tracker-api",
      "type": "web_service",
      "env": "node",
      "plan": "free",
      "repo": "https://github.com/serdarbeki937-eng/Debt-Tracker.git",
      "branch": "main",
      "buildCommand": "pnpm install && pnpm run build",
      "startCommand": "cd artifacts/api-server && pnpm run start",
      "envVars": [
        {"key": "DATABASE_URL", "value": "postgresql://neondb_owner:npg_cKOp28qLDUnG@ep-jolly-term-ahylujz9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"},
        {"key": "NODE_ENV", "value": "production"},
        {"key": "PORT", "value": "3000"},
        {"key": "CLERK_SECRET_KEY", "value": "sk_test_hbwx5qhs7BNh2B2Mg64tidJmgLTDwD49SfmlYw1eTS"},
        {"key": "CLERK_PUBLISHABLE_KEY", "value": "pk_test_bGlrZWQtc25haWwtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA"},
        {"key": "CORS_ORIGIN", "value": "https://debt-tracker-api.onrender.com"}
      ],
      "autoDeployOnPush": true
    }')
  
  SERVICE_ID=$(echo "$SERVICE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  echo "✅ Service yaratildi: $SERVICE_ID"
else
  echo "✅ Service topildi: $SERVICE_ID"
fi

echo ""
echo "🚀 Deploy qilishni boshlash..."

# Deploy qilish
DEPLOY=$(curl -s -X POST "$RENDER_API_URL/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_TOKEN" \
  -H "Content-Type: application/json")

echo "$DEPLOY" | jq .

echo ""
echo "====================================="
echo "✅ DEPLOY BOSHLANDI!"
echo "====================================="
echo ""
echo "📊 Holatini ko'ring: https://dashboard.render.com"
echo "🔗 Service URL: https://debt-tracker-api.onrender.com"
echo ""
echo "⏳ Deploy 5-10 daqiqada tugallandi bo'ladi..."
