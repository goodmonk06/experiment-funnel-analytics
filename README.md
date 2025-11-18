# 📊 Funnel & Experiment Analytics Platform

A production-ready, full-stack analytics platform for tracking user journeys, analyzing multi-step funnels, and running A/B experiments.

## Overview

This platform enables product teams to:
- **Track user events** with high-performance ingestion API
- **Analyze conversion funnels** across multiple steps with detailed drop-off metrics
- **Run A/B experiments** with automatic variant assignment and statistical analysis
- **Visualize data** through an intuitive Next.js dashboard with interactive charts

Built for scale, type-safety, and developer experience.

## Tech Stack

**Backend**
- Node.js + Fastify (high-performance API framework)
- TypeScript (end-to-end type safety)
- Prisma ORM (type-safe database access)
- PostgreSQL (relational data storage)
- Zod (runtime validation)

**Frontend**
- Next.js 14 (App Router)
- React 18
- Tailwind CSS (styling)
- Recharts (data visualization)

**SDKs**
- Browser SDK (TypeScript, auto-batching)
- Node.js SDK (server-side tracking)

**Infrastructure**
- Docker & Docker Compose
- Vitest (testing)
- npm workspaces (monorepo)

## Domain Model

### Core Entities

**Project**
- Container for all analytics data
- Has a unique API key for authentication
- One-to-many relationship with events, funnels, and experiments

**Event**
- Tracks user actions (page views, clicks, conversions, etc.)
- Linked to a user (via `userId` or `anonymousId`)
- Stores arbitrary properties as JSON
- Indexed for fast querying by project, event name, and timestamp

**FunnelDefinition**
- Defines a multi-step conversion flow
- Stores ordered list of event names (e.g., `["page_view", "signup", "subscribe"]`)
- Used to compute conversion rates and drop-off analysis

**ExperimentDefinition**
- Defines an A/B test configuration
- Stores variant names (e.g., `["control", "variant_a", "variant_b"]`)
- Has a status: `active`, `paused`, or `completed`

**UserExperimentAssignment**
- Tracks which variant a user is assigned to
- Ensures consistent variant assignment per user
- Used to compute per-variant conversion rates

### Relationships

```
Project (1) ──→ (N) Event
Project (1) ──→ (N) FunnelDefinition
Project (1) ──→ (N) ExperimentDefinition
Project (1) ──→ (N) UserExperimentAssignment
```

## Getting Started

### Requirements

- **Node.js** 18 or higher
- **Docker** and **Docker Compose**
- **Git**

### Quick Start (Recommended)

```bash
# 1. Clone the repository
git clone <repository-url>
cd experiment-funnel-analytics

# 2. Start PostgreSQL
npm run docker:dev

# 3. Install dependencies
npm install

# 4. Set up database
npm run db:generate
npm run db:migrate
npm run db:seed

# 5. Start development servers (backend + dashboard)
npm run dev
```

**Access the application:**
- Dashboard: http://localhost:3000
- API: http://localhost:3001
- API Health: http://localhost:3001/health

### Setup Steps (Detailed)

#### 1. Environment Setup

```bash
# Backend environment
cd backend
cp .env.example .env
```

The default `.env` should work for local development:
```env
DATABASE_URL="postgresql://analytics:analytics@localhost:5432/analytics?schema=public"
PORT=3001
```

```bash
# Dashboard environment
cd dashboard
cp .env.local.example .env.local
```

Default `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 2. Database Setup

```bash
# Start PostgreSQL (development mode)
npm run docker:dev

# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Seed with demo data
npm run db:seed
```

The seed script will create:
- **Demo project** with API key
- **Signup funnel** (page_view → signup → subscribe)
- **A/B experiment** (CTA button test)
- **250 users** with realistic journey data

#### 3. Start Development

```bash
# Option 1: Start both backend and dashboard
npm run dev

# Option 2: Start individually
npm run dev:backend  # Backend on :3001
npm run dev:dashboard # Dashboard on :3000
```

#### 4. Run Tests

```bash
npm test
```

## Demo Flow

After seeding the database, you can explore the full analytics platform:

### 1. View Projects
1. Open http://localhost:3000
2. You'll see the **"Demo SaaS App"** project
3. Click on it to view the project dashboard

### 2. Analyze Funnel Conversion

**Navigate to Funnels:**
1. Click **"Funnels"** from the project page
2. Select **"Signup to Subscription Flow"**
3. View the conversion metrics:
   - **Step 1 (page_view)**: 250 users (100%)
   - **Step 2 (signup)**: 125 users (~50% conversion)
   - **Step 3 (subscribe)**: 50 users (~40% of signups, 20% overall)

The interactive chart shows:
- User count at each step
- Conversion rates between steps
- Drop-off percentages
- Overall conversion rate

**Filter by Date:**
- Use the date range filters to analyze specific time periods
- Watch the funnel metrics update in real-time

### 3. Analyze A/B Experiment

**Navigate to Experiments:**
1. Click **"Experiments"** from the project page
2. Select **"cta_button_test"**
3. Set **Conversion Event** to `subscribe`
4. View per-variant metrics:
   - User distribution across variants (control, green, blue)
   - Conversion rates for each variant
   - Statistical comparison

**What you'll see:**
- **Pie chart**: User distribution across variants
- **Bar chart**: Conversion rates per variant
- **Table**: Detailed metrics (users, conversions, conversion rate)

### 4. Track New Events

Use the API key from the seed output to track events:

```bash
# Get the API key from seed output or dashboard
export API_KEY="<your-api-key>"

