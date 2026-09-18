# Go + MongoDB + Redis Login/Signup

Flow:
HTML/JS -> Go REST API -> MongoDB (users/products) + Redis (sessions/product cache)

Requirements:
- Go 1.22+
- MongoDB running on localhost:27017
- Redis running on localhost:6379

Run backend:
cd backend
go mod tidy
go run .

Open frontend with VS Code Live Server, or:
cd frontend
python -m http.server 5500

Then open http://localhost:5500

APIs:
POST /api/signup
POST /api/login
GET /api/profile
POST /api/logout
GET /api/products
POST /api/products
PUT /api/products/:id
DELETE /api/products/:id

Session:
The Go server creates a random session token after login, stores
session:<token> -> userId in Redis for 24 hours, and sends the token
as an HttpOnly cookie named session_id.

Optional environment variables:
MONGO_URI, MONGO_DB, REDIS_ADDR, PORT, CORS_ORIGIN

Defaults:
- MONGO_URI=mongodb://localhost:27017
- MONGO_DB=loginapp
- REDIS_ADDR=localhost:6379
- PORT=8080
- CORS_ORIGIN=http://localhost:5500

Production deployment:
- Set CORS_ORIGIN to your deployed frontend URL, for example:
  https://your-app.netlify.app
- Set the frontend API URL in frontend/index.html or override it before app.js loads:
  window.__API_URL__ = "https://your-backend-service.com/api";
- For services like Render, Railway, or Fly.io, set the backend env vars and expose the public URL.
- For static frontend hosting (Netlify/Vercel), deploy the frontend folder and keep the API URL pointed to your backend.

Product caching:
GET /api/products first checks Redis using the authenticated user's key
products:<userId>. A cache entry lives for 5 minutes. MongoDB remains the
source of truth, and the cache is deleted after product create, update, or
delete. If Redis is unavailable, the API reads from MongoDB normally.
