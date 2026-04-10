"""
VÉRA Greenwashing Analyzer
NLP pipeline for detecting greenwashing in fashion product descriptions.
Uses spaCy for text processing and a rule-based classification system.
"""

import re
import math
from typing import Optional
import spacy

from sustainability_db import (
    MATERIAL_SCORES,
    GREENWASHING_BUZZWORDS,
    CERTIFICATIONS,
    BRAND_DATA,
    VAGUENESS_PATTERNS,
)


class AnalysisResult:
    """Structured result from greenwashing analysis."""

    def __init__(self):
        self.eco_score: float = 0.0
        self.material_score: float = 0.0
        self.buzzword_score: float = 0.0
        self.certification_score: float = 0.0
        self.vagueness_score: float = 0.0

        self.materials_found: list = []
        self.buzzwords_found: list = []
        self.certifications_found: list = []
        self.vagueness_phrases: list = []

        self.brand_data: Optional[dict] = None
        self.verdict: str = ""
        self.confidence: float = 0.0
        self.flags: list = []

    def to_dict(self) -> dict:
        return {
            "eco_score": round(self.eco_score, 1),
            "breakdown": {
                "material_score": round(self.material_score, 1),
                "buzzword_score": round(self.buzzword_score, 1),
                "certification_score": round(self.certification_score, 1),
                "vagueness_score": round(self.vagueness_score, 1),
            },
            "materials": self.materials_found,
            "buzzwords": self.buzzwords_found,
            "certifications": self.certifications_found,
            "vagueness_phrases": self.vagueness_phrases,
            "brand_data": self.brand_data,
            "verdict": self.verdict,
            "confidence": round(self.confidence, 2),
            "flags": self.flags,
        }


