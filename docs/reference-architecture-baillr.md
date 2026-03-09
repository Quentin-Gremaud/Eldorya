---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
workflowCompleted: true
completedAt: '2026-02-08'
inputDocuments: ['_bmad-output/planning-artifacts/prd.md', '_bmad-output/brainstorming/brainstorming-session-2026-02-08.md']
workflowType: 'architecture'
project_name: 'Baillr'
user_name: 'Monsieur'
date: '2026-02-08'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
64 FRs across 12 capability domains. Core architectural drivers: event-sourced accounting (FR53-56), batch document generation and email (FR18-27), bank statement import with automatic matching (FR28-34), 3-tier reminder escalation (FR35-41), and three INSEE index revision types (FR42-47).

**Non-Functional Requirements:**
21 NFRs across 4 categories. Architecture-shaping requirements: event immutability and zero data loss (NFR13-14), deterministic financial calculations with 2-decimal precision (NFR15, NFR18), strict multi-tenant data isolation (NFR9), and batch operation performance targets (NFR1-6).

**Scale & Complexity:**

- Primary domain: Full-stack SaaS (Next.js frontend, NestJS backend)
- Complexity level: High (event sourcing + financial domain + legal compliance)
- Estimated architectural components: 5 bounded contexts (Portfolio, Tenancy, Billing, Recovery, Indexation) + presentation gateway
- Users: single bailleur initially (dogfooding), designed for multi-tenant SaaS

### Technical Constraints & Dependencies

- **Fixed stack**: Next.js (frontend) + NestJS (backend) â non-negotiable
- **Event sourcing**: first implementation with NestJS â no pre-selected event store technology
- **Financial precision**: all money as integer cents or Decimal â no floating-point
- **Legal compliance**: French rental law (loi ALUR), GDPR, SCI accounting obligations
- **PDF generation**: server-side, must reproduce real-world document structures
- **Desktop-first**: optimized for desktop with responsive mobile adaptation

### Cross-Cutting Concerns Identified

- **Event sourcing**: affects all write operations, all state derivation, all data storage
- **Multi-tenancy**: user isolation â entity isolation â event stream isolation
- **Financial precision**: consistent decimal handling across all calculations (rent, charges, pro-rata, indices)
- **Document generation**: PDF templates for 7+ document types (rent calls, receipts, revision letters, formal notices, charge statements, stakeholder letters, account book export)
- **Email delivery**: batch SMTP with PDF attachments, deliverability tracking
- **Legal compliance**: mandatory legal mentions, correct formulas, proper document structure
- **Audit trail**: event store provides native auditability â no separate audit system needed

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SaaS: Next.js frontend + NestJS backend, deployed as two independent applications. CQRS/ES architecture with dedicated event store.

### Repository Structure Decision

**Single repository, two independent applications.** No monorepo tooling (Turborepo, Nx), no shared packages, no cross-folder dependencies. Each application is fully self-contained with its own `package.json`, `node_modules`, `tsconfig.json`, and development scripts.

```
baillr/
âââ frontend/          # Next.js application (standalone)
â   âââ package.json
â   âââ tsconfig.json
â   âââ next.config.ts
â   âââ src/
âââ backend/           # NestJS application (standalone)
â   âââ package.json
â   âââ tsconfig.json
â   âââ nest-cli.json
â   âââ src/
âââ .gitignore
âââ README.md
```

**Rationale:** Simplicity. No build orchestration overhead, no shared type synchronization to maintain, no monorepo tooling complexity. API contract between frontend and backend is the only integration point â enforced via HTTP/REST, not TypeScript imports.

### Technology Stack (Versions Verified)

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| Frontend Framework | Next.js | 16.x (App Router) | UI, routing, SSR |
| Frontend Styling | Tailwind CSS | 4.x | Utility-first CSS |
| Frontend Auth | Clerk | @clerk/nextjs 6.x | Authentication UI |
| Backend Framework | NestJS | 11.x | BFF, command/query handling |
| CQRS | @nestjs/cqrs | 11.x | Command/Query/Event buses |
| Event Store | KurrentDB (ex-EventStoreDB) | 25.x | Event storage, streams, subscriptions |
| Event Store Client | nestjs-cqrx | 5.x | NestJS â KurrentDB integration |
| ORM (Read Models) | Prisma | 7.x | Projections in PostgreSQL |
| Read Model DB | PostgreSQL | 18 | Projections, queries |
| Deployment (app) | Railway | â | NestJS + PostgreSQL |
| Deployment (events) | Kurrent Cloud | â | Managed KurrentDB (free tier) |

### Data Architecture

```
KurrentDB (Kurrent Cloud)          PostgreSQL (Railway)
âââââââââââââââââââââââ            ââââââââââââââââââââââââ
â Event Streams        â            â Read Models (Prisma)  â
â ââ tenant-{id}      â  project   â ââ properties         â
â ââ lease-{id}       â âââââââââº  â ââ tenants            â
â ââ payment-{id}     â  via       â ââ leases             â
â ââ rent-call-{id}   â  subscr.   â ââ payments           â
â ââ revision-{id}    â            â ââ rent_calls         â
â                      â            â ââ account_entries    â
â Source of truth      â            â Optimized for queries â
â Append-only          â            â Rebuildable from eventsâ
âââââââââââââââââââââââ            ââââââââââââââââââââââââ
```

### Initialization Commands

**Frontend (`frontend/`):**
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --turbopack
cd frontend && npm install @clerk/nextjs
```

Decisions made by create-next-app: TypeScript strict, App Router, Turbopack dev server, Tailwind 4, ESLint, `src/` directory structure.

**Backend (`backend/`):**
```bash
npx @nestjs/cli new backend --strict --package-manager npm
cd backend && npm install @nestjs/cqrs nestjs-cqrx @kurrent/kurrentdb-client @prisma/client
npx prisma init
```

Decisions made by NestJS CLI: TypeScript strict mode, Jest testing, ESLint, modular architecture.

**Development (KurrentDB local):**
```bash
docker run -d --name kurrentdb \
  -p 2113:2113 \
  -e KURRENTDB_INSECURE=true \
  -e KURRENTDB_ENABLE_ATOM_PUB_OVER_HTTP=true \
  kurrentplatform/kurrentdb:25.1.0
```

### Architectural Decisions Provided by Starters

**Language & Runtime:**
TypeScript strict mode in both applications, independent `tsconfig.json` configurations.

**Styling Solution:**
Tailwind CSS 4 â utility-first, desktop-first with responsive mobile adaptation.

**Build Tooling:**
- Frontend: Turbopack (dev), Next.js compiler (prod)
- Backend: NestJS compiler (tsc or swc)

**Testing Framework:**
- Frontend: Jest + React Testing Library
- Backend: Jest (NestJS default)

**Event Sourcing Infrastructure:**
- nestjs-cqrx integrates directly with @nestjs/cqrs decorators
- KurrentDB handles streams, subscriptions, optimistic concurrency
- PostgreSQL via Prisma handles read models (projections)
- Read models are rebuildable from events at any time

**Development Experience:**
- Frontend: Turbopack hot reload on port 3000
- Backend: NestJS watch mode on port 3001
- KurrentDB: Docker container on port 2113 (admin UI included)

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
Data architecture (dual-store CQRS/ES), authentication flow (Clerk JWT), multi-tenant isolation pattern, API design (REST + CQRS commands/queries), event versioning strategy (client-side upcasting).

**Important Decisions (Shape Architecture):**
Frontend state management, component library, form handling, CI/CD pipeline, monitoring approach.

**Deferred Decisions:**
Staging environment, advanced observability, scaling strategy â to be evaluated when moving beyond single-user dogfooding.

### Data Architecture

**Dual-Store CQRS/ES Pattern:**
- **KurrentDB**: source of truth. Events stored in streams named `{aggregate}-{id}` (e.g., `lease-abc123`, `tenant-def456`).
- **PostgreSQL**: read models only. Projections optimized for queries, managed via Prisma.
- Projections fed by **catch-up subscriptions** â NestJS subscribes to KurrentDB streams at startup, updates Prisma tables on each event, persists cursor position for restart recovery.
- Read models are **rebuildable** from events at any time.

**Event Format:**
- `type`: event name following VerbANoun convention (e.g., `TenantCreated`, `RentCallGenerated`, `PaymentReceived`)
- `data`: business payload (JSONB)
- `metadata`: `userId`, `entityId` (SCI/personal name), `timestamp`, `correlationId`
- `entityId` in metadata enforces multi-tenant isolation at the event store level.

**Event Versioning & Upcasting:**
- Client-side upcasting during deserialization, using nestjs-cqrx transformer mechanism as hook point.
- Prefer additive changes (new optional fields with defaults) over breaking changes.
- Breaking changes handled via chained upcaster pipeline (V1âV2âV3).
- Version tracking via event type name suffix (`TenantCreated_v1`, `TenantCreated_v2`) or payload shape detection.
- Aggregate/projection handlers only know the latest event version â upcasters transform before delivery.

**Hexagonal Architecture & DDD Rules:**
- **Command handlers contain ZERO business logic.** A handler loads the aggregate from the event store, calls the appropriate aggregate method, and saves. Nothing else.
- **All business logic lives in the aggregate.** The aggregate methods validate invariants, apply domain rules, and emit events.
- **Services are passed to aggregate methods as parameters** when the aggregate needs external capabilities (e.g., index calculation, date generation). The aggregate defines the interface (port), the infrastructure provides the implementation (adapter).
- **Always program against interfaces (ports).** Domain defines interfaces for repositories, services, and external dependencies. Infrastructure provides concrete implementations. No concrete class imported in domain â only interfaces.
- **Domain layer has zero dependencies on infrastructure.** Domain knows only its own interfaces. NestJS dependency injection wires the implementations at module registration.

Example flow:
```typescript
// Command Handler â NO logic, just orchestration
async execute(command: ApplyARevisionCommand): Promise<void> {
  const lease = await this.repository.load(command.leaseId);
  lease.applyRevision(command.newIndex, this.indexCalculator); // service passed as param
  await this.repository.save(lease);
}

