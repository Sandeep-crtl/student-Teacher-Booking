const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Student, Teacher, Booking } = require('./models');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, unique + ext);
  },
});
const upload = multer({ storage });

const router = express.Router();

function signToken(payload) {
  const secret = process.env.JWT_SECRET || 'dev_secret';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

function authRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Current user info and stats
router.get('/me', authRequired, async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.id).lean();
      if (!student) return res.status(404).json({ error: 'Not found' });
      const bookings = await Booking.find({ student: student._id }).populate('teacher').lean();
      const totalSpend = bookings.reduce((sum, b) => sum + (b.teacher?.price || 0), 0);
      return res.json({
        id: String(student._id),
        role: 'student',
        name: student.name,
        email: student.email,
        avatarUrl: `https://via.placeholder.com/64?text=${encodeURIComponent(student.name?.[0] || 'S')}`,
        stats: { bookingsCount: bookings.length, totalSpend }
      });
    } else if (req.user.role === 'teacher') {
      const teacher = await Teacher.findById(req.user.id).lean();
      if (!teacher) return res.status(404).json({ error: 'Not found' });
      const bookingsCount = await Booking.countDocuments({ teacher: teacher._id });
      const totalEarnings = (teacher.price || 0) * bookingsCount;
      return res.json({
        id: String(teacher._id),
        role: 'teacher',
        name: teacher.name,
        email: teacher.email,
        imageUrl: teacher.imageUrl,
        price: teacher.price,
        avatarUrl: teacher.imageUrl || `https://via.placeholder.com/64?text=${encodeURIComponent(teacher.name?.[0] || 'T')}`,
        stats: { bookingsCount, totalEarnings }
      });
    }
    return res.status(400).json({ error: 'Unknown role' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Auth: Student signup/login
router.post('/auth/student/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await Student.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await Student.create({ name, email, passwordHash });
    const token = signToken({ sub: student._id, role: 'student' });
    res.status(201).json({ token, user: { id: student._id, name: student.name, email: student.email, role: 'student' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to signup' });
  }
});

router.post('/auth/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });
    if (!student || !student.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, student.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: student._id, role: 'student' });
    res.json({ token, user: { id: student._id, name: student.name, email: student.email, role: 'student' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Auth: Teacher signup/login
router.post('/auth/teacher/signup', upload.single('imageFile'), async (req, res) => {
  try {
    const { name, email, subject, bio, slots, password, price } = req.body;
    if (!name || !email || !subject || !password) return res.status(400).json({ error: 'Missing fields' });
    const existing = await Teacher.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const numericPrice = price !== undefined ? Number(price) : undefined;
    const teacher = await Teacher.create({ name, email, subject, bio, imageUrl, price: numericPrice, slots: Array.isArray(slots) ? slots : [], passwordHash });
    const token = signToken({ sub: teacher._id, role: 'teacher' });
    res.status(201).json({ token, user: { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to signup' });
  }
});

router.post('/auth/teacher/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await Teacher.findOne({ email });
    if (!teacher || !teacher.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, teacher.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ sub: teacher._id, role: 'teacher' });
    res.json({ token, user: { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Teachers
router.get('/teachers', async (req, res) => {
  try {
    const { q } = req.query;
    const filter = q
      ? { $or: [{ name: new RegExp(q, 'i') }, { subject: new RegExp(q, 'i') }] }
      : {};
    const teachers = await Teacher.find(filter).sort({ name: 1 });
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Students
router.post('/students', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    let student = await Student.findOne({ email });
    if (!student) student = await Student.create({ name, email });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create/find student' });
  }
});

// Bookings
router.get('/bookings', async (req, res) => {
  try {
    const { teacherId, date } = req.query;
    const filter = {};
    if (teacherId) filter.teacher = teacherId;
    if (date) filter.date = date;
    const bookings = await Booking.find(filter).populate('teacher').populate('student');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

router.post('/bookings', authRequired, async (req, res) => {
  try {
    const { teacherId, date, time, note } = req.body;
    if (!teacherId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Only students can book teachers
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can book teachers' });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    if (!teacher.slots.includes(time)) return res.status(400).json({ error: 'Time not in teacher slots' });

    const booking = await Booking.create({ 
      student: req.user.id, 
      teacher: teacher._id, 
      date, 
      time, 
      note 
    });
    res.status(201).json(await booking.populate('teacher').populate('student'));
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(409).json({ error: 'Slot already booked' });
    }
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Delete booking
router.delete('/bookings/:id', authRequired, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    
    // Check if user owns this booking
    if (req.user.role === 'student' && booking.student.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (req.user.role === 'teacher' && booking.teacher.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    
    await booking.deleteOne();
    res.json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// Current user's bookings (student or teacher)
router.get('/my-bookings', authRequired, async (req, res) => {
  try {
    const filter = req.user.role === 'student' ? { student: req.user.id } : { teacher: req.user.id };
    const bookings = await Booking.find(filter)
      .populate('teacher')
      .populate('student')
      .sort({ createdAt: -1 })
      .lean();
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch my bookings' });
  }
});

// Admin routes
function adminRequired(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    
    // Check if user is admin (you can set your email as admin)
    if (payload.email !== 'admin@example.com') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// Get all bookings for admin
router.get('/admin/bookings', adminRequired, async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('teacher')
      .populate('student')
      .sort({ createdAt: -1 })
      .lean();
    
    const bookingsWithStatus = bookings.map(booking => {
      const now = new Date();
      const bookingDate = new Date(booking.date + 'T' + booking.time);
      const diffMs = bookingDate - now;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      let status = 'pending';
      if (diffMins < -60) status = 'completed';
      else if (diffMins < 0) status = 'ongoing';
      else if (diffMins < 15) status = 'starting';
      
      return {
        ...booking,
        status,
        studentName: booking.student?.name || 'Unknown',
        studentEmail: booking.student?.email || 'Unknown',
        teacherName: booking.teacher?.name || 'Unknown',
        teacherSubject: booking.teacher?.subject || 'Unknown',
        teacherPrice: booking.teacher?.price || 0
      };
    });
    
    res.json(bookingsWithStatus);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get all users for admin
router.get('/admin/users', adminRequired, async (req, res) => {
  try {
    const students = await Student.find({}).lean();
    const teachers = await Teacher.find({}).lean();
    
    const users = [
      ...students.map(s => ({
        id: s._id,
        name: s.name,
        email: s.email,
        role: 'student',
        createdAt: s.createdAt,
        bookingsCount: 0 // Will be calculated
      })),
      ...teachers.map(t => ({
        id: t._id,
        name: t.name,
        email: t.email,
        role: 'teacher',
        subject: t.subject,
        price: t.price,
        imageUrl: t.imageUrl,
        bio: t.bio,
        createdAt: t.createdAt,
        bookingsCount: 0 // Will be calculated
      }))
    ];
    
    // Get booking counts for each user
    for (let user of users) {
      if (user.role === 'student') {
        user.bookingsCount = await Booking.countDocuments({ student: user.id });
      } else {
        user.bookingsCount = await Booking.countDocuments({ teacher: user.id });
      }
    }
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin login
router.post('/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Only allow specific admin email (change this to your email)
    if (email !== 'admin@example.com') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Simple admin password check (change this to your password)
    if (password !== 'admin123') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = signToken({ sub: 'admin', role: 'admin', email: 'admin@example.com' });
    res.json({ 
      token, 
      user: { 
        id: 'admin', 
        name: 'Admin', 
        email: 'admin@example.com', 
        role: 'admin' 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

module.exports = router;


