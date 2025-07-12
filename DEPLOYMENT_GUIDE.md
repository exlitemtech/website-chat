# Website Chat - Deployment & Testing Guide

## Quick Start Testing

### 1. Start the Backend Server
```bash
cd apps/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

### 2. Start the Admin Interface
```bash
cd apps/admin-web
npm run dev
```

### 3. Start the Test Website
```bash
cd test-website
python3 server.py
```

### 4. Test the Integration
1. Open http://localhost:3001/test-website/ (test e-commerce site)
2. Open http://localhost:3000 (admin interface)
3. Click the chat widget on the test site
4. Send a message from the widget
5. Respond from the admin interface

## Production Deployment

### Option 1: Self-Hosted Deployment

#### Backend (FastAPI)
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:pass@localhost/chatdb"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET_KEY="your-secret-key"

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

#### Admin Interface (Next.js)
```bash
# Build for production
npm run build

# Start production server
npm start

# Or deploy to Vercel/Netlify
vercel deploy
```

#### Chat Widget (Static Files)
```bash
# Build widget
cd apps/chat-widget
npm run build

# Serve dist/ files from CDN or web server
# Files needed:
# - dist/website-chat-widget.css
# - dist/website-chat-widget.iife.js
```

### Option 2: Docker Deployment

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: chatdb
      POSTGRES_USER: chatuser
      POSTGRES_PASSWORD: chatpass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  backend:
    build: ./apps/backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://chatuser:chatpass@postgres/chatdb
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  admin:
    build: ./apps/admin-web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000

volumes:
  postgres_data:
```

### Option 3: Cloud Deployment

#### Backend on Railway/Render/DigitalOcean
1. Connect your Git repository
2. Set environment variables
3. Deploy automatically

#### Admin on Vercel/Netlify
1. Connect Git repository
2. Set build command: `npm run build`
3. Set environment variables
4. Deploy automatically

#### Widget on CDN
1. Upload built files to AWS S3/CloudFlare
2. Enable CDN distribution
3. Update integration code with CDN URLs

## Widget Integration for Websites

### Basic Integration
```html
<!-- Add to <head> -->
<link rel="stylesheet" href="https://your-cdn.com/website-chat-widget.css">

<!-- Add before </body> -->
<script src="https://your-cdn.com/website-chat-widget.iife.js"></script>
<script>
  const widget = new WebsiteChatWidget({
    websiteId: 'your-website-id',
    apiUrl: 'https://your-api.com',
    primaryColor: '#6366f1',
    position: 'bottom-right',
    welcomeMessage: 'Hi! How can we help?',
    agentName: 'Support Team'
  });
</script>
```

### WordPress Integration
1. Install "Header Footer Code Manager" plugin
2. Add CSS link to header
3. Add JavaScript code to footer

### Shopify Integration
1. Go to Online Store > Themes > Edit Code
2. Add CSS link to `theme.liquid` header
3. Add JavaScript code before `</body>` tag

### Advanced Configuration
```javascript
const widget = new WebsiteChatWidget({
  websiteId: 'your-website-id',
  apiUrl: 'https://your-api.com',
  
  // Appearance
  primaryColor: '#6366f1',
  position: 'bottom-right', // or 'bottom-left'
  
  // Messages
  welcomeMessage: 'Hi! How can we help you today?',
  agentName: 'Support Team',
  agentAvatar: 'https://your-site.com/avatar.jpg',
  
  // Features
  enableFileUpload: true,
  enableEmoji: true,
  
  // Advanced
  autoOpen: false,
  showOnMobile: true,
  language: 'en'
});
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:pass@localhost/chatdb
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your-super-secret-jwt-key
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
ENVIRONMENT=production
```

### Admin Interface (.env.local)
```
NEXT_PUBLIC_API_URL=https://your-api.com
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-admin-domain.com
```

## Database Setup

### PostgreSQL
```sql
CREATE DATABASE chatdb;
CREATE USER chatuser WITH PASSWORD 'chatpass';
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;
```

### Run Migrations
```bash
cd apps/backend
alembic upgrade head
```

## Monitoring & Analytics

### Health Checks
- Backend: `GET /health`
- Admin: `GET /api/health`
- Widget: Check console for connection status

### Metrics to Monitor
- WebSocket connections
- Message delivery rate
- Response times
- Error rates
- Database connections

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **CORS Configuration**: Restrict allowed origins
3. **Rate Limiting**: Implement rate limits on API endpoints
4. **Input Validation**: Sanitize all user inputs
5. **Authentication**: Secure admin access with strong passwords
6. **Database Security**: Use connection pooling and encryption

## Troubleshooting

### Common Issues

#### Widget Not Loading
- Check console for JavaScript errors
- Verify CSS/JS file URLs are accessible
- Check CORS headers on API server

#### WebSocket Connection Failed
- Verify WebSocket URL is correct
- Check firewall settings
- Ensure backend WebSocket server is running

#### Messages Not Sending
- Check API endpoint connectivity
- Verify website ID is correct
- Check browser network tab for errors

#### Admin Interface Not Connecting
- Verify API URL environment variable
- Check authentication tokens
- Test API endpoints directly

### Debug Mode
```javascript
// Enable debug mode for widget
const widget = new WebsiteChatWidget({
  websiteId: 'test',
  apiUrl: 'http://localhost:8000',
  debug: true // Enables console logging
});
```

## Performance Optimization

### Widget Loading
- Load widget asynchronously
- Lazy load after page content
- Minimize CSS/JS bundle size

### Backend Scaling
- Use connection pooling
- Implement Redis caching
- Add load balancer for multiple instances

### Database Optimization
- Add proper indexes
- Use connection pooling
- Regular maintenance and monitoring

## Next Steps

1. **Set up monitoring** with tools like Sentry or DataDog
2. **Implement analytics** to track widget usage
3. **Add mobile app** for agent notifications
4. **Enhance features** like file sharing, emoji reactions
5. **Scale infrastructure** based on usage patterns

---

Need help? Check the admin interface for real-time support! 🎉