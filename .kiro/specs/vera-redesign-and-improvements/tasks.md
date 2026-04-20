# Implementation Tasks

## Task 1: Install Dependencies and Set Up Project Infrastructure

- [x] 1.1 Add `framer-motion` to frontend dependencies
- [x] 1.2 Add `html2canvas` to frontend dependencies
- [x] 1.3 Create `frontend/lib/` directory with placeholder files for `apiClient.js`, `scanHistory.js`, and `shareUtils.js`
- [x] 1.4 Create `frontend/hooks/` directory with placeholder file for `useKeepAlive.js`

## Task 2: Implement API Client with Retry Logic (Requirements 2, 16)

- [x] 2.1 Implement `frontend/lib/apiClient.js` with `analyzeProduct(input)` function that wraps fetch with 90-second AbortController timeout
- [x] 2.2 Add exponential backoff retry logic (2 retries, 5s then 10s delay) to `apiClient.js` for network errors and timeouts
- [x] 2.3 Implement error classification in `apiClient.js` that categorizes errors as `COLD_START`, `NETWORK_ERROR`, `SCRAPE_FAILED`, `ML_ERROR`, `RATE_LIMITED`, or `UNKNOWN`
- [x] 2.4 Add `pingHealth()` function to `apiClient.js` that pings backend and ML service health endpoints in parallel with 3 retries and 5-second retry delay

## Task 3: Implement Keep-Alive Hook (Requirement 1)

- [x] 3.1 Implement `frontend/hooks/useKeepAlive.js` custom hook that calls `pingHealth()` on mount and every 10 minutes via `setInterval`
- [x] 3.2 Integrate `useKeepAlive` hook into `frontend/app/page.js`

## Task 4: Migrate Design System to Light Theme (Requirements 3, 19)

- [x] 4.1 Update CSS custom properties in `frontend/app/globals.css` — replace dark theme tokens with light theme (background: `#fafafa`, text: `#1d1c1c`, card: `#ffffff` with solid borders)
- [x] 4.2 Add new gradient CSS custom properties (`--gradient-hero`, `--gradient-accent-1: cyan→green`, `--gradient-accent-2: orange→pink`)
- [x] 4.3 Replace glassmorphism card styles with new card styles (solid border `1px solid #1d1c1c`, `border-radius: 8px`, `box-shadow: 0 6px #1d1c1c`)
- [x] 4.4 Update heading typography tokens to font-weight 800, uppercase, letter-spacing -0.04em to -0.02em
- [x] 4.5 Preserve eco-spectrum color scale (green→yellow→red) and adjust for readability on light background
- [x] 4.6 Update `frontend/app/page.module.css` for light theme styles (hero, results, footer, error sections)

## Task 5: Update Existing Component Styles for Light Theme (Requirement 19)

- [x] 5.1 Update `ScannerInput.module.css` — pill-shaped tabs with rounded borders, light theme colors
- [x] 5.2 Update `ScoreDisplay.module.css` — light background, adjusted glow effects for light theme
- [x] 5.3 Update `LoadingScreen.module.css` — light theme, colorful accents
- [x] 5.4 Update `MaterialChart.module.css` — light theme bar colors and backgrounds
- [x] 5.5 Update `BuzzwordRadar.module.css` — light theme category colors and card styles
- [x] 5.6 Update `CertificationCard.module.css` — light theme section styles
- [x] 5.7 Update `VaguenessMeter.module.css` — light theme gauge and phrase styles
- [x] 5.8 Update `CarbonTimeline.module.css` — light theme chart and transparency bar styles

## Task 6: Create Animated Gradient Background Component (Requirement 3)

- [x] 6.1 Create `frontend/components/AnimatedGradientBg.jsx` with pink-to-yellow animated gradient using CSS keyframes, cycle duration 8-12 seconds
- [x] 6.2 Create `frontend/components/AnimatedGradientBg.module.css` with gradient animation styles
- [x] 6.3 Integrate `AnimatedGradientBg` into the hero section of `page.js`

## Task 7: Integrate Framer Motion Animations (Requirements 6, 9, 18)

- [x] 7.1 Create `frontend/components/ScrollReveal.jsx` — reusable Framer Motion wrapper using `motion.div` with `whileInView` (translateY 30px, opacity 0→1, threshold 0.2)
- [x] 7.2 Wrap page state transitions in `page.js` with Framer Motion `AnimatePresence` for idle↔loading↔results↔error transitions with opacity and slide animations
- [x] 7.3 Update `ScoreDisplay.jsx` — replace IntersectionObserver with Framer Motion `whileInView` and `useInView`
- [x] 7.4 Update `VaguenessMeter.jsx` — replace IntersectionObserver with Framer Motion `whileInView` and `useInView`
- [x] 7.5 Update `CarbonTimeline.jsx` — replace IntersectionObserver with Framer Motion `whileInView` and `useInView`
- [x] 7.6 Replace IntersectionObserver scroll reveal in `page.js` `useEffect` with Framer Motion `ScrollReveal` wrapper on bento grid cards, with staggered delays (100ms between siblings)
- [x] 7.7 Add Framer Motion hover animations to bento cards (translateY -3px, shadow adjustment)
- [x] 7.8 Remove all IntersectionObserver code and `.reveal` / `.visible` CSS classes from globals.css

## Task 8: Update ScannerInput with Pill-Shaped Design (Requirement 8)

- [x] 8.1 Update `ScannerInput.jsx` — apply pill-shaped border-radius (9999px) to mode tabs and submit buttons with visible borders
- [x] 8.2 Update `ScannerInput.module.css` — pill-shaped tab styles, light theme input styles, updated focus states

