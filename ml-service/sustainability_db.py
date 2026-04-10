"""
VÉRA Sustainability Database
Comprehensive database of material sustainability scores, greenwashing buzzwords,
legitimate certifications, and brand environmental data.
"""

# ─────────────────────────────────────────────────────────────
# MATERIAL SUSTAINABILITY SCORES (0-10 scale)
# Sources: Higg MSI, MADE-BY Benchmark, Textile Exchange
# ─────────────────────────────────────────────────────────────

MATERIAL_SCORES = {
    # ── Natural & Organic (Higher scores) ──
    "organic cotton": 8.5,
    "organic linen": 9.0,
    "organic hemp": 9.2,
    "organic wool": 7.8,
    "hemp": 8.8,
    "linen": 8.2,
    "flax": 8.2,
    "ramie": 7.5,
    "jute": 8.0,
    "tencel": 8.5,
    "lyocell": 8.5,
    "modal": 7.2,
    "bamboo lyocell": 7.8,
    "cupro": 6.8,
    "piñatex": 8.0,
    "mylo": 8.5,
    "econyl": 8.2,
    "cork": 9.0,

    # ── Recycled Materials (Good scores) ──
    "recycled polyester": 7.0,
    "recycled nylon": 7.8,
    "recycled cotton": 7.5,
    "recycled wool": 7.2,
    "recycled cashmere": 7.0,
    "recycled plastic": 6.5,
    "recycled rubber": 6.8,
    "post-consumer recycled": 7.0,
    "pre-consumer recycled": 6.5,
    "upcycled": 8.0,

    # ── Conventional Natural (Mid scores) ──
    "cotton": 5.0,
    "conventional cotton": 4.5,
    "wool": 5.5,
    "silk": 5.0,
    "cashmere": 3.8,
    "down": 4.0,
    "feather": 4.0,
    "leather": 3.5,
    "suede": 3.5,
    "bamboo": 5.5,
    "rubber": 5.0,

    # ── Semi-Synthetic (Lower-mid scores) ──
    "viscose": 4.5,
    "rayon": 4.2,
    "bamboo viscose": 4.0,
    "acetate": 4.5,
    "triacetate": 4.2,

    # ── Synthetic (Low scores) ──
    "polyester": 2.5,
    "virgin polyester": 2.0,
    "nylon": 2.8,
    "acrylic": 2.0,
    "spandex": 3.0,
    "elastane": 3.0,
    "lycra": 3.0,
    "polypropylene": 2.2,
    "polyurethane": 2.5,
    "pu leather": 2.8,
    "faux leather": 3.0,
    "pvc": 1.0,
    "vinyl": 1.0,
    "microfiber": 2.2,
    "polyamide": 2.8,
    "modacrylic": 2.0,
    "metallic fiber": 2.5,
}

# ─────────────────────────────────────────────────────────────
# GREENWASHING BUZZWORD TAXONOMY
# Categories: vague_claims, misleading_labels, unsubstantiated, deflection
# Severity: 1 (mild) to 5 (egregious)
# ─────────────────────────────────────────────────────────────

