# Tasks: AI Video Generation Web Application

**Input**: Design documents from `/home/beppe/x/Active/vt-challenge/specs/001-we-will-create/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/api-schema.yaml, quickstart.md

## Execution Flow (main)

```
1. Load plan.md from feature directory
   → Tech stack: Next.js 15, Tailwind CSS 4, Shadcn/UI, Motion, Vercel AI SDK, Remotion
   → Extract: TypeScript, pnpm, local storage, AI providers (OpenRouter, Fal AI)
2. Load design documents:
   → data-model.md: VideoProject, Scene, UserSession entities → model tasks
   → contracts/api-schema.yaml: 8 endpoints → contract test tasks
   → quickstart.md: 5 user scenarios → integration test tasks
3. Generate tasks by category:
   → Setup: Next.js project, dependencies, configuration
   → Tests: contract tests, integration tests (TDD approach)
   → Core: types, storage, API routes, UI components
   → Integration: AI providers, video composition, theme support
   → Polish: error handling, performance, accessibility
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Next.js project**: `src/`, `app/`, `components/`, `lib/` at repository root
- **API routes**: `app/api/` directory
- **Tests**: `__tests__/`, `tests/` directories
- **Types**: `src/types/` or `lib/types/`

## Phase 3.1: Setup

- [x] T001 Create Next.js 15 project structure with App Router and TypeScript
- [x] T002 Install core dependencies: Tailwind CSS 4, Shadcn/UI, Motion, Vercel AI SDK, Remotion
- [x] T003 [P] Configure Tailwind CSS 4 with dark mode and Shadcn/UI integration
- [x] T004 [P] Set up pnpm workspace configuration and development scripts
- [x] T005 [P] Configure TypeScript strict mode and path aliases

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Routes)

- [x] T006 [P] Contract test POST /api/generate/title in **tests**/api/generate/title.test.ts
- [x] T007 [P] Contract test POST /api/generate/storyboard in **tests**/api/generate/storyboard.test.ts
- [x] T008 [P] Contract test POST /api/generate/scene-prompts in **tests**/api/generate/scene-prompts.test.ts
- [x] T009 [P] Contract test POST /api/generate/image in **tests**/api/generate/image.test.ts
- [x] T010 [P] Contract test GET /api/projects in **tests**/api/projects/index.test.ts
- [x] T011 [P] Contract test POST /api/projects in **tests**/api/projects/create.test.ts
- [x] T012 [P] Contract test GET /api/projects/[id] in **tests**/api/projects/detail.test.ts
- [x] T013 [P] Contract test POST /api/projects/[id]/scenes/[sceneId]/edit in **tests**/api/projects/edit-scene.test.ts

### Integration Tests (User Scenarios)

- [x] T014 [P] Integration test first-time user flow in **tests**/integration/first-user.test.ts
- [x] T015 [P] Integration test scene editing workflow in **tests**/integration/scene-editing.test.ts
- [x] T016 [P] Integration test video preview in **tests**/integration/video-preview.test.ts
- [x] T017 [P] Integration test project persistence in **tests**/integration/project-persistence.test.ts
- [x] T018 [P] Integration test responsive design in **tests**/integration/responsive.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Type Definitions and Data Models

- [x] T019 [P] VideoProject interface in src/types/project.ts
- [x] T020 [P] Scene interface in src/types/scene.ts
- [x] T021 [P] UserSession interface in src/types/session.ts
- [x] T022 [P] AI provider types in src/types/ai.ts
- [x] T023 [P] API request/response types in src/types/api.ts

### Storage Layer

- [x] T024 [P] Local storage manager in src/lib/storage/manager.ts
- [x] T025 [P] Project storage operations in src/lib/storage/projects.ts
- [x] T026 [P] Image cache manager in src/lib/storage/cache.ts
- [x] T027 [P] Session storage in src/lib/storage/session.ts

### AI Provider Integration

- [x] T028 [P] OpenRouter client in src/lib/ai/openrouter.ts
- [x] T029 [P] Fal AI client in src/lib/ai/fal.ts
- [x] T030 [P] AI generation pipeline in src/lib/ai/pipeline.ts
- [x] T031 [P] Generation queue manager in src/lib/ai/queue.ts

### API Routes Implementation

- [x] T032 POST /api/generate/title endpoint
- [x] T033 POST /api/generate/storyboard endpoint
- [x] T034 POST /api/generate/scene-prompts endpoint
- [x] T035 POST /api/generate/image endpoint
- [x] T036 GET /api/projects endpoint
- [x] T037 POST /api/projects endpoint
- [x] T038 GET /api/projects/[id] endpoint
- [x] T039 POST /api/projects/[id]/scenes/[sceneId]/edit endpoint

### Base UI Components

- [x] T040 [P] Theme provider setup in src/components/providers/theme-provider.tsx
- [x] T041 [P] Layout component in src/components/layout/layout.tsx
- [x] T042 [P] Loading spinner in src/components/ui/loading-spinner.tsx
- [x] T043 [P] Toast notifications in src/components/ui/toast.tsx
- [x] T044 [P] Error boundary in src/components/ui/error-boundary.tsx

### Feature Components

- [x] T045 [P] Homepage component in src/components/pages/homepage.tsx
- [x] T046 [P] Project input form in src/components/forms/project-input.tsx
- [x] T047 [P] Loading screen in src/components/pages/loading-screen.tsx
- [x] T048 [P] Canvas workspace in src/components/canvas/canvas-workspace.tsx
- [x] T049 [P] Scene image component in src/components/canvas/scene-image.tsx
- [x] T050 [P] Edit popover in src/components/canvas/edit-popover.tsx
- [x] T051 [P] Project cards in src/components/projects/project-cards.tsx

