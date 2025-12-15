# Mirror Platform - Production Deployment Guide

Complete instructions for deploying Mirror to production.

## Quick Local Setup

```bash
# 1. Install dependencies
cd mirrorx-engine && pip install -r requirements.txt
cd ../frontend && npm install

# 2. Generate Guardian keypair
python -c "
from mirrorx_engine.app.canonical_signing import Ed25519Signer
signer = Ed25519Signer.generate()
print(f'GUARDIAN_PUBLIC_KEY={signer.public_hex()}')
print(f'GUARDIAN_PRIVATE_KEY={signer.private_hex()}')
"

# 3. Create .env files (see below)

# 4. Run
python core-api/app/main_v2.py  # Backend on :8000
npm run dev  # Frontend on :3000
```

## Environment Configuration

**mirrorx-engine/.env**
```bash
ANTHROPIC_API_KEY=sk-ant-your-key
GUARDIAN_PRIVATE_KEY=your-private-key-hex
EVENT_LOG_PATH=mirror_events.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PERSONAL_PRICE_ID=price_...
STRIPE_SOVEREIGN_PRICE_ID=price_...
STRIPE_BYOK_PRICE_ID=price_...
```

**frontend/.env**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Production Deployment (Railway + Vercel)

### 1. Guardian Service
```bash
# Railway CLI
railway init
railway add
# Choose: Python
# Set environment: GUARDIAN_PRIVATE_KEY
# Deploy: railway up
```

### 2. Core API
```bash
railway add
# Set all environment variables from .env
# Add volume for EVENT_LOG_PATH
railway up
```

### 3. Frontend (Vercel)
```bash
vercel
# Set NEXT_PUBLIC_API_URL to Railway backend URL
vercel --prod
```

### 4. Stripe Setup
```bash
# Create products
stripe products create --name "Mirror Personal"
stripe prices create --product prod_... --unit-amount 1500 --currency usd --recurring[interval]=month

# Setup webhook
stripe listen --forward-to https://your-api.railway.app/webhooks/stripe
```

## Monitoring & Scaling

**Key metrics:**
- API latency (target: <200ms p95)
- Event log size (archive after 90 days)
- Certificate expiration queue
- Worker execution success rate

**Scaling thresholds:**
- <10k users: SQLite on Railway volume
- 10k-100k: PostgreSQL
- 100k+: PostgreSQL + read replicas + Redis

## Cost Estimate (1,000 users)

| Service | Monthly Cost |
|---------|--------------|
| Railway Backend | $20 |
| Anthropic API | $200 |
| Vercel | $0 |
| Stripe fees (3%) | $45 |
| **Total** | **$265** |

**Revenue (50% conversion):**
- 500 × $15 = $7,500/month
- **Net: $7,235/month**

## Security Checklist

- [ ] Guardian private key in vault (1Password/AWS Secrets)
- [ ] All dev keys rotated
- [ ] CORS restricted to production domain
- [ ] Rate limiting enabled
- [ ] SSL/TLS enforced
- [ ] Database backups automated
- [ ] Certificate rotation (30 day TTL)

## Support

- Docs: https://docs.mirror.xyz
- Discord: https://discord.gg/mirror
- Email: guardian@mirror.xyz

---

**Deploy in 2 hours. Scale to 1M users.**
