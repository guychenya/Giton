# Changelog

All notable changes to GitOn project.

## [1.0.0] - 2024-12-02

### Added
- **Landing Page**
  - Hero section with animated background and gradient text
  - Demo video with 2.5x playback speed and normal audio
  - Mute/unmute button for audio control
  - Enhanced search: Type username to see all their repos
  - "Get Started" CTAs above and below video
  - Cookie consent banner
  - Terms of Service and Privacy Policy modals
  - Stats section with animated counters

- **Authentication & Billing**
  - Clerk authentication integration
  - Stripe checkout for Pro subscriptions ($19.99/month)
  - Usage tracking (Free: 10 generations, Pro: unlimited)
  - Crown badge for Pro users
  - Billing management in settings

- **AI Features**
  - Multi-AI provider support (Gemini, OpenAI, OpenRouter)
  - Repository analysis with card generation
  - Architecture diagram generation (Mermaid)
  - PRD (Product Requirements Document) generation
  - AI chat assistant with model selection
  - Voice assistant integration

- **UI/UX**
  - Dark/Light theme toggle
  - GitHub-style settings page with tabs
  - API key validation with lightning icon
  - Saved projects library (IndexedDB)
  - Markdown renderer for documentation
  - Loading animations (water-fill effect)
  - Responsive design

- **Technical**
  - Vite + React 18 + TypeScript
  - Tailwind CSS for styling
  - Netlify Functions for serverless backend
  - Content Security Policy for Stripe and OpenAI
  - Environment variable configuration

### Fixed
- Stripe checkout updated to new API (removed deprecated redirectToCheckout)
- OpenAI API calls now direct (not through Netlify functions for local dev)
- Audio preload added to reduce initial play delay
- Search results z-index increased to show above content
- CSP updated to allow Stripe.js, OpenAI, and OpenRouter APIs

### Security
- API keys stored locally in browser (not on server)
- Stripe payment processing (no card storage)
- Environment variables for sensitive data
- HTTPS enforced in production

## Configuration Files
- `.env.example` - Template for environment variables
- `netlify.toml` - Netlify deployment configuration
- `STRIPE_SETUP.md` - Stripe integration guide
- `BILLING_IMPLEMENTATION.md` - Billing system documentation

## Credits
- Music: Heaven and Hell by Jeremy Blake (YouTube Audio Library)
- Built by Guy Chenya
- AI-powered by Google Gemini, OpenAI, and Anthropic Claude
