# Open 24/7 — Cross-Device Photo Sync Setup

## Features
- Upload photos from any device
- **Automatically syncs across all devices** ✨
- Photos persist even after page refresh
- Works offline with localStorage fallback

## How Cross-Device Sync Works

1. **You upload a photo** on Device A
2. **Photo URL is saved** to the backend server
3. **All other devices** load the backend data when they visit the site
4. **Photos appear instantly** on Device B, Device C, etc.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Server
```bash
npm start
```
The server will run on `http://localhost:3000`

### 3. Set Up Frontend
- Update the fetch URLs in `index.html` if deploying to production:
  - Currently set to `/api/get-images` and `/api/save-image`
  - Works for localhost and same-domain deployments

### 4. Deploy (Optional)
For production deployment (e.g., Heroku, Vercel, Railway):
- Deploy the backend separately or use a serverless function
- Update API URLs in `index.html` to point to your deployed backend

## File Structure
```
Open24-7/
├── index.html           # Frontend (HTML + CSS + JS)
├── server.js            # Backend (Node.js/Express)
├── package.json         # Dependencies
├── images-data.json     # Stores image URLs (auto-created)
└── README.md            # This file
```

## How It Works
- **Device 1**: Uploads photo → saved to `images-data.json` → backend returns success
- **Device 2**: Opens website → fetches `images-data.json` → displays all photos
- **Device 3**: Uploads different photo → updates `images-data.json`
- **Device 1 & 2**: Refresh page → see the new photo from Device 3

## Troubleshooting

### Photos not syncing?
1. Check that backend is running (`npm start`)
2. Check browser console for errors (press F12)
3. Ensure both devices can access the same backend URL

### Backend not starting?
```bash
npm install express
npm start
```

### Want to store data in the cloud instead?
Replace the `images-data.json` file logic with:
- Firebase Realtime Database
- MongoDB
- AWS S3
- GitHub API (store as gist)

---

**Now upload a photo and refresh on another device to see the magic! 🎉**
