# DeepRadio Authentication & Database Setup Guide

## Backend Setup

### 1. PostgreSQL Database Configuration

Create the database and user:

```sql
CREATE DATABASE deepradio_db;
CREATE USER deepradio_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE deepradio_db TO deepradio_user;
```

### 2. Environment Variables

Copy the example environment file and configure it:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your actual credentials:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=deepradio_db
DB_USER=deepradio_user
DB_PASSWORD=your_secure_password

# Google OAuth (get from https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Server
PORT=3000
NODE_ENV=production
CALLBACK_URL=https://yourdomain.com/auth/google/callback
FRONTEND_URL=https://yourdomain.com

# JWT Secret (generate a strong random string)
JWT_SECRET=your_random_jwt_secret_key_here
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

### 4. Start the Backend Server

Development:
```bash
npm run start
```

Production with PM2:
```bash
npm run pm2
```

The server will:
- Connect to PostgreSQL
- Initialize database tables automatically
- Start listening on the configured PORT

## Features

### Authentication
- **Google OAuth 2.0** - Secure authentication via Google
- **JWT Tokens** - Stateless authentication with 30-day expiration
- **Session Management** - Automatic token verification and renewal

### Database Storage
- **Favorites** - Synced across devices
- **Statistics** - Complete listening history with tracks and timestamps
- **User Settings** - All preferences saved to cloud
  - Theme, language, animations
  - Visualizer settings
  - Floating player position
  - Layout preferences
  - Volume and last station
- **Custom Gradients** - User-created color schemes

### Security Features
- **Helmet.js** - HTTP security headers
- **Rate Limiting** - Prevents abuse
- **XSS Protection** - Input sanitization
- **SQL Injection Protection** - Parameterized queries
- **CORS** - Cross-origin request configuration

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - OAuth callback handler
- `POST /auth/verify` - Verify JWT token
- `POST /auth/logout` - Logout (client-side token removal)

### Protected Endpoints (Require Authentication)
- `POST /api/favorites` - Add/remove favorite
- `GET /api/favorites` - Get user favorites
- `POST /api/stats` - Save listening session
- `GET /api/stats` - Get listening statistics
- `DELETE /api/stats` - Clear all statistics
- `POST /api/gradients` - Save custom gradients
- `GET /api/gradients` - Get custom gradients
- `POST /api/settings` - Save user settings
- `GET /api/settings` - Get user settings

## Frontend Integration

### Auth Flow
1. User clicks "Sign In with Google" button
2. Auth panel opens with beautiful animated background
3. User redirects to Google for authorization
4. Google redirects back with auth token
5. Token stored in localStorage
6. Token verified with backend
7. User data loaded and UI updates

### Components
- `auth/auth-manager.js` - Authentication state management
- `auth/auth-panel.js` - Beautiful login UI with particles animation
- `utils/db-sync.js` - Database synchronization utilities

### Protected Features
- **Statistics View** - Requires authentication, shows auth prompt if not logged in
- **Favorites** - Prompts to sign in when unauthenticated user tries to add favorite
- **Settings Sync** - Automatically syncs all settings when closing settings panel

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U deepradio_user -d deepradio_db -h localhost
```

### OAuth Errors
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
- Ensure redirect URI in Google Console matches CALLBACK_URL in .env
- Check FRONTEND_URL matches your actual frontend URL

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

## Production Deployment

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /path/to/DeepRadio-Site/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # Auth endpoints
    location /auth {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### PM2 Process Manager
```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start server/index.js --name deepradio-backend

# Configure startup
pm2 startup
pm2 save
```

## Security Best Practices

1. **Change Default Secrets** - Generate strong random strings for JWT_SECRET
2. **Use HTTPS** - Always use SSL certificates in production
3. **Database Backups** - Regular automated backups
4. **Environment Variables** - Never commit .env file to git
5. **Update Dependencies** - Regularly update npm packages
6. **Monitor Logs** - Use PM2 logs or similar for monitoring

## Development

### Hot Reload
Frontend (Vite):
```bash
npm run dev
```

Backend (with nodemon):
```bash
npm install -g nodemon
nodemon server/index.js
```

### Database Schema Updates
Database tables are created automatically on server start. To modify schema, edit `server/db.js` and restart the server.

## Support

For issues or questions:
- Check server logs: `pm2 logs deepradio-backend`
- Verify environment variables are set correctly
- Ensure PostgreSQL is running and accessible
- Check Google OAuth credentials are valid