// Aggregate â ALL logic here
applyRevision(newIndex: number, calculator: IIndexCalculator): void {
  const revisedRent = calculator.calculate(this.currentRentCents, this.previousIndex, newIndex);
  this.apply(new RentRevised({ leaseId: this.id, revisedRentCents: revisedRent, ... }));
}

// Port (interface) â defined in domain
interface IIndexCalculator {
  calculate(currentRentCents: number, previousIndex: number, newIndex: number): number;
}
```

**Value Objects (Domain-Driven Design):**

Every domain concept is a Value Object (VO). Aggregates manipulate VOs exclusively â never raw primitives (`string`, `number`). VOs are immutable, self-validating via static factory methods, and compared by value.

**VO Rules:**
- **Private constructor**: All VOs have `private constructor`. Instantiation through static factory methods only (`fromString`, `create`, `fromPrimitives`).
- **Immutable**: All properties `private readonly`. Exposed via getters.
- **Self-validating**: Factory method validates invariants, throws a **named domain exception** on invalid input (never raw `DomainException`).
- **Equality by value**: `equals(other)` method compares properties, not references.
- **No null in aggregates**: Optional concepts use VO with `static empty()` factory (Null Object pattern). Check absence via `isEmpty` getter.
- **Serialization at event boundary**: Events carry primitives. Aggregate constructs VOs from primitives when replaying events, serializes VOs to primitives when creating events.

**VO Location (vertical slice â flat in module):**
- Module-specific: `{bc}/{aggregate}/` â co-located with aggregate, e.g., `portfolio/entity/entity-name.ts`, `portfolio/entity/siret.ts`
- Shared across BCs: `shared/` â e.g., `user-id.ts`, `money.ts`
- No `value-objects/` subdirectory â opening a module folder shows everything at a glance

**File naming**: `kebab-case.ts` â e.g., `entity-name.ts`, `user-id.ts` (no `.vo.ts` suffix)

Example â required VO:
```typescript
import { InvalidEntityNameException } from './exceptions/invalid-entity-name.exception.js';

export class EntityName {
  private constructor(private readonly _value: string) {}

  static fromString(value: string): EntityName {
    const trimmed = value.trim();
    if (!trimmed) throw InvalidEntityNameException.required();
    if (trimmed.length > 255) throw InvalidEntityNameException.tooLong();
    return new EntityName(trimmed);
  }

  get value(): string { return this._value; }
  equals(other: EntityName): boolean { return this._value === other._value; }
}
```

Example â optional VO (Null Object):
```typescript
import { InvalidSiretException } from './exceptions/invalid-siret.exception.js';

export class Siret {
  private static readonly EMPTY = new Siret(null);
  private constructor(private readonly _value: string | null) {}

  static create(value: string): Siret {
    if (!/^\d{14}$/.test(value)) throw InvalidSiretException.invalidFormat();
    return new Siret(value);
  }
  static empty(): Siret { return Siret.EMPTY; }

  get value(): string | null { return this._value; }
  get isEmpty(): boolean { return this._value === null; }
  equals(other: Siret): boolean { return this._value === other._value; }
}
```

Example â aggregate with VOs (no raw primitives):
```typescript
// Aggregate fields â always VOs, never primitives
private name!: EntityName;
private type!: EntityType;
private siret!: Siret;                       // Siret.empty() when absent, never null
private address!: Address;
private legalInformation!: LegalInformation; // LegalInformation.empty() when absent

// VOs constructed via factory methods
const voName = EntityName.fromString(name);
const voType = EntityType.fromString(type);
const voSiret = siret ? Siret.create(siret) : Siret.empty();

// Events serialize VOs â primitives at the boundary
this.apply(new EntityCreated({
  id: this.id, userId, type: voType.value, name: voName.value,
  siret: voSiret.value, address: voAddress.toPrimitives(), legalInformation: voLegalInfo.value,
}));
```

**Named Domain Exceptions:**

Domain exceptions are specific classes extending `DomainException`, with private constructors and static factory methods. Never throw raw `DomainException` â always use a named subclass.

**Exception Location:**
- Module-specific: `{bc}/{aggregate}/exceptions/` â e.g., `portfolio/entity/exceptions/invalid-siret.exception.ts`
- Shared: `shared/exceptions/` â base `DomainException` + cross-module exceptions (e.g., `invalid-user-id.exception.ts`)

**Exception Rules:**
- **Private constructor**: Instantiation through named static factory methods only.
- **Static factory methods**: Descriptive names â `required()`, `invalidFormat()`, `tooLong()`, `streetRequired()`.
- **One class per logical error group**: An exception class can have multiple factories for related validation errors (e.g., `InvalidAddressException.streetRequired()`, `.cityRequired()`).
- **Extend `DomainException`**: All exceptions carry `message`, `code`, and `statusCode`.

Example:
```typescript
import { DomainException } from '@shared/exceptions/domain.exception.js';

