const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

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

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Open 24/7 Backend running on http://localhost:${PORT}`);
});
