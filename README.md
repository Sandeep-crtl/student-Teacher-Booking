# 🎓 Student-Teacher Booking Appointment System

A web-based application that allows **students to book appointments with teachers** and enables **admins to manage teachers and student registrations**.  
Built using **HTML, CSS, JavaScript (Frontend)** and **Node.js, Express, MongoDB (Backend)**.

---

## 🚀 Features

- **Student Module**
  - Sign up & login authentication
  - View available teachers
  - Book appointments with teachers
  - View booking history

- **Teacher Module**
  - View student bookings
  - Update appointment status (Accepted / Rejected / Completed)

- **Admin Module**
  - Login authentication
  - Add / Update / Delete teacher profiles
  - Approve or reject student registrations
  - Manage booking records

---

## 🛠️ Tech Stack

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js, Express.js  
- **Database**: MongoDB  
- **Authentication**: JWT / Session-based  

---

## 📂 Project Structure

student-teacher-booking/
│── backend/
│ ├── server.js # Main server file
│ ├── routes/ # API routes
│ ├── models/ # Mongoose schemas
│ ├── controllers/ # Business logic
│ ├── middleware/ # Authentication & validation
│── frontend/
│ ├── index.html # Landing page
│ ├── login.html # Student/Teacher login
│ ├── signup.html # Student signup
│ ├── dashboard.html # Student dashboard
│ ├── admin.html # Admin panel
│ ├── css/ # Stylesheets
│ ├── js/ # Client-side scripts
│── README.md
│── package.json



---

## ⚙️ Installation & Setup

1. Clone the repository  
   ```bash
   git clone https://github.com/your-username/student-teacher-booking.git
   cd student-teacher-booking
cd backend
npm install
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/booking
JWT_SECRET=your-secret-key
PORT=5000
npm start

🔮 Future Enhancements

Email / SMS notifications for bookings
Calendar view for teachers & students
Role-based dashboard (student / teacher / admin)
Deployment on Render / Vercel / Netlify

👨‍💻 Author
Developed by Sandeep Bhukya 🚀
