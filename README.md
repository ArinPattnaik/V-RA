# VÉRA — Greenwashing NLP Scanner

<div align="center">

**See through fast fashion's eco-marketing.**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![spaCy](https://img.shields.io/badge/spaCy-3.8-09A3D5?style=flat-square)](https://spacy.io/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org/)

</div>

---

## 🌿 What is VÉRA?

VÉRA is a web application that exposes greenwashing in the fashion industry. Users paste a product link or description, and VÉRA's NLP engine:

1. **Scrapes** product data from major retailers (H&M, Zara, ASOS, SHEIN, Nike, Adidas, Uniqlo)
2. **Analyzes** marketing text using a 7-stage NLP pipeline
3. **Cross-references** against a sustainability database of 40+ materials, 80+ greenwashing buzzwords, and 15+ certifications
4. **Delivers** a **True Eco-Score** (0-10) with a stunning visual breakdown

---

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Next.js 14    │────▶│   Node.js API   │────▶│  FastAPI + NLP  │
│   Frontend      │     │   + Puppeteer   │     │  Microservice   │
│   (Vercel)      │     │   (Render)      │     │  (Render)       │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                        Fashion Retailers     Sustainability DB
                        (H&M, Zara, ...)     (Materials, Certs,
                                              Brands, Buzzwords)
```

---

## 🔬 NLP Pipeline

| Stage | Process | Details |
|:---:|:---|:---|
| 1 | **Material Extraction** | spaCy + regex → extracts material composition percentages |
| 2 | **Buzzword Detection** | 80+ taxonomy of greenwashing terms with severity scoring |
| 3 | **Certification Validation** | Cross-references against 15+ legitimate eco-certifications |
| 4 | **Vagueness Analysis** | Detects hedging language ("up to", "working towards", etc.) |
| 5 | **Brand Enrichment** | Adds carbon footprint data for 10+ major brands |
| 6 | **Score Synthesis** | Weighted formula: Materials (35%) + Buzzwords (25%) + Certs (20%) + Clarity (20%) |
| 7 | **Verdict Generation** | Human-readable summary of the product's true sustainability |

---

## 🎨 UI/UX Design

- **Pure black** background with noise texture overlay
- **Massive bold typography** score (100-220px) with animated counter
- **Bento grid** layout for the analysis breakdown
- **Glassmorphism** cards with hover micro-animations
- **Color-coded** eco-spectrum (green → yellow → red)
- **Scroll-triggered** animations via Intersection Observer
- **Space Grotesk** + **Inter** typography from Google Fonts

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- pip

### 1. ML Microservice

```bash
cd ml-service
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

### 2. Backend API

```bash
cd backend
npm install
node server.js
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app is ready!

---

## 📦 Deployment

### Frontend → Vercel
- Connect the `frontend/` directory to Vercel
- Set `NEXT_PUBLIC_API_URL` to your Render backend URL

### Backend + ML Service → Render
- Deploy each service as a Docker Web Service
- Set `ML_SERVICE_URL` on the backend to point to the ML service

---

## 📁 Project Structure

```
VÉRA/
├── ml-service/           # Python FastAPI + spaCy
│   ├── main.py           # API endpoints
│   ├── analyzer.py       # NLP greenwashing analyzer
│   ├── sustainability_db.py  # Materials, buzzwords, certs, brands
│   ├── requirements.txt
│   └── Dockerfile
├── backend/              # Node.js Express + Puppeteer
│   ├── server.js         # API orchestration
│   ├── scraper.js        # Retailer-specific web scraper
│   ├── package.json
│   └── Dockerfile
├── frontend/             # Next.js 14
│   ├── app/
│   │   ├── page.js       # Main scanner page
│   │   ├── layout.js     # Root layout
│   │   ├── globals.css   # Design system
│   │   └── page.module.css
│   └── components/
│       ├── ScannerInput.jsx
│       ├── ScoreDisplay.jsx
│       ├── MaterialChart.jsx
│       ├── BuzzwordRadar.jsx
│       ├── CarbonTimeline.jsx
│       ├── VaguenessMeter.jsx
│       ├── CertificationCard.jsx
│       └── LoadingScreen.jsx
├── .gitignore
└── README.md
```

---

## 🛡️ Demo Mode

VÉRA includes 4 pre-loaded demo products to showcase the scanner without requiring live scraping:

| Product | Brand | Expected Score |
|:---|:---|:---:|
| Conscious Choice T-Shirt | H&M | ~3.5 |
| Regenerative Organic Cotton Tee | Patagonia | ~8.5 |
| EcoWave Wide Leg Pants | SHEIN | ~1.5 |
| Join Life Textured Blazer | Zara | ~5.0 |

---

## 📜 License

MIT

---

<div align="center">

**Built with 🌿 to fight greenwashing in fashion.**

</div>