GREENWASHING_BUZZWORDS = {
    # ── Vague & Meaningless Claims ──
    "eco-friendly": {"category": "vague_claims", "severity": 4, "explanation": "Has no standardized definition or certification requirement"},
    "eco friendly": {"category": "vague_claims", "severity": 4, "explanation": "Has no standardized definition or certification requirement"},
    "environmentally friendly": {"category": "vague_claims", "severity": 4, "explanation": "No regulatory standard defines what this means"},
    "green": {"category": "vague_claims", "severity": 3, "explanation": "Meaningless without specific, verifiable metrics"},
    "sustainable": {"category": "vague_claims", "severity": 3, "explanation": "Overused term with no universally agreed-upon definition in fashion"},
    "sustainability": {"category": "vague_claims", "severity": 3, "explanation": "Often used without measurable targets or timelines"},
    "conscious": {"category": "vague_claims", "severity": 4, "explanation": "A marketing term with no legal or certification backing"},
    "conscious choice": {"category": "vague_claims", "severity": 5, "explanation": "H&M's heavily criticized label — sued for misleading claims"},
    "conscious collection": {"category": "vague_claims", "severity": 5, "explanation": "Marketing label masquerading as a sustainability standard"},
    "earth-friendly": {"category": "vague_claims", "severity": 4, "explanation": "No measurable criteria behind this claim"},
    "planet-friendly": {"category": "vague_claims", "severity": 4, "explanation": "No measurable criteria behind this claim"},
    "nature-inspired": {"category": "vague_claims", "severity": 3, "explanation": "Aesthetic descriptor falsely implying environmental benefit"},
    "clean": {"category": "vague_claims", "severity": 3, "explanation": "No standard definition in fashion context"},
    "pure": {"category": "vague_claims", "severity": 2, "explanation": "Suggests naturalness without evidence"},
    "natural": {"category": "vague_claims", "severity": 2, "explanation": "Can mean many things — natural leather is still environmentally taxing"},
    "better for the planet": {"category": "vague_claims", "severity": 4, "explanation": "Comparative claim with no baseline specified"},
    "kind to the earth": {"category": "vague_claims", "severity": 4, "explanation": "Emotional language with zero measurable backing"},
    "responsibly made": {"category": "vague_claims", "severity": 3, "explanation": "No standard defines 'responsible' manufacturing"},
    "responsibly sourced": {"category": "vague_claims", "severity": 3, "explanation": "Often unverifiable without third-party audit"},
    "mindful": {"category": "vague_claims", "severity": 3, "explanation": "Marketing buzzword with no environmental meaning"},
    "thoughtfully designed": {"category": "vague_claims", "severity": 2, "explanation": "Design intent does not equal environmental impact"},
    "curated": {"category": "vague_claims", "severity": 1, "explanation": "Selection process says nothing about sustainability"},

    # ── Misleading Labels & Self-Certifications ──
    "join life": {"category": "misleading_labels", "severity": 4, "explanation": "Zara's internal label — not an independent certification"},
    "committed": {"category": "misleading_labels", "severity": 3, "explanation": "States intention, not achievement"},
    "towards sustainability": {"category": "misleading_labels", "severity": 4, "explanation": "Implies a journey with no destination or timeline"},
    "low impact": {"category": "misleading_labels", "severity": 3, "explanation": "Relative claim — low compared to what?"},
    "reduced impact": {"category": "misleading_labels", "severity": 3, "explanation": "Reduced from what baseline? By how much?"},
    "carbon neutral": {"category": "misleading_labels", "severity": 3, "explanation": "Often achieved through offset purchases, not actual emission reduction"},
    "climate positive": {"category": "misleading_labels", "severity": 3, "explanation": "Rarely backed by verifiable data"},
    "net zero": {"category": "misleading_labels", "severity": 2, "explanation": "Usually a future pledge, not current status"},
    "circular": {"category": "misleading_labels", "severity": 2, "explanation": "True circularity is extremely rare in fashion"},
    "zero waste": {"category": "misleading_labels", "severity": 3, "explanation": "Usually refers only to manufacturing, not full lifecycle"},
    "biodegradable": {"category": "misleading_labels", "severity": 3, "explanation": "Most textiles only biodegrade under specific industrial conditions"},
    "compostable": {"category": "misleading_labels", "severity": 2, "explanation": "Requires industrial composting — won't break down in landfill"},
    "plant-based": {"category": "misleading_labels", "severity": 2, "explanation": "Plant-derived materials can still be chemically intensive"},

    # ── Unsubstantiated & Exaggerated Claims ──
    "saving the planet": {"category": "unsubstantiated", "severity": 5, "explanation": "Hyperbolic claim impossible for a fashion brand to achieve"},
    "100% sustainable": {"category": "unsubstantiated", "severity": 5, "explanation": "No product can be 100% sustainable"},
    "completely sustainable": {"category": "unsubstantiated", "severity": 5, "explanation": "Absolute claims are always false in manufacturing"},
    "chemical-free": {"category": "unsubstantiated", "severity": 5, "explanation": "Everything is made of chemicals — this is scientifically meaningless"},
    "toxin-free": {"category": "unsubstantiated", "severity": 4, "explanation": "Vague claim — what specific toxins were tested?"},
    "all natural": {"category": "unsubstantiated", "severity": 4, "explanation": "Rarely true for finished textile products"},
    "cruelty-free": {"category": "unsubstantiated", "severity": 2, "explanation": "Meaningful only with specific certification (e.g., Leaping Bunny)"},
    "ethical": {"category": "unsubstantiated", "severity": 3, "explanation": "Subjective term — ethical by whose standards?"},
    "fair": {"category": "unsubstantiated", "severity": 2, "explanation": "Without Fair Trade certification, this is meaningless"},
    "transparent": {"category": "unsubstantiated", "severity": 2, "explanation": "Transparency is a process, not a product attribute"},
    "traceable": {"category": "unsubstantiated", "severity": 2, "explanation": "Only meaningful with published supply chain data"},

    # ── Hedging & Deflection Language ──
    "up to": {"category": "deflection", "severity": 3, "explanation": "Inflates best-case scenario — actual impact likely lower"},
    "partially": {"category": "deflection", "severity": 3, "explanation": "What percentage is 'partial'?"},
    "some of our": {"category": "deflection", "severity": 3, "explanation": "Cherry-picks best products while rest is unchanged"},
    "working towards": {"category": "deflection", "severity": 3, "explanation": "Future promise with no accountability"},
    "striving to": {"category": "deflection", "severity": 3, "explanation": "Effort framing without results"},
    "aiming to": {"category": "deflection", "severity": 3, "explanation": "Goals are not achievements"},
    "by 2030": {"category": "deflection", "severity": 2, "explanation": "Distant target with no interim milestones"},
    "by 2040": {"category": "deflection", "severity": 3, "explanation": "So far away it's essentially meaningless"},
    "by 2050": {"category": "deflection", "severity": 4, "explanation": "A quarter century away — no accountability"},
    "inspired by nature": {"category": "deflection", "severity": 3, "explanation": "Aesthetic branding, not environmental action"},
    "made with care": {"category": "deflection", "severity": 2, "explanation": "Emotional appeal with no environmental relevance"},
    "designed to last": {"category": "deflection", "severity": 1, "explanation": "Good if true, but often marketing for fast fashion"},
    "more sustainable": {"category": "deflection", "severity": 3, "explanation": "Comparative without a baseline — more than what?"},
    "less water": {"category": "deflection", "severity": 2, "explanation": "Relative claim — less than the industry average? Than their own past?"},
    "fewer emissions": {"category": "deflection", "severity": 2, "explanation": "Relative claim needing quantification"},
}

