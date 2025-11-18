# 📊 Funnel & Experiment Analytics Platform

A full-stack analytics platform for tracking user journeys, computing funnel conversion rates, and running A/B experiments.

## 🚀 Features

- **Event Ingestion**: High-performance API for tracking user events
- **Funnel Analytics**: Track multi-step conversion flows with detailed metrics
- **A/B Experiment Testing**: Run experiments and analyze variant performance
- **Real-time Dashboard**: Beautiful Next.js dashboard with interactive charts
- **SDK Support**: Browser and Node.js SDKs for easy integration

## 🏗️ Tech Stack

- **Backend**: Node.js + Fastify + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Charts**: Recharts
- **SDKs**: TypeScript (Browser + Node.js)

## 📂 Project Structure

```
experiment-funnel-analytics/
├── backend/                  # Fastify API server
│   ├── src/
│   │   ├── routes/          # API routes (ingest, funnels, experiments)
│   │   ├── middleware/      # Auth & validation
│   │   └── db.ts           # Prisma client
│   └── prisma/
│       └── schema.prisma    # Database schema
├── dashboard/               # Next.js dashboard
│   └── src/app/
│       ├── page.tsx        # Projects list
│       └── projects/[id]/  # Project views
├── packages/
│   ├── sdk-browser/        # Browser SDK
│   └── sdk-node/           # Node.js SDK
└── docker-compose.yml      # PostgreSQL setup
```

## 🎯 Quick Start

### 1. Start PostgreSQL

```bash
docker-compose up -d
```

### 2. Set up Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run database migrations
npx prisma migrate dev --name init

# Start the server
npm run dev
```

The API will be running at `http://localhost:3001`

### 3. Start Dashboard

```bash
cd dashboard

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local

# Start the dashboard
npm run dev
```

The dashboard will be running at `http://localhost:3000`

### 4. Build SDKs (Optional)

```bash
# Browser SDK
cd packages/sdk-browser
npm install
npm run build

# Node.js SDK
cd packages/sdk-node
npm install
npm run build
```

## 📊 Database Schema

### Project
- Stores project information and API keys
- Each project has its own API key for authentication

### Event
- Tracks all user events (page views, clicks, conversions, etc.)
- Links to a project and user (userId or anonymousId)
- Stores event properties as JSON

### FunnelDefinition
- Defines multi-step conversion funnels
- Stores ordered list of event names

### ExperimentDefinition
- Defines A/B test experiments
- Stores variant names and experiment status

### UserExperimentAssignment
- Tracks which variant each user is assigned to
- Ensures consistent variant assignment per user

## 🎓 Example: Landing Page → Signup → Subscribe Funnel

Here's a complete example of tracking a user journey from landing page to subscription.

### Step 1: Create a Project

1. Open the dashboard at `http://localhost:3000`
2. Click "New Project"
3. Enter name: "My SaaS App"
4. Copy the generated API key (e.g., `clq1x2y3z0000abcd...`)

### Step 2: Track Events with Browser SDK

```html
<!DOCTYPE html>
<html>
<head>
  <title>My SaaS Landing Page</title>
</head>
<body>
  <h1>Welcome to My SaaS</h1>
  <button id="signup-btn">Sign Up</button>

  <script type="module">
    import { init, track, identify } from './path/to/sdk-browser/dist/index.js';

    // Initialize analytics
    const analytics = init({
      apiKey: 'YOUR_PROJECT_API_KEY',
      endpoint: 'http://localhost:3001',
      debug: true
    });

    // Track landing page view
    track('page_view', {
      page: 'landing',
      url: window.location.href
    });

    // Track signup button click
    document.getElementById('signup-btn').addEventListener('click', () => {
      track('signup_click');
      // Redirect to signup page
      window.location.href = '/signup';
    });
  </script>
</body>
</html>
```

### Step 3: Track Signup and Subscribe Events

```javascript
// On signup page (after successful signup)
identify('user_123'); // Identify the user
track('signup', {
  email: 'user@example.com',
  plan: 'free'
});

// On subscription page (after successful payment)
track('subscribe', {
  plan: 'premium',
  price: 29.99
});
```

### Step 4: Create a Funnel in the Dashboard

1. Navigate to your project
2. Click "Funnels"
3. Click "New Funnel"
4. Enter:
   - Name: "Signup to Subscription"
   - Steps: `page_view, signup, subscribe`
5. Click "Create"

### Step 5: View Funnel Analytics

The dashboard will show:
- **Total Users**: How many users viewed the landing page
- **Conversion Rate per Step**: What percentage moved to each step
- **Overall Conversion Rate**: From landing page to subscription
- **Drop-off Analysis**: Where users are leaving the funnel

Example output:
```
Step 1: page_view     → 1,000 users (100%)
Step 2: signup        → 250 users (25% conversion, 75% drop-off)
Step 3: subscribe     → 50 users (20% conversion, 80% drop-off)

Overall Conversion: 5% (50 out of 1,000 users subscribed)
```

## 🧪 Running A/B Experiments

### Example: Test Different CTA Button Colors

#### 1. Create an Experiment

```bash
curl -X POST http://localhost:3001/experiments \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "YOUR_PROJECT_ID",
    "key": "cta_button_color",
    "variants": ["blue", "green", "red"]
  }'
```

#### 2. Assign Users to Variants

