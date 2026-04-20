# Requirements Document

## Introduction

VÉRA is an NLP-powered greenwashing scanner for the fashion industry. This redesign addresses three areas: (1) resolving cold-start failures caused by Render free-tier inactivity timeouts, (2) replacing the dark glassmorphism UI with a vibrant, animated, light-themed design inspired by the Sowieso Wero website using Framer Motion, and (3) adding new features including comparison mode, scan history, shareable results, improved loading states, and mobile optimization.

## Glossary

- **Frontend**: The Next.js 14 / React 19 application deployed on Vercel that serves the user interface
- **Backend**: The Node.js/Express API server deployed on Render free tier that orchestrates scraping and ML analysis
- **ML_Service**: The Python/FastAPI service deployed on Render free tier that performs NLP greenwashing analysis
- **Keep_Alive_System**: The subsystem responsible for periodically pinging Backend and ML_Service to prevent cold-start sleep
- **Scanner_Input**: The component that accepts product URLs, pasted text, or demo product selections for analysis
- **Score_Display**: The component that renders the animated eco-score and verdict after analysis
- **Loading_Screen**: The component that displays scan progress steps during analysis
- **Results_View**: The section of the Frontend that displays all analysis results in a card-based layout
- **Comparison_Mode**: A feature allowing users to view two product analyses side by side
- **Scan_History**: A feature that persists past scan results in the browser using localStorage
- **Share_System**: A feature that generates shareable links or images from analysis results
- **Animation_System**: The Framer Motion-based system that handles all page transitions, scroll reveals, and micro-interactions
- **Design_System**: The set of design tokens, color palette, typography, and component styles that define the visual identity
- **Cold_Start**: The delay (up to 30+ seconds) when Render free-tier services resume after 15 minutes of inactivity
- **Warm_Up_Ping**: An HTTP request sent to Backend or ML_Service health endpoints to keep them active or trigger wake-up

## Requirements

### Requirement 1: Periodic Keep-Alive Pinging

**User Story:** As a user, I want the backend services to stay warm so that I do not encounter analysis errors caused by cold starts.

#### Acceptance Criteria

1. WHEN the Frontend loads in the browser, THE Keep_Alive_System SHALL send a Warm_Up_Ping to both the Backend health endpoint and the ML_Service health endpoint
2. WHILE the Frontend is open in the browser, THE Keep_Alive_System SHALL send a Warm_Up_Ping to both the Backend and ML_Service every 10 minutes
3. IF a Warm_Up_Ping fails, THEN THE Keep_Alive_System SHALL retry the ping up to 3 times with a 5-second delay between retries
4. THE Keep_Alive_System SHALL execute pings to Backend and ML_Service in parallel to minimize total ping duration

### Requirement 2: Cold-Start Aware Analysis Requests

**User Story:** As a user, I want the analysis to handle cold starts gracefully so that I see helpful feedback instead of a generic error.

#### Acceptance Criteria

1. WHEN the user submits an analysis request and the Backend returns a network error or timeout, THE Frontend SHALL retry the request up to 2 additional times with exponential backoff starting at 5 seconds
2. WHILE the Frontend is retrying a failed analysis request, THE Loading_Screen SHALL display a message indicating that services are waking up (e.g., "Our servers are waking up, this may take a moment...")
3. IF all retry attempts for an analysis request fail, THEN THE Frontend SHALL display an error state with a descriptive message explaining the cold-start issue and a retry button
4. THE Frontend SHALL set a request timeout of 90 seconds for analysis API calls to accommodate cold-start delays

### Requirement 3: Animated Gradient Background

**User Story:** As a user, I want to see a vibrant animated gradient background so that the application feels modern and visually engaging.

#### Acceptance Criteria

