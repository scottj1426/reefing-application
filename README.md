# Reefing Application

A full-stack React monorepo with Auth0 authentication and PostgreSQL (Neon) database.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Auth0 React SDK
- **Backend**: Express.js, TypeScript, Prisma ORM, Auth0 JWT
- **Database**: Neon PostgreSQL
- **Monorepo**: pnpm workspaces

## Project Structure

```
reefing-application/
├── apps/
│   ├── web/              # React frontend (port 3000)
│   └── api/              # Express backend (port 4000)
├── packages/
│   └── shared-types/     # Shared TypeScript types
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 18+
- pnpm 8+
- Neon PostgreSQL account
- Auth0 account

## Setup Instructions

### 1. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm@8.15.0

# Install all dependencies
pnpm install
```

### 2. Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a new project
2. Copy the connection string
3. Create `apps/api/.env` file:

```env
DATABASE_URL=your-neon-connection-string
NODE_ENV=development
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

### 3. Set Up Auth0

#### Create Auth0 Application

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Create a new **Single Page Application**
3. Configure:
   - **Allowed Callback URLs**: `http://localhost:3000`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
4. Copy **Domain** and **Client ID**

#### Create Auth0 API

1. In Auth0 Dashboard → Applications → APIs
2. Create new API:
   - **Name**: Reefing API
   - **Identifier**: `http://localhost:4000`
   - **Signing Algorithm**: RS256

#### Update Backend .env

Add to `apps/api/.env`:

```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=http://localhost:4000
AUTH0_ISSUER=https://your-domain.auth0.com/
```

#### Create Frontend .env.local

Create `apps/web/.env.local`:

```env
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=http://localhost:4000
VITE_API_URL=http://localhost:4000
```

### 4. Run Database Migration

```bash
# Navigate to API directory
cd apps/api

# Generate Prisma Client
pnpm prisma generate

# Create and run migration
pnpm prisma migrate dev --name init

# (Optional) Open Prisma Studio to view database
pnpm prisma studio
```

### 5. Start Development Servers

From the root directory:

```bash
# Start both frontend and backend
pnpm dev

# Or start individually:
pnpm dev:web   # Frontend only
pnpm dev:api   # Backend only
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Usage

1. Navigate to http://localhost:3000
2. Click "Log In" → redirected to Auth0
3. Log in with your Auth0 credentials
4. You'll be redirected back to the app
5. User info from Auth0 and database will be displayed
6. Click "Log Out" to log out

## How It Works

### Authentication Flow

1. User clicks "Log In" → redirected to Auth0
2. User authenticates with Auth0
3. Auth0 redirects back with authorization code
4. Frontend exchanges code for access token
5. Frontend calls `POST /api/users/sync` with token
6. Backend validates token, creates/updates user in database
7. Frontend displays user info

### Database

The `users` table stores:
- `id` - Unique user ID (cuid)
- `email` - User email (unique)
- `name` - User name (optional)
- `auth0_id` - Auth0 user ID (unique)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### API Endpoints

- `GET /api/health` - Health check (public)
- `POST /api/users/sync` - Sync Auth0 user to database (protected)
- `GET /api/users/me` - Get current user (protected)

## Build

```bash
# Build all packages
pnpm build

# Build individually
pnpm build:web
pnpm build:api
```

## Troubleshooting

### "User not synced" error

Make sure:
- Auth0 API audience matches in frontend and backend
- Auth0 domain and issuer are correct
- Database migration has been run

### CORS errors

Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL exactly.

### Database connection failed

Verify:
- Neon connection string is correct
- Connection string includes `?sslmode=require`
- Neon database is active

## Next Steps

- Add more user fields to the schema
- Implement user profile editing
- Add protected routes on frontend
- Add role-based access control
- Deploy to production (Vercel + Railway + Neon)
