"""
VÉRA — Greenwashing NLP Scanner
FastAPI microservice for analyzing fashion product descriptions.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional

from analyzer import GreenwashingAnalyzer
from sustainability_db import DEMO_PRODUCTS, BRAND_DATA, CERTIFICATIONS

# ── Initialize FastAPI ──
app = FastAPI(
    title="VÉRA ML Service",
    description="NLP microservice for greenwashing detection in fashion",
    version="1.0.0",
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load analyzer once at startup (avoids cold-start per request) ──
analyzer = GreenwashingAnalyzer()


# ── Request/Response Models ──

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=10, description="Product description text to analyze")
    materials: Optional[dict] = Field(None, description="Material composition {name: percentage}")
    brand: Optional[str] = Field(None, description="Brand name for context enrichment")


class DemoRequest(BaseModel):
    product_id: str = Field(..., description="Demo product ID (demo-1, demo-2, etc.)")


# ── Endpoints ──

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "vera-ml", "version": "1.0.0"}


@app.post("/analyze")
async def analyze_product(request: AnalyzeRequest):
    """
    Analyze a product description for greenwashing.

    Returns a True Eco-Score (0-10) and detailed breakdown.
    """
    try:
        result = analyzer.analyze(
            text=request.text,
            materials=request.materials,
            brand=request.brand,
        )
        return {
            "success": True,
            "data": result.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze/demo")
async def analyze_demo_product(request: DemoRequest):
    """
    Analyze a pre-loaded demo product. Used for showcase mode.
    """
    # Find the demo product
    product = next(
        (p for p in DEMO_PRODUCTS if p["id"] == request.product_id),
        None,
    )
    if not product:
        raise HTTPException(
            status_code=404,
            detail=f"Demo product '{request.product_id}' not found. Available: {[p['id'] for p in DEMO_PRODUCTS]}",
        )

    try:
        result = analyzer.analyze(
            text=product["description"],
            materials=product.get("materials"),
            brand=product.get("brand"),
        )
        return {
            "success": True,
            "product": {
                "id": product["id"],
                "name": product["name"],
                "brand": product["brand"],
                "price": product["price"],
                "url": product["url"],
                "description": product["description"],
            },
            "data": result.to_dict(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Demo analysis failed: {str(e)}")


@app.get("/demo/products")
async def list_demo_products():
    """List available demo products for showcase mode."""
    return {
        "products": [
            {
                "id": p["id"],
                "name": p["name"],
                "brand": p["brand"],
                "price": p["price"],
            }
            for p in DEMO_PRODUCTS
        ]
    }


@app.get("/brands")
async def get_brands():
    """Get brand carbon footprint and transparency data."""
    return {"brands": BRAND_DATA}


@app.get("/certifications")
async def get_certifications():
    """Get the certification registry."""
    return {
        "certifications": {
            k: v
            for k, v in CERTIFICATIONS.items()
            if v.get("legitimate") is True and v.get("strength", 0) >= 6
        }
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