## Task 9: Create Enhanced Loading Screen (Requirements 2, 15)

- [x] 9.1 Update `LoadingScreen.jsx` — add step-by-step progress with animated checkmarks using Framer Motion, elapsed time counter, and conditional cold-start wake-up message
- [x] 9.2 Update `LoadingScreen.module.css` — light theme loading styles with colorful accents
- [x] 9.3 Accept `isColdStart` prop in `LoadingScreen` and display "Our servers are waking up..." message when true

## Task 10: Create Typed Error State Component (Requirement 16)

- [x] 10.1 Create `frontend/components/ErrorState.jsx` — accepts error type and displays specific message, suggestion, and retry button per error category (COLD_START, NETWORK_ERROR, SCRAPE_FAILED, ML_ERROR, RATE_LIMITED)
- [x] 10.2 Create `frontend/components/ErrorState.module.css` — light theme error card styles with playful card design
- [x] 10.3 Replace inline error rendering in `page.js` with the new `ErrorState` component

## Task 11: Create FAQ Accordion Section (Requirement 10)

- [x] 11.1 Create `frontend/components/FAQSection.jsx` — accordion with at least 5 questions, Framer Motion animated expand/collapse, one-open-at-a-time behavior
- [x] 11.2 Create `frontend/components/FAQSection.module.css` — light theme accordion styles with playful card design
- [x] 11.3 Integrate `FAQSection` into `page.js` below the results/hero section

## Task 12: Create Bento-Grid Footer (Requirement 11)

- [x] 12.1 Create `frontend/components/Footer.jsx` — bento-grid card layout with project info, links, credits, and call-to-action cards
- [x] 12.2 Create `frontend/components/Footer.module.css` — responsive bento-grid (multi-column → single-column at 640px), playful card styles
- [x] 12.3 Replace inline footer in `page.js` with the new `Footer` component

## Task 13: Implement Scan History (Requirement 13)

- [x] 13.1 Implement `frontend/lib/scanHistory.js` — `addScan(entry)`, `getHistory()`, `clearHistory()`, `getScanById(id)` functions with 50-entry cap, sorted by most recent, localStorage persistence
- [x] 13.2 Create `frontend/components/ScanHistoryPanel.jsx` — displays past scans list, click to view, clear all button
- [x] 13.3 Create `frontend/components/ScanHistoryPanel.module.css` — light theme history panel styles
- [x] 13.4 Integrate scan history into `page.js` — save on successful analysis, display history panel, load past scan on selection

## Task 14: Implement Share System (Requirement 14)

- [x] 14.1 Implement `frontend/lib/shareUtils.js` — `encodeShareData(data)` and `decodeShareData(hash)` for URL hash encoding/decoding, `generateShareImage(elementRef)` using html2canvas
- [x] 14.2 Create `frontend/components/ShareButton.jsx` — share button with "Copy Link" and "Download Image" options
- [x] 14.3 Create `frontend/components/ShareButton.module.css` — light theme share button styles
- [x] 14.4 Integrate share functionality into `page.js` — add ShareButton to results view, handle shared URL on page load

## Task 15: Implement Comparison Mode (Requirement 12)

- [x] 15.1 Create `frontend/components/ComparisonMode.jsx` — dual scanner inputs, side-by-side results with aligned score categories, color-coded differences (green for better, red for worse)
- [x] 15.2 Create `frontend/components/ComparisonMode.module.css` — responsive layout (2 columns → 1 column at 768px), playful card styles
- [x] 15.3 Integrate comparison mode into `page.js` — add comparison toggle/tab, manage comparison state

## Task 16: Mobile Optimization (Requirement 17)

- [x] 16.1 Audit and update all component CSS modules for 320px minimum viewport support — ensure no horizontal overflow, readable text, functional layouts
- [x] 16.2 Update `ScannerInput` for mobile — scrollable horizontal tabs or vertical stack below 480px
- [x] 16.3 Ensure all interactive elements have minimum 44x44px touch targets on mobile
- [x] 16.4 Add `prefers-reduced-motion` media query support — reduce Framer Motion animation durations and disable parallax effects when enabled

## Task 17: Update Main Page Orchestration (Requirements 1-19)

- [x] 17.1 Refactor `page.js` to use the new `apiClient.js` for all API calls instead of inline fetch
- [x] 17.2 Add comparison mode state and navigation to `page.js`
- [x] 17.3 Wire up all new components (FAQSection, Footer, ScanHistoryPanel, ShareButton, ErrorState, ComparisonMode, AnimatedGradientBg) in `page.js`
- [x] 17.4 Verify full application flow: idle → loading (with cold-start handling) → results → reset, comparison mode, history, sharing

## Task 18: Write Property-Based Tests

- [x] 18.1 [PBT] Write property test for FAQ accordion invariant — for any sequence of clicks, at most one item is open at a time
- [x] 18.2 [PBT] Write property test for comparison mode color coding — higher score gets green, lower gets red, equal gets neutral
- [x] 18.3 [PBT] Write property test for scan history round-trip persistence — serialize then deserialize produces equivalent data
- [x] 18.4 [PBT] Write property test for scan history maximum size invariant — history length never exceeds 50 after any number of additions
- [x] 18.5 [PBT] Write property test for scan history sort order — history is always sorted descending by timestamp
- [x] 18.6 [PBT] Write property test for share URL round-trip encoding — encode then decode produces equivalent data
- [x] 18.7 [PBT] Write property test for error type classification — different error types produce distinct display content