1. THE Design_System SHALL define a light-themed color palette replacing the current dark theme (#000000 background) with a light base (white or near-white)
2. THE Frontend SHALL render an animated gradient background using pink-to-yellow tones on the hero section
3. THE Animation_System SHALL animate the gradient background position continuously using CSS keyframes or Framer Motion with a cycle duration between 5 and 15 seconds
4. THE Frontend SHALL ensure the animated gradient does not cause layout shifts or affect text readability by maintaining sufficient contrast ratios (WCAG AA minimum 4.5:1 for body text)

### Requirement 4: Bold Oversized Typography

**User Story:** As a user, I want the typography to feel bold and impactful so that key information stands out clearly.

#### Acceptance Criteria

1. THE Design_System SHALL define heading styles with font-weight 800, uppercase text-transform, and letter-spacing between -0.04em and -0.02em
2. THE Frontend SHALL apply the bold oversized typography to the main VÉRA title, section headings, and score display
3. THE Design_System SHALL use a font size of at least 64px (scaling with viewport via clamp) for the primary hero title

### Requirement 5: Playful Card-Based Layout

**User Story:** As a user, I want the results displayed in visually distinct cards so that information is easy to scan and visually appealing.

#### Acceptance Criteria

1. THE Design_System SHALL define a card style with a visible border (1px solid), border-radius of 5px to 16px, and a box-shadow offset (e.g., 0 6px) to create a playful raised appearance
2. THE Results_View SHALL display each analysis section (materials, buzzwords, certifications, vagueness, carbon timeline) in individual styled cards
3. THE Animation_System SHALL animate cards on hover with a subtle lift effect (translateY of -2px to -4px) and shadow adjustment using Framer Motion

### Requirement 6: Scroll-Driven Animations

**User Story:** As a user, I want content to animate into view as I scroll so that the experience feels dynamic and polished.

#### Acceptance Criteria

1. THE Animation_System SHALL use Framer Motion to animate elements into view on scroll using translateY (20px to 40px) combined with opacity (0 to 1) transitions
2. THE Animation_System SHALL trigger scroll animations when elements enter the viewport at a threshold of 10% to 30% visibility
3. THE Animation_System SHALL stagger animations for sibling card elements with a delay of 50ms to 150ms between each card
4. THE Animation_System SHALL replace the current Intersection Observer-based scroll reveal implementation with Framer Motion equivalents

### Requirement 7: Colorful Accent Sections

**User Story:** As a user, I want colorful gradient accents on key sections so that the interface feels vibrant and categorized.

#### Acceptance Criteria

1. THE Design_System SHALL define gradient accent pairs including cyan-to-green and orange-to-pink for use on feature cards and section highlights
2. THE Results_View SHALL apply gradient backgrounds to at least two result card categories to visually differentiate them
3. THE Design_System SHALL ensure gradient accent colors maintain readable contrast against card text content

### Requirement 8: Pill-Shaped Navigation and Buttons

**User Story:** As a user, I want navigation elements and buttons to have a modern pill shape so that the interface feels cohesive and contemporary.

#### Acceptance Criteria

1. THE Design_System SHALL define a pill-shaped style with border-radius of 9999px and a visible border for navigation tabs and primary action buttons
2. THE Scanner_Input SHALL render mode tabs (URL, Text, Demo) as pill-shaped buttons with rounded borders
3. THE Frontend SHALL render the primary scan/analyze button with the pill-shaped style and a visible border

### Requirement 9: Smooth Page Transitions

**User Story:** As a user, I want smooth transitions between application states so that the experience feels seamless.

#### Acceptance Criteria

1. WHEN the application state changes from idle to loading, THE Animation_System SHALL animate the transition using Framer Motion AnimatePresence with opacity and optional blur effects
2. WHEN the application state changes from loading to results, THE Animation_System SHALL animate the results section into view with a fade-in and upward slide
3. WHEN the application state changes from results to idle (reset), THE Animation_System SHALL animate the results out and the hero section back in

### Requirement 10: FAQ Accordion Section

**User Story:** As a user, I want an FAQ section so that I can learn how VÉRA works and what the scores mean without leaving the page.

#### Acceptance Criteria

1. THE Frontend SHALL display an FAQ section on the main page with at least 5 questions covering topics such as how scoring works, what greenwashing means, which retailers are supported, data privacy, and score accuracy
2. WHEN the user clicks an FAQ question, THE Animation_System SHALL animate the answer expanding with a smooth height transition using Framer Motion
3. WHEN the user clicks an open FAQ question, THE Animation_System SHALL animate the answer collapsing with a smooth height transition
4. THE FAQ section SHALL allow only one answer to be open at a time (accordion behavior)

### Requirement 11: Footer with Bento-Grid Card Layout

**User Story:** As a user, I want a well-organized footer so that I can find project information, links, and credits easily.

#### Acceptance Criteria

1. THE Frontend SHALL render a footer section using a bento-grid card layout with distinct cards for project info, links, credits, and a call-to-action
2. THE Design_System SHALL apply the playful card style (border, border-radius, box-shadow) to footer grid cards
3. THE Footer SHALL be responsive, collapsing from a multi-column grid to a single-column stack on viewports narrower than 640px

### Requirement 12: Comparison Mode

**User Story:** As a user, I want to compare two products side by side so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. THE Frontend SHALL provide a comparison mode accessible from the main interface that allows the user to input two products (via URL, text, or demo selection)
2. WHEN both products have been analyzed, THE Results_View SHALL display both analyses side by side with aligned score categories (eco-score, materials, buzzwords, certifications, vagueness)
3. THE Comparison_Mode SHALL visually highlight differences between the two products using color coding (green for better, red for worse) on each score category
4. THE Comparison_Mode SHALL be responsive, stacking the two product results vertically on viewports narrower than 768px

### Requirement 13: Scan History

**User Story:** As a user, I want to see my past scans so that I can revisit previous results without re-scanning.

#### Acceptance Criteria

1. WHEN an analysis completes successfully, THE Scan_History SHALL persist the product name, eco-score, verdict, timestamp, and full analysis result to localStorage
2. THE Frontend SHALL display a scan history section or panel showing past scans sorted by most recent first
3. WHEN the user selects a past scan from the history, THE Results_View SHALL display the stored analysis results
4. THE Scan_History SHALL store a maximum of 50 scan entries and remove the oldest entry when the limit is exceeded
5. THE Frontend SHALL provide a button to clear all scan history from localStorage

### Requirement 14: Shareable Results

**User Story:** As a user, I want to share my scan results so that I can inform others about greenwashing in specific products.

#### Acceptance Criteria

1. WHEN analysis results are displayed, THE Share_System SHALL provide a share button that offers at least two sharing options: copy link to clipboard and download as image
2. WHEN the user selects "copy link," THE Share_System SHALL encode the analysis summary into a URL query parameter or hash and copy the shareable URL to the clipboard
3. WHEN the user selects "download as image," THE Share_System SHALL generate a PNG or JPEG image containing the product name, eco-score, verdict, and key sub-scores
4. WHEN the Frontend loads with a shared URL containing encoded analysis data, THE Frontend SHALL decode and display the shared results

### Requirement 15: Enhanced Loading Experience

**User Story:** As a user, I want to see detailed progress during analysis so that I know the scan is working and how far along it is.

#### Acceptance Criteria

1. WHILE an analysis is in progress, THE Loading_Screen SHALL display a step-by-step progress indicator showing the current analysis phase (scraping, material analysis, buzzword scanning, certification check, scoring)
2. THE Loading_Screen SHALL animate each step completion with a checkmark and transition to the next step using Framer Motion
3. THE Loading_Screen SHALL display an estimated time remaining or elapsed time counter
4. THE Loading_Screen SHALL use the new Design_System styles (light theme, colorful accents, playful card style) instead of the current dark-themed scanner animation

### Requirement 16: Improved Error States

**User Story:** As a user, I want clear and helpful error messages so that I know what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN an analysis fails, THE Frontend SHALL display an error card with a specific error message, a suggested action (e.g., "Try pasting the text directly" or "Try a demo product"), and a retry button
2. WHEN the error is caused by a cold start, THE Frontend SHALL display a specific message explaining that services are starting up and suggest waiting a moment before retrying
3. THE Frontend SHALL display distinct error states for different failure types: network errors, scraping failures, ML service errors, and rate limiting
4. THE error card SHALL include a one-click retry button that re-submits the previous analysis request

### Requirement 17: Mobile-Optimized Experience

**User Story:** As a user on a mobile device, I want the application to be fully usable and visually appealing so that I can scan products on the go.

#### Acceptance Criteria

1. THE Frontend SHALL be fully functional and visually correct on viewports as narrow as 320px
2. THE Scanner_Input SHALL adapt its layout for mobile by stacking mode tabs vertically or using a scrollable horizontal layout when the viewport is narrower than 480px
3. THE Results_View bento grid SHALL collapse to a single-column layout on viewports narrower than 640px
4. THE Comparison_Mode SHALL stack product results vertically on viewports narrower than 768px
5. THE Frontend SHALL ensure all interactive elements (buttons, tabs, cards) have a minimum touch target size of 44x44px on mobile viewports
6. THE Animation_System SHALL reduce animation complexity (disable parallax, reduce motion durations) when the user has enabled the "prefers-reduced-motion" accessibility setting

### Requirement 18: Framer Motion Integration

**User Story:** As a developer, I want all animations powered by Framer Motion so that the animation system is consistent, performant, and maintainable.

#### Acceptance Criteria

1. THE Frontend SHALL add Framer Motion as a project dependency
2. THE Animation_System SHALL use Framer Motion motion components for all animated elements including scroll reveals, page transitions, hover effects, and loading animations
3. THE Animation_System SHALL use Framer Motion AnimatePresence for mounting and unmounting transitions between application states (idle, loading, results, error)
4. THE Animation_System SHALL remove the current Intersection Observer-based scroll reveal logic and replace it with Framer Motion whileInView or useInView equivalents

### Requirement 19: Design System Token Migration

**User Story:** As a developer, I want the design tokens updated to reflect the new light-themed, vibrant design so that all components use a consistent visual language.

#### Acceptance Criteria

1. THE Design_System SHALL replace the current dark-theme CSS custom properties in globals.css with light-theme equivalents (light background, dark text, vibrant accent colors)
2. THE Design_System SHALL define new CSS custom properties for gradient backgrounds (pink-to-yellow, cyan-to-green, orange-to-pink)
3. THE Design_System SHALL define new card styles replacing glassmorphism (backdrop-filter blur) with solid borders, border-radius, and offset box-shadows
4. THE Design_System SHALL preserve the eco-spectrum color scale (green to red) for score visualization while ensuring readability on the new light background
5. THE Design_System SHALL update all component CSS modules to use the new design tokens
