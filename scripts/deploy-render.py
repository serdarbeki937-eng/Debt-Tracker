#!/usr/bin/env python3
"""
Render API orqali Debt-Tracker loyihasini deploy qilish scripti
"""

import requests
import json
import time

# Sozlamalar
RENDER_API_TOKEN = "rnd_h97UUXNypgaX4k5I4CipHjUq0pCR"
RENDER_API_URL = "https://api.render.com/v1"

# GitHub sozlamalari
GITHUB_REPO_URL = "https://github.com/serdarbeki937-eng/Debt-Tracker.git"
GITHUB_BRANCH = "main"

# Environment Variables
ENV_VARS = {
    "DATABASE_URL": "postgresql://neondb_owner:npg_cKOp28qLDUnG@ep-jolly-term-ahylujz9-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    "NODE_ENV": "production",
    "PORT": "3000",
    "CLERK_SECRET_KEY": "sk_test_hbwx5qhs7BNh2B2Mg64tidJmgLTDwD49SfmlYw1eTS",
    "CLERK_PUBLISHABLE_KEY": "pk_test_bGlrZWQtc25haWwtOTcuY2xlcmsuYWNjb3VudHMuZGV2JA",
    "CORS_ORIGIN": "https://debt-tracker-api.onrender.com"
}

headers = {
    "Authorization": f"Bearer {RENDER_API_TOKEN}",
    "Content-Type": "application/json"
}

def create_web_service():
    """Render'da Web Service yaratish"""
    print("🚀 Web Service yaratilmoqda...")
    
    service_data = {
        "name": "debt-tracker-api",
        "ownerId": None,  # Foydalanuvchi ID'si
        "type": "web_service",
        "env": "node",
        "plan": "free",
        "repo": GITHUB_REPO_URL,
        "branch": GITHUB_BRANCH,
        "buildCommand": "pnpm install && pnpm run build",
        "startCommand": "cd artifacts/api-server && pnpm run start",
        "envVars": [{"key": k, "value": v} for k, v in ENV_VARS.items()],
        "autoDeployOnPush": True,
        "notificationEmail": "serdarbeki937@gmail.com"
    }
    
    try:
        response = requests.post(
            f"{RENDER_API_URL}/services",
            headers=headers,
            json=service_data,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            service = response.json()
            print(f"✅ Web Service yaratildi!")
            print(f"   Service ID: {service.get('id')}")
            print(f"   Name: {service.get('name')}")
            return service
        else:
            print(f"❌ Xato ({response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"❌ Xato: {e}")
        return None

def list_services():
    """Mavjud servicelarni ko'rish"""
    print("\n📋 Mavjud servicelar...")
    
    try:
        response = requests.get(
            f"{RENDER_API_URL}/services",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            services = response.json()
            for service in services:
                print(f"  - {service.get('name')} ({service.get('id')})")
            return services
        else:
            print(f"❌ Xato ({response.status_code}): {response.text}")
            return []
    except Exception as e:
        print(f"❌ Xato: {e}")
        return []

def trigger_deploy(service_id):
    """Deploy qilishni boshlash"""
    print(f"\n🚀 Deploy qilishni boshlash ({service_id})...")
    
    try:
        response = requests.post(
            f"{RENDER_API_URL}/services/{service_id}/deploys",
            headers=headers,
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            deploy = response.json()
            print(f"✅ Deploy boshlandi!")
            print(f"   Deploy ID: {deploy.get('id')}")
            return deploy
        else:
            print(f"❌ Xato ({response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"❌ Xato: {e}")
        return None

def main():
    print("=" * 60)
    print("🎯 RENDER'DA DEPLOY QILISH - AVTOMATIK SCRIPT")
    print("=" * 60)
    
    # 1. Mavjud servicelarni ko'rish
    services = list_services()
    
    # 2. Agar debt-tracker-api allaqachon borsa, uni ko'rish
    existing = [s for s in services if s.get('name') == 'debt-tracker-api']
    
    if existing:
        service_id = existing[0].get('id')
        print(f"\n✅ debt-tracker-api allaqachon mavjud! (ID: {service_id})")
        print("   Deploy qayta qilishni boshlayabdi...")
        trigger_deploy(service_id)
    else:
        print("\n🆕 Yangi Web Service yaratilmoqda...")
        service = create_web_service()
        if service:
            service_id = service.get('id')
            time.sleep(5)  # Xizmatni yaratish uchun vaqt
            trigger_deploy(service_id)
    
    print("\n" + "=" * 60)
    print("✅ JARAYON TUGALLANDI!")
    print("=" * 60)
    print("\n📊 Render Dashboard'ni ochib, deploy holatini ko'ring:")
    print("   https://dashboard.render.com")
    print("\n🎉 Loyihangiz deploy bo'lish tugallangach:")
    print("   https://debt-tracker-api.onrender.com")

if __name__ == "__main__":
    main()