# ─────────────────────────────────────────────────────────────
# LEGITIMATE CERTIFICATIONS
# ─────────────────────────────────────────────────────────────

CERTIFICATIONS = {
    "gots": {
        "name": "GOTS (Global Organic Textile Standard)",
        "legitimate": True,
        "strength": 9,
        "description": "Requires 70%+ organic fibers, strict chemical and social criteria",
        "url": "https://global-standard.org/"
    },
    "oeko-tex": {
        "name": "OEKO-TEX Standard 100",
        "legitimate": True,
        "strength": 7,
        "description": "Tests for harmful substances in finished textiles",
        "url": "https://www.oeko-tex.com/"
    },
    "oeko-tex standard 100": {
        "name": "OEKO-TEX Standard 100",
        "legitimate": True,
        "strength": 7,
        "description": "Tests for harmful substances in finished textiles",
        "url": "https://www.oeko-tex.com/"
    },
    "bluesign": {
        "name": "bluesign®",
        "legitimate": True,
        "strength": 8,
        "description": "Holistic system for sustainable textile production",
        "url": "https://www.bluesign.com/"
    },
    "fair trade": {
        "name": "Fair Trade Certified",
        "legitimate": True,
        "strength": 8,
        "description": "Ensures fair wages and safe working conditions",
        "url": "https://www.fairtrade.net/"
    },
    "fair trade certified": {
        "name": "Fair Trade Certified",
        "legitimate": True,
        "strength": 8,
        "description": "Ensures fair wages and safe working conditions",
        "url": "https://www.fairtrade.net/"
    },
    "b corp": {
        "name": "B Corporation",
        "legitimate": True,
        "strength": 8,
        "description": "Holistic assessment of social and environmental performance",
        "url": "https://www.bcorporation.net/"
    },
    "cradle to cradle": {
        "name": "Cradle to Cradle Certified",
        "legitimate": True,
        "strength": 9,
        "description": "Evaluates material health, circularity, clean air, water stewardship, and social fairness",
        "url": "https://www.c2ccertified.org/"
    },
    "grs": {
        "name": "GRS (Global Recycled Standard)",
        "legitimate": True,
        "strength": 7,
        "description": "Verifies recycled content and responsible manufacturing",
        "url": "https://textileexchange.org/grs/"
    },
    "global recycled standard": {
        "name": "GRS (Global Recycled Standard)",
        "legitimate": True,
        "strength": 7,
        "description": "Verifies recycled content and responsible manufacturing",
        "url": "https://textileexchange.org/grs/"
    },
    "rws": {
        "name": "RWS (Responsible Wool Standard)",
        "legitimate": True,
        "strength": 7,
        "description": "Ensures animal welfare and land management in wool production",
        "url": "https://textileexchange.org/rws/"
    },
    "ocs": {
        "name": "OCS (Organic Content Standard)",
        "legitimate": True,
        "strength": 6,
        "description": "Verifies organic content claims in finished products",
        "url": "https://textileexchange.org/ocs/"
    },
    "eu ecolabel": {
        "name": "EU Ecolabel",
        "legitimate": True,
        "strength": 7,
        "description": "EU-regulated label for products meeting high environmental standards",
        "url": "https://environment.ec.europa.eu/topics/circular-economy/eu-ecolabel_en"
    },
    "fsc": {
        "name": "FSC (Forest Stewardship Council)",
        "legitimate": True,
        "strength": 7,
        "description": "Relevant for wood-based fibers like viscose and lyocell",
        "url": "https://fsc.org/"
    },
    "sa8000": {
        "name": "SA8000",
        "legitimate": True,
        "strength": 7,
        "description": "Social accountability standard for decent work conditions",
        "url": "https://sa-intl.org/programs/sa8000/"
    },

    # ── Self-Invented / Weak Labels ──
    "conscious choice": {
        "name": "Conscious Choice (H&M)",
        "legitimate": False,
        "strength": 2,
        "description": "H&M's internal program — not independently verified. Heavily criticized."
    },
    "join life": {
        "name": "Join Life (Zara/Inditex)",
        "legitimate": False,
        "strength": 3,
        "description": "Inditex's internal label with limited third-party oversight"
    },
    "better cotton": {
        "name": "Better Cotton Initiative (BCI)",
        "legitimate": True,
        "strength": 5,
        "description": "Promotes better cotton farming but does NOT guarantee the final product contains BCI cotton (mass balance)"
    },
    "higg index": {
        "name": "Higg Index",
        "legitimate": True,
        "strength": 4,
        "description": "Industry self-assessment tool — criticized for conflicts of interest and synthetic fiber bias"
    },
}