export class InvalidEntityNameException extends DomainException {
  private constructor(message: string, code: string) {
    super(message, code, 400);
  }
  static required(): InvalidEntityNameException {
    return new InvalidEntityNameException('Entity name is required', 'ENTITY_NAME_REQUIRED');
  }
  static tooLong(): InvalidEntityNameException {
    return new InvalidEntityNameException('Entity name exceeds 255 characters', 'ENTITY_NAME_TOO_LONG');
  }
}
```

**Controller-per-Action (Single Responsibility):**

Each NestJS controller class handles exactly one route (one HTTP method + path). No fat controllers grouping multiple actions. This follows SRP, simplifies testing, and scales cleanly as the number of actions grows.

- **File naming**: `{verb-a-noun}.controller.ts` â matches the command/query name
- **Class naming**: `{VerbANoun}Controller` â e.g., `CreateATenantController`, `GetTenantsController`
- **Single `handle()` method** per controller

Example:
```typescript
@Controller('entities')
export class CreateAnEntityController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async handle(@Body() dto: CreateAnEntityDto, @CurrentUser() userId: string): Promise<void> {
    await this.commandBus.execute(new CreateAnEntityCommand(dto.id, userId, ...));
  }
}
```

Presentation module structure (per module):
```
presentation/{module}/
âââ controllers/
â   âââ create-a-{module}.controller.ts    # POST â command
â   âââ update-a-{module}.controller.ts    # PUT :id â command
â   âââ get-{module}s.controller.ts        # GET â query (list)
â   âââ get-a-{module}.controller.ts       # GET :id â query (detail)
âââ dto/
âââ queries/
âââ projections/
âââ finders/
âââ __tests__/
```

**Naming Conventions:**
- Command classes: VerbANoun pattern â `CreateATenantCommand`, `GenerateRentCallsCommand` (plural for batch), `ImportABankStatementCommand`
- Query classes: VerbANoun pattern â `GetATenantQuery`, `GetTenantsQuery`
- Event types: PastTense â `TenantCreated`, `PaymentReceived`, `RentCallGenerated`
- Stream names: `{aggregate}-{id}` â `tenant-abc123`, `lease-def456`

**Financial Precision:**
All monetary values stored as **integer cents** (e.g., 75000 = 750.00â¬). No floating-point anywhere in the pipeline. INSEE index calculations (IRL, ILC, ICC) rounded down to nearest cent (favoring tenant per French law).

**Caching:**
No caching layer at launch. PostgreSQL read models are sufficient for single-user scale.

### Bounded Contexts & Context Map

Each bounded context (BC) is a self-contained semantic boundary with its own ubiquitous language, aggregates, and module structure. **BCs contain domain logic only** (aggregates, commands, events, VOs, exceptions). The presentation layer (controllers, DTOs, queries, projections, finders) lives **outside** the BCs as a separate API gateway layer.

**5 Bounded Contexts (domain only):**

| BC | Directory | Aggregates | FR Coverage | Core Concept |
|----|-----------|-----------|-------------|--------------|
| Portfolio | `portfolio/` | Entity, Property, Unit | FR1-8, FR57-60 | Real estate ownership structure |
| Tenancy | `tenancy/` | Tenant, Lease | FR9-17 | Tenant lifecycle and lease contracts |
| Billing | `billing/` | RentCall, Payment | FR18-22, FR28-34 | Revenue generation and collection |
| Recovery | `recovery/` | Reminder | FR35-41 | Unpaid rent detection and escalation |
| Indexation | `indexation/` | Revision, Charge | FR42-52 | Annual adjustments per French law |

**Presentation Gateway** (`presentation/`): Sits outside BCs. Organized by resource (entity/, tenant/, lease/, etc.). Acts as the API gateway layer â receives HTTP requests, dispatches commands to BCs, reads from PostgreSQL projections. `presentation/accounting/` is a **read-only module** (FR53-56) with no domain counterpart â it projects financial events from Billing, Recovery, and Indexation into the account book.

**Shared Kernel** (`shared/`): Cross-BC value objects (`UserId`, `Money`) and base exceptions (`DomainException`). These are the **only** allowed cross-BC imports.

**Context Map â Event-Driven Relationships:**
```
Portfolio ââ(UnitCreated)âââº Tenancy ââ(LeaseCreated)âââº Billing
                                â                           â
                     (LeaseCreated)               (RentCallUnpaid)
                                â                           â
                                â¼                           â¼
                           Indexation                   Recovery

                    presentation/accounting/
                    projects financial events from
                    Billing, Recovery, Indexation
```

- **Portfolio â Tenancy**: Lease references a Unit by `unitId`. Tenancy subscribes to `UnitCreated`/`UnitUpdated` events for denormalized read models.
- **Tenancy â Billing**: RentCall references a Lease by `leaseId`. Billing subscribes to `LeaseCreated`/`LeaseTerminated` to know active leases.
- **Tenancy â Indexation**: Revision references a Lease by `leaseId`. Indexation subscribes to `LeaseCreated` to know which leases need annual revision.
- **Billing â Recovery**: Reminder references unpaid RentCalls. Recovery subscribes to `RentCallGenerated`/`PaymentReceived` to detect unpaid status.
- **All â Accounting (presentation)**: `presentation/accounting/` projects financial events (`RentCallGenerated`, `PaymentReceived`, `ChargeRegularized`, etc.) into the account book read model.

**Inter-BC Communication Rules:**
1. BCs communicate **exclusively via domain events** (KurrentDB catch-up subscriptions)
2. No direct imports between BC domain modules â only `shared/` imports allowed
3. References between BCs are **by ID only** (e.g., a Lease stores `unitId: string`, never imports Unit aggregate)
4. Each BC has its own root NestJS module that registers its domain sub-modules
5. `presentation/` is a separate layer â it dispatches commands to BCs and queries its own read models
6. `infrastructure/` remains global â provides cross-cutting adapters (auth, database, eventstore, document generation, email)

**Document & Email Services:**
Document generation (`PdfGeneratorService`) and email delivery (`SmtpService`) are **infrastructure services**, not bounded contexts. They have no business invariants â they execute on behalf of other BCs via the command bus. Located in `infrastructure/document/` and `infrastructure/email/`.

**BC Directory Pattern (domain only):**
```
{bounded-context}/
âââ {aggregate}/
â   âââ {aggregate}.aggregate.ts
â   âââ {aggregate}.module.ts
â   âââ *.ts                     # VOs flat in module
â   âââ commands/
â   âââ events/
â   âââ exceptions/
â   âââ __tests__/
âââ {bounded-context}.module.ts   # Registers aggregate domain modules
```

**Presentation Directory Pattern (gateway):**
```
presentation/
âââ {resource}/
â   âââ controllers/             # One controller per action
â   âââ dto/
â   âââ queries/
â   âââ projections/
â   âââ finders/
â   âââ {resource}-presentation.module.ts
â   âââ __tests__/
âââ accounting/                  # Read-only, no BC counterpart
```

### Authentication & Security

**Clerk Integration:**
- Frontend: `@clerk/nextjs` middleware handles login/signup, provides JWT in session cookies.
- Backend: custom NestJS `AuthGuard` verifies Clerk JWT using JWKS (public key verification, no Clerk API call per request).
- User identity extracted from JWT claims and injected into NestJS request context.

**Multi-Tenant Isolation:**
- Clerk user = bailleur. Each bailleur owns multiple management entities (SCIs + personal name).
- Two-level isolation:
  - **Event store level**: `entityId` in event metadata â streams filterable by entity.
  - **Read model level**: every Prisma table carries `entityId` â all queries filtered by active entity.
- NestJS middleware injects current `entityId` (selected in frontend) into request context.
- Guard verifies the requested `entityId` belongs to the authenticated user.

**Authorization:**
Two roles per entity, no RBAC library needed:
- `owner`: full access (commands + queries)
- `accountant`: read-only access (queries only, scoped to specific entities)
- Role stored in the user-entity relationship (Prisma read model).
- Guard checks: authenticated â owns or has access to entity â if `accountant`, block POST/PUT/DELETE.

**API Security:**
- CORS restricted to frontend domain only.
- Rate limiting via `@nestjs/throttler`.
- Input validation via `class-validator` + `class-transformer` (NestJS standard).
- No sensitive data in events (passwords managed by Clerk).

### API & Communication Patterns

**REST API with CQRS Semantics:**
- Commands via POST: `POST /api/tenants` â `CreateATenantCommand`
- Queries via GET: `GET /api/rent-calls?month=2026-03` â `GetRentCallsQuery`
- Batch operations via POST: `POST /api/rent-calls/generate` â `GenerateRentCallsCommand`
- No GraphQL â single frontend, REST is simpler.

**Command/Query Flow:**
- Frontend generates resource UUIDs (`crypto.randomUUID()`) and includes them in the command payload.
- Commands are fire-and-forget: backend validates, writes event, returns `202 Accepted` with no body.
- Frontend already knows the ID â navigates or updates optimistically without waiting.
- Queries return `200 OK` with data payload from read models.

**Error Handling:**
Global NestJS `ExceptionFilter` normalizing all errors:
- Business errors (invalid rent, unknown lease) â `400` / `404` / `409`
- Auth errors â `401` / `403`
- Server errors â `500` with logging, no technical details exposed.
- Error format: `{ statusCode, error, message, details? }`

**API Documentation:**
`@nestjs/swagger` with controller decorators â auto-generated OpenAPI spec.

**Eventual Consistency Strategy:**
After a command, projections may not be immediately updated. Two approaches:
- **Optimistic UI + delayed reconciliation** (default): TanStack Query `onMutate` / `onError` / `onSettled` pattern â cache is updated immediately with optimistic data, rolled back on error. `onSettled` triggers a delayed `invalidateQueries` (1.5s) to let the projection catch up, then reconcile the cache with the actual read model. See Frontend Architecture section for the full pattern.
- **Short polling**: for batch operations (rent call generation), frontend polls a status endpoint.
- No WebSocket â management tool, not real-time application.

### Frontend Architecture

**Data Fetching: TanStack Query (React Query)**
- Caches GET queries, auto-invalidates after mutations.
- Handles loading/error states.
- **Optimistic updates are MANDATORY** for all `useMutation` hooks â the CQRS/ES projection delay makes this essential.

**Optimistic Update Pattern (established in Story 2.1):**
Every mutation hook follows the `onMutate` / `onError` / `onSettled` pattern:
- `onMutate`: cancel in-flight queries, snapshot previous cache, construct optimistic data, update cache immediately.
- `onError`: rollback cache to snapshot from context.
- `onSettled`: **delayed `invalidateQueries`** (1.5s via `setTimeout`) â gives the projection time to process the event, then reconciles the cache with the actual read model. The optimistic data bridges the gap: user sees immediate feedback, and the delayed refetch ensures completeness (e.g., other entities already in the database).

```typescript
// Create: append optimistic entry to list cache
onMutate: async (payload) => {
  await queryClient.cancelQueries({ queryKey: ["resources"] });
  const previous = queryClient.getQueryData<Data[]>(["resources"]);
  const optimistic: Data = { id: payload.id, ...payload, /* defaults */ };
  queryClient.setQueryData<Data[]>(["resources"], (old) => [...(old ?? []), optimistic]);
  return { previous };
},

