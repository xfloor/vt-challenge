# VT Challenge Constitution

## Core Principles

### I. Superior User Experience

Every interface must prioritize sleek, modern, and engaging design with superior typography. Animation and motion should enhance user experience, not distract from it. Components must be responsive, accessible, and performant across all devices and viewport sizes.

### II. SOLID Architecture (NON-NEGOTIABLE)

All code must adhere to SOLID principles:

- **Single Responsibility**: Each class/component has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Derived classes must be substitutable for base classes
- **Interface Segregation**: Clients shouldn't depend on interfaces they don't use
- **Dependency Inversion**: Depend on abstractions, not concretions

### III. Component-First Development

Every feature starts as a reusable component; Components must be self-contained, independently testable; Clear purpose required - no organizational-only components; Shadcn/UI components should be extended, not modified directly.

### IV. Performance-First Implementation

Core Web Vitals must be optimized: LCP < 2.5s, FID < 100ms, CLS < 0.1; Images must use Next.js Image optimization; Fonts must use Next.js Font optimization; Components must implement proper lazy loading and code splitting; Motion animations must use hardware acceleration and respect user preferences.

### V. AI-Enhanced Development

Leverage Vercel AI SDK for intelligent features; Use OpenRouter for diverse model access; Use FAL for specialized AI tasks; AI features must have fallback states and error handling; User data privacy must be maintained in all AI interactions.

## Technology Stack Constraints

### Required Technologies

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS 4.0+ with Shadcn/UI components
- **Animation**: Motion (not Framer Motion) for all animations
- **Optimization**: Next.js built-in Image and Font optimization
- **AI**: Vercel AI SDK with OpenRouter and FAL providers
- **Video**: Remotion for video generation and processing
- **Package Manager**: pnpm (NO npm or yarn)
- **TypeScript**: Strict mode enabled

### Forbidden Technologies

- Framer Motion (use Motion instead)
- npm/yarn (use pnpm only)
- CSS-in-JS libraries (use Tailwind)
- Unoptimized images or fonts
- Client-side rendering for static content

## Development Workflow

### Code Quality Gates

- TypeScript strict mode compliance required
- ESLint and Prettier formatting enforced
- Component tests required for all UI components
- Accessibility standards (WCAG 2.1 AA) compliance verified

### Animation Standards

- All animations must use Motion library
- Respect `prefers-reduced-motion` user preference
- 60fps performance target for all animations
- Hardware acceleration for transform animations
- Meaningful motion that enhances UX, not decorative

### AI Integration Standards

- Graceful degradation when AI services are unavailable
- Data minimization in AI requests
- Response streaming or use loading screens for better UX
- Error boundaries for AI failures

## Governance

This constitution supersedes all other development practices. Amendments require documentation in git commit messages and team approval. All pull requests must verify compliance with these principles.

**Complexity must be justified**: Simple solutions preferred over clever ones. When in doubt, choose readability over performance micro-optimizations.

**User-first decisions**: Technical decisions must prioritize user experience and performance over developer convenience.

**Version**: 1.0.0 | **Ratified**: 2025-09-17 | **Last Amended**: 2025-09-17