### Video and Editor Components

- [x] T052 [P] Remotion composition in src/components/video/video-composition.tsx
- [x] T053 [P] Video player wrapper in src/components/video/video-player.tsx
- [x] T054 [P] Editor view in src/components/pages/editor-view.tsx
- [x] T055 [P] View toggle component in src/components/ui/view-toggle.tsx

## Phase 3.4: Integration

### State Management

- [x] T056 Project context provider in src/context/project-context.tsx
- [x] T057 User session context in src/context/session-context.tsx
- [x] T058 Generation queue context in src/context/generation-context.tsx

### Page Routes

- [x] T059 Homepage route in app/page.tsx
- [x] T060 Project detail route in app/project/[id]/page.tsx
- [x] T061 Loading route in app/loading/page.tsx

### Animation and Interactions

- [x] T062 [P] Canvas scene images drag and drop feature with Motion in src/lib/interactions/canvas.ts
- [x] T063 [P] Theme transition animations in src/lib/animations/theme.ts
- [x] T064 [P] Loading state animations in src/lib/animations/loading.ts

### Error Handling and Validation

- [x] T065 [P] Input validation schemas in src/lib/validation/schemas.ts
- [x] T066 [P] API error handling in src/lib/errors/api-errors.ts
- [x] T067 [P] Generation error recovery in src/lib/errors/generation.ts

## Phase 3.5: Polish

### Accessibility

- [x] T071 [P] ARIA labels and roles in src/lib/accessibility/aria.ts
- [x] T072 [P] Keyboard navigation in src/lib/accessibility/keyboard.ts
- [x] T073 [P] Screen reader support in src/lib/accessibility/screen-reader.ts

### Testing and Documentation

- [x] T074 [P] Unit tests for validation in **tests**/unit/validation.test.ts
- [x] T075 [P] Unit tests for storage in **tests**/unit/storage.test.ts
- [x] T077 [P] Component documentation in src/components/README.md
- [x] T078 Run complete quickstart validation

## Dependencies

### Critical Dependencies

- Tests (T006-T018) before implementation (T019-T078)
- Types (T019-T023) before storage and API layers
- Storage layer (T024-T027) before API routes (T032-T039)
- AI clients (T028-T031) before generation endpoints (T032-T035)
- Base UI (T040-T044) before feature components (T045-T055)
- Context providers (T056-T058) before page routes (T059-T061)

### Specific Blocking Dependencies

- T024 blocks T036, T037, T038 (storage needed for project APIs)
- T028, T029 block T032, T033, T034, T035 (AI clients needed for generation)
- T019, T020 block T045, T046, T047 (types needed for components)
- T040 blocks T059, T060, T061 (theme provider needed for pages)
- T056 blocks T060 (project context needed for detail page)

## Parallel Example

```
# Launch T006-T013 together (Contract Tests):
Task: "Contract test POST /api/generate/title in __tests__/api/generate/title.test.ts"
Task: "Contract test POST /api/generate/storyboard in __tests__/api/generate/storyboard.test.ts"
Task: "Contract test POST /api/generate/scene-prompts in __tests__/api/generate/scene-prompts.test.ts"
Task: "Contract test POST /api/generate/image in __tests__/api/generate/image.test.ts"
Task: "Contract test GET /api/projects in __tests__/api/projects/index.test.ts"
Task: "Contract test POST /api/projects in __tests__/api/projects/create.test.ts"
Task: "Contract test GET /api/projects/[id] in __tests__/api/projects/detail.test.ts"
Task: "Contract test POST /api/projects/[id]/scenes/[sceneId]/edit in __tests__/api/projects/edit-scene.test.ts"

# Launch T019-T023 together (Type Definitions):
Task: "VideoProject interface in src/types/project.ts"
Task: "Scene interface in src/types/scene.ts"
Task: "UserSession interface in src/types/session.ts"
Task: "AI provider types in src/types/ai.ts"
Task: "API request/response types in src/types/api.ts"

# Launch T024-T027 together (Storage Layer):
Task: "Local storage manager in src/lib/storage/manager.ts"
Task: "Project storage operations in src/lib/storage/projects.ts"
Task: "Image cache manager in src/lib/storage/cache.ts"
Task: "Session storage in src/lib/storage/session.ts"
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Use pnpm for all package management
- Commit after each task completion
- Follow TDD: red → green → refactor cycle
- Maintain 60fps animations and Core Web Vitals targets

## Task Generation Rules

_Applied during main() execution_

1. **From Contracts**:
   - 8 API endpoints → 8 contract test tasks [P]
   - Each endpoint → implementation task (sequential for shared dependencies)
2. **From Data Model**:
   - 3 main entities (VideoProject, Scene, UserSession) → 5 type definition tasks [P]
   - Storage operations → 4 storage layer tasks [P]
3. **From User Stories**:

   - 5 quickstart scenarios → 5 integration test tasks [P]
   - Each workflow → corresponding component tasks

4. **Ordering**:
   - Setup → Tests → Types → Storage → AI → API → UI → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist

_GATE: Checked before task execution_

- [x] All 8 API contracts have corresponding tests
- [x] All 3 main entities have model tasks
- [x] All 13 tests come before implementation
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
