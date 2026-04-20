# Technical Design Document

## Overview

This design covers the VÉRA greenwashing scanner redesign across three pillars: cold-start resilience, a vibrant light-themed UI with Framer Motion animations, and new user-facing features (comparison mode, scan history, shareable results). The implementation targets the existing Next.js 14 / React 19 frontend, Node.js/Express backend, and Python/FastAPI ML service.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (Vercel)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Keep-Alive   │  │ Animation    │  │ Feature Modules   │  │
│  │ Service      │  │ System       │  │                   │  │
│  │ (useEffect   │  │ (Framer      │  │ - ComparisonMode  │  │
│  │  + setInterval│  │  Motion)     │  │ - ScanHistory     │  │
│  │  + retry)    │  │              │  │ - ShareSystem     │  │
│  └──────┬───────┘  └──────────────┘  └───────────────────┘  │
│         │                                                    │
│  ┌──────┴───────────────────────────────────────────────┐   │
│  │              API Client Layer                         │   │
│  │  (fetch wrapper with retry, timeout, error typing)    │   │
│  └──────────────────────┬────────────────────────────────┘   │
└─────────────────────────┼────────────────────────────────────┘
                          │
              ┌───────────┴───────────┐
              │   Express Backend     │
              │   (Render free tier)  │
              └───────────┬───────────┘
                          │
              ┌───────────┴───────────┐
              │   FastAPI ML Service  │
              │   (Render free tier)  │
              └───────────────────────┘
```

### Component Architecture

```
page.js (main orchestrator)
├── AnimatePresence (state transitions)
│   ├── HeroSection (idle state)
│   │   ├── AnimatedGradientBg
│   │   ├── ScannerInput (pill tabs, URL/text/demo)
│   │   └── RetailerBadges
│   ├── LoadingScreen (loading state)
│   │   ├── StepProgress (animated steps)
│   │   └── ColdStartMessage (conditional)
│   ├── ErrorState (error state)
│   │   ├── ErrorCard (typed errors)
│   │   └── RetryButton
│   └── ResultsView (results state)
│       ├── ProductBanner
│       ├── ScoreDisplay
│       ├── SubScores
│       ├── Flags
│       ├── BentoGrid (scroll-animated cards)
│       │   ├── MaterialChart
│       │   ├── VaguenessMeter
│       │   ├── CertificationCard
│       │   ├── BuzzwordRadar
│       │   └── CarbonTimeline
│       ├── ShareButton
│       └── ResetButton
├── ComparisonMode (separate view)
│   ├── DualScannerInput
│   └── SideBySideResults
├── ScanHistoryPanel
│   ├── HistoryList
│   └── ClearHistoryButton
├── FAQSection (accordion)
└── Footer (bento-grid)
```

## Design Decisions

### 1. Keep-Alive Strategy: Client-Side Interval with Retry

**Decision:** Implement keep-alive as a client-side React hook (`useKeepAlive`) that runs in the main page component.

**Rationale:** The existing server-side API route (`/api/keep-alive/route.js`) only fires on page load. A client-side interval ensures pings continue while the user has the tab open. This avoids needing a cron job or external service, keeping the solution within the free tier.

**Implementation:**
- Custom hook `useKeepAlive` with `setInterval` at 10-minute intervals
- Pings both `/api/health` (backend) and ML service health endpoint via the existing keep-alive API route
- Retry logic: 3 attempts with 5-second delays using a simple async retry helper
- Cleanup on unmount to prevent memory leaks

### 2. API Client with Retry and Error Typing

**Decision:** Create a centralized API client module (`lib/apiClient.js`) that wraps `fetch` with retry logic, timeouts, and error classification.

**Rationale:** The current `page.js` has inline fetch calls with no retry logic. Centralizing this provides consistent error handling, makes cold-start retries automatic, and enables typed error states for the UI.

**Implementation:**
- `apiClient.js` exports `analyzeProduct(input)` and `pingHealth()`
- Configurable retry count (default 2 retries), exponential backoff (5s, 10s)
- 90-second AbortController timeout per request
- Error classification: `COLD_START`, `NETWORK_ERROR`, `SCRAPE_FAILED`, `ML_ERROR`, `RATE_LIMITED`, `UNKNOWN`

### 3. Design System Migration: CSS Custom Properties

**Decision:** Migrate the design system by updating CSS custom properties in `globals.css` rather than introducing a CSS-in-JS solution or Tailwind.

**Rationale:** The project already uses CSS Modules with CSS custom properties. Changing the token values in `:root` propagates the new theme to all components. This is the least disruptive approach and maintains the existing architecture.

**Key token changes:**
- `--bg-primary`: `#000000` → `#fafafa` (near-white)
- `--bg-card`: glassmorphism → `#ffffff` with solid border
- `--text-primary`: `#ffffff` → `#1d1c1c` (near-black)
- New gradient tokens: `--gradient-hero`, `--gradient-accent-1`, `--gradient-accent-2`
- Card style: remove `backdrop-filter`, add `border: 1px solid #1d1c1c`, `box-shadow: 0 6px #1d1c1c`

