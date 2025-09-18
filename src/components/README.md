# AI Video Generation Components

This directory contains all the React components for the AI Video Generation application.

## Architecture Overview

The component architecture follows a hierarchical structure with clear separation of concerns:

```
components/
├── ui/              # Basic UI components (buttons, inputs, cards)
├── providers/       # Context providers and app-level state
├── pages/           # Page-level components
├── forms/           # Form components and validation
├── canvas/          # Video canvas and scene editing
├── video/           # Video player and composition
├── projects/        # Project management components
└── layout/          # Layout and navigation components
```

## Component Categories

### UI Components (`/ui`)

Base UI components built on top of Shadcn/UI and Tailwind CSS. These are reusable, accessible components.

#### `button.tsx`

- **Purpose**: Primary button component with variants
- **Props**: `variant`, `size`, `disabled`, `loading`
- **Accessibility**: Full keyboard support, ARIA labels
- **Usage**: All interactive actions throughout the app

#### `card.tsx`

- **Purpose**: Container component for content grouping
- **Props**: `title`, `description`, `children`
- **Accessibility**: Proper heading hierarchy
- **Usage**: Project cards, scene cards, info panels

#### `input.tsx`

- **Purpose**: Text input with validation
- **Props**: `value`, `onChange`, `error`, `required`
- **Accessibility**: ARIA error states, label association
- **Usage**: Form inputs, search fields

#### `textarea.tsx`

- **Purpose**: Multi-line text input
- **Props**: `value`, `onChange`, `placeholder`, `maxLength`
- **Accessibility**: Character count announcements
- **Usage**: Prompt input, description fields

#### `dialog.tsx`

- **Purpose**: Modal dialog component
- **Props**: `open`, `onOpenChange`, `title`, `children`
- **Accessibility**: Focus trapping, escape key handling
- **Usage**: Scene editing, confirmations

#### `sonner.tsx`

- **Purpose**: Toast notification system
- **Props**: `type`, `message`, `duration`
- **Accessibility**: Live region announcements
- **Usage**: Success/error messages, status updates

### Providers (`/providers`)

Context providers for global state management.

#### `theme-provider.tsx`

- **Purpose**: Dark/light mode theme management
- **Context**: `theme`, `setTheme`, `systemTheme`
- **Accessibility**: Respects system preferences, smooth transitions
- **Usage**: App-wide theme switching

### Page Components (`/pages`)

Full page components that compose smaller components.

#### `homepage.tsx`

- **Purpose**: Landing page with project creation form
- **Features**: Prompt input, project cards, feature showcase
- **Accessibility**: Skip links, proper heading hierarchy
- **State**: Form validation, submission handling

#### `loading-screen.tsx`

- **Purpose**: Loading state during AI generation
- **Features**: Progress indicators, step descriptions
- **Accessibility**: Live progress announcements
- **State**: Generation step tracking

#### `editor-view.tsx`

- **Purpose**: Scene editing interface
- **Features**: Canvas, scene gallery, edit controls
- **Accessibility**: Keyboard navigation, screen reader support
- **State**: Scene selection, edit history

### Form Components (`/forms`)

Specialized form components with validation.

#### `project-input.tsx`

- **Purpose**: Main project creation form
- **Features**: Prompt validation, character counting
- **Accessibility**: Real-time validation feedback
- **Validation**: 1-1000 characters, required field

### Canvas Components (`/canvas`)

Video scene editing and visualization.

#### `canvas-workspace.tsx`

- **Purpose**: Main canvas area for scene arrangement
- **Features**: Drag and drop, grid layout, zoom controls
- **Accessibility**: Keyboard grid navigation
- **State**: Scene positions, canvas scale

#### `scene-image.tsx`

- **Purpose**: Individual scene image component
- **Features**: Image display, edit button, status indicator
- **Accessibility**: Alt text, edit action labels
- **Props**: `scene`, `onEdit`, `position`

#### `edit-popover.tsx`

- **Purpose**: Scene editing popover dialog
- **Features**: Prompt input, regeneration controls
- **Accessibility**: Modal behavior, form validation
- **State**: Edit prompt, submission status

