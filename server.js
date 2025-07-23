const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Data storage (JSON files)
const DATA_DIR = './data';
const GRC_ITEMS_FILE = path.join(DATA_DIR, 'grc-items.json');
const EVIDENCE_FILE = path.join(DATA_DIR, 'evidence.json');

// Ensure data directory and files exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(GRC_ITEMS_FILE)) {
  fs.writeFileSync(GRC_ITEMS_FILE, '[]');
}

if (!fs.existsSync(EVIDENCE_FILE)) {
  fs.writeFileSync(EVIDENCE_FILE, '[]');
}

// Helper functions
function readGRCItems() {
  try {
    const data = fs.readFileSync(GRC_ITEMS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading GRC items:', error);
    return [];
  }
}

function writeGRCItems(items) {
  try {
    fs.writeFileSync(GRC_ITEMS_FILE, JSON.stringify(items, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing GRC items:', error);
    return false;
  }
}

function readEvidence() {
  try {
    const data = fs.readFileSync(EVIDENCE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading evidence:', error);
    return [];
  }
}

function writeEvidence(evidence) {
  try {
    fs.writeFileSync(EVIDENCE_FILE, JSON.stringify(evidence, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing evidence:', error);
    return false;
  }
}

// Routes

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GRC Items API endpoints

// Get all GRC items
app.get('/api/grc-items', (req, res) => {
  const items = readGRCItems();
  res.json(items);
});

// Get a specific GRC item
app.get('/api/grc-items/:id', (req, res) => {
  const items = readGRCItems();
  const item = items.find(i => i.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({ error: 'GRC item not found' });
  }
  
  res.json(item);
});

// Create a new GRC item
app.post('/api/grc-items', (req, res) => {
  const items = readGRCItems();
  const newItem = {
    id: uuidv4(),
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    framework: req.body.framework,
    status: req.body.status || 'Not Started',
    priority: req.body.priority || 'Medium',
    assignedTo: req.body.assignedTo || '',
    dueDate: req.body.dueDate || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    evidenceIds: []
  };
  
  items.push(newItem);
  
  if (writeGRCItems(items)) {
    res.status(201).json(newItem);
  } else {
    res.status(500).json({ error: 'Failed to save GRC item' });
  }
});

// Update a GRC item
app.put('/api/grc-items/:id', (req, res) => {
  const items = readGRCItems();
  const itemIndex = items.findIndex(i => i.id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'GRC item not found' });
  }
  
  const updatedItem = {
    ...items[itemIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  items[itemIndex] = updatedItem;
  
  if (writeGRCItems(items)) {
    res.json(updatedItem);
  } else {
    res.status(500).json({ error: 'Failed to update GRC item' });
  }
});

// Delete a GRC item
app.delete('/api/grc-items/:id', (req, res) => {
  const items = readGRCItems();
  const itemIndex = items.findIndex(i => i.id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'GRC item not found' });
  }
  
  items.splice(itemIndex, 1);
  
  if (writeGRCItems(items)) {
    res.json({ message: 'GRC item deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete GRC item' });
  }
});

// Evidence API endpoints

// Get all evidence
app.get('/api/evidence', (req, res) => {
  const evidence = readEvidence();
  res.json(evidence);
});

// Get evidence for a specific GRC item
app.get('/api/evidence/item/:itemId', (req, res) => {
  const evidence = readEvidence();
  const itemEvidence = evidence.filter(e => e.grcItemId === req.params.itemId);
  res.json(itemEvidence);
});

// Upload evidence
app.post('/api/evidence', upload.single('file'), (req, res) => {
  const evidence = readEvidence();
  
  const newEvidence = {
    id: uuidv4(),
    grcItemId: req.body.grcItemId,
    title: req.body.title || req.file?.originalname || 'Untitled Evidence',
    description: req.body.description || '',
    type: req.body.type || 'file',
    fileName: req.file?.filename || '',
    originalName: req.file?.originalname || '',
    filePath: req.file ? `/uploads/${req.file.filename}` : '',
    fileSize: req.file?.size || 0,
    mimeType: req.file?.mimetype || '',
    url: req.body.url || '',
    notes: req.body.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  evidence.push(newEvidence);
  
  // Update GRC item to include this evidence
  const items = readGRCItems();
  const itemIndex = items.findIndex(i => i.id === req.body.grcItemId);
  if (itemIndex !== -1) {
    items[itemIndex].evidenceIds.push(newEvidence.id);
    items[itemIndex].updatedAt = new Date().toISOString();
    writeGRCItems(items);
  }
  
  if (writeEvidence(evidence)) {
    res.status(201).json(newEvidence);
  } else {
    res.status(500).json({ error: 'Failed to save evidence' });
  }
});

// Delete evidence
app.delete('/api/evidence/:id', (req, res) => {
  const evidence = readEvidence();
  const evidenceIndex = evidence.findIndex(e => e.id === req.params.id);
  
  if (evidenceIndex === -1) {
    return res.status(404).json({ error: 'Evidence not found' });
  }
  
  const evidenceItem = evidence[evidenceIndex];
  
  // Remove file if it exists
  if (evidenceItem.fileName && fs.existsSync(path.join('uploads', evidenceItem.fileName))) {
    try {
      fs.unlinkSync(path.join('uploads', evidenceItem.fileName));
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }
  
  // Remove from evidence array
  evidence.splice(evidenceIndex, 1);
  
  // Remove from GRC item's evidence list
  const items = readGRCItems();
  const itemIndex = items.findIndex(i => i.id === evidenceItem.grcItemId);
  if (itemIndex !== -1) {
    items[itemIndex].evidenceIds = items[itemIndex].evidenceIds.filter(id => id !== req.params.id);
    items[itemIndex].updatedAt = new Date().toISOString();
    writeGRCItems(items);
  }
  
  if (writeEvidence(evidence)) {
    res.json({ message: 'Evidence deleted successfully' });
  } else {
    res.status(500).json({ error: 'Failed to delete evidence' });
  }
});

// Dashboard/Statistics endpoint
app.get('/api/dashboard', (req, res) => {
  const items = readGRCItems();
  const evidence = readEvidence();
  
  const stats = {
    totalItems: items.length,
    totalEvidence: evidence.length,
    itemsByStatus: {},
    itemsByCategory: {},
    itemsByFramework: {},
    itemsByPriority: {},
    recentItems: items
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
  };
  
  // Calculate statistics
  items.forEach(item => {
    stats.itemsByStatus[item.status] = (stats.itemsByStatus[item.status] || 0) + 1;
    stats.itemsByCategory[item.category] = (stats.itemsByCategory[item.category] || 0) + 1;
    stats.itemsByFramework[item.framework] = (stats.itemsByFramework[item.framework] || 0) + 1;
    stats.itemsByPriority[item.priority] = (stats.itemsByPriority[item.priority] || 0) + 1;
  });
  
  res.json(stats);
});

// Start server
app.listen(PORT, () => {
  console.log(`GRC Tracker server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to access the application`);
});