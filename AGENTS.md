# Hairdresser Backend Agent

This repository is a NestJS backend for a hairdresser booking system. Keep changes aligned with the existing modular architecture and TypeORM patterns.

## Project overview

- Framework: NestJS with TypeScript
- API entry point: src/main.ts
- App wiring: src/app.module.ts
- Domain modules live under src/<feature>/ and are registered in AppModule
- Database access uses TypeORM and entities under src/\*\*/entities
- Validation and DTOs are organized per feature module

## Key commands

```bash
npm install
npm run start:dev
npm run build
npm run test
npm run test:e2e
npm run lint
npm run migration:generate -- src/migrations/<MigrationName>
npm run migration:run
```

## Repository conventions

- Prefer feature-based folders such as auth, users, calendar, clients, appointment, roles, services, mail, and calendar-share.
- Keep each feature encapsulated: module, controller, service, dto, entities, decorators, guards, interfaces, exceptions, validators as needed.
- Follow NestJS conventions: controller handles HTTP, service handles business logic, entities map TypeORM models.
- Add DTO validation for incoming request payloads using class-validator and transform with class-transformer when needed.
- Reuse shared utilities from src/common when they fit the problem instead of duplicating logic.
- Keep business rules in services rather than controllers.
- Preserve the existing naming style: camelCase for methods, PascalCase for classes, kebab-case file names where already used.

## Testing and validation

- Unit tests are colocated with source files as \*.spec.ts.
- E2E tests live in test/ and use the app-level test runner.
- Run the smallest relevant test command for the changed behavior before considering the task done.
- Use the repo's existing Jest config unless a new test pattern is clearly required.

## Database and migrations

- Database configuration is centralized in the TypeORM setup and related config files.
- Generated migrations belong in src/migrations and should normally not be edited manually after generation.
- Prefer migrations for schema changes rather than ad hoc DB edits.

## Change guidelines

- Before creating a new feature, inspect similar modules for conventions and naming.
- Keep changes narrow and consistent with the current module structure.
- When extending the API, maintain request/response shape compatibility unless the task explicitly requires a breaking change.
- If a new module is introduced, add it to AppModule and follow the same folder structure as the existing modules.

## Useful starting points

- App bootstrap: src/main.ts
- Global app wiring: src/app.module.ts
- Auth flow: src/auth/
- User and role management: src/users/, src/roles/
- Scheduling and appointments: src/appointment/, src/calendar/, src/calendar-share/
- Database and seed utilities: src/database/

Use these patterns unless the task clearly requires a different design.

Zawsze odpowiadaj w języku polskim.