// Update: apply partial update to BOTH list AND detail caches
onMutate: async ({ id, payload }) => {
  await queryClient.cancelQueries({ queryKey: ["resources"] });
  await queryClient.cancelQueries({ queryKey: ["resources", id] });
  const previousList = queryClient.getQueryData<Data[]>(["resources"]);
  const previousDetail = queryClient.getQueryData<Data>(["resources", id]);
  queryClient.setQueryData<Data[]>(["resources"], (old) =>
    old?.map((e) => (e.id === id ? { ...e, ...payload } : e)),
  );
  if (previousDetail) {
    queryClient.setQueryData<Data>(["resources", id], { ...previousDetail, ...payload });
  }
  return { previousList, previousDetail };
},
```

**Anti-Patterns:**
- Never call `invalidateQueries` **immediately** (without delay) in `onSettled` â projection lag will overwrite optimistic data with stale server state.
- Never skip optimistic updates and rely solely on `invalidateQueries` â user must see immediate feedback.

**State Management:**
No global store (no Redux, no Zustand). TanStack Query manages server state. Only global client state: active management entity (SCI / personal name) via React Context.

**Component Library: shadcn/ui**
- Components copied into project (not an npm dependency).
- Based on Radix UI (accessible, headless primitives).
- Tailwind 4 compatible.
- Full control over component code.

**Forms: React Hook Form + Zod**
- React Hook Form for form state management (performant, minimal re-renders).
- Zod schemas for validation with TypeScript inference.
- Connected via `zodResolver`.

**Routing: Next.js App Router**
File-based routing with route groups:
```
src/app/
âââ (auth)/              # Routes protected by Clerk
â   âââ dashboard/
â   âââ tenants/
â   âââ leases/
â   âââ rent-calls/
â   âââ payments/
â   âââ accounting/
â   âââ settings/
âââ sign-in/
âââ sign-up/
âââ layout.tsx
```

### Infrastructure & Deployment

**Production Architecture:**
- Frontend (Next.js): Railway service, port 3000
- Backend (NestJS): Railway service, port 3001
- PostgreSQL: Railway managed database (read models)
- KurrentDB: Kurrent Cloud managed (free tier, event store)
- Two Railway services with independent environment variables. Frontend knows backend URL only.

**Local Development:**
Docker Compose at repo root for external services only (PostgreSQL + KurrentDB). Frontend and backend run natively for faster development.

**Environments:**
- **Local**: `next dev` + `nest start --watch` + Docker Compose (PostgreSQL + KurrentDB)
- **Production**: Railway (frontend + backend + PostgreSQL) + Kurrent Cloud (KurrentDB)
- No staging environment initially â single user dogfooding. Add later if needed.

**CI/CD: GitHub Actions**
- On PR: lint + typecheck + tests (frontend and backend in parallel)
- On merge to main: auto-deploy via Railway GitHub integration
- No complex orchestration â Railway detects pushes and deploys automatically.

**Configuration:**
Environment variables only (`.env` local, Railway dashboard in prod):
- `DATABASE_URL`, `KURRENTDB_CONNECTION_STRING`
- `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `BACKEND_URL` (frontend â backend)

**Monitoring & Logging:**
- Railway: application logs (stdout/stderr)
- Kurrent Cloud: event store monitoring dashboard
- NestJS Logger with levels (debug/info/warn/error)
- No external observability platform initially â evaluate when scaling to multi-user.

### Decision Impact Analysis

**Implementation Sequence:**
1. Repository setup + Docker Compose (PostgreSQL + KurrentDB)
2. Backend scaffolding (NestJS + Clerk AuthGuard + KurrentDB connection)
3. First aggregate with event store (e.g., Property or Tenant)
4. Projection infrastructure (catch-up subscription â Prisma)
5. Frontend scaffolding (Next.js + Clerk + TanStack Query)
6. First end-to-end flow (command â event â projection â query â UI)
7. Remaining bounded contexts following established patterns

**Cross-Component Dependencies:**
- Clerk configuration must be done first (shared between frontend auth and backend JWT verification).
- KurrentDB connection and subscription infrastructure must be established before any aggregate can be implemented.
- Prisma schema evolves as new projections are added per bounded context.
- Frontend API client layer depends on backend endpoint contracts being defined.

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma):**
- Tables: `snake_case` plural â `tenants`, `leases`, `rent_calls`, `account_entries`
- Columns: `snake_case` â `entity_id`, `created_at`, `lease_start_date`
- Prisma auto-maps to `camelCase` in TypeScript via `@map` / `@@map`

**API Endpoints:**
- Endpoints: `kebab-case` plural â `/api/tenants`, `/api/rent-calls`, `/api/account-entries`
- Route parameters: `:id` â `/api/tenants/:id`
- Query params: `camelCase` â `?entityId=xxx&month=2026-03`

**Backend TypeScript:**
- Files: `kebab-case` â `create-a-tenant.command.ts`, `tenant-created.event.ts`, `create-a-tenant.controller.ts`, `entity-name.ts`, `invalid-siret.exception.ts`
- Classes: `PascalCase` â `CreateATenantCommand`, `CreateATenantController`, `TenantProjection`, `EntityName`, `InvalidSiretException`
- Functions/variables: `camelCase` â `getActiveLease`, `monthlyRentCents`
- Mandatory suffixes: `.command.ts`, `.query.ts`, `.event.ts`, `.handler.ts`, `.projection.ts`, `.controller.ts`, `.module.ts`, `.guard.ts`, `.exception.ts`, `.dto.ts`
- VOs: no suffix â just `entity-name.ts`, `siret.ts`, `address.ts` (co-located flat in module)

**Frontend TypeScript:**
- Components: `kebab-case` file, `PascalCase` export â `tenant-card.tsx` exports `TenantCard`
- Hooks: `use-` prefix â `use-tenants.ts` exports `useTenants`
- API client: `kebab-case` â `tenants-api.ts`

### Structure Patterns

