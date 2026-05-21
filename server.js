// Debug: Log Cloudinary environment variables (do not log secrets in production)
console.log('Cloudinary ENV:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET ? '***' : undefined
});
const express = require('express');
const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Path to store images data
const imagesFile = path.join(__dirname, 'images-data.json');

// Initialize file if it doesn't exist
if (!fs.existsSync(imagesFile)) {
  fs.writeFileSync(imagesFile, JSON.stringify({}));
}

// Get all stored images
app.get('/api/get-images', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
    res.json(data);
  } catch (err) {
    console.error('Error reading images:', err);
    res.json({});
  }
});

// Save an image URL
app.post('/api/save-image', (req, res) => {
  try {
    const { zoneId, url } = req.body;
    if (!zoneId || !url) {
      return res.status(400).json({ error: 'Missing zoneId or url' });
    }

    // Read current data
    let data = {};
    if (fs.existsSync(imagesFile)) {
      data = JSON.parse(fs.readFileSync(imagesFile, 'utf8'));
    }

    // Update with new image
    data[zoneId] = url;

    // Write back to file
    fs.writeFileSync(imagesFile, JSON.stringify(data, null, 2));
    res.json({ success: true, zoneId, url });
  } catch (err) {
    console.error('Error saving image:', err);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// Endpoint to get a signed upload signature
app.post('/api/sign-upload', (req, res) => {
  const { public_id, timestamp } = req.body;
  if (!public_id || !timestamp) return res.status(400).json({ error: 'Missing public_id or timestamp' });
  const signature = cloudinary.utils.api_sign_request(
    { public_id, timestamp, folder: 'open247' },
    cloudinary.config().api_secret
  );
  res.json({ signature });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Open 24/7 Backend running on http://localhost:${PORT}`);
});
