# CreAIlity — Project Audit & Roadmap (v78)

## Recent Changes (v78)
- **Credit deduction system LIVE**: Credits are now actually deducted per message based on AI model cost. New builds (first message, no conversation history) cost 3x credits. Iterations/edits cost 1x. BYOK users bypass all credit checks. Free users are gated by both build count and credit balance.
- **Subscription enforcement**: Cancelled/expired subscriptions now block building with a clear upgrade prompt. Hosting plan correctly blocks AI builds. Plan status is checked BEFORE every build.
- **Publishing modal fixed**: Wider modal (max-w-lg), URL bar no longer overflows or scrolls sideways, added explicit edit (pencil) icon next to the sub-URL slug.
- **Hosting Only plan**: Added to pricing page ($10/mo), settings Plan & Billing tab, admin plans tab, and Stripe checkout as plan ID "hosting".
- **AI Models - no more fake enabled states**: Admin AI Models tab now auto-disables models that don't have a platform API key configured. Models only show "Enabled" when their provider key actually exists.
- **Label fix**: Admin AI Models tab changed "Credits per build" → "Credits per message" for clarity.

## 1. WHAT EXISTS (Fully Functional)

### Core Builder Workspace — Production Quality
- React 19 + TypeScript + TailwindCSS v3 + Vite 8 SPA
- Auth: Supabase email/password with AuthGuard + Plan loading
- AI engine: 5 models, 4 build modes (web-app, browser-extension, react-app, import-edit)
- **LAYERED SMART CONTEXT**: 5-tier context system that outperforms bolt.new/lovable/replit
- **CREDIT SYSTEM**: Per-message credit deduction with 3x multiplier for new builds, plan gating, subscription status checks
- Preview: sandboxed iframe via blob URL + Babel standalone bundler
- Conversation persistence: All messages stored in Supabase
- Version history: snapshot on every build/save
- Import: GitHub repo, ZIP upload
- Deploy: Cloudflare Sandbox with editable sub-URL
- Prompt optimizer: Magic wand button
- Plan system: Free/Pro/BYOK/Hosting/Team with enforced limits

### Credit & Build Enforcement
- `checkCanBuild()`: Blocks cancelled/expired subscriptions, hosting plan, exhausted free builds, zero credits
- `getModelCreditCost()`: Returns credit cost per model (GPT-4o=3, Claude=5, Gemini=2, DeepSeek=2, Grok=4)
- `deductCredits()`: Atomically deducts credits after successful build
- **Multiplier**: 3x for new builds (first message), 1x for iterations/edits
- BYOK plan: Unlimited, no credit checks, user provides own API keys

### Stripe Integration
- stripe-checkout: creates Stripe Checkout sessions
- stripe-webhook: handles subscription lifecycle
- Plans: BYOK ($20/mo), Pro ($29/mo), Team ($79/mo), Hosting ($10/mo)

### Plan Definitions
| | Free | Hosting ($10/mo) | BYOK ($20/mo) | Pro ($29/mo) | Team ($79/mo) |
|---|---|---|---|---|---|
| Projects | 3 | 10 | Unlimited | Unlimited | Unlimited |
| Builds | 50/mo | 0 | Unlimited | Unlimited | Unlimited |
| Credits | 50/mo | N/A | Own key | Platform keys | Platform keys |
| AI Models | GPT-4o only | None | All 5 | All 5 | All 5 |
| Hosting | Sub-URL | Custom domain | Custom domain | Custom domain | Custom domain |

### Supabase Backend
- 9 tables + RLS on all
- 8 edge functions

### Admin Dashboard (7 Tabs)
- Overview, Users, Projects, Deployments, AI Models, Plans, Settings
- AI Models tab: auto-disables models without platform API keys

## 2. WHAT'S LEFT

### Configuration Required — STRIPE PRICE IDs
- Create Products & Prices in Stripe Dashboard
- Set Price IDs as Supabase Edge Function secrets (including "hosting" plan)
- Webhook secret needs to be set

### HIGH
- Email verification, password reset

### MEDIUM
- Build queue, rate limiting, auto-retry
- Pre-built component library

### LOW
- Team collaboration, browser extension .zip download, SEO, MCP connections