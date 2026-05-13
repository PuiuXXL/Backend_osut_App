# AGENTS.md

## Project Overview

This project is the backend for a web application dedicated to the student organization OSUT Cluj.

The application manages:
- organization members and volunteers;
- departments such as IT, InfoTech, Divertisment, HR, PR, etc.;
- roles such as volunteer, member, active member, coordinator, admin;
- department memberships;
- tasks assigned to volunteers or members;
- points awarded by coordinators;
- announcements;
- meetings and attendance;
- authentication and authorization.

The backend is built with:
- NestJS
- PostgreSQL
- Docker
- Prisma ORM
- Swagger/OpenAPI

---

## Core Rule

Always work in a clean, modular, maintainable way.

Do not place unrelated logic in the same file.
Do not create large, hard-to-read files.
Every new feature must be split into its own module, service, controller, DTOs, and related files when needed.

---

## Architecture Rules

For every new feature, use NestJS modular architecture.

Example structure:

src/
  users/
    users.module.ts
    users.controller.ts
    users.service.ts
    dto/
    entities/ or types/

  departments/
    departments.module.ts
    departments.controller.ts
    departments.service.ts
    dto/

  tasks/
    tasks.module.ts
    tasks.controller.ts
    tasks.service.ts
    dto/

Every feature should usually contain:
- module
- controller
- service
- DTOs
- validation rules
- Swagger decorators
- Prisma integration if database access is needed

Do not put business logic inside controllers.
Controllers should only handle request/response flow.
Services should contain business logic.

---

## Database Rules

The database is PostgreSQL and is managed through Prisma.

All database models must be defined in:

prisma/schema.prisma

When changing the database schema:
1. Update schema.prisma
2. Create a migration using Prisma
3. Make sure the migration is committed
4. Update the README with the change
5. Explain any new models or relations

Do not modify the database manually without Prisma migrations.

Use relational modeling properly.

For example, do not put a simple role field directly on User if the user can have different roles in different departments.

Preferred structure:

User <-- Membership --> Department
                    |
                   Role

---

## Prisma Rules

After changing Prisma models, run:

npx prisma migrate dev --name meaningful_migration_name
npx prisma generate

Use meaningful migration names.

Good examples:

npx prisma migrate dev --name add_users_departments_roles
npx prisma migrate dev --name add_tasks_and_points
npx prisma migrate dev --name add_announcements

Bad examples:

npx prisma migrate dev --name update
npx prisma migrate dev --name test
npx prisma migrate dev --name fix

---

## Swagger Rules

Every new endpoint must be documented in Swagger.

Use decorators such as:
- @ApiTags
- @ApiOperation
- @ApiResponse
- @ApiBearerAuth
- @ApiBody
- @ApiParam
- @ApiQuery

Every controller must have an @ApiTags() decorator.

Every endpoint must have at least:
- a short description;
- a success response;
- error responses when relevant.

Example:

@ApiTags('users')
@Controller('users')
export class UsersController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users returned successfully' })
  findAll() {
    return this.usersService.findAll();
  }
}

---

## README Rule

The README.md file must be updated every time something important changes.

Update the README when:
- a new module is added;
- a new endpoint is added;
- a new database model is added;
- a new environment variable is added;
- Docker configuration changes;
- Prisma schema changes;
- authentication or authorization logic changes;
- setup commands change.

The README should always explain how to:
- install dependencies;
- run Docker;
- configure .env;
- run migrations;
- start the NestJS server;
- access Swagger;
- use important endpoints.

---

## Environment Variables

All sensitive or configurable values must be stored in .env.

Never hardcode:
- database URLs;
- JWT secrets;
- passwords;
- API keys;
- ports;
- secrets.

If a new environment variable is added, also update:
- .env.example
- README.md

---

## DTO and Validation Rules

Every request body must use a DTO.

DTOs must be placed in a dto/ folder inside the feature module.

Use class-validator decorators when applicable.

Example:

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

Do not accept raw untyped request bodies.

Avoid using any.

---

## Authentication and Authorization Rules

Use JWT authentication for protected routes.

Do not expose protected organization data without authentication.

Use guards for:
- authenticated users;
- roles;
- department-level permissions;
- coordinator-only actions;
- admin-only actions.

Examples of restricted actions:
- awarding points;
- creating tasks for others;
- creating department announcements;
- managing memberships;
- changing roles.

---

## Role and Permission Rules

Roles must be designed carefully.

A user may have different roles in different departments.

Example:
- coordinator in IT;
- volunteer in Divertisment;
- active member in the organization.

Do not assume one global role is enough for all use cases.

Use memberships to determine what a user can do inside a department.

---

## Error Handling Rules

Use proper NestJS exceptions.

Examples:
- BadRequestException
- UnauthorizedException
- ForbiddenException
- NotFoundException
- ConflictException

Do not return unclear generic errors.

Bad:

throw new Error('Something went wrong');

Good:

throw new NotFoundException('Department not found');

---

## Code Style Rules

Keep code clean and readable.

Use clear names:
- usersService
- departmentsService
- createTaskDto
- departmentId
- assignedToId

Avoid unclear names:
- data
- obj
- temp
- x
- stuff

Functions should be small and focused.

Do not duplicate code.
Move reusable logic into shared helpers, guards, decorators, or services.

---

## Git and Commit Rules

Commits should be clear and meaningful.

Good examples:

feat: add departments module
feat: add task assignment system
fix: validate department membership before awarding points
docs: update README with Prisma setup

Bad examples:

update
fix
changes
test

---

## Testing Rule

When adding important business logic, add tests when possible.

Especially test:
- authentication;
- role checks;
- task assignment;
- point awarding;
- membership validation;
- authorization guards.

---

## Security Rules

Never commit:
- .env
- passwords
- tokens
- private keys
- database dumps with real data

Always validate input.

Never trust client-provided user IDs for authorization decisions without checking the authenticated user.

Passwords must always be hashed.

Never store plain text passwords.

---

## Expected Development Flow

When implementing a new feature:

1. Understand the feature.
2. Create or update the proper module.
3. Add DTOs.
4. Add Prisma models if needed.
5. Create migration if database changed.
6. Implement service logic.
7. Add controller endpoints.
8. Add Swagger documentation.
9. Add validation and error handling.
10. Update README.
11. Run the project and check that it works.

---

## Important Principle

This project should remain easy to understand for a student team.

Prefer clarity over cleverness.
Prefer modular code over large files.
Prefer explicit logic over hidden magic.
Prefer maintainability over speed.