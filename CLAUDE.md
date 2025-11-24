# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 application (using React 19) that provides live transcription and translation using browser APIs. The app captures audio from screen sharing, transcribes it using the Web Speech Recognition API, enhances the transcription quality using the Rewriter API, and translates the text using the Translation API.

## Getting Started

```bash
# Install dependencies
npm install
```

## Development Commands

```bash
# Start development server (default: http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check (use this instead of build during development)
npx tsc --noEmit
```

## Development Process

- **Type checking**: Use `npx tsc --noEmit` for type checking during development. Avoid using `npm run build` as it requires restarting the development server.
- **Linting**: Use `npm run lint` for code quality checks.
- **Code change verification**: After making any code changes that affect syntax (excluding text/comment-only changes), always run both `npm run lint` and `npx tsc --noEmit`. Verify the validity of the changes and confirm there are no errors before considering the task complete.

## Git Commit Guidelines

- **Commit message format**: Follow [Conventional Commits](https://www.conventionalcommits.org/) specification
- **Types**: Use appropriate type prefixes:
  - `feat:` - New features
  - `fix:` - Bug fixes
  - `docs:` - Documentation changes
  - `style:` - Code style changes (formatting, etc.)
  - `refactor:` - Code refactoring
  - `test:` - Adding or modifying tests
  - `chore:` - Maintenance tasks
- **Message content**: Focus on the "why" rather than the "what". Keep messages concise (1-2 sentences)

## Architecture

### Core Flow
1. **Audio Capture**: Uses `navigator.mediaDevices.getDisplayMedia()` to capture audio from screen sharing
2. **Speech Recognition**: Web Speech Recognition API transcribes audio in real-time with interim and final results
3. **Rewriting**: Uses browser's Rewriter API to improve transcription accuracy and correct technical terms
4. **Translation**: Translates finalized sentences using browser's Translation API
5. **Auto-scroll**: Results list automatically scrolls to show new content as it appears

### Key Components

**`components/Sandbox.tsx`** (Main component):
- `useSpeechRecognition` hook: Manages Web Speech Recognition lifecycle
  - Handles `start`, `result`, `error`, and `end` events
  - Automatically restarts recognition when it ends to maintain continuous transcription
  - Separates interim (in-progress) and final transcripts
  - Integrates with Rewriter API to enhance final transcripts with better technical term accuracy
- `Translation` component: Renders translated text using browser's Translation API
  - Monitors download progress for translation models
  - Creates translators on-demand per text block

### Browser APIs Used

This application requires Chrome/Edge with experimental features enabled:

1. **Web Speech Recognition API**: `window.SpeechRecognition` / `window.webkitSpeechRecognition`
   - Configured with `continuous: true` and `interimResults: true`
   - Language specified via `lang` property (e.g., "ja-JP", "en-US")

2. **Rewriter API**: `window.Rewriter`
   - Used to improve transcription quality by correcting technical terms
   - Configured with context about tech conference content

3. **Translation API**: `window.Translator`
   - Provides on-device translation between languages
   - Supports download progress monitoring

### State Management

- Local React state via `useState` and `useEffect` hooks
- No external state management libraries
- Real-time updates from browser APIs trigger re-renders

### Language Configuration

Currently hardcoded in `Sandbox.tsx`:
- `sourceLanguage`: The language being transcribed (e.g., "ja-JP")
- `distLanguage`: The target translation language (e.g., "en-US")

## TypeScript Configuration

- Path alias: `@/*` maps to project root
- Target: ES2017
- Types: Uses `@types/dom-speech-recognition` for Speech Recognition API types
- `@ts-expect-error` used in `Sandbox.tsx:21-24` to handle server component initialization safely (recognition object is client-side only)

## Styling

- Tailwind CSS v4 (using `@tailwindcss/postcss`)
- Dark mode support via `dark:` variants
- Geist font family (sans and mono variants)
- Icons from `lucide-react`

## UI/UX Guidelines

### Error Message Best Practices

When displaying errors to users, always include these three elements concisely:

1. **What happened**: Describe the phenomenon that occurred
2. **Why it may have happened**: Explain the suspected cause (use "may", "probably", "might" - avoid definitive statements)
3. **How to recover**: For recoverable errors, provide clear actionable steps for users to return to normal operation

**Example**:
```
The selected screen does not have audio available.
This may be because audio sharing was not enabled.
Please check 'Share tab audio' or 'Share system audio' when sharing your screen.
```

## Known TODOs (from code comments)

- Line 6-7 in `Sandbox.tsx`: Finalize old sentences and handle results that become empty arrays after a certain time
- `hooks/api-availability.ts`: Incomplete API availability checking logic
