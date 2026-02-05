# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. It uses Claude AI to generate React components on-demand and displays them in a sandboxed iframe with a virtual file system. No files are written to disk during component generation.

**Tech Stack:**
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI (Claude Haiku 4.5)
- Vercel AI SDK

## Development Commands

```bash
# Setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests with Vitest
npm test

# Lint
npm run lint

# Reset database (force reset with migrations)
npm run db:reset
```

**Note:** All Next.js commands use a custom node compatibility shim (`node -r ./node-compat.cjs`) for Windows compatibility.

## Architecture

### Virtual File System

The core feature is a **VirtualFileSystem** (`src/lib/file-system.ts`) that manages an in-memory file tree:
- Implements CRUD operations for files/directories
- Supports serialization/deserialization to/from JSON for persistence
- Provides text editor commands (view, create, str_replace, insert) used by AI tools
- All file paths are normalized to start with `/`

The file system is serialized to the database when authenticated users save projects.

### AI Integration

**Two Provider Modes:**
1. **Anthropic API** (when `ANTHROPIC_API_KEY` is set in `.env`): Uses Claude Haiku 4.5 via `@ai-sdk/anthropic`
2. **Mock Provider** (no API key): Returns static pre-scripted responses for demo purposes (`src/lib/provider.ts`)

The mock provider simulates multi-step agentic behavior by tracking tool message counts and generating appropriate responses.

**AI Tools:**
- `str_replace_editor` (`src/lib/tools/str-replace.ts`): Text editing operations on virtual files
- `file_manager` (`src/lib/tools/file-manager.ts`): File system operations (list, rename, delete)

**System Prompt:**
- Located in `src/lib/prompts/generation.tsx`
- Instructs AI to create React components with `/App.jsx` as the entry point
- Uses `@/` import alias for local files
- Emphasizes Tailwind CSS styling

### Preview System

**JSX Transformation** (`src/lib/transform/jsx-transformer.ts`):
- Uses Babel Standalone to transpile JSX/TSX to JavaScript
- Creates ES Module import maps with blob URLs for in-browser module resolution
- Generates complete HTML document with React 19 from CDN
- Handles CSS extraction and bundling

**PreviewFrame** (`src/components/preview/PreviewFrame.tsx`):
- Sandboxed iframe with `allow-scripts allow-same-origin allow-forms`
- Automatically detects entry point (`/App.jsx`, `/App.tsx`, `/index.jsx`, etc.)
- Shows friendly error states for missing files or first load
- Refreshes on file system changes via `refreshTrigger` from context

### Database Schema

**Models** (`prisma/schema.prisma`):
- `User`: Authentication (email/password with bcrypt)
- `Project`: Stores serialized messages and file system data as JSON strings
  - `messages`: Chat history
  - `data`: VirtualFileSystem serialized state
  - `userId`: Optional (supports anonymous users)

**Custom Prisma Output:** Generated client is in `src/generated/prisma` (not default location).

### Authentication

**JWT-based session management** (`src/lib/auth.ts`):
- Uses `jose` library for JWT signing/verification
- Session stored in HTTP-only cookie
- Middleware (`src/middleware.ts`) protects routes and checks authentication
- Anonymous users can create temporary projects (not persisted)
- Anonymous work tracking via local storage (`src/lib/anon-work-tracker.ts`)

### Component Structure

**Chat Interface** (`src/components/chat/`):
- `ChatInterface.tsx`: Main container with message list and input
- `MessageList.tsx`: Renders chat history with markdown support
- `MessageInput.tsx`: User input with submit handling
- `MarkdownRenderer.tsx`: Custom markdown renderer for AI responses

**Editor** (`src/components/editor/`):
- `CodeEditor.tsx`: Monaco Editor integration for viewing/editing files
- `FileTree.tsx`: Tree view of virtual file system

**Preview** (`src/components/preview/`):
- `PreviewFrame.tsx`: Sandboxed iframe for live React component preview

### API Routes

**`/api/chat/route.ts`:**
- Accepts messages, files, and projectId
- Prepends system prompt with ephemeral caching for Anthropic
- Uses `streamText` from Vercel AI SDK with tools
- Saves conversation and file system to database on completion (if authenticated)
- `maxDuration: 120` for long-running AI requests

### Context Providers

**FileSystemContext** (`src/lib/contexts/file-system-context.tsx`):
- Manages VirtualFileSystem instance
- Provides `refreshTrigger` for invalidating preview cache
- Wraps the application to share file system state

## Testing

Tests use Vitest with React Testing Library:
- Test files: `**/__tests__/*.test.tsx`
- Environment: jsdom
- Config: `vitest.config.mts`

## Important Patterns

1. **File paths always start with `/`**: The virtual file system normalizes all paths
2. **`@/` import alias**: Used in generated components to reference other virtual files
3. **Blob URL import maps**: Preview system converts modules to blob URLs for browser execution
4. **Serialization for persistence**: File system and messages serialized to JSON for database storage
5. **Streaming responses**: AI uses streaming for real-time feedback to users
6. **Anonymous usage**: Projects created by anonymous users are stored client-side only

## Environment Variables

Optional `.env` file:
```
ANTHROPIC_API_KEY=your-api-key-here
```

If not provided, the app falls back to the mock provider with static responses.
