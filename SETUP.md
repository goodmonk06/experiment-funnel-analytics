# Setup Guide

This guide will help you get the Funnel & Experiment Analytics Platform running locally.

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Git installed

## Step-by-Step Setup

### 1. Clone and Install

```bash
# Navigate to project
cd experiment-funnel-analytics

# Install dependencies for all workspaces
npm install
```

### 2. Start PostgreSQL

```bash
# Start PostgreSQL container
docker-compose up -d

# Verify it's running
docker ps
```

You should see a container named `analytics-postgres` running.

### 3. Set up the Database

```bash
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Optional: Open Prisma Studio to view the database
npm run db:studio
```

This will:
- Create all required tables (projects, events, funnels, experiments, assignments)
- Set up indexes for performance
- Generate the Prisma client for TypeScript

### 4. Start the Backend

```bash
# From the backend directory
npm run dev
```

You should see:
```
🚀 Server running at http://localhost:3001
📊 Analytics API ready for ingestion
```

Test the health endpoint:
```bash
curl http://localhost:3001/health
```

### 5. Start the Dashboard

Open a new terminal:

```bash
cd dashboard

# Start Next.js dev server
npm run dev
```

The dashboard will be available at `http://localhost:3000`

### 6. Build the SDKs (Optional)

If you want to use the SDKs in other projects:

```bash
# Browser SDK
cd packages/sdk-browser
npm install
npm run build

# Node SDK
cd packages/sdk-node
npm install
npm run build
```

## Testing the Setup

### 1. Create a Project

1. Open `http://localhost:3000`
2. Click "New Project"
3. Enter a name (e.g., "Test Project")
4. Click "Create"
5. Copy the API key that's displayed

### 2. Send a Test Event

```bash
curl -X POST http://localhost:3001/ingest/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "userId": "test_user_1",
    "event": "page_view",
    "properties": {
      "page": "home"
    }
  }'
```

You should get a response like:
```json
{
  "success": true,
  "eventId": "clq..."
}
```

### 3. Create a Funnel

1. Click on your project in the dashboard
2. Click "Funnels"
3. Click "New Funnel"
4. Enter:
   - Name: "Test Funnel"
   - Steps: `page_view, signup, purchase`
5. Click "Create"

### 4. Send More Events

```bash
# Signup event
curl -X POST http://localhost:3001/ingest/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "userId": "test_user_1",
    "event": "signup"
  }'

# Purchase event
curl -X POST http://localhost:3001/ingest/event \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "userId": "test_user_1",
    "event": "purchase",
    "properties": {
      "amount": 99.99
    }
  }'
```

### 5. View Funnel Results

Refresh the funnel page in the dashboard. You should see:
- Step 1 (page_view): 1 user
- Step 2 (signup): 1 user (100% conversion)
- Step 3 (purchase): 1 user (100% conversion)
- Overall: 100% conversion rate

## Troubleshooting

### Database Connection Issues

If you see `Error: P1001: Can't reach database server`:

1. Check PostgreSQL is running:
   ```bash
   docker ps
   ```

2. Check the connection string in `backend/.env`:
   ```
   DATABASE_URL="postgresql://analytics:analytics@localhost:5432/analytics?schema=public"
   ```

3. Try restarting PostgreSQL:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

### Port Already in Use

If port 3001 or 3000 is already in use:

1. Change the backend port in `backend/.env`:
   ```
   PORT=3002
   ```

2. Update the dashboard `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3002
   ```

3. For the dashboard, Next.js will automatically find an available port.

### Prisma Client Issues

If you see `@prisma/client did not initialize yet`:

```bash
cd backend
npm run db:generate
```

### CORS Errors

If you see CORS errors in the browser console, make sure:
1. The backend is running
2. The `NEXT_PUBLIC_API_URL` in dashboard `.env.local` is correct
3. Restart both servers

## Next Steps

- Read the [README.md](README.md) for full documentation
- Try the [LP → Signup → Subscribe example](README.md#-example-landing-page--signup--subscribe-funnel)
- Create an A/B experiment
- Integrate the SDK into your own application

## Stopping the Services

```bash
# Stop backend and dashboard
# Press Ctrl+C in each terminal

# Stop PostgreSQL
docker-compose down

# Stop PostgreSQL and remove data
docker-compose down -v
```

## Reset Everything

To start fresh:

```bash
# Remove all data
docker-compose down -v

# Start PostgreSQL
docker-compose up -d

# Re-run migrations
cd backend
npm run db:migrate
```

## Support

If you encounter issues:
1. Check the console logs for errors
2. Verify all services are running
3. Check the troubleshooting section above
4. Open an issue on GitHub
