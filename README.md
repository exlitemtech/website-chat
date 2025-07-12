# Website Chat Application

A comprehensive multi-website chat solution with universal UI components, real-time messaging, and mobile app support.

## Architecture

- **Frontend**: Next.js with Tamagui universal components
- **Backend**: FastAPI with PostgreSQL and Redis
- **Mobile**: React Native (planned)
- **Widget**: Embeddable vanilla JS component
- **Real-time**: Socket.io for WebSocket connections

## Project Structure

```
website-chat/
├── packages/
│   ├── ui/           # Tamagui universal components
│   └── shared/       # Shared types and utilities
├── apps/
│   ├── admin-web/    # Next.js admin interface
│   ├── chat-widget/  # Embeddable chat widget
│   ├── mobile/       # React Native app (planned)
│   └── backend/      # FastAPI server
└── docs/             # Documentation
```

## Features Planned

### Core Features
- Multi-website chat management
- Role-based agent permissions
- Real-time messaging with typing indicators
- Visitor journey tracking
- File sharing capabilities
- Chat history and archiving

### Advanced Features
- Analytics dashboard
- Canned responses
- Chat ratings and feedback
- CRM integrations
- White-labeling options
- Automated chat triggers

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL
- Redis

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up backend environment:
```bash
cd apps/backend
cp .env.example .env
# Edit .env with your database and Redis URLs
```

3. Set up database:
```bash
# Create database and run migrations
alembic upgrade head
```

4. Start development servers:
```bash
# Terminal 1: Backend
cd apps/backend
uvicorn app.main:app --reload

# Terminal 2: Admin Web
cd apps/admin-web
npm run dev

# Terminal 3: Build packages
npm run dev
```

## Development

- **Admin Interface**: http://localhost:3000
- **API Documentation**: http://localhost:8000/docs
- **Socket.io**: http://localhost:8000/socket.io

## Next Steps

1. Complete authentication system
2. Implement chat widget
3. Add real-time messaging
4. Create mobile app
5. Add analytics features