**Backend â bounded contexts (domain) + presentation gateway (hexagonal CQRS):**
```
backend/src/
â
â ââ Bounded Contexts (domain only) ââ
â
âââ portfolio/                   # BC: Real estate ownership
â   âââ entity/                  # Aggregate: SCI, nom propre
â   â   âââ entity.aggregate.ts
â   â   âââ entity.module.ts
â   â   âââ entity-name.ts       # VO â flat in module
â   â   âââ commands/
â   â   âââ events/
â   â   âââ exceptions/
â   â   âââ __tests__/
â   âââ property/                # Aggregate: Properties & units
â   âââ portfolio.module.ts
â
âââ tenancy/                     # BC: Tenant lifecycle & leases
â   âââ tenant/
â   âââ lease/
â   âââ tenancy.module.ts
â
âââ billing/                     # BC: Revenue collection
â   âââ rent-call/
â   âââ payment/
â   âââ billing.module.ts
â
âââ recovery/                    # BC: Unpaid management
â   âââ reminder/
â   âââ recovery.module.ts
â
âââ indexation/                  # BC: Annual adjustments
â   âââ revision/
â   âââ charge/
â   âââ indexation.module.ts
â
â ââ Presentation Gateway (API layer) ââ
â
âââ presentation/                # Outside BCs â REST gateway
â   âââ entity/
â   â   âââ controllers/         # One controller per action
â   â   âââ dto/
â   â   âââ queries/
â   â   âââ projections/
â   â   âââ finders/
â   â   âââ __tests__/
â   âââ property/
â   âââ tenant/
â   âââ lease/
â   âââ rent-call/
â   âââ payment/
â   âââ reminder/
â   âââ revision/
â   âââ charge/
â   âââ accounting/              # Read-only â no BC counterpart
â       âââ controllers/
â       âââ queries/
â       âââ projections/
â       âââ finders/
â       âââ __tests__/
â
â ââ Cross-cutting ââ
â
âââ infrastructure/
â   âââ auth/                    # Clerk AuthGuard
â   âââ database/                # Prisma service
â   âââ eventstore/              # KurrentDB connection, upcasters
â   âââ tenant-context/          # EntityId middleware
â   âââ document/                # PDF generation service
â   âââ email/                   # SMTP service
â   âââ scheduling/              # Cron jobs
â   âââ gdpr/                    # Crypto-shredding
â   âââ integrations/            # External APIs (INSEE, banking, AR24)
â
âââ shared/                      # Shared kernel
â   âââ user-id.ts
â   âââ money.ts
â   âââ exceptions/
â
âââ app.module.ts
âââ main.ts
```

**Frontend â feature-based organization:**
```
frontend/src/
âââ app/                # Next.js App Router
â   âââ (auth)/
â   â   âââ dashboard/
â   â   âââ tenants/
â   â   â��   âââ page.tsx
â   â   â   âââ [id]/
â   â   â   â   âââ page.tsx
â   â   â   âââ new/
â   â   â       âââ page.tsx
â   â   âââ leases/
â   â   âââ rent-calls/
â   â   âââ payments/
â   â   âââ accounting/
â   âââ sign-in/
â   âââ layout.tsx
âââ components/
â   âââ ui/             # shadcn/ui components
â   âââ features/
â       âââ tenants/
â       â   âââ tenant-card.tsx
â       â   âââ tenant-form.tsx
â       â   âââ tenant-list.tsx
â       âââ leases/
â       âââ payments/
âââ hooks/
â   âââ use-tenants.ts
â   âââ use-entity-context.ts
âââ lib/
â   âââ api/            # API client functions
â   â   âââ tenants-api.ts
â   â   âââ client.ts   # fetch wrapper with auth
â   âââ utils/
âââ types/
    âââ api.ts          # API response types
```

**Tests:** co-located in `__tests__/` folder within each module/feature.

### Format Patterns

**API Responses:**
- Command accepted: `202 Accepted` â no body. Frontend already has the resource ID (generated client-side via `crypto.randomUUID()`).
- Query success: `200 OK` â `{ data: T }`
- Error: `{ statusCode: number, error: string, message: string, details?: any }`
- HTTP status code conveys success/failure â no `{ success: true }` wrapper.

**Command Payload Convention:**
Frontend generates the resource ID and includes it in the command payload:
```json
POST /api/tenants
{ "id": "uuid-generated-by-frontend", "entityId": "sci-xxx", "firstName": "Dupont", ... }
```

**Data Exchange Formats:**
- JSON fields: `camelCase` â `{ entityId, leaseStartDate, monthlyRentCents }`
- Dates: ISO 8601 strings â `"2026-03-01"` (date), `"2026-03-01T10:30:00Z"` (datetime)
- Money: always in **cents** (integer) â `{ monthlyRentCents: 75000 }`
- Booleans: native JSON `true`/`false`
- Null: explicit `null` in API JSON responses (never omit field). In domain aggregates, Null Object VOs (`VO.empty()`) replace nullable primitives â no `null` in aggregate state

### Communication Patterns

**Events (recap from step 4):**
- Naming: `PascalCase` past tense â `TenantCreated`, `PaymentReceived`
- Payload: `{ data: {...}, metadata: { userId, entityId, timestamp, correlationId } }`
- Versioning: `_v2` suffix for breaking changes

**Logging:**
- NestJS Logger injected per class â `private readonly logger = new Logger(CreateATenantController.name)`
- Levels: `error` (failure), `warn` (abnormal), `log` (business event), `debug` (dev only)
- Never log sensitive data
- Always include `correlationId` when available

### Process Patterns

**Error Handling:**
- Backend: custom domain exceptions â `TenantNotFoundException`, `InvalidRentAmountException`
- All inherit from a base `DomainException`
- Global `ExceptionFilter` translates to normalized HTTP response
- Frontend: TanStack Query `onError` â toast/notification display

**Loading States:**
- TanStack Query manages `isLoading`, `isError`, `data` natively
- Standardized `<LoadingSpinner />` component (shadcn/ui)
- Skeleton loaders for lists and tables
- No global loading state

**Validation:**
- Frontend: Zod schemas in forms (instant validation)
- Backend: `class-validator` decorators on DTOs (validation at controller entry)
- Double validation â backend never trusts frontend

### Enforcement Guidelines

**All AI Agents MUST:**
- **Zero logic in command handlers** â handler loads aggregate, calls method, saves. Period.
- **All business logic in aggregates** â validation, rules, event emission all happen in aggregate methods
- **Use Value Objects for ALL domain concepts** â aggregates never hold raw primitives (`string`, `number`). Every field is a VO. Optional fields use `VO.empty()` (Null Object), never `null`
- **Private constructors + static factories on VOs** â `EntityName.fromString(value)`, `Siret.create(value)`, `Address.fromPrimitives(data)`. Never `new EntityName(value)`
- **Named domain exceptions** â never throw raw `DomainException`. Use specific subclasses with static factory: `InvalidEntityNameException.required()`, `EntityAlreadyExistsException.create()`
- **VOs flat in module** â no `value-objects/` subdirectory. `entity-name.ts`, `siret.ts` co-located next to `entity.aggregate.ts`
- **One controller per action** â each controller class handles exactly one route with a single `handle()` method. No fat controllers with multiple endpoints
- **Use interfaces (ports) everywhere** â domain defines interfaces, infrastructure implements them
- **Pass services as parameters to aggregate methods** â never inject services into aggregates directly
- Respect domain/presentation separation: domain/ talks to event store only, presentation/ talks to PostgreSQL only
- Follow VerbANoun naming for commands/queries, PastTense for events
- Use `kebab-case` for all file names, `PascalCase` for classes, `camelCase` for variables
- Generate resource UUIDs on the frontend â commands never return IDs
- Store all monetary values as integer cents â no floating-point
- Include `entityId` in all event metadata and all Prisma queries
- Co-locate tests in `__tests__/` within each domain or presentation module
- Use NestJS Logger (not console.log) with proper log levels

