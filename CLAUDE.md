# AI Accountant Adviser

## Architecture
- Backend: FastAPI (Python 3.12) at `/backend/`
- Frontend: React + Vite + TypeScript at `/frontend/`
- Infrastructure: Docker Compose at `/infra/`
- CI/CD: GitHub Actions at `.github/workflows/`

## Deployment
- Server: AWS EC2 (same as probooking, 34.227.48.162)
- Domain: https://ai-adviser.probooking.app/
- Backend port: 8001 (probooking uses 8000)
- Frontend port: 3002 (probooking uses 3000)
- Container prefix: adviser_

## Key Services
- Stripe: 10 pound consultation, 50 pounds for 50 more questions
- OpenAI: GPT-4o for UK tax advice
- AWS S3: Document storage
- PostgreSQL: Data storage
- Redis: Caching + Celery broker

## Design System
All colors are CSS variables in frontend/src/index.css
All design tokens in frontend/src/design-system.ts
Tailwind uses ds-* prefix for design system classes