# ─────────────────────────────────────────────────────────────
# BRAND CARBON FOOTPRINT DATA (tonnes CO2e, in millions)
# Sources: Public sustainability reports, Fashion Transparency Index
# ─────────────────────────────────────────────────────────────

BRAND_DATA = {
    "h&m": {
        "name": "H&M Group",
        "emissions": {
            "2019": 5.6, "2020": 4.8, "2021": 5.1,
            "2022": 4.9, "2023": 4.5, "2024": 4.2
        },
        "transparency_score": 73,
        "notes": "Has faced lawsuits over 'Conscious Collection' greenwashing claims",
        "revenue_billions": 22.2
    },
    "zara": {
        "name": "Inditex (Zara)",
        "emissions": {
            "2019": 8.2, "2020": 6.9, "2021": 7.8,
            "2022": 7.5, "2023": 7.1, "2024": 6.8
        },
        "transparency_score": 60,
        "notes": "Join Life label covers a fraction of total production",
        "revenue_billions": 33.0
    },
    "shein": {
        "name": "SHEIN",
        "emissions": {
            "2019": 6.3, "2020": 8.1, "2021": 12.4,
            "2022": 15.8, "2023": 18.2, "2024": 20.1
        },
        "transparency_score": 7,
        "notes": "Ultra-fast fashion model with minimal transparency. Emissions rising rapidly.",
        "revenue_billions": 45.0
    },
    "nike": {
        "name": "Nike, Inc.",
        "emissions": {
            "2019": 3.8, "2020": 3.2, "2021": 3.5,
            "2022": 3.3, "2023": 3.1, "2024": 2.9
        },
        "transparency_score": 55,
        "notes": "Move to Zero campaign — mixture of genuine effort and marketing",
        "revenue_billions": 51.2
    },
    "adidas": {
        "name": "Adidas AG",
        "emissions": {
            "2019": 3.1, "2020": 2.7, "2021": 3.0,
            "2022": 2.8, "2023": 2.6, "2024": 2.4
        },
        "transparency_score": 58,
        "notes": "Parley for the Oceans partnership is genuine but limited in scale",
        "revenue_billions": 21.4
    },
    "uniqlo": {
        "name": "Fast Retailing (Uniqlo)",
        "emissions": {
            "2019": 2.1, "2020": 1.8, "2021": 2.0,
            "2022": 1.9, "2023": 1.8, "2024": 1.7
        },
        "transparency_score": 42,
        "notes": "RE.UNIQLO program for recycling — limited scope relative to production volume",
        "revenue_billions": 19.4
    },
    "asos": {
        "name": "ASOS plc",
        "emissions": {
            "2019": 0.8, "2020": 0.7, "2021": 0.9,
            "2022": 0.85, "2023": 0.75, "2024": 0.7
        },
        "transparency_score": 48,
        "notes": "'Responsible edit' filter — unclear criteria for inclusion",
        "revenue_billions": 4.2
    },
    "primark": {
        "name": "Primark (ABF)",
        "emissions": {
            "2019": 2.5, "2020": 2.1, "2021": 2.4,
            "2022": 2.3, "2023": 2.2, "2024": 2.1
        },
        "transparency_score": 25,
        "notes": "Primark Cares initiative launched — low transparency historically",
        "revenue_billions": 9.0
    },
    "gap": {
        "name": "Gap Inc.",
        "emissions": {
            "2019": 2.0, "2020": 1.7, "2021": 1.9,
            "2022": 1.8, "2023": 1.7, "2024": 1.6
        },
        "transparency_score": 51,
        "notes": "Moderate transparency efforts but declining market relevance",
        "revenue_billions": 15.6
    },
    "patagonia": {
        "name": "Patagonia",
        "emissions": {
            "2019": 0.09, "2020": 0.08, "2021": 0.10,
            "2022": 0.09, "2023": 0.085, "2024": 0.08
        },
        "transparency_score": 92,
        "notes": "Industry leader in transparency and genuine sustainability efforts",
        "revenue_billions": 1.5
    },
    "everlane": {
        "name": "Everlane",
        "emissions": {
            "2019": 0.04, "2020": 0.035, "2021": 0.038,
            "2022": 0.036, "2023": 0.034, "2024": 0.032
        },
        "transparency_score": 65,
        "notes": "'Radical Transparency' branding — good effort but some claims questioned",
        "revenue_billions": 0.2
    },
}