```javascript
import { init, getExperimentVariant, track } from '@experiment-analytics/sdk-browser';

const analytics = init({ apiKey: 'YOUR_API_KEY' });

// Get variant for this user
const variant = await analytics.getExperimentVariant('cta_button_color');

// Apply the variant
const button = document.getElementById('cta-btn');
if (variant === 'blue') button.style.backgroundColor = '#3b82f6';
if (variant === 'green') button.style.backgroundColor = '#10b981';
if (variant === 'red') button.style.backgroundColor = '#ef4444';

// Track when user clicks the button
button.addEventListener('click', () => {
  track('cta_click');
  track('signup'); // Conversion event
});
```

#### 3. View Experiment Results

1. Navigate to your project
2. Click "Experiments"
3. Select your experiment
4. Set "Conversion Event" to `signup`
5. View results:
   - User distribution across variants
   - Conversion rate per variant
   - Statistical comparison

## 📡 API Reference

### Ingestion API

#### Track Single Event
```bash
POST /ingest/event
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "userId": "user_123",      # or "anonymousId"
  "event": "page_view",
  "properties": {
    "page": "landing",
    "referrer": "google"
  },
  "timestamp": "2024-01-15T10:30:00Z"  # optional
}
```

#### Track Multiple Events (Batch)
```bash
POST /ingest/events
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "events": [
    { "userId": "user_123", "event": "page_view", "properties": {} },
    { "userId": "user_123", "event": "signup", "properties": {} }
  ]
}
```

### Funnel API

#### Create Funnel
```bash
POST /funnels
Body: {
  "projectId": "PROJECT_ID",
  "name": "Signup Flow",
  "steps": ["page_view", "signup", "subscribe"]
}
```

#### Compute Funnel
```bash
GET /funnels/FUNNEL_ID/compute?startDate=2024-01-01&endDate=2024-01-31
```

### Experiment API

#### Create Experiment
```bash
POST /experiments
Body: {
  "projectId": "PROJECT_ID",
  "key": "button_test",
  "variants": ["control", "variant_a", "variant_b"]
}
```

#### Assign Variant
```bash
POST /experiments/EXPERIMENT_KEY/assign
Headers: X-API-Key: YOUR_API_KEY
Body: {
  "userId": "user_123"  # or "anonymousId"
}
Response: { "variant": "control" }
```

#### Get Experiment Stats
```bash
GET /experiments/EXPERIMENT_ID/stats?conversionEvent=subscribe&startDate=2024-01-01
```

## 🔧 SDK Usage

### Browser SDK

```javascript
import { init, track, identify, getExperimentVariant } from '@experiment-analytics/sdk-browser';

// Initialize
const analytics = init({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'http://localhost:3001',
  debug: true
});

// Identify user
identify('user_123');

// Track events
track('page_view', { page: 'home' });
track('button_click', { button: 'cta' });

// Get experiment variant
const variant = await getExperimentVariant('my_experiment');

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  analytics.destroy();
});
```

### Node.js SDK

```javascript
const { createClient } = require('@experiment-analytics/sdk-node');

const analytics = createClient({
  apiKey: 'YOUR_API_KEY',
  endpoint: 'http://localhost:3001',
  flushInterval: 5000,  // Flush every 5 seconds
  maxQueueSize: 100     // Flush when queue reaches 100 events
});

// Track events
analytics.track({
  event: 'purchase',
  userId: 'user_123',
  properties: {
    amount: 99.99,
    product: 'premium_plan'
  }
});

// Get experiment variant
const variant = await analytics.getExperimentVariant(
  'pricing_test',
  'user_123'
);

// Flush and clean up
await analytics.destroy();
```

## 🎨 Dashboard Features

### Projects Page
- List all projects
- Create new projects
- View project stats (events, funnels, experiments)

### Funnels Page
- Create multi-step funnels
- View conversion rates per step
- Filter by date range
- Interactive charts showing:
  - User count per step
  - Conversion rates
  - Drop-off analysis

### Experiments Page
- Create A/B test experiments
- View user distribution across variants
- Track conversion rates per variant
- Filter by conversion event and date range
- Charts showing:
  - Pie chart of user distribution
  - Bar chart of conversion rates
  - Detailed variant comparison table

## 🔒 Security

- API key authentication for all ingestion endpoints
- Project isolation (events are scoped to projects)
- No cross-project data leakage
- CORS enabled for browser SDK usage

## 🚀 Deployment

### Backend Deployment

1. Set environment variables:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   PORT=3001
   ```

2. Run migrations:
   ```bash
   npm run db:migrate
   ```

3. Build and start:
   ```bash
   npm run build
   npm start
   ```

### Dashboard Deployment

1. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

2. Build and start:
   ```bash
   npm run build
   npm start
   ```

## 📈 Performance Considerations

- **Database Indexes**: Events are indexed by `projectId`, `name`, `timestamp`, and `userIdOrAnonId`
- **Batch Ingestion**: Use `/ingest/events` for bulk event tracking
- **SDK Queuing**: Both SDKs queue events and flush periodically
- **Date Range Filtering**: Apply date filters to limit query scope

## 🛠️ Development

### Run Database Studio
```bash
cd backend
npm run db:studio
```

### Generate Prisma Client
```bash
cd backend
npm run db:generate
```

### Push Schema Changes
```bash
cd backend
npm run db:push
```

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ for data-driven product teams**
