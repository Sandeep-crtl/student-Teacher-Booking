require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { Teacher } = require('./models');
const apiRoutes = require('./routes');

const app = express();

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));
// Ensure uploads dir exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
try { if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}

// API routes
app.use('/api', apiRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve index page as default (contains both landing and booking)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_teacher_booking';

async function seedTeachers() {
  const count = await Teacher.countDocuments();
  if (count === 0) {
    await Teacher.insertMany([
      { name: 'Alice Johnson', subject: 'Mathematics', bio: 'Algebra and Calculus specialist', imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=80', price: 25, slots: ['09:00', '10:00', '14:00', '16:00'] },
      { name: 'Brian Lee', subject: 'Physics', bio: 'Mechanics and Optics', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=80', price: 30, slots: ['11:00', '13:00', '15:00'] },
      { name: 'Cynthia Gomez', subject: 'Chemistry', bio: 'Organic and Inorganic', imageUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=600&q=80', price: 28, slots: ['10:00', '12:00', '14:00'] },
    ]);
    console.log('Seeded sample teachers');
  }
}

async function start() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    await seedTeachers();
    app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();