### 4. Framer Motion Integration: Incremental Replacement

**Decision:** Add Framer Motion as a dependency and incrementally replace Intersection Observer usage with Framer Motion equivalents.

**Rationale:** Framer Motion provides `whileInView`, `AnimatePresence`, and `motion` components that cover all current animation needs plus the new requirements (page transitions, accordion, staggered reveals). Replacing Intersection Observer removes custom animation code in favor of a declarative API.

**Implementation:**
- Install `framer-motion` package
- Create reusable animation wrapper components: `ScrollReveal`, `PageTransition`, `StaggerContainer`
- Replace `useEffect` + `IntersectionObserver` in `ScoreDisplay`, `VaguenessMeter`, `CarbonTimeline` with `motion.div` + `whileInView`
- Wrap page state transitions in `AnimatePresence` in `page.js`

### 5. Scan History: localStorage with JSON Serialization

**Decision:** Store scan history as a JSON array in localStorage with a 50-entry cap.

**Rationale:** localStorage is the simplest persistence mechanism that works without a backend database. 50 entries at ~5KB each stays well within the 5MB localStorage limit. No user accounts are needed.

**Data structure per entry:**
```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "product": { "name": "", "retailer": "", "price": "" },
  "score": 7.2,
  "verdict": "Mostly Legitimate",
  "analysis": { /* full analysis object */ }
}
```

### 6. Share System: URL Hash Encoding + html2canvas

**Decision:** Use URL hash with compressed/encoded summary data for link sharing, and `html2canvas` for image generation.

**Rationale:** URL hash avoids server-side storage. The summary (not full analysis) is encoded to keep URLs reasonable length. `html2canvas` is a well-established library for DOM-to-image conversion.

**Implementation:**
- Share link: encode `{ product, score, verdict, breakdown }` as base64 in URL hash
- Share image: use `html2canvas` to capture the score card area as PNG
- On load, check for hash data and display shared results in a read-only view

### 7. Comparison Mode: Dual State Management

**Decision:** Implement comparison mode as a separate view state in `page.js` with two independent analysis pipelines.

**Rationale:** Keeping comparison as a page-level state (alongside idle/loading/results/error) simplifies routing (no new pages needed) and reuses existing components.

**Implementation:**
- New state value: `comparison`
- `ComparisonMode` component manages two independent `{ input, state, result }` objects
- Reuses `ScannerInput` and all result display components
- Side-by-side layout with CSS Grid (2 columns on desktop, 1 on mobile)

## File Structure

```
frontend/
├── app/
│   ├── globals.css              (updated: light theme tokens)
│   ├── layout.js                (updated: new fonts if needed)
│   ├── page.js                  (updated: AnimatePresence, new states)
│   └── page.module.css          (updated: light theme styles)
├── components/
│   ├── AnimatedGradientBg.jsx   (new: hero gradient background)
│   ├── AnimatedGradientBg.module.css
│   ├── BuzzwordRadar.jsx        (updated: light theme, Framer Motion)
│   ├── BuzzwordRadar.module.css
│   ├── CarbonTimeline.jsx       (updated: remove IntersectionObserver)
│   ├── CarbonTimeline.module.css
│   ├── CertificationCard.jsx    (updated: light theme)
│   ├── CertificationCard.module.css
│   ├── ComparisonMode.jsx       (new)
│   ├── ComparisonMode.module.css
│   ├── ErrorState.jsx           (new: typed error display)
│   ├── ErrorState.module.css
│   ├── FAQSection.jsx           (new: accordion)
│   ├── FAQSection.module.css
│   ├── Footer.jsx               (new: bento-grid footer)
│   ├── Footer.module.css
│   ├── LoadingScreen.jsx        (updated: step progress, cold-start msg)
│   ├── LoadingScreen.module.css
│   ├── MaterialChart.jsx        (updated: light theme)
│   ├── MaterialChart.module.css
│   ├── ScanHistoryPanel.jsx     (new)
│   ├── ScanHistoryPanel.module.css
│   ├── ScannerInput.jsx         (updated: pill tabs, light theme)
│   ├── ScannerInput.module.css
│   ├── ScoreDisplay.jsx         (updated: remove IntersectionObserver)
│   ├── ScoreDisplay.module.css
│   ├── ScrollReveal.jsx         (new: reusable Framer Motion wrapper)
│   ├── ShareButton.jsx          (new)
│   ├── ShareButton.module.css
│   ├── VaguenessMeter.jsx       (updated: remove IntersectionObserver)
│   └── VaguenessMeter.module.css
├── lib/
│   ├── apiClient.js             (new: fetch wrapper with retry)
│   ├── scanHistory.js           (new: localStorage CRUD)
│   └── shareUtils.js            (new: URL encoding, image gen)
├── hooks/
│   └── useKeepAlive.js          (new: periodic ping hook)
└── package.json                 (updated: + framer-motion, html2canvas)
```