**Anti-Patterns (Forbidden):**
- **Putting business logic in command handlers** (handlers are pure orchestration â load, call, save)
- **Using raw primitives in aggregates** (always use Value Objects â `EntityName` not `string`, `Siret` not `string | null`)
- **Public constructors on VOs** (always private constructor + static factory: `fromString`, `create`, `fromPrimitives`)
- **Throwing raw `DomainException`** (always use named subclass: `InvalidSiretException.invalidFormat()`, not `new DomainException('SIRET must be 14 digits', ...)`)
- **`value-objects/` subdirectory in domain modules** (VOs live flat in module root â vertical slice)
- **Putting multiple routes in one controller** (one controller = one HTTP action = one `handle()` method)
- **Importing concrete classes in domain/** (domain only imports its own interfaces/ports)
- **Injecting services into aggregates via constructor** (pass them as method parameters instead)
- Importing Prisma or PostgreSQL in domain/ (domain only knows the event store)
- Importing KurrentDB client in presentation/ (presentation only knows PostgreSQL, except projections consuming events via subscription)
- Returning resource data from command endpoints (commands return `202` only)
- Using `float` or `number` for money (must be integer cents)
- Querying without `entityId` filter (breaks multi-tenant isolation)
- Creating shared packages between frontend and backend
- Using global state stores (Redux/Zustand) instead of TanStack Query
- Writing `useMutation` hooks without optimistic update pattern (all mutations MUST handle eventual consistency)
- Calling `invalidateQueries` **immediately** in `onSettled` (without delay) â projection lag overwrites optimistic data with stale server state
- Hardcoding IDs server-side in command handlers
- **Importing between bounded contexts** (e.g., `tenancy/` importing from `portfolio/`) â use events and IDs only

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Domain | Bounded Context | Domain Path | Presentation Path | Frontend Feature |
|-----------|----------------|-------------|-------------------|-----------------|
| FR57-60: Management Entities | Portfolio | `portfolio/entity/` | `presentation/entity/` | `entities/` |
| FR1-5: Property Management | Portfolio | `portfolio/property/` | `presentation/property/` | `properties/` |
| FR6-10: Tenant Management | Tenancy | `tenancy/tenant/` | `presentation/tenant/` | `tenants/` |
| FR11-17: Lease Management | Tenancy | `tenancy/lease/` | `presentation/lease/` | `leases/` |
| FR18-22: Rent Call Generation | Billing | `billing/rent-call/` | `presentation/rent-call/` | `rent-calls/` |
| FR28-34: Bank Import & Matching | Billing | `billing/payment/` | `presentation/payment/` | `payments/` |
| FR35-41: Reminder Escalation | Recovery | `recovery/reminder/` | `presentation/reminder/` | `reminders/` |
| FR42-47: INSEE Index Revision | Indexation | `indexation/revision/` | `presentation/revision/` | `revisions/` |
| FR48-52: Charge Management | Indexation | `indexation/charge/` | `presentation/charge/` | `charges/` |
| FR53-56: Accounting | â (read-only) | â | `presentation/accounting/` | `accounting/` |
| FR23-27: Documents & Emails | â (infra) | `infrastructure/document/` + `infrastructure/email/` | â | (integrated) |
| FR61-64: Settings | â (infra) | `infrastructure/` | â | `settings/` |

### Complete Project Directory Structure

```
baillr/
âââ .github/
â   âââ workflows/
â       âââ ci.yml
âââ .gitignore
âââ docker-compose.yml
âââ README.md
â
âââ frontend/
â   âââ package.json
â   âââ tsconfig.json
â   âââ next.config.ts
â   âââ postcss.config.ts
â   âââ .env.local
â   âââ .env.example
â   â
â   âââ src/
â       âââ app/
â       â   âââ globals.css
â       â   âââ layout.tsx
â       â   âââ sign-in/
â       â   â   âââ [[...sign-in]]/
â       â   â       âââ page.tsx
â       â   âââ sign-up/
â       â   â   âââ [[...sign-up]]/
â       â   â       âââ page.tsx
â       â   âââ (auth)/
â       â       âââ layout.tsx
â       â       âââ dashboard/
â       â       â   âââ page.tsx
â       â       âââ entities/
â       â       â   âââ page.tsx
â       â       â   âââ new/
â       â       â       âââ page.tsx
â       â       âââ properties/
â       â       â   âââ page.tsx
â       â       â   âââ [id]/
â       â       â   â   âââ page.tsx
â       â       â   âââ new/
â       â       â       âââ page.tsx
â       â       âââ tenants/
â       â       â   âââ page.tsx
â       â       â   âââ [id]/
â       â       â   â   âââ page.tsx
â       â       â   âââ new/
â       â       â       âââ page.tsx
â       â       âââ leases/
â       â       â   âââ page.tsx
â       â       â   âââ [id]/
â       â       â   â   âââ page.tsx
â       â       â   âââ new/
â       â       â       âââ page.tsx
â       â       âââ rent-calls/
â       â       â   âââ page.tsx
â       â       â   âââ [id]/
â       â       â       âââ page.tsx
â       â       âââ payments/
â       â       â   âââ page.tsx
â       â       â   âââ [id]/
â       â       â       âââ page.tsx
â       â       âââ reminders/
â       â       â   âââ page.tsx
â       â       âââ revisions/
â       â       â   âââ page.tsx
â       â       â   âââ new/
â       â       â       âââ page.tsx
â       â       âââ charges/
â       â       â   âââ page.tsx
â       â       â   âââ [id]/
â       â       â       âââ page.tsx
â       â       âââ accounting/
â       â       â   âââ page.tsx
â       â       âââ settings/
â       â           âââ page.tsx
â       â
â       âââ components/
â       â   âââ ui/                         # shadcn/ui
â       â   âââ layout/
â       â   â   âââ sidebar.tsx
â       â   â   âââ header.tsx
â       â   â   âââ entity-switcher.tsx
â       â   âââ features/
â       â       âââ properties/
â       â       â   âââ property-form.tsx
â       â       â   âââ property-list.tsx
â       â       âââ tenants/
â       â       â   âââ tenant-form.tsx
â       â       â   âââ tenant-list.tsx
â       â       âââ leases/
â       â       â   âââ lease-form.tsx
â       â       â   âââ lease-list.tsx
â       â       âââ rent-calls/
â       â       â   âââ rent-call-list.tsx
â       â       â   âââ batch-generate-dialog.tsx
â       â       âââ payments/
â       â       â   âââ bank-import-form.tsx
â       â       â   âââ matching-table.tsx
â       â       â   âââ payment-list.tsx
â       â       âââ reminders/
â       â       â   âââ reminder-list.tsx
â       â       âââ revisions/
â       â       â   âââ revision-form.tsx
â       â       â   âââ revision-list.tsx
â       â       âââ charges/
â       â       â   âââ charge-form.tsx
â       â       â   âââ charge-list.tsx
â       â       âââ accounting/
â       â           âââ account-book.tsx
â       â           âââ export-dialog.tsx
â       â
â       âââ hooks/
â       â   âââ use-entity-context.ts
â       â   âââ use-properties.ts
â       â   âââ use-tenants.ts
â       â   âââ use-leases.ts
â       â   âââ use-rent-calls.ts
â       â   âââ use-payments.ts
â       â   âââ use-reminders.ts
â       â   âââ use-revisions.ts
â       â   âââ use-charges.ts
â       â   âââ use-accounting.ts
â       â
â       âââ lib/
â       â   âââ api/
â       â   â   âââ client.ts               # fetch wrapper with Clerk auth
â       â   â   âââ properties-api.ts
â       â   â   âââ tenants-api.ts
â       â   â   âââ leases-api.ts
â       â   â   âââ rent-calls-api.ts
â       â   â   âââ payments-api.ts
â       â   â   âââ reminders-api.ts
â       â   â   âââ revisions-api.ts
â       â   â   âââ charges-api.ts
â       â   â   âââ accounting-api.ts
â       â   âââ utils/
â       â       âââ format-money.ts
â       â       âââ format-date.ts
â       â
â       âââ types/
â       â   âââ api.ts
â       â
â       âââ middleware.ts                    # Clerk auth middleware
â
âââ backend/
    âââ package.json
    âââ tsconfig.json
    âââ tsconfig.build.json
    âââ nest-cli.json
    âââ .env
    âââ .env.example
    â
    âââ prisma/
    â   âââ schema.prisma                   # Read models only
    â   âââ migrations/
    â
    âââ src/
        âââ main.ts
        âââ app.module.ts
        â
        â   ââââ Bounded Contexts (domain only) ââââ
        â
        âââ portfolio/                       # BC: Real estate ownership
        â   âââ entity/
        â   â   âââ entity.aggregate.ts
        â   â   âââ entity.module.ts
        â   â   âââ entity-name.ts                   # VO â flat in module
        â   â   âââ entity-type.ts                   # VO
        â   â   âââ siret.ts                         # VO (Null Object)
        â   â   âââ address.ts                       # VO (composite)
        â   â   âââ legal-information.ts             # VO (Null Object)
        â   â   âââ commands/
        â   â   â   âââ create-an-entity.command.ts
        â   â   â   âââ create-an-entity.handler.ts
        â   â   â   âââ update-an-entity.command.ts
        â   â   â   âââ update-an-entity.handler.ts
        â   â   âââ events/
        â   â   â   âââ entity-created.event.ts
        â   â   â   âââ entity-updated.event.ts
        â   â   âââ exceptions/
        â   â   â   âââ entity-already-exists.exception.ts
        â   â   â   âââ entity-not-found.exception.ts
        â   â   â   âââ siret-required-for-sci.exception.ts
        â   â   â   âââ invalid-entity-name.exception.ts
        â   â   â   âââ invalid-entity-type.exception.ts
        â   â   â   âââ invalid-siret.exception.ts
        â   â   â   âââ invalid-address.exception.ts
        â   â   â   âââ invalid-legal-information.exception.ts
        â   â   âââ __tests__/
        â   â       âââ entity.aggregate.spec.ts
        â   â       âââ create-an-entity.handler.spec.ts
        â   â       âââ update-an-entity.handler.spec.ts
        â   â   # property/                  # Future: Story 2.4
        â   âââ portfolio.module.ts
        â
        âââ tenancy/                         # BC: Tenant lifecycle & leases
        â   âââ tenant/
        â   â   âââ tenant.aggregate.ts
        â   â   âââ *.ts                             # VOs flat in module
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ __tests__/
        â   âââ lease/
        â   â   âââ lease.aggregate.ts
        â   â   âââ *.ts
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ __tests__/
        â   âââ tenancy.module.ts
        â
        âââ billing/                         # BC: Revenue collection
        â   âââ rent-call/
        â   â   âââ rent-call.aggregate.ts
        â   â   âââ *.ts
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ __tests__/
        â   âââ payment/
        â   â   âââ payment.aggregate.ts
        â   â   âââ *.ts
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ services/
        â   â   â   âââ bank-statement-parser.service.ts
        â   â   âââ __tests__/
        â   âââ billing.module.ts
        â
        âââ recovery/                        # BC: Unpaid management
        â   âââ reminder/
        â   â   âââ reminder.aggregate.ts
        â   â   âââ *.ts
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ sagas/
        â   â   â   âââ reminder-escalation.saga.ts
        â   â   âââ __tests__/
        â   âââ recovery.module.ts
        â
        âââ indexation/                      # BC: Annual adjustments
        â   âââ revision/
        â   â   âââ revision.aggregate.ts
        â   â   âââ *.ts
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ services/
        â   â   â   âââ index-calculator.service.ts
        â   â   âââ __tests__/
        â   âââ charge/
        â   â   âââ charge.aggregate.ts
        â   â   âââ *.ts
        â   â   âââ commands/
        â   â   âââ events/
        â   â   âââ exceptions/
        â   â   âââ __tests__/
        â   âââ indexation.module.ts
        â
        â   ââââ Presentation Gateway (API layer) ââââ
        â
        âââ presentation/                    # Outside BCs â REST + read models
        â   âââ entity/
        â   â   âââ controllers/
        â   â   â   âââ create-an-entity.controller.ts
        â   â   â   âââ update-an-entity.controller.ts
        â   â   â   âââ get-entities.controller.ts
        â   â   â   âââ get-an-entity.controller.ts
        â   â   âââ dto/
        â   â   â   âââ create-an-entity.dto.ts
        â   â   â   âââ update-an-entity.dto.ts
        â   â   âââ queries/
        â   â   â   âââ get-entities.query.ts
        â   â   â   âââ get-entities.handler.ts
        â   â   â   âââ get-an-entity.query.ts
        â   â   â   âââ get-an-entity.handler.ts
        â   â   âââ projections/
        â   â   â   âââ entity.projection.ts
        â   â   âââ finders/
        â   â   â   âââ entity.finder.ts
        â   â   âââ entity-presentation.module.ts
        â   â   âââ __tests__/
        â   â
        â   âââ property/                    # Same pattern per resource
        â   â   âââ controllers/
        â   â   âââ dto/
        â   â   âââ queries/
        â   â   âââ projections/
        â   â   âââ finders/
        â   â   âââ __tests__/
        â   â
        â   âââ tenant/
        â   âââ lease/
        â   âââ rent-call/
        â   âââ payment/
        â   âââ reminder/
        â   âââ revision/
        â   âââ charge/
        â   â
        â   âââ accounting/                  # Read-only â no BC counterpart
        â       âââ controllers/
        â       âââ queries/
        â       âââ projections/
        â       â   âââ account-entry.projection.ts
        â       âââ finders/
        â       âââ __tests__/
        â
        âââ infrastructure/
        â   âââ auth/
        â   â   âââ clerk-auth.guard.ts
        â   â   âââ auth.module.ts
        â   âââ database/
        â   â   âââ prisma.service.ts
        â   â   âââ database.module.ts
        â   âââ eventstore/
        â   â   âââ kurrentdb.service.ts
        â   â   âââ eventstore.module.ts
        â   â   âââ upcasters/
        â   â       âââ index.ts
        â   âââ tenant-context/
        â   â   âââ entity-context.middleware.ts
        â   â   âââ entity-context.guard.ts
        â   â   âââ tenant-context.module.ts
        â   âââ filters/
        â   â   âââ domain-exception.filter.ts
        â   âââ document/                        # PDF generation service
        â   â   âââ pdf-generator.service.ts
        â   â   âââ templates/
        â   â       âââ rent-call.template.ts
        â   â       âââ receipt.template.ts
        â   â       âââ revision-letter.template.ts
        â   â       âââ formal-notice.template.ts
        â   â       âââ charge-statement.template.ts
        â   â       âââ stakeholder-letter.template.ts
        â   âââ email/                           # SMTP service
        â   â   âââ smtp.service.ts
        â   âââ scheduling/
        â   â   âââ alert-scheduler.service.ts
        â   âââ gdpr/
        â   â   âââ crypto-shredding.service.ts
        â   âââ integrations/
        â       âââ insee/
        â       âââ banking/
        â       âââ registered-mail/
        â
        âââ shared/
            âââ user-id.ts
            âââ money.ts
            âââ exceptions/
                âââ domain.exception.ts
                âââ invalid-user-id.exception.ts
```

### Architectural Boundaries

**Bounded Context Isolation (domain only):**
- Each BC (`portfolio/`, `tenancy/`, `billing/`, `recovery/`, `indexation/`) contains **only domain logic** (aggregates, commands, events, VOs, exceptions)
- **No direct imports between BC domain modules** â the only allowed cross-BC imports come from `shared/` (shared kernel)
- References between BCs are **by ID only** (e.g., a Lease stores `unitId: string`, never imports the Unit aggregate)
- Each BC has a root NestJS module (`portfolio.module.ts`, `tenancy.module.ts`, etc.) that registers its aggregate sub-modules

**Presentation as Gateway (outside BCs):**
- `presentation/` is a separate top-level layer â it does **not** belong to any BC
- `presentation/` dispatches commands to BC aggregates via CommandBus, and reads from its own PostgreSQL projections via QueryBus
- `presentation/*/projections/` consume events via KurrentDB catch-up subscriptions (read from event store, write to PostgreSQL)
- `presentation/accounting/` is a read-only module (no BC counterpart) that projects financial events from Billing, Recovery, and Indexation

**Domain / Presentation Separation (Hexagonal):**
- BC domain modules depend on: their own interfaces (ports), `shared/` â **never** concrete infrastructure classes, Prisma, or PostgreSQL
- Ports (interfaces) are defined within the domain module that needs them â implemented by `infrastructure/`
- `presentation/` depends on: PostgreSQL/Prisma (via infrastructure/database), `shared/` â **never** KurrentDB client directly (except projections)
- `infrastructure/` provides concrete adapters for domain ports and presentation needs (database, auth, document, email)
- NestJS module registration wires interface â implementation via dependency injection

**Inter-BC Communication:**
- BCs communicate **only via domain events** (KurrentDB catch-up subscriptions), never by direct import
- `document/` and `email/` are infrastructure services consumed via command bus from any BC
- Presentation projections can consume events from **any BC** to build denormalized read models
- No Prisma JOINs across presentation module tables â each presentation module owns its projections

**Frontend / Backend Boundary:**
- Single integration point: HTTP/REST API
- No shared TypeScript packages, no shared types
- API contract is the only dependency

### Data Flow

```
1. Frontend generates UUID + sends POST command
2. presentation/*/controllers/* receives request, dispatches to CommandBus
3. {bc}/*/commands/handler loads aggregate (events from KurrentDB)
4. Aggregate applies business logic, emits event(s)
5. Event(s) persisted to KurrentDB
6. Catch-up subscription captures event
7. presentation/*/projections/ updates PostgreSQL via Prisma
8. (Optional) Other presentation modules also consume the event for denormalized read models
9. Frontend sends GET query
10. presentation/*/controllers/* dispatches to QueryBus
11. presentation/*/queries/handler reads from finder (PostgreSQL)
12. Returns 200 OK { data: T }
```

### Cross-Cutting Concerns Mapping

| Concern | Location | Scope |
|---------|----------|-------|
| Authentication | `infrastructure/auth/` | All controllers |
| Multi-tenant isolation | `infrastructure/tenant-context/` | All domain handlers + all finders |
| Error normalization | `infrastructure/filters/` | All controllers |
| Event store connection | `infrastructure/eventstore/` | All domain modules |
| Database connection | `infrastructure/database/` | All presentation modules |
| Financial precision | `shared/money.ts` | Domain + presentation |
| Event upcasting | `infrastructure/eventstore/upcasters/` | All event deserialization |
| Proactive alerts | `infrastructure/scheduling/` | Insurance expiry, unpaid detection, escalation thresholds |
| GDPR compliance | `infrastructure/gdpr/` | Tenant personal data encryption/shredding |
| External integrations | `infrastructure/integrations/` | INSEE, Open Banking, AR24/Maileva |

## Architecture Validation Results

### Coherence Validation â

**Decision Compatibility:**
All technology choices are compatible: Next.js 15 + NestJS 11 + KurrentDB 25 + PostgreSQL 16 + Prisma 6 + Clerk + Tailwind 4. No version conflicts detected. nestjs-cqrx 5.x bridges @nestjs/cqrs with KurrentDB cleanly.

**Pattern Consistency:**
VerbANoun commands, PastTense events, kebab-case files, camelCase variables â all consistently applied across domain and presentation layers. Domain/presentation separation aligns perfectly with the CQRS write/read split.

**Structure Alignment:**
Project structure directly supports all architectural decisions. Each bounded context maps cleanly to a domain module (write) and a presentation module (read). Infrastructure layer properly adapts external services for both sides.

### Requirements Coverage Validation

**64 Functional Requirements Coverage:**

| FR Range | Domain | BC | Status | Notes |
|----------|--------|----|--------|-------|
| FR1-4 | Entity Management | Portfolio | â | `portfolio/entity/` + `presentation/entity/` |
| FR5-8 | Property & Units | Portfolio | â | `portfolio/property/` + `presentation/property/` |
| FR9-11 | Tenant Management | Tenancy | â | FR11 alerts via `infrastructure/scheduling/` |
| FR12-17 | Lease Management | Tenancy | â | Pro-rata in lease aggregate |
| FR18-22 | Rent Call Generation | Billing | â | `billing/rent-call/` + `presentation/rent-call/` |
| FR23-27 | Documents & Email | â (infra) | â | `infrastructure/document/` + `infrastructure/email/` |
| FR28-34 | Payment & Bank | Billing | â | FR34 Open Banking via `infrastructure/integrations/banking/` |
| FR35-41 | Reminders | Recovery | â | Saga + FR40 AR24 via `infrastructure/integrations/registered-mail/` |
| FR42-47 | Index Revision | Indexation | â | FR47 auto-retrieval via `infrastructure/integrations/insee/` |
| FR48-52 | Charges | Indexation | â | `indexation/charge/` + `presentation/charge/` |
| FR53-56 | Accounting | â (read-only) | â | `presentation/accounting/` â no domain (event store IS the ledger) |
| FR57-61 | Dashboard & Alerts | â (cross) | â | FR61 email alerts via `infrastructure/scheduling/` |
| FR62-64 | User & Access | â (infra) | â | FR63 accountant read-only via role-based guard |

**21 Non-Functional Requirements Coverage:**

| NFR | Concern | Status | Architectural Support |
|-----|---------|--------|----------------------|
| NFR1-6 | Performance | â | KurrentDB + PostgreSQL sufficient at current scale |
| NFR7 | Encryption | â | Railway TLS + managed DB encryption at rest |
| NFR8 | Authentication | â | Clerk handles all auth (no password management by us) |
| NFR9 | Tenant isolation | â | entityId in events + all queries |
| NFR10 | GDPR | â | Crypto-shredding strategy for right-to-erasure |
| NFR11 | No sensitive logs | â | Logging patterns defined |
| NFR12 | Accountant read-only | â | Role-based guard (owner/accountant) |
| NFR13-14 | Event immutability | â | KurrentDB native guarantee |
| NFR15 | Deterministic projections | â | Integer cents, no floating-point |
| NFR16 | Crash recovery | â | Event store = source of truth, cursor persistence |
| NFR17 | Daily backups | â | Kurrent Cloud + Railway managed backups |
| NFR18 | 2-decimal precision | â | Integer cents throughout |
| NFR19 | Consistent patterns | â | Step 5 enforcement guidelines |
| NFR20 | Event schema versioning | â | Upcasting pipeline defined |
| NFR21 | Test coverage >95% | â | Jest co-located, structure supports testing |

### Gaps Addressed

| Gap | Resolution | Location |
|-----|-----------|----------|
| Accountant read-only (FR63/NFR12) | Added `owner`/`accountant` role in entity-user relation, guard blocks writes for accountants | `infrastructure/auth/` |
| Proactive alerts (FR11/FR61) | Added `@nestjs/schedule` cron infrastructure for insurance expiry, unpaid detection | `infrastructure/scheduling/` |
| GDPR right-to-erasure (NFR10) | Crypto-shredding: personal data in events encrypted per-tenant, delete key = erase data | `infrastructure/gdpr/` |
| External integrations (FR34/40/47) | Infrastructure adapter stubs for Open Banking, AR24/Maileva, INSEE | `infrastructure/integrations/` |

### Architecture Completeness Checklist

**â Requirements Analysis**
- [x] Project context thoroughly analyzed (64 FRs, 21 NFRs)
- [x] Scale and complexity assessed (high)
- [x] Technical constraints identified (event sourcing, financial precision, French law)
- [x] Cross-cutting concerns mapped (7 concerns + 3 added during validation)

**â Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Dual-store CQRS/ES pattern fully specified (KurrentDB + PostgreSQL)
- [x] Domain/presentation separation defined (hexagonal CQRS)
- [x] Authentication + authorization with accountant role
- [x] Event versioning and upcasting strategy

**â Implementation Patterns**
- [x] Naming conventions established (VerbANoun, PastTense, kebab-case)
- [x] Structure patterns defined (domain/ vs presentation/)
- [x] Communication patterns specified (events, API, logging)
- [x] Process patterns documented (error handling, validation, loading)
- [x] Enforcement guidelines and anti-patterns listed

**â Project Structure**
- [x] Complete directory structure defined (frontend + backend)
- [x] Component boundaries established (domain â presentation â infrastructure)
- [x] All 12 FR domains mapped to specific modules
- [x] Cross-cutting concerns mapped to infrastructure

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High â all 64 FRs and 21 NFRs have explicit architectural support.

**Key Strengths:**
- Clean CQRS/ES separation with dedicated event store (KurrentDB)
- Domain/presentation boundary prevents accidental coupling
- Event store as source of truth provides native auditability and rebuildable read models
- Simple authorization model covers all access patterns (owner + accountant)
- Modular structure allows bounded contexts to be built independently

**Areas for Future Enhancement:**
- Staging environment when moving beyond single-user
- Advanced observability (OpenTelemetry) when scaling
- External integrations (Open Banking, AR24, INSEE) as infrastructure adapters
- Performance caching layer if query load increases
