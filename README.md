<div align="center">

# VÉRA

### See Through the Greenwash.

[![Live Demo](https://img.shields.io/badge/🌿_Live_Demo-Visit_VÉRA-00ff88?style=for-the-badge)](https://frontend-iota-self-92.vercel.app)

[![License](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

---

**VÉRA is an NLP-powered greenwashing scanner for the fashion industry.**
Paste a product link from any major retailer — get the truth behind the eco-marketing.

[**→ Try VÉRA Live**](https://frontend-iota-self-92.vercel.app)

</div>

---

## The Problem

Fast fashion brands spend millions on "eco-friendly" marketing — but most of it is greenwashing. Terms like _"sustainable"_, _"conscious"_, and _"planet-friendly"_ have no legal definition. Consumers have no way to tell real sustainability from marketing spin.

## What VÉRA Does

Paste a product URL or description from **H&M, Zara, ASOS, SHEIN, Nike, Adidas, Uniqlo** — or any public product page — and VÉRA will:

🔍 **Scrape** the product page for material data and marketing claims

🧠 **Analyze** the text with a 7-stage NLP pipeline to detect deceptive language

📊 **Score** the product on a 0–10 **True Eco-Score** by cross-referencing:
- **40+** material sustainability scores
- **80+** greenwashing buzzwords with severity levels
- **15+** eco-certifications (real vs. self-invented)
- **10+** brand carbon footprint histories

📋 **Deliver** a visual breakdown:

<div align="center">

| Component | What It Shows |
|:---|:---|
| **True Eco-Score** | Massive animated 0–10 score with color-coded verdict |
| **Material Chart** | Composition breakdown with sustainability ratings per material |
| **Greenwashing Radar** | Every detected buzzword, categorized by type and severity |
| **Vagueness Meter** | How much hedging language the brand uses |
| **Certification Check** | Verified certifications vs. self-invented labels |
| **Carbon Timeline** | Brand's historical carbon footprint with trend direction |

</div>

---

## Demo Mode

No URL needed — try the built-in showcase with 4 pre-analyzed products:

| Product | Brand | Verdict |
|:---|:---|:---|
| Conscious Choice Oversized T-Shirt | H&M | 🔴 Heavy Greenwashing |
| Regenerative Organic Cotton Tee | Patagonia | 🟢 Genuinely Sustainable |
| EcoWave Wide Leg Pants | SHEIN | 🔴 Heavy Greenwashing |
| Join Life Textured Blazer | Zara | 🟡 Mixed Signals |

---

## How Scoring Works

The **True Eco-Score** is a weighted composite:

| Factor | Weight | What It Measures |
|:---:|:---:|:---|
| Materials | 35% | Actual sustainability of the fabrics used |
| Buzzwords | 25% | Density of deceptive marketing language |
| Certifications | 20% | Real third-party certifications vs. invented labels |
| Clarity | 20% | Specificity of claims — vague vs. concrete |

Scores range from **0** (pure greenwashing) to **10** (genuinely sustainable).

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | Next.js 14, CSS Modules |
| Backend API | Node.js, Express, Puppeteer |
| NLP Engine | Python, FastAPI, spaCy |
| Deployment | Vercel + Render (Docker) |

---

<div align="center">

## [→ Try VÉRA Live](https://frontend-iota-self-92.vercel.app)

**Stop trusting the label. Start reading the data.**

---

MIT License · Built to fight greenwashing in fashion.

</div>