class GreenwashingAnalyzer:
    """
    Multi-stage NLP pipeline for greenwashing detection.

    Pipeline stages:
    1. Material Extraction & Scoring
    2. Buzzword Detection & Severity Assessment
    3. Certification Validation
    4. Vagueness Analysis
    5. Final Eco-Score Synthesis
    """

    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            import subprocess
            subprocess.run(
                ["python", "-m", "spacy", "download", "en_core_web_sm"],
                check=True,
            )
            self.nlp = spacy.load("en_core_web_sm")

    def analyze(
        self,
        text: str,
        materials: Optional[dict] = None,
        brand: Optional[str] = None,
    ) -> AnalysisResult:
        """
        Run the full greenwashing analysis pipeline.

        Args:
            text: Product description / marketing text
            materials: Optional dict of {material_name: percentage}
            brand: Optional brand name for context enrichment
        """
        result = AnalysisResult()
        doc = self.nlp(text.lower())
        text_lower = text.lower()

        # ── Stage 1: Material Analysis ──
        self._analyze_materials(text_lower, materials, result)

        # ── Stage 2: Buzzword Detection ──
        self._detect_buzzwords(text_lower, doc, result)

        # ── Stage 3: Certification Validation ──
        self._validate_certifications(text_lower, result)

        # ── Stage 4: Vagueness Analysis ──
        self._analyze_vagueness(text_lower, doc, result)

        # ── Stage 5: Brand Context ──
        if brand:
            self._enrich_brand_data(brand.lower(), result)

        # ── Stage 6: Synthesize Final Score ──
        self._calculate_eco_score(result)

        # ── Stage 7: Generate Verdict ──
        self._generate_verdict(result)

        return result

    def _analyze_materials(
        self,
        text: str,
        provided_materials: Optional[dict],
        result: AnalysisResult,
    ):
        """Extract and score material composition."""
        materials = {}

        # Use provided materials if available
        if provided_materials:
            materials = {k.lower(): v for k, v in provided_materials.items()}
        else:
            # Try to extract from text using regex
            # Pattern: "XX% material_name"
            pattern = r"(\d+(?:\.\d+)?)\s*%\s*([a-zA-Z\s]+?)(?=[,.\d]|$)"
            matches = re.findall(pattern, text)

            for pct, mat in matches:
                mat_clean = mat.strip().lower()
                if mat_clean and len(mat_clean) > 1:
                    materials[mat_clean] = float(pct)

        # Score each material
        total_weight = 0
        weighted_score = 0

        for mat_name, percentage in materials.items():
            # Find best match in our database
            score = self._find_material_score(mat_name)
            sustainability = "unknown"

            if score is not None:
                weighted_score += score * (percentage / 100)
                total_weight += percentage / 100

                if score >= 7.0:
                    sustainability = "good"
                elif score >= 4.5:
                    sustainability = "moderate"
                else:
                    sustainability = "poor"

            result.materials_found.append({
                "name": mat_name.title(),
                "percentage": percentage,
                "sustainability_score": score if score is not None else 0,
                "sustainability": sustainability,
            })

        # Calculate final material score
        if total_weight > 0:
            result.material_score = weighted_score / total_weight
        else:
            # No materials found — neutral score
            result.material_score = 5.0
            result.flags.append("No material composition data found — score may be less accurate")

        # Flag concerning patterns
        synth_pct = sum(
            m["percentage"]
            for m in result.materials_found
            if m["sustainability"] == "poor"
        )
        if synth_pct > 70:
            result.flags.append(
                f"{synth_pct:.0f}% of this product is made from low-sustainability synthetic materials"
            )

    def _find_material_score(self, material_name: str) -> Optional[float]:
        """Find the best matching material score from our database."""
        material_name = material_name.strip().lower()

        # Direct match
        if material_name in MATERIAL_SCORES:
            return MATERIAL_SCORES[material_name]

        # Partial match — check if any DB key is contained in the name or vice versa
        for db_mat, score in MATERIAL_SCORES.items():
            if db_mat in material_name or material_name in db_mat:
                return score

        return None

    def _detect_buzzwords(self, text: str, doc, result: AnalysisResult):
        """Detect greenwashing buzzwords and assess severity."""
        found = []
        total_severity = 0

        for buzzword, info in GREENWASHING_BUZZWORDS.items():
            if buzzword in text:
                # Find the context (surrounding sentence)
                idx = text.find(buzzword)
                start = max(0, idx - 40)
                end = min(len(text), idx + len(buzzword) + 40)
                context = "..." + text[start:end] + "..."

                found.append({
                    "term": buzzword,
                    "category": info["category"],
                    "severity": info["severity"],
                    "explanation": info["explanation"],
                    "context": context,
                })
                total_severity += info["severity"]

        result.buzzwords_found = sorted(found, key=lambda x: x["severity"], reverse=True)

        # Calculate buzzword score (inverse — more buzzwords = lower score)
        if found:
            # Normalize: max expected severity for a heavily greenwashed text is ~40
            normalized = min(total_severity / 30, 1.0)
            result.buzzword_score = 10 * (1 - normalized)
        else:
            result.buzzword_score = 9.0  # No buzzwords is great

    def _validate_certifications(self, text: str, result: AnalysisResult):
        """Check for legitimate vs. self-invented certifications."""
        found_certs = []
        legit_count = 0
        fake_count = 0

        for cert_key, cert_info in CERTIFICATIONS.items():
            if cert_key in text:
                # Avoid duplicates (e.g., "fair trade" and "fair trade certified")
                already_found = any(c["name"] == cert_info["name"] for c in found_certs)
                if not already_found:
                    found_certs.append({
                        "name": cert_info["name"],
                        "legitimate": cert_info["legitimate"],
                        "strength": cert_info["strength"],
                        "description": cert_info["description"],
                    })
                    if cert_info["legitimate"] and cert_info["strength"] >= 6:
                        legit_count += 1
                    elif not cert_info["legitimate"]:
                        fake_count += 1

        result.certifications_found = found_certs

        # Score based on certification quality
        if found_certs:
            if legit_count > 0 and fake_count == 0:
                avg_strength = sum(c["strength"] for c in found_certs) / len(found_certs)
                result.certification_score = min(avg_strength + 1, 10)
            elif legit_count > fake_count:
                result.certification_score = 6.0
            elif fake_count > legit_count:
                result.certification_score = 3.0
                result.flags.append("Product relies on self-invented labels instead of independent certifications")
            else:
                result.certification_score = 5.0
        else:
            result.certification_score = 4.0  # No certifications — slightly below neutral

    def _analyze_vagueness(self, text: str, doc, result: AnalysisResult):
        """Detect hedging and vague language patterns."""
        found = []

        for pattern in VAGUENESS_PATTERNS:
            if pattern in text:
                idx = text.find(pattern)
                start = max(0, idx - 30)
                end = min(len(text), idx + len(pattern) + 30)
                context = "..." + text[start:end] + "..."

                found.append({
                    "phrase": pattern,
                    "context": context,
                })

        result.vagueness_phrases = found

        # Score: more vagueness = lower score
        word_count = len(text.split())
        vague_density = len(found) / max(word_count / 20, 1)  # Normalize by text length
        result.vagueness_score = max(10 - (vague_density * 4), 1)

    def _enrich_brand_data(self, brand: str, result: AnalysisResult):
        """Add brand context and carbon footprint data."""
        brand_clean = brand.strip().lower()

        # Check for brand matches
        for brand_key, data in BRAND_DATA.items():
            if brand_key in brand_clean or brand_clean in brand_key:
                result.brand_data = {
                    "name": data["name"],
                    "emissions": data["emissions"],
                    "transparency_score": data["transparency_score"],
                    "notes": data["notes"],
                    "revenue_billions": data.get("revenue_billions"),
                }

                if data["transparency_score"] < 30:
                    result.flags.append(
                        f"{data['name']} has a very low transparency score ({data['transparency_score']}/100)"
                    )
                break

    def _calculate_eco_score(self, result: AnalysisResult):
        """
        Synthesize the final True Eco-Score from all sub-scores.

        Weights:
        - Material composition: 35% (what it's actually made of matters most)
        - Buzzword analysis: 25% (how deceptive is the marketing)
        - Certification quality: 20% (are claims verified)
        - Vagueness: 20% (is the language specific or hedging)
        """
        weights = {
            "material": 0.35,
            "buzzword": 0.25,
            "certification": 0.20,
            "vagueness": 0.20,
        }

        raw_score = (
            result.material_score * weights["material"]
            + result.buzzword_score * weights["buzzword"]
            + result.certification_score * weights["certification"]
            + result.vagueness_score * weights["vagueness"]
        )

        # Brand transparency modifier (±0.5 max)
        if result.brand_data:
            transparency = result.brand_data["transparency_score"]
            modifier = (transparency - 50) / 100  # ±0.5
            raw_score += modifier

        # Clamp to 0-10
        result.eco_score = max(0.0, min(10.0, raw_score))

        # Confidence based on data completeness
        data_points = 0
        if result.materials_found: data_points += 2
        if result.buzzwords_found: data_points += 1
        if result.certifications_found: data_points += 1
        if result.vagueness_phrases: data_points += 1
        if result.brand_data: data_points += 1
        result.confidence = min(data_points / 5, 1.0)

    def _generate_verdict(self, result: AnalysisResult):
        """Generate a human-readable verdict summary."""
        score = result.eco_score
        buzzword_count = len(result.buzzwords_found)
        high_severity = sum(1 for b in result.buzzwords_found if b["severity"] >= 4)
        legit_certs = sum(1 for c in result.certifications_found if c["legitimate"])

        if score >= 8.0:
            result.verdict = (
                "Genuinely sustainable. This product backs its claims with legitimate "
                "certifications and high-quality materials."
            )
        elif score >= 6.5:
            result.verdict = (
                "Mostly legitimate with room for improvement. Some claims are "
                "substantiated, but watch for vague language."
            )
        elif score >= 5.0:
            result.verdict = (
                "Mixed signals. The product makes sustainability claims but relies "
                "heavily on marketing language over verifiable data."
            )
        elif score >= 3.5:
            if high_severity >= 3:
                result.verdict = (
                    f"Significant greenwashing detected. Found {buzzword_count} misleading "
                    f"buzzwords ({high_severity} high-severity). Claims are not backed by "
                    "independent certifications."
                )
            else:
                result.verdict = (
                    "Below average sustainability. Materials are predominantly synthetic "
                    "and environmental claims lack substance."
                )
        else:
            result.verdict = (
                f"Heavy greenwashing. This product uses {buzzword_count} deceptive marketing "
                f"terms to disguise a fundamentally unsustainable product. "
                "Do not trust the eco-branding."
            )
