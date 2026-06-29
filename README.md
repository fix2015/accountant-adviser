# AI Accountant Adviser

AI-powered UK tax and accounting adviser built with FastAPI and React.

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for frontend development)
- Python 3.12+ (for backend development)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/fix2015/accountant-adviser.git
cd accountant-adviser
```

2. Set up environment variables:
```bash
cp infra/.env.example infra/.env
cp backend/.env.example backend/.env
```

3. Start all services:
```bash
cd infra
docker compose up -d
```

4. Access the application:
- Frontend: http://localhost:3001
- Backend API: http://localhost:8001
- API docs: http://localhost:8001/docs

### Backend Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

## Production

The application is deployed to AWS EC2 at https://ai-adviser.probooking.app/

Deployment is automated via GitHub Actions on push to `main`.

## Architecture

- **Backend**: FastAPI (Python 3.12) with SQLAlchemy, Celery, OpenAI
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 16
- **Cache/Broker**: Redis 7
- **CI/CD**: GitHub Actions with Docker (GHCR)

## License

Proprietary - All rights reserved.
