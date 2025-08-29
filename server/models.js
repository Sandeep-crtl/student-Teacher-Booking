const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: false },
  },
  { timestamps: true }
);

const TeacherSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    passwordHash: { type: String },
    subject: { type: String, required: true, trim: true },
    bio: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    price: { type: Number, min: 0 },
    slots: [{ type: String }],
  },
  { timestamps: true }
);

const BookingSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    time: { type: String, required: true }, // HH:mm
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

StudentSchema.index({ email: 1 }, { unique: true });
BookingSchema.index({ teacher: 1, date: 1, time: 1 }, { unique: true });

const Student = mongoose.model('Student', StudentSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);
const Booking = mongoose.model('Booking', BookingSchema);

module.exports = { Student, Teacher, Booking };


