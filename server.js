const express = require('express');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

let compression;
try { compression = require('compression'); } catch (e) { /* optional */ }

const app = express();

if (compression) app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files with cache headers
app.use(express.static(__dirname, {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Path to store images data
const imagesFile = path.join(__dirname, 'images-data.json');

// Initialize file if it doesn't exist or is invalid
function readImagesData() {
  try {
    if (fs.existsSync(imagesFile)) {
      const raw = fs.readFileSync(imagesFile, 'utf8');
      const data = JSON.parse(raw);
      return typeof data === 'object' && data !== null ? data : {};
    }
  } catch (err) {
    console.error('Error reading images file, resetting:', err.message);
  }
  return {};
}

function writeImagesData(data) {
  fs.writeFileSync(imagesFile, JSON.stringify(data, null, 2));
}

// Ensure file exists on startup
if (!fs.existsSync(imagesFile)) {
  writeImagesData({});
}

// Get all stored images
app.get('/api/get-images', (req, res) => {
  const data = readImagesData();
  res.json(data);
});

// Save an image URL
app.post('/api/save-image', (req, res) => {
  const { zoneId, url } = req.body;
  if (!zoneId || !url) {
    return res.status(400).json({ error: 'Missing zoneId or url' });
  }

  try {
    const data = readImagesData();
    data[zoneId] = url;
    writeImagesData(data);
    res.json({ success: true, zoneId, url });
  } catch (err) {
    console.error('Error saving image:', err.message);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// Endpoint to get a signed upload signature
app.post('/api/sign-upload', (req, res) => {
  const { public_id, timestamp } = req.body;
  if (!public_id || !timestamp) {
    return res.status(400).json({ error: 'Missing public_id or timestamp' });
  }

  const secret = cloudinary.config().api_secret;
  if (!secret) {
    return res.status(500).json({ error: 'Cloudinary API secret not configured' });
  }

  const paramsToSign = { public_id, timestamp };
  const signature = cloudinary.utils.api_sign_request(paramsToSign, secret);
  res.json({ signature, api_key: cloudinary.config().api_key });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Open 24/7 running on http://localhost:${PORT}`);
});