### Video Components (`/video`)

Video composition and playback.

#### `video-composition.tsx`

- **Purpose**: Remotion video composition
- **Features**: Scene sequence, timing, transitions
- **Accessibility**: Video player controls
- **Props**: `scenes`, `duration`, `onRender`

#### `video-player.tsx`

- **Purpose**: Video preview player
- **Features**: Play/pause, seek, fullscreen
- **Accessibility**: Media controls, time announcements
- **State**: Playback state, current time

### Project Components (`/projects`)

Project management and listing.

#### `project-cards.tsx`

- **Purpose**: Grid of project cards
- **Features**: Project preview, status, actions
- **Accessibility**: Card navigation, action buttons
- **Props**: `projects`, `onSelect`, `onDelete`

### Layout Components (`/layout`)

App structure and navigation.

#### `layout.tsx`

- **Purpose**: Main app layout wrapper
- **Features**: Header, navigation, main content area
- **Accessibility**: Landmark roles, skip links
- **Structure**: Header, nav, main, footer

## Accessibility Standards

All components follow WCAG 2.1 AA standards:

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Arrow keys for list/grid navigation
- Escape key for modal dismissal

### Screen Reader Support

- Semantic HTML elements
- ARIA labels and descriptions
- Live region announcements
- Progress indicators

### Visual Design

- High contrast color schemes
- Responsive typography
- Clear focus indicators
- Consistent spacing

## State Management

Components use a combination of:

### Local State (useState)

- Component-specific UI state
- Form inputs and validation
- Modal open/close states

### Context Providers

- Theme preferences
- User session data
- Project state

### Local Storage

- Project persistence
- User preferences
- Image cache

## Styling Approach

### Tailwind CSS

- Utility-first styling
- Responsive design
- Dark mode support
- Custom color palette

### Component Variants

- Size variants (sm, md, lg)
- Color variants (primary, secondary, destructive)
- State variants (loading, disabled, error)

### Animation

- Motion library for smooth transitions
- Loading state animations
- Hover and focus effects
- Page transitions

## Testing Strategy

### Unit Tests

- Component rendering
- Props handling
- Event handling
- Accessibility features

### Integration Tests

- User workflows
- Form submissions
- Navigation patterns
- Error handling

### E2E Tests

- Complete user journeys
- Cross-browser compatibility
- Performance metrics
- Accessibility validation

## Development Guidelines

### Component Creation

1. Start with accessibility requirements
2. Define clear prop interfaces
3. Implement keyboard navigation
4. Add error handling
5. Write tests
6. Document usage

### Code Style

- TypeScript strict mode
- ESLint and Prettier
- Consistent naming conventions
- JSDoc comments for complex logic

### Performance

- React.memo for expensive components
- Lazy loading for large components
- Image optimization
- Bundle size monitoring

## Usage Examples

### Basic Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary" size="lg" onClick={handleSubmit} disabled={isLoading}>
  Create Video
</Button>;
```

### Project Card

```tsx
import { ProjectCard } from "@/components/projects/project-cards";

<ProjectCard
  project={videoProject}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onSelect={handleSelect}
/>;
```

### Scene Editor

```tsx
import { CanvasWorkspace } from "@/components/canvas/canvas-workspace";

<CanvasWorkspace
  scenes={project.scenes}
  onSceneEdit={handleSceneEdit}
  onSceneReorder={handleReorder}
/>;
```

### Theme Provider

```tsx
import { ThemeProvider } from "@/components/providers/theme-provider";

<ThemeProvider defaultTheme="system">
  <App />
</ThemeProvider>;
```

## Contributing

When adding new components:

1. Follow the established patterns
2. Ensure accessibility compliance
3. Add comprehensive tests
4. Update documentation
5. Consider responsive design
6. Test with screen readers

## Future Enhancements

Planned component improvements:

- Advanced video timeline editor
- Real-time collaboration features
- Enhanced animation controls
- Voice command support
- Mobile-optimized interfaces
- Offline functionality

