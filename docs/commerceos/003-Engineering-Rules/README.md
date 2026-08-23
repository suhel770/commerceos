# CommerceOS Engineering Rules

Version: 1.0
Status: Frozen

## Objective

These engineering rules are mandatory for every contributor and every AI coding assistant.

## Technology Stack

- Next.js (App Router)
- React
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- Framer Motion
- Zod
- React Hook Form

## Coding Standards

1. Never use `any`.
2. Prefer composition over inheritance.
3. Keep components focused on a single responsibility.
4. Use server components unless client features are required.
5. All business logic must be typed.
6. Never duplicate code.
7. Prefer reusable components over page-specific implementations.

## Folder Structure

app/
components/
lib/
hooks/
types/
services/
docs/

## Component Rules

- One component, one responsibility.
- Export default only for page-level components.
- Shared UI belongs in components/ui.
- Business components belong in feature folders.

## Styling Rules

- Tailwind only.
- No inline styles.
- Follow the Design System.
- Maintain consistent spacing and typography.

## State Management

- Local state where appropriate.
- Context only for shared feature state.
- Avoid unnecessary global state.

## API Rules

- API-first design.
- Validate every request.
- Return typed responses.
- Handle errors consistently.

## Security

- Validate all inputs.
- Enforce RBAC.
- Never expose secrets.
- Audit sensitive operations.

## Testing

Every feature should include:
- Unit tests
- Integration tests where applicable
- Manual QA checklist

## Git Workflow

main
develop
feature/*
bugfix/*
release/*

## Cursor Rules

Cursor must:
- Never redesign approved UI.
- Never invent workflows.
- Reuse existing components.
- Follow documentation before generating code.
- Stop when requested scope is complete.