# Track a page view event
curl -X POST http://localhost:3001/ingest/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "userId": "new_user_1",
    "event": "page_view",
    "properties": {
      "page": "home",
      "referrer": "twitter"
    }
  }'

# Track a signup event
curl -X POST http://localhost:3001/ingest/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d '{
    "userId": "new_user_1",
    "event": "signup",
    "properties": {
      "email": "user@example.com"
    }
  }'
```

Refresh the funnel page to see the updated metrics!

### 5. Use the Browser SDK

```html
<script type="module">
  import { init, track } from '@experiment-analytics/sdk-browser';

  const analytics = init({
    apiKey: 'YOUR_API_KEY',
    endpoint: 'http://localhost:3001',
    debug: true
  });

  // Track events
  track('page_view', { page: 'home' });

  // Get experiment variant
  const variant = await analytics.getExperimentVariant('cta_button_test');
  console.log('Assigned variant:', variant);
</script>
```

## API Reference

### Core Endpoints

**Projects**
- `GET /projects` - List all projects
- `GET /projects/:id` - Get project details
- `POST /projects` - Create a project
- `DELETE /projects/:id` - Delete a project

**Event Ingestion** (requires API key)
- `POST /ingest/event` - Track single event
- `POST /ingest/events` - Batch track events

**Funnels**
- `GET /projects/:projectId/funnels` - List funnels
- `POST /funnels` - Create funnel
- `GET /funnels/:funnelId/compute` - Compute funnel conversion
- `DELETE /funnels/:funnelId` - Delete funnel

**Experiments**
- `GET /projects/:projectId/experiments` - List experiments
- `POST /experiments` - Create experiment
- `POST /experiments/:key/assign` - Assign user to variant
- `GET /experiments/:id/stats` - Get experiment statistics
- `PATCH /experiments/:id` - Update experiment status
- `DELETE /experiments/:id` - Delete experiment

See [API Documentation](./docs/API.md) for detailed request/response schemas.

## Development

### Available Scripts

**Root level:**
```bash
npm run dev           # Start backend + dashboard
npm run build         # Build all workspaces
npm run test          # Run backend tests
npm run lint          # Lint all workspaces
npm run db:migrate    # Run database migrations
npm run db:seed       # Seed database with demo data
npm run docker:dev    # Start PostgreSQL only
npm run docker:up     # Start all services (production)
```

**Backend:**
```bash
cd backend
npm run dev           # Start with hot reload
npm run build         # Build TypeScript
npm run start         # Run production build
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run lint          # Type check
npm run db:studio     # Open Prisma Studio
```

**Dashboard:**
```bash
cd dashboard
npm run dev           # Start Next.js dev server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Lint with ESLint
```

### Testing

Run tests with:
```bash
npm test
```

Tests cover:
- **Validation schemas** (Zod)
- **Error handling** utilities
- Request validation
- Business logic (funnels, experiments)

### Database Management

```bash
# View data in browser
npm run db:studio

# Create a new migration
cd backend
npx prisma migrate dev --name <migration-name>

# Reset database (dev only)
npx prisma migrate reset

# Re-seed
npm run db:seed
```

## Docker Deployment

### Production (all services)

```bash
# Build and start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

This runs:
- PostgreSQL
- Backend API
- Dashboard

### Development (PostgreSQL only)

```bash
# Start PostgreSQL only
npm run docker:dev

# Stop
npm run docker:dev:down
```

Then run backend and dashboard locally with `npm run dev`.

## Project Structure

```
experiment-funnel-analytics/
├── backend/                 # Fastify API server
│   ├── src/
│   │   ├── routes/         # API routes
│   │   │   ├── ingest.ts
│   │   │   ├── projects.ts
│   │   │   ├── funnels.ts
│   │   │   └── experiments.ts
│   │   ├── validation/     # Zod schemas
│   │   ├── utils/          # Error handling, helpers
│   │   ├── middleware/     # Auth middleware
│   │   ├── db.ts           # Prisma client
│   │   └── index.ts        # Server entry
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed script
│   ├── Dockerfile
│   └── package.json
├── dashboard/              # Next.js dashboard
│   ├── src/app/
│   │   ├── page.tsx       # Projects list
│   │   └── projects/[id]/
│   │       ├── page.tsx   # Project detail
│   │       ├── funnels/   # Funnel analytics
│   │       └── experiments/ # Experiment analytics
│   ├── Dockerfile
│   └── package.json
├── packages/
│   ├── sdk-browser/       # Browser SDK
│   └── sdk-node/          # Node.js SDK
├── docker-compose.yml     # Production setup
├── docker-compose.dev.yml # Dev setup (PostgreSQL only)
└── package.json           # Root workspace config
```

## Future Extensions

**Analytics Features**
- [ ] Retention cohort analysis
- [ ] Custom dashboards with drag-and-drop widgets
- [ ] Real-time event streaming
- [ ] User segmentation
- [ ] Revenue tracking and LTV analysis

**Experiments**
- [ ] Multi-armed bandit optimization
- [ ] Statistical significance testing
- [ ] Experiment scheduling
- [ ] Holdout groups

**Platform**
- [ ] Team collaboration (multi-user projects)
- [ ] Role-based access control (RBAC)
- [ ] Webhooks for event notifications
- [ ] Data export (CSV, JSON)
- [ ] Integration with data warehouses

**Infrastructure**
- [ ] Horizontal scaling with Redis
- [ ] Event queue (Kafka/RabbitMQ)
- [ ] Performance monitoring (OpenTelemetry)
- [ ] Multi-region deployment

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

MIT

---

**Built with ❤️ for data-driven teams**
