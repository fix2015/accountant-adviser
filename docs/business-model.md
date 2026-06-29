# AI Accountant Adviser — Business Model & Cost Analysis

*Last updated: 29 June 2026*

---

## Price Plans

| Plan | Price | Questions | Documents | PDF Reports | Key Limits |
|------|-------|-----------|-----------|-------------|------------|
| **Free Trial** | £0 | 3 | 1 | No | Auto-created on signup |
| **Full Consultation** | £10 one-time | 50 | Unlimited | Yes | Upgrades trial in-place |
| **Monthly Subscription** | £5/month | 20/month | Unlimited | Yes | Recurring via Stripe |
| **Extra Questions** | £5 per pack | +50 | — | — | Adds to existing consultation |
| **Accountant Review** | £50 one-time | — | — | Briefing PDF | Human accountant reviews AI strategy |

---

## Cost Per User

### OpenAI (GPT-4o)
| Operation | Tokens (avg) | Cost per call | Calls per user | Cost per user |
|-----------|-------------|---------------|----------------|---------------|
| Chat Q&A | ~1,300 (800 in + 500 out) | £0.012 | 50 (full plan) | **£0.60** |
| Health Score | ~700 | £0.007 | 1 (cached 1hr) | £0.007 |
| Planner | ~4,000 | £0.040 | 1 (cached 1hr) | £0.040 |
| Scenario | ~1,100 | £0.011 | 3 avg | £0.033 |
| Doc Classification | ~750 | £0.008 | 5 docs avg | £0.040 |
| PDF Summary | ~600 | £0.006 | 1 | £0.006 |
| **Total per user** | | | | **£0.73** |

### Stripe Fees
| Plan | Revenue | Stripe Fee (1.4% + 20p) | Net Revenue |
|------|---------|------------------------|-------------|
| Consultation £10 | £10.00 | £0.34 (3.4%) | **£9.66** |
| Subscription £5 | £5.00 | £0.27 (5.4%) | **£4.73** |
| Extra Questions £5 | £5.00 | £0.27 (5.4%) | **£4.73** |
| Accountant Review £50 | £50.00 | £0.90 (1.8%) | **£49.10** |

### S3 Storage
- ~£0.003 per user/month (docs + strategy PDFs)
- Bucket: `gport` (shared), prefix: `ai-adviser/`
- Region: eu-central-1, ~$0.024/GB/month

### Server (EC2 t2.small — SHARED)
- Total instance cost: ~$25/month (£20/month)
- Shared with: ProBooking + Calorie Tracker
- AI Adviser share (~33%): **£7/month fixed**

---

## Profit Per User

### Single Consultation User (£10 plan)
| Item | Amount |
|------|--------|
| Revenue | £10.00 |
| Stripe fee | -£0.34 |
| OpenAI (50 questions + extras) | -£0.73 |
| S3 storage | -£0.003 |
| **Profit per user** | **£8.93** |
| **Margin** | **89.3%** |

### Subscription User (£5/month)
| Item | Amount/month |
|------|-------------|
| Revenue | £5.00 |
| Stripe fee | -£0.27 |
| OpenAI (20 questions + extras) | -£0.32 |
| S3 storage | -£0.003 |
| **Profit per user/month** | **£4.41** |
| **Margin** | **88.1%** |
| **Annual profit per sub user** | **£52.90** |

### Accountant Review User (£50 add-on)
| Item | Amount |
|------|--------|
| Revenue | £50.00 |
| Stripe fee | -£0.90 |
| OpenAI (briefing generation) | -£0.01 |
| **Profit per review** | **£49.09** |
| **Margin** | **98.2%** |

---

## Revenue Projections

### 1 User
| Revenue Stream | Amount |
|----------------|--------|
| Consultation | £10.00 |
| Costs | -£1.08 |
| **Net profit** | **£8.92** |

### 100 Users/month (20% conversion from trial)
| Item | Amount |
|------|--------|
| 20 consultations × £10 | £200 |
| 10 subscriptions × £5/mo | £50/mo |
| 5 extra question packs × £5 | £25 |
| 3 accountant reviews × £50 | £150 |
| **Monthly revenue** | **£425** |
| Stripe fees | -£28 |
| OpenAI costs (all users) | -£22 |
| Server (shared) | -£7 |
| S3 | -£0.30 |
| **Monthly profit** | **£368** |
| **Annual profit** | **£4,410** |

### 1,000 Users/month (20% conversion)
| Item | Amount |
|------|--------|
| 200 consultations × £10 | £2,000 |
| 100 subscriptions × £5/mo | £500/mo |
| 50 extra question packs × £5 | £250 |
| 30 accountant reviews × £50 | £1,500 |
| **Monthly revenue** | **£4,250** |
| Stripe fees | -£280 |
| OpenAI costs | -£220 |
| Server (need upgrade ~t3.medium) | -£30 |
| S3 | -£3 |
| **Monthly profit** | **£3,717** |
| **Annual profit** | **£44,600** |

---

## Rate Limits (Anti-Abuse)

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| Chat send/stream | 20/min | Prevents API spam |
| Scenario calculator | 10/min | Prevents OpenAI abuse |
| Health score | 5/min | Expensive AI call |
| Document upload | 30/min | S3 costs |
| ZIP upload | 5/min | Heavy processing |
| Register | 5/min | Anti-bot |
| Login | 10/min | Anti-brute-force |
| Forgot password | 3/min | Anti-spam |

## Question Limit Enforcement
- Trial: 3 questions hard limit → 402 error → upgrade modal
- Consultation: 50 questions → 402 → buy extra questions
- Subscription: 20/month → 402 → buy extra or wait
- Extra pack: +50 questions added to existing limit

## Document Limit Enforcement
- Trial: 1 document → 403 → upgrade modal
- Paid: Unlimited (rate limited at 30/min)
- Per file: 10MB max
- ZIP: 50 files max, 100MB total

---

## Caching Strategy (Reduce OpenAI Costs)

| Data | Cache Location | TTL | Saves |
|------|---------------|-----|-------|
| Health Score | localStorage + server | 1 hour | ~£0.007/reload |
| Tax Planner | localStorage + server | 1 hour | ~£0.040/reload |
| Chat Suggestions | Not cached (contextual) | — | — |
| Scenarios | Not cached (unique inputs) | — | — |
| Doc Classification | Once per upload | Permanent | — |

**Estimated savings from caching: 30-40% reduction in OpenAI costs**

---

## Infrastructure Scaling Thresholds

| Users | Server | Estimated Cost | Action Needed |
|-------|--------|---------------|---------------|
| 1-500 | t2.small (shared) | £7/mo | None |
| 500-2,000 | t3.medium (dedicated) | £30/mo | Separate instance |
| 2,000-10,000 | t3.large + RDS | £100/mo | Managed DB, load balancer |
| 10,000+ | ECS/EKS cluster | £300+/mo | Full cloud architecture |

---

## Key Metrics to Track
- Trial → Paid conversion rate (target: 20%+)
- Average questions per consultation
- Subscription retention rate (monthly churn)
- Accountant review attach rate
- OpenAI cost per user trend
- Revenue per user (ARPU)
