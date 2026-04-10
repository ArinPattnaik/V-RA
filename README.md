<div align="center">

# 🌿 VÉRA

### See Through the Greenwash.

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_VERA-00ff88?style=for-the-badge)](https://vera.arinpattnaik.me/)
[![License](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/ML_Service-FastAPI-009688?logo=fastapi)](https://fastapi.tiangolo.com/)

**VÉRA is an industry-grade NLP-powered greenwashing scanner for the fashion industry.**
Stop falling for "sustainable" marketing. Paste a link, get the truth.

[**Try VÉRA Live**](https://vera.arinpattnaik.me/)

</div>

---

## ⚡ The Problem

Fast fashion brands spend millions on "eco-friendly" marketing, but most of it is **greenwashing**. Terms like "sustainable," "conscious," and "planet-friendly" have no legal definition. VÉRA uses advanced Natural Language Processing to dissect product claims and score them against real sustainability benchmarks.

## 🚀 Key Features

-   **🔍 Scalable Product Scraping**: Integrated with **ScraperAPI** to bypass anti-bot protections on major retailers (H&M, Zara, Nike, etc.).
-   **🧠 7-Stage NLP Pipeline**: Analyzes text for deceptive language, vague claims, and hidden trade-offs.
-   **📊 True Eco-Score (0-10)**: A proprietary scoring algorithm that cross-references material composition against global sustainability indexes.
-   **♻️ Material Transparency**: Automatically extracts and evaluates fabric percentages (e.g., Organic Cotton vs. Recycled Polyester).
-   **🏢 Brand Footprint**: Correlates product claims with corporate-level transparency data.

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, React, Tailwind CSS, Framer Motion |
| **Backend API** | Node.js, Express, ScraperAPI (Proxying) |
| **ML Engine** | Python, FastAPI, HuggingFace (Transformers) |
| **Data Science** | Scikit-learn, Pandas, NLTK |
| **Deployment** | Vercel (Frontend), Render/Docker (Services) |

## 📐 Architecture

```mermaid
graph TD
    User((User)) -->|Pastes URL| NextJS[Next.js Frontend]
    NextJS -->|Request| NodeAPI[Express API Gateway]
    NodeAPI -->|Proxy Scrape| ScraperAPI[ScraperAPI]
    ScraperAPI -->|HTML Content| NodeAPI
    NodeAPI -->|Extracts Text/Materials| MLService[FastAPI ML Service]
    MLService -->|NLP Analysis| BERT[Fine-tuned Model]
    MLService -->|Scoring| DB[(Sustainability DB)]
    MLService -->|JSON Result| NodeAPI
    NodeAPI -->|Final Analysis| NextJS
```


## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
Built with 🌱 by <a href="https://github.com/ArinPattnaik">Arin Pattnaik</a>
</div>