## Correctness Properties

### Property 1: FAQ Accordion — At Most One Open Item (Requirement 10, Criterion 4)

**Type:** Invariant

**Description:** For any sequence of user clicks on FAQ items, at most one FAQ answer is expanded at any time.

**Property:** After any click event on an FAQ question, the count of items in the "open" state is either 0 or 1.

**Test approach:** Generate random sequences of click indices (0 to N-1 where N is the number of FAQ items). After each click, assert that the number of open items is <= 1.

### Property 2: Comparison Mode — Color Coding Correctness (Requirement 12, Criterion 3)

**Type:** Metamorphic

**Description:** For any two product scores in a given category, the product with the higher score receives the "better" color indicator (green) and the product with the lower score receives the "worse" color indicator (red). Equal scores receive a neutral indicator.

**Property:** Given `scoreA` and `scoreB` for any category, if `scoreA > scoreB` then product A is green and product B is red; if `scoreA < scoreB` then product A is red and product B is green; if `scoreA === scoreB` then both are neutral.

**Test approach:** Generate random pairs of scores (0-10) for each category. Verify the color assignment function returns the correct indicator for each pair.

### Property 3: Scan History — Round-Trip Persistence (Requirement 13, Criterion 1)

**Type:** Round-trip

**Description:** Any valid scan result that is saved to localStorage can be retrieved and is equivalent to the original.

**Property:** For any valid scan entry object, `deserialize(serialize(entry))` produces an object deeply equal to the original entry.

**Test approach:** Generate random scan entry objects with varying product names, scores (0-10), verdicts, timestamps, and nested analysis data. Serialize to localStorage format (JSON.stringify), then deserialize (JSON.parse) and assert deep equality.

### Property 4: Scan History — Maximum Size Invariant (Requirement 13, Criterion 4)

**Type:** Invariant

**Description:** The scan history never exceeds 50 entries regardless of how many scans are added.

**Property:** After any sequence of `addScan` operations, `getHistory().length <= 50`.

**Test approach:** Generate random sequences of 1-200 scan additions. After each addition, assert the history length is at most 50. Also verify that the most recent scan is always present and the oldest entries are the ones removed.

### Property 5: Scan History — Sorted by Most Recent (Requirement 13, Criterion 2)

**Type:** Invariant

**Description:** The scan history is always sorted by timestamp in descending order (most recent first).

**Property:** For all consecutive pairs `(history[i], history[i+1])`, `history[i].timestamp >= history[i+1].timestamp`.

**Test approach:** Generate random sequences of scan additions with varying timestamps. After each addition, verify the returned history array is sorted descending by timestamp.

### Property 6: Share URL — Round-Trip Encoding (Requirement 14, Criteria 2 & 4)

**Type:** Round-trip

**Description:** Encoding analysis summary data into a shareable URL and then decoding it produces equivalent data.

**Property:** For any valid share data object, `decodeShareData(encodeShareData(data))` is deeply equal to the original data.

**Test approach:** Generate random share data objects with varying product names, scores, verdicts, and breakdown objects. Encode to URL hash format, decode back, and assert deep equality.

### Property 7: Error Type Classification — Distinct Error States (Requirement 16, Criterion 3)

**Type:** Metamorphic

**Description:** Different error types always produce distinct error messages and suggested actions.

**Property:** For any two different error type inputs from the set {COLD_START, NETWORK_ERROR, SCRAPE_FAILED, ML_ERROR, RATE_LIMITED}, the resulting error card content (message and suggestion) is different.

**Test approach:** Enumerate all error types and verify that the `getErrorDisplay(errorType)` function returns unique message/suggestion pairs for each type.

## API Changes

No backend API changes are required. The frontend will use the existing endpoints:
- `POST /api/analyze` — main analysis
- `POST /api/analyze/demo` — demo analysis
- `GET /api/health` — health check (used by keep-alive)
- `GET /api/keep-alive` — existing Vercel API route (enhanced with periodic calling)

## Testing Strategy

- **Property-based tests** for scan history (round-trip, max size, sort order), share URL encoding (round-trip), comparison color coding, FAQ accordion invariant, and error type classification
- **Component tests** for new components (FAQSection, ComparisonMode, ScanHistoryPanel, ShareButton, ErrorState) using React Testing Library
- **Integration tests** for the API client retry logic with mocked fetch
- **Visual verification** for design system migration (manual review of light theme, gradients, typography)
- **Accessibility** manual testing with screen readers and keyboard navigation for WCAG AA compliance
