# Claude AI Assistant Instructions

This file contains instructions and context for Claude to better understand and work with this codebase.

## Project Overview
A website chat widget system with:
- Frontend: Next.js admin web interface
- Backend: FastAPI Python backend
- Widget: TypeScript chat widget component
- Database: SQLite (website_chat.db)
- Real-time: WebSocket for live messaging

## Project Structure
- `apps/admin-web/` - Next.js admin interface
- `apps/backend/` - FastAPI Python backend
- `apps/chat-widget/` - TypeScript chat widget
- `test-website/` - Test HTML files for widget testing

## Development Commands
- Backend: `cd apps/backend && python -m uvicorn app.main:app --reload`
- Admin Web: `cd apps/admin-web && npm run dev`
- Widget: `cd apps/chat-widget && npm run build`

## Database
- SQLite database: `apps/backend/website_chat.db`
- Migrations: Use Alembic in `apps/backend/alembic/`

## WebSocket Implementation
- Backend endpoints: `/ws/agent/{user_id}` and `/ws/visitor/{website_id}`
- Authentication: JWT tokens for agents, visitor IDs for widgets
- Connection manager handles broadcasting to conversation participants
- Both admin and widget must join conversations to receive real-time messages

## Testing
- Widget tests: Use files in `test-website/` directory
- Manual testing: Open `test-website/index.html` in browser
- WebSocket test: `test_websocket_browser_direct.html` for debugging connections