# ─────────────────────────────────────────────────────────────
# VAGUENESS INDICATORS
# Language patterns that dilute or deflect from concrete commitments
# ─────────────────────────────────────────────────────────────

VAGUENESS_PATTERNS = [
    "up to",
    "as much as",
    "partially",
    "some of",
    "a portion of",
    "where possible",
    "when available",
    "working towards",
    "working toward",
    "striving to",
    "aiming to",
    "committed to",
    "on a journey",
    "aspires to",
    "exploring ways",
    "looking into",
    "may contain",
    "could include",
    "inspired by",
    "in partnership with",
    "selected styles",
    "select items",
    "certain products",
    "more sustainable",
    "better than",
    "less impact",
    "reduced footprint",
    "improved",
    "progress",
    "transitioning",
]

# ─────────────────────────────────────────────────────────────
# DEMO PRODUCTS (Pre-analyzed for showcase mode)
# ─────────────────────────────────────────────────────────────

DEMO_PRODUCTS = [
    {
        "id": "demo-1",
        "name": "Conscious Choice Oversized T-Shirt",
        "brand": "h&m",
        "url": "https://www2.hm.com/example/conscious-tshirt",
        "price": "$12.99",
        "description": (
            "Part of our Conscious Choice collection. This oversized t-shirt is made with "
            "sustainably sourced cotton for a more sustainable wardrobe. We're committed to "
            "working towards a circular fashion future by 2030. Eco-friendly and designed "
            "with care for the planet. Material: 60% Cotton, 35% Polyester, 5% Elastane."
        ),
        "image_url": None,
        "materials": {"cotton": 60, "polyester": 35, "elastane": 5}
    },
    {
        "id": "demo-2",
        "name": "Regenerative Organic Cotton Tee",
        "brand": "patagonia",
        "url": "https://www.patagonia.com/example/organic-tee",
        "price": "$45.00",
        "description": (
            "Made with 100% Regenerative Organic Certified® cotton grown on farms that "
            "practice soil health, animal welfare, and farmworker fairness. Fair Trade Certified™ "
            "sewn — a premium goes directly to workers. GOTS certified organic. "
            "This tee is dyed with low-impact dyes and uses 87% less water than conventional cotton "
            "processing. Bluesign® approved fabric. Material: 100% Organic Cotton (Regenerative)."
        ),
        "image_url": None,
        "materials": {"organic cotton": 100}
    },
    {
        "id": "demo-3",
        "name": "SHEIN EcoWave Wide Leg Pants",
        "brand": "shein",
        "url": "https://www.shein.com/example/ecowave-pants",
        "price": "$8.49",
        "description": (
            "From our planet-friendly EcoWave line — saving the planet one outfit at a time! "
            "These trendy wide-leg pants are made with love, using eco-friendly fabrics that are "
            "kind to the earth. Chemical-free and all natural vibes. We're on a journey to become "
            "100% sustainable by 2050. Join us in making fashion more mindful! "
            "Material: 95% Polyester, 5% Spandex."
        ),
        "image_url": None,
        "materials": {"polyester": 95, "spandex": 5}
    },
    {
        "id": "demo-4",
        "name": "Join Life Textured Blazer",
        "brand": "zara",
        "url": "https://www.zara.com/example/join-life-blazer",
        "price": "$89.90",
        "description": (
            "Part of our Join Life commitment. This textured blazer combines style with our "
            "reduced impact approach. Made with partially recycled polyester and responsibly "
            "sourced viscose. We are aiming to use more sustainable raw materials across "
            "selected styles. Low impact dyes used where possible. "
            "Material: 55% Recycled Polyester, 30% Viscose, 10% Cotton, 5% Elastane."
        ),
        "image_url": None,
        "materials": {"recycled polyester": 55, "viscose": 30, "cotton": 10, "elastane": 5}
    },
]
