## Purpose

Provides a cohesive Turborepo and pnpm monorepo workspace for building, testing, and sharing TypeScript code across web and API applications.

## ADDED Requirements

### Requirement: Workspace package resolution
The monorepo SHALL manage packages and applications using pnpm workspaces and Turborepo caching.

#### Scenario: Running workspace build
- **WHEN** the user executes `pnpm turbo build` at the repository root
- **THEN** Turborepo MUST build `@healthinance/tsconfig`, `@healthinance/types`, `@healthinance/database`, `apps/api` and `apps/web` in the correct dependency order.

### Requirement: Shared TypeScript configurations
The workspace SHALL expose shared TypeScript configurations from `packages/tsconfig`.

#### Scenario: Inheriting base tsconfig
- **WHEN** an application extends `@healthinance/tsconfig/base.json` or `@healthinance/tsconfig/nextjs.json`
- **THEN** TypeScript compiler MUST resolve type checks consistently without duplicating compiler options across projects.
