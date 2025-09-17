# Research: AI Video Generation Web Application

**Date**: September 17, 2025  
**Branch**: `001-we-will-create`  
**Phase**: 0 - Research & Technology Decisions

## Research Overview

This document resolves technical uncertainties and establishes best practices for implementing an AI-powered video generation web application using Next.js 15, Tailwind CSS 4, and multiple AI providers.

## Core Technology Decisions

### Frontend Framework: Next.js 15 with App Router

**Decision**: Next.js 15 with App Router for full-stack React application  
**Rationale**:

- Built-in optimization for Core Web Vitals targets
- Server and client components for performance
- Integrated API routes for AI provider communication
- Image optimization for generated content
- Font optimization for typography

**Alternatives considered**: Vite + React, Remix  
**Why rejected**: Next.js provides superior performance optimization and integrated full-stack capabilities needed for AI integration

### Styling: Tailwind CSS 4.0

**Decision**: Tailwind CSS 4.0 with Shadcn/UI component system  
**Rationale**:

- Latest features including CSS variables and container queries
- Shadcn/UI provides accessible, customizable components
- Superior performance with purging and JIT compilation
- Excellent developer experience with IntelliSense

**Alternatives considered**: CSS Modules, Styled Components  
**Why rejected**: Tailwind 4.0 provides better performance and maintenance, Shadcn/UI reduces development time

### Animation: Motion

**Decision**: Motion library (successor to Framer Motion)  
**Rationale**:

- Hardware-accelerated animations for 60fps performance
- Respects `prefers-reduced-motion` accessibility setting
- Smaller bundle size and better performance than Framer Motion
- Excellent gesture support for canvas interactions

**Alternatives considered**: CSS animations, Framer Motion  
**Why rejected**: Motion provides better performance and developer experience than alternatives

### AI Integration: Vercel AI SDK

**Decision**: Vercel AI SDK with OpenRouter and Fal AI providers  
**Rationale**:

- Unified interface for multiple AI providers
- Built-in streaming support for better UX
- TypeScript support and error handling
- Excellent Next.js integration

**AI Provider Strategy**:

- **OpenRouter**: Text generation (title, storyboard, prompts) using cost-effective OpenAI models
- **Fal AI**: Image generation (fal-ai/flux-1/schnell for speed, fal-ai/nano-banana for quality)

**Alternatives considered**: Direct provider APIs, LangChain  
**Why rejected**: Vercel AI SDK provides better integration and unified error handling

### Video Processing: Remotion

**Decision**: Remotion for video composition and playback  
**Rationale**:

- React-based video composition aligns with component architecture
- Excellent performance for browser-based video
- No server-side rendering needed for simple image sequences
- Great developer experience with React patterns

**Alternatives considered**: FFmpeg.js, Canvas API, video.js  
**Why rejected**: Remotion provides better React integration and simpler implementation for image sequences

### State Management: React Context + Local Storage

**Decision**: React Context for runtime state, Local Storage for persistence  
**Rationale**:

- No authentication requirement simplifies architecture
- Local Storage provides offline capability
- React Context sufficient for single-user scenarios
- Reduces complexity compared to external state libraries

**Alternatives considered**: Zustand, Redux Toolkit  
**Why rejected**: Over-engineering for single-user, no-auth requirements

## Development Environment

### Package Manager: pnpm

**Decision**: pnpm for all package management  
**Rationale**:

- Faster installation and better disk space efficiency
- Superior monorepo support if needed later
- Strict dependency resolution prevents phantom dependencies
- Constitutional requirement

**Commands to use**:

- `pnpm install` (not npm install)
- `pnpm dlx` (not npx)
- `pnpm add` / `pnpm remove`

### Testing: Vitest + React Testing Library

**Decision**: Vitest for unit testing, React Testing Library for component testing  
**Rationale**:

- Faster than Jest with better ESM support
- Native TypeScript support
- Excellent Next.js integration
- React Testing Library encourages accessibility-focused testing

**Alternatives considered**: Jest + Testing Library  
**Why rejected**: Vitest provides better performance and ESM support

## UI/UX Design Decisions

### Theme System: Light/Dark Mode

**Decision**: next-themes with Tailwind CSS 4.0 dark mode support  
**Rationale**:

- System preference detection
- Persistent user preference
- Smooth transitions between modes
- Accessible color contrast in both modes

### Layout Strategy: Responsive Grid + Flexbox

**Decision**: CSS Grid for main layout, Flexbox for components  
**Rationale**:

- Grid ideal for canvas workspace layout
- Flexbox perfect for component internal layout
- Better performance than older layout methods
- Excellent browser support

### Typography: Inter Font

**Decision**: Inter variable font via Next.js Font optimization  
**Rationale**:

- Excellent readability across all sizes
- Variable font reduces bundle size
- Next.js optimization prevents layout shift
- Modern, professional appearance

## Performance Optimization

### Core Web Vitals Targets

**LCP (Largest Contentful Paint)**: < 2.5s

- Next.js Image optimization for generated images
- Lazy loading for previous projects
- Efficient font loading

**FID (First Input Delay)**: < 100ms

- Hardware-accelerated animations
- Efficient event handlers
- Code splitting for routes

**CLS (Cumulative Layout Shift)**: < 0.1

- Font optimization prevents font swaps
- Skeleton loading states
- Fixed dimensions for image containers

### Bundle Optimization

**Code Splitting Strategy**:

- Route-based splitting (automatic with App Router)
- Dynamic imports for heavy components (Remotion player)
- Separate chunks for AI providers

**Asset Optimization**:

- Next.js automatic image optimization
- WebP format for generated images
- Lazy loading for non-critical images

## Security & Privacy

### API Key Management

**Decision**: Environment variables with secure patterns  
**Rationale**:

- Server-side API routes hide keys from client
- Environment validation at build time
- Clear separation between development and production

**Implementation**:

```
OPENROUTER_API_KEY=your_openrouter_key_here
FAL_API_KEY=your_fal_api_key_here
```

### Data Privacy

**Decision**: Client-side only data storage  
**Rationale**:

- No server-side database reduces privacy concerns
- User maintains full control of their data
- Simplified GDPR compliance
- Faster development iteration

## Error Handling Strategy

### AI Provider Failures

**Strategy**: Graceful degradation with user feedback  
**Implementation**:

- Toast notifications for transient errors
- Retry mechanisms for network failures
- Fallback content for generation failures
- Clear error messages with suggested actions

### Image Generation Limits

**Strategy**: Usage awareness and queue management  
**Implementation**:

- Loading states during generation
- Queue visualization for multiple requests
- Cost estimation display
- Rate limiting with user feedback

## Accessibility

### WCAG 2.1 AA Compliance

**Focus Management**: Proper focus indicators and keyboard navigation  
**Screen Reader Support**: Semantic HTML and ARIA labels  
**Motion Preferences**: Respect `prefers-reduced-motion`  
**Color Contrast**: Minimum 4.5:1 ratio in both themes

## Deployment Strategy

### Vercel Platform

**Decision**: Vercel for hosting and deployment  
**Rationale**:

- Excellent Next.js optimization
- Automatic preview deployments
- Edge function support for AI routes
- Built-in analytics and monitoring

**Configuration**:

- Environment variables for API keys
- Automatic deployments from main branch
- Preview deployments for feature branches

## Research Summary

All technical uncertainties have been resolved. The technology stack aligns with constitutional requirements and provides a solid foundation for implementing the AI video generation application. The chosen technologies work synergistically to deliver superior user experience while maintaining high performance and accessibility standards.

**Next Phase**: Phase 1 - Design & Contracts (data model, API contracts, quickstart)
