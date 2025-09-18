# VT Challenge - AI Video Generation Web Application

A modern web application for creating AI-generated video stories using text prompts. Built with Next.js, TypeScript, and powered by OpenRouter and FAL AI.

## Features

- 🤖 AI-powered video story generation from text prompts
- 🎨 Interactive canvas workspace for scene editing
- 🎬 Video preview with Remotion player
- 🌙 Light/dark mode support
- 📱 Responsive design for all devices
- ♿ WCAG 2.1 AA accessibility compliance

## Prerequisites

- Node.js 18+ installed
- pnpm package manager installed
- Modern web browser (Chrome, Firefox, Safari, Edge)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Edit `.env.example` file in the root directory with your API keys and rename it to `.env`:

```bash
OPENROUTER_API_KEY=your_openrouter_key_here
FAL_API_KEY=your_fal_api_key_here
```

**Getting API Keys:**

- **OpenRouter**: Sign up at [openrouter.ai](https://openrouter.ai) for text generation
- **FAL AI**: Sign up at [fal.ai](https://fal.ai) for image generation

### 3. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm test` - Run unit tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:e2e` - Run end-to-end tests
- `pnpm type-check` - Run TypeScript type checking

## How It Works

1. **Text Input**: Enter a video story prompt on the homepage
2. **AI Generation**: OpenRouter generates title, storyboard, and scene prompts
3. **Image Creation**: FAL AI generates images for each scene
4. **Canvas Editing**: Drag and edit scenes in the interactive workspace
5. **Video Preview**: Watch your generated video story

## Development Notes

- The app works with mock responses when API keys are not configured
- All data is stored locally in the browser (no server-side database)
- Built with TypeScript for type safety
- Uses Tailwind CSS for styling
- Implements proper error handling and loading states

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Providers**: OpenRouter, FAL AI
- **Video**: Remotion
- **UI Components**: Radix UI
- **Testing**: Vitest, Playwright
- **Package Manager**: pnpm
