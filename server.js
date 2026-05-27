const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');

let compression;
try { compression = require('compression'); } catch (e) { /* optional */ }

const app = express();

if (compression) app.use(compression());
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(__dirname, {
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI
  || 'mongodb://sainiabhimanyu155_db_user:155155@ac-oxpa6p2-shard-00-00.uunhkff.mongodb.net:27017,ac-oxpa6p2-shard-00-01.uunhkff.mongodb.net:27017,ac-oxpa6p2-shard-00-02.uunhkff.mongodb.net:27017/open247?ssl=true&replicaSet=atlas-sa33zg-shard-0&authSource=admin';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err.message));

// Schema for stored images
const imageSchema = new mongoose.Schema({
  zoneId: { type: String, required: true, unique: true },
  url: { type: String, required: true }
}, { timestamps: true });

const Image = mongoose.model('Image', imageSchema);

// Schema for user-created memories
const memorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  tag: { type: String, default: '' },
  createdBy: { type: String, default: 'Someone' }
}, { timestamps: true });

const Memory = mongoose.model('Memory', memorySchema);

// Schema for tribute notes (the short notes on person cards)
const tributeSchema = new mongoose.Schema({
  personId: { type: String, required: true },
  author: { type: String, required: true },
  text: { type: String, default: '' }
}, { timestamps: true });

tributeSchema.index({ personId: 1, author: 1 }, { unique: true });
const Tribute = mongoose.model('Tribute', tributeSchema);

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Get all stored images
app.get('/api/get-images', async (req, res) => {
  try {
    const images = await Image.find({});
    const data = {};
    images.forEach(img => { data[img.zoneId] = img.url; });
    res.json(data);
  } catch (err) {
    console.error('Error reading images:', err.message);
    res.json({});
  }
});

// Save an image URL
app.post('/api/save-image', async (req, res) => {
  const { zoneId, url } = req.body;
  if (!zoneId || !url) {
    return res.status(400).json({ error: 'Missing zoneId or url' });
  }

  try {
    await Image.findOneAndUpdate(
      { zoneId },
      { zoneId, url },
      { upsert: true, new: true }
    );
    res.json({ success: true, zoneId, url });
  } catch (err) {
    console.error('Error saving image:', err.message);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// Signed upload signature
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

// Delete an image
app.delete('/api/delete-image', async (req, res) => {
  const { zoneId } = req.body;
  if (!zoneId) {
    return res.status(400).json({ error: 'Missing zoneId' });
  }

  try {
    await Image.findOneAndDelete({ zoneId });
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting image:', err.message);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// ---- TRIBUTES API ----

// Get all tributes
app.get('/api/tributes', async (req, res) => {
  try {
    const tributes = await Tribute.find({});
    res.json(tributes);
  } catch (err) {
    console.error('Error reading tributes:', err.message);
    res.json([]);
  }
});

// Save or update a tribute
app.post('/api/tributes', async (req, res) => {
  const { personId, author, text } = req.body;
  if (!personId || !author) {
    return res.status(400).json({ error: 'Missing personId or author' });
  }

  try {
    const tribute = await Tribute.findOneAndUpdate(
      { personId, author },
      { personId, author, text: text || '' },
      { upsert: true, new: true }
    );
    res.json({ success: true, tribute });
  } catch (err) {
    console.error('Error saving tribute:', err.message);
    res.status(500).json({ error: 'Failed to save tribute' });
  }
});

// ---- MEMORIES API ----

// Get all user-created memories
app.get('/api/memories', async (req, res) => {
  try {
    const memories = await Memory.find({}).sort({ createdAt: -1 });
    res.json(memories);
  } catch (err) {
    console.error('Error reading memories:', err.message);
    res.json([]);
  }
});

// Create a new memory
app.post('/api/memories', async (req, res) => {
  const { title, description, photoUrl, tag, createdBy } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const memory = await Memory.create({
      title,
      description: description || '',
      photoUrl: photoUrl || '',
      tag: tag || '',
      createdBy: createdBy || 'Someone'
    });
    res.json({ success: true, memory });
  } catch (err) {
    console.error('Error creating memory:', err.message);
    res.status(500).json({ error: 'Failed to create memory' });
  }
});

// Delete a memory
app.delete('/api/memories/:id', async (req, res) => {
  try {
    await Memory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting memory:', err.message);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Open 24/7 running on http://localhost:${PORT}`);
});
