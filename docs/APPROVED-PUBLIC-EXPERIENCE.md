# Approved Planora public experience

The October 18 approved reference defines the forest-green, cream and leaf-logo identity. `/` and `/experience` use the same `ApprovedLanding` composition. Root-level `planora-brand.css` shares the identity with sign-in and authenticated workspaces without changing financial permissions or calculations.

## Reuse and content

The following components accept serializable, typed content props, with defaults in `src/components/showcase/content.ts`:

| Component | Prop | Purpose |
|---|---|---|
| `DashboardShowcase` | `views: DashboardContent[]` | Keyboard-accessible workspace previews |
| `VideoShowcase` | `videos: VideoChapter[]` | Viewport playback, reduced motion and modal controls |
| `FeatureCarousel` | `items: SolutionContent[]` | Scroll-snap solutions with keyboard navigation and workflow dialogs |
| `CustomerShowcase` | `categories: CustomerCategory[]` | Audience cards without unverified customer claims |

A server page or CMS adapter can supply these props. No CMS service is connected. Import `approved-landing.css` and the shared brand tokens when embedding the showcases in another Planora route or app. Dialog labels use instance-specific IDs; dashboard SVG gradients and tabs also have distinct IDs.

Interactions dispatch `planora:showcase` on `window`, with `{ component, action, item }`. A consent-aware analytics adapter can subscribe. The components set no tracking cookies and send no analytics requests themselves.

Public metrics and workflows are illustrative. They do not read or write the canonical financial model. The six existing product animations are playable; the poster is a frame from the supplied footage. New narrated videos, verified testimonials, customer logos and externally measured results have not been invented.

## Verification

The production build, TypeScript, ESLint, Prisma validation, 200 unit/supporting tests, 11 isolated integration files, five privacy-guard tests, and 43 browser tests passed locally. Browser coverage includes keyboard tabs/dialogs, reduced-motion playback, mobile navigation, finance evidence, approvals, export reconciliation, and tenant boundaries. Responsive layouts were checked at 375, 430, 768, 1024 and 1440 pixels.

The production dependency audit has zero findings. The complete dependency audit retains its mandatory failure for GHSA-vfj7-8cjw-p6xm in the Next.js lint-tool dependency chain. Functional verification does not constitute full release certification; the production release remains blocked by that gate.

## Hosting scope

The new Vercel project is `eduradiusllc/planora`, connected to `olu3242/Planora-AI-`. The reviewed source is on `feat/public-experience-showcase-20261018`; main and the integration branch remain unchanged.

The user explicitly approved initializing the existing empty Neon database with all 20 migrations and provisioning separate authentication and tenant runtime roles. No demo users, organizations or financial records were seeded there. Runtime credentials are stored outside Git and must be configured as server-only Vercel secrets. Initial authorized-user onboarding remains separate from public-page publication.
