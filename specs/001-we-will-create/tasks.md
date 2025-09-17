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

- [ ] T001 Create Next.js 15 project structure with App Router and TypeScript
- [ ] T002 Install core dependencies: Tailwind CSS 4, Shadcn/UI, Motion, Vercel AI SDK, Remotion
- [ ] T003 [P] Configure Tailwind CSS 4 with dark mode and Shadcn/UI integration
- [ ] T004 [P] Set up pnpm workspace configuration and development scripts
- [ ] T005 [P] Configure TypeScript strict mode and path aliases

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (API Routes)

- [ ] T006 [P] Contract test POST /api/generate/title in **tests**/api/generate/title.test.ts
- [ ] T007 [P] Contract test POST /api/generate/storyboard in **tests**/api/generate/storyboard.test.ts
- [ ] T008 [P] Contract test POST /api/generate/scene-prompts in **tests**/api/generate/scene-prompts.test.ts
- [ ] T009 [P] Contract test POST /api/generate/image in **tests**/api/generate/image.test.ts
- [ ] T010 [P] Contract test GET /api/projects in **tests**/api/projects/index.test.ts
- [ ] T011 [P] Contract test POST /api/projects in **tests**/api/projects/create.test.ts
- [ ] T012 [P] Contract test GET /api/projects/[id] in **tests**/api/projects/detail.test.ts
- [ ] T013 [P] Contract test POST /api/projects/[id]/scenes/[sceneId]/edit in **tests**/api/projects/edit-scene.test.ts

### Integration Tests (User Scenarios)

- [ ] T014 [P] Integration test first-time user flow in **tests**/integration/first-user.test.ts
- [ ] T015 [P] Integration test scene editing workflow in **tests**/integration/scene-editing.test.ts
- [ ] T016 [P] Integration test video preview in **tests**/integration/video-preview.test.ts
- [ ] T017 [P] Integration test project persistence in **tests**/integration/project-persistence.test.ts
- [ ] T018 [P] Integration test responsive design in **tests**/integration/responsive.test.ts

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Type Definitions and Data Models

- [ ] T019 [P] VideoProject interface in src/types/project.ts
- [ ] T020 [P] Scene interface in src/types/scene.ts
- [ ] T021 [P] UserSession interface in src/types/session.ts
- [ ] T022 [P] AI provider types in src/types/ai.ts
- [ ] T023 [P] API request/response types in src/types/api.ts

### Storage Layer

- [ ] T024 [P] Local storage manager in src/lib/storage/manager.ts
- [ ] T025 [P] Project storage operations in src/lib/storage/projects.ts
- [ ] T026 [P] Image cache manager in src/lib/storage/cache.ts
- [ ] T027 [P] Session storage in src/lib/storage/session.ts

### AI Provider Integration

- [ ] T028 [P] OpenRouter client in src/lib/ai/openrouter.ts
- [ ] T029 [P] Fal AI client in src/lib/ai/fal.ts
- [ ] T030 [P] AI generation pipeline in src/lib/ai/pipeline.ts
- [ ] T031 [P] Generation queue manager in src/lib/ai/queue.ts

### API Routes Implementation

- [ ] T032 POST /api/generate/title endpoint
- [ ] T033 POST /api/generate/storyboard endpoint
- [ ] T034 POST /api/generate/scene-prompts endpoint
- [ ] T035 POST /api/generate/image endpoint
- [ ] T036 GET /api/projects endpoint
- [ ] T037 POST /api/projects endpoint
- [ ] T038 GET /api/projects/[id] endpoint
- [ ] T039 POST /api/projects/[id]/scenes/[sceneId]/edit endpoint

### Base UI Components

- [ ] T040 [P] Theme provider setup in src/components/providers/theme-provider.tsx
- [ ] T041 [P] Layout component in src/components/layout/layout.tsx
- [ ] T042 [P] Loading spinner in src/components/ui/loading-spinner.tsx
- [ ] T043 [P] Toast notifications in src/components/ui/toast.tsx
- [ ] T044 [P] Error boundary in src/components/ui/error-boundary.tsx

### Feature Components

- [ ] T045 [P] Homepage component in src/components/pages/homepage.tsx
- [ ] T046 [P] Project input form in src/components/forms/project-input.tsx
- [ ] T047 [P] Loading screen in src/components/pages/loading-screen.tsx
- [ ] T048 [P] Canvas workspace in src/components/canvas/canvas-workspace.tsx
- [ ] T049 [P] Scene image component in src/components/canvas/scene-image.tsx
- [ ] T050 [P] Edit popover in src/components/canvas/edit-popover.tsx
- [ ] T051 [P] Project cards in src/components/projects/project-cards.tsx

### Video and Editor Components

- [ ] T052 [P] Remotion composition in src/components/video/video-composition.tsx
- [ ] T053 [P] Video player wrapper in src/components/video/video-player.tsx
- [ ] T054 [P] Editor view in src/components/pages/editor-view.tsx
- [ ] T055 [P] View toggle component in src/components/ui/view-toggle.tsx

## Phase 3.4: Integration

### State Management

- [ ] T056 Project context provider in src/context/project-context.tsx
- [ ] T057 User session context in src/context/session-context.tsx
- [ ] T058 Generation queue context in src/context/generation-context.tsx

### Page Routes

- [ ] T059 Homepage route in app/page.tsx
- [ ] T060 Project detail route in app/project/[id]/page.tsx
- [ ] T061 Loading route in app/loading/page.tsx

### Animation and Interactions

- [ ] T062 [P] Canvas scene images drag and drop feature with Motion in src/lib/interactions/canvas.ts
- [ ] T063 [P] Theme transition animations in src/lib/animations/theme.ts
- [ ] T064 [P] Loading state animations in src/lib/animations/loading.ts

### Error Handling and Validation

- [ ] T065 [P] Input validation schemas in src/lib/validation/schemas.ts
- [ ] T066 [P] API error handling in src/lib/errors/api-errors.ts
- [ ] T067 [P] Generation error recovery in src/lib/errors/generation.ts

## Phase 3.5: Polish

### Accessibility

- [ ] T071 [P] ARIA labels and roles in src/lib/accessibility/aria.ts
- [ ] T072 [P] Keyboard navigation in src/lib/accessibility/keyboard.ts
- [ ] T073 [P] Screen reader support in src/lib/accessibility/screen-reader.ts

### Testing and Documentation

- [ ] T074 [P] Unit tests for validation in **tests**/unit/validation.test.ts
- [ ] T075 [P] Unit tests for storage in **tests**/unit/storage.test.ts
- [ ] T077 [P] Component documentation in src/components/README.md
- [ ] T078 Run complete quickstart validation

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
