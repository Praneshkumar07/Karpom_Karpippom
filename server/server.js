const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const db = require('./db'); // <--- IMPORT SHARED DB CONNECTION
const tutorRoutes = require('./routes/tutorRoutes'); // <--- IMPORT TUTOR ROUTES
const router = express.Router();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// 1. SETUP STATIC FOLDER FOR UPLOADS
app.use('/uploads', express.static('public/uploads'));

// 2. MULTER CONFIG (For PDF Uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads') // Ensure this folder exists!
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only .pdf format allowed!'));
        }
    }
});

// Ensure this route is AFTER the multer config
app.post('/student/assignment/submit', (req, res) => {
    // 1. Wrap upload in a function to catch Multer errors
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error("Multer Error:", err);
            return res.status(500).json({ Error: "File Upload Failed", Details: err.message });
        }

        // 2. Check if file and ID exist
        const submissionId = req.body.submission_id;
        const file = req.file;

        console.log("Received Upload Request:");
        console.log("Submission ID:", submissionId);
        console.log("File:", file ? file.filename : "MISSING");

        if (!file || !submissionId) {
            return res.status(400).json({ Error: "Missing file or submission ID" });
        }

        // 3. Update Database
        const sql = "UPDATE student_submissions SET status = 'Submitted', submission_date = NOW(), file_path = ? WHERE id = ?";
        
        db.query(sql, [file.filename, submissionId], (err, result) => {
            if (err) {
                console.error("Database Error:", err);
                return res.status(500).json({ Error: "Database Update Failed" });
            }
            console.log("Database Updated Successfully");
            res.json({ Status: "Success" });
        });
    });
});
// ---------------------------------------------------------
// ROUTE REGISTRATION
// ---------------------------------------------------------

// 1. Activate Tutor Routes
// URLs will look like: http://localhost:8081/tutor/profile/1
app.use('/tutor', tutorRoutes); 


// ---------------------------------------------------------
// LOGIN API
// ---------------------------------------------------------
app.post('/login', (req, res) => {
    const { userType, username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";
    
    db.query(sql, [username], (err, data) => {
        if (err) return res.json({ Error: "Database Error" });
        if (data.length === 0) return res.json({ Error: "User not found" });

        const user = data[0];
        if (user.password !== password) return res.json({ Error: "Wrong Password" });
        if (user.user_type !== userType) return res.json({ Error: "User Type Mismatch" });

        return res.json({
            Status: "Success",
            role: user.role,
            username: user.username,
            id: user.id
        });
    });
});

// ---------------------------------------------------------
// STUDENT ROUTES (Legacy Inline Routes)
// ---------------------------------------------------------

// 1. Get Student Stats
app.get('/student/stats/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `
        SELECT 
            SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN status IN ('Submitted', 'Graded') THEN 1 ELSE 0 END) AS completed
        FROM student_submissions 
        WHERE student_id = ?
    `;
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({
            pending: result[0].pending || 0,
            completed: result[0].completed || 0,
            attendance: '80%'
        });
    });
});



// Make the uploads folder accessible to the frontend
// In your main server.js, make sure to add:
// app.use('/uploads', express.static('public/uploads'));


// ---------------------------------------------------------
// STUDENT ASSIGNMENT ROUTES
// ---------------------------------------------------------

// 2.Get Assignments for Student
app.get('/student/assignments/:studentId', (req, res) => {
    const studentId = req.params.studentId;

    const sql = `
        SELECT 
            s.id as submission_id, 
            s.status, 
            s.remarks, 
            s.file_path,
            a.id as assignment_id, 
            a.title, 
            a.subject, 
            a.description, 
            a.due_date
        FROM student_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = ?
    `;

    db.query(sql, [studentId], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json(data);
    });
});

//3 Submit Assignment (Upload PDF)
app.post('/student/assignment/submit', upload.single('file'), (req, res) => {
    const submissionId = req.body.submission_id;
    const file = req.file;

    if (!file) return res.status(400).json({ Error: "No file uploaded" });

    const sql = "UPDATE student_submissions SET status = 'Submitted', submission_date = NOW(), file_path = ? WHERE id = ?";
    
    db.query(sql, [file.filename, submissionId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ Status: "Success" });
    });
});
// 4. Get Student Profile
app.get('/student/profile/:id', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT u.username AS full_name, u.role, sd.batch, sd.contact_number, sd.address, sd.parent_name
        FROM users u
        LEFT JOIN student_details sd ON u.id = sd.user_id
        WHERE u.id = ?
    `;
    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        if (result.length === 0) return res.status(404).json({ error: "User profile not found" });
        res.json(result[0]);
    });
});

// 5. Update Student Profile
app.post('/student/profile/update', (req, res) => {
    const { id, contact_number, address } = req.body;
    const sql = "UPDATE student_details SET contact_number = ?, address = ? WHERE user_id = ?";
    db.query(sql, [contact_number, address, id], (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ Status: "Success", message: "Profile updated successfully" });
    });
});

// 6. Get Materials (Filtered by Student Batch)
app.get('/student/materials/:userId', (req, res) => {
    const userId = req.params.userId;
    const batchSql = `SELECT batch FROM student_details WHERE user_id = ?`;
    db.query(batchSql, [userId], (err, userResult) => {
        if (err) return res.status(500).json({ error: "Database error" });
        const batch = (userResult.length > 0 && userResult[0].batch) ? userResult[0].batch : 'KK_01';

        const materialSql = `
            SELECT id, title, subject, description, file_name, uploaded_at 
            FROM study_materials WHERE batch = ? ORDER BY uploaded_at DESC
        `;
        db.query(materialSql, [batch], (err, materials) => {
            if (err) return res.status(500).json({ error: "Database error fetching materials" });
            res.json(materials);
        });
    });
});

// 7. Download Material File
app.get('/materials/download/:id', (req, res) => {
    const materialId = req.params.id;
    const sql = `SELECT file_name FROM study_materials WHERE id = ?`;
    db.query(sql, [materialId], (err, result) => {
        if (err) return res.status(500).send("Database error");
        if (result.length === 0) return res.status(404).send("File not found");
        if (result[0].file_name) return res.redirect(`/uploads/${result[0].file_name}`);
    });
});

// 8. Get Exam Results
app.get('/student/marks/exams/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `SELECT id, exam_name, subject, marks_obtained, total_marks, grade, exam_date FROM exam_results WHERE student_id = ? ORDER BY exam_date DESC`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error fetching marks" });
        res.json(results);
    });
});

// 9. Get Student Timetable
app.get('/student/timetable/:userId', (req, res) => {
    const userId = req.params.userId;
    const batchSql = `SELECT batch FROM student_details WHERE user_id = ?`;
    db.query(batchSql, [userId], (err, userResult) => {
        if (err) return res.status(500).json({ error: "Database error" });
        const batch = (userResult.length > 0 && userResult[0].batch) ? userResult[0].batch : 'KK_01';
        
        const scheduleSql = `
            SELECT day_of_week, period_order, time_slot, subject, teacher_name, type
            FROM timetables WHERE batch = ?
            ORDER BY FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), period_order ASC
        `;
        db.query(scheduleSql, [batch], (err, schedule) => {
            if (err) return res.status(500).json({ error: "Database error fetching schedule" });
            res.json(schedule);
        });
    });
});

// 10. Get Attendance History
app.get('/student/attendance/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `SELECT id, date, status, remarks FROM attendance WHERE student_id = ? ORDER BY date DESC`;
    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// 11. Get Announcements
app.get('/student/announcements', (req, res) => {
    const sql = `
        SELECT id, title, content, type, subject, event_date_time, link, publish_date, priority 
        FROM announcements 
        ORDER BY priority = 'High' DESC, event_date_time ASC, publish_date DESC 
        LIMIT 10
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});
// ==========================================
//  MARKS ENTRY ROUTES (Updated for your Table)
// ==========================================

// 1. GET Marks for a specific Student & Exam Type
app.get('/student/marks/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    const examType = req.query.exam_type; // e.g., 'Quarterly' or 'Half Yearly'

    const sql = `
        SELECT subject, marks_obtained 
        FROM student_academic_marks 
        WHERE student_id = ? AND exam_type = ?
    `;

    db.query(sql, [studentId, examType], (err, data) => {
        if (err) {
            console.error("Error fetching marks:", err);
            return res.status(500).json({ Error: "Database Error" });
        }
        return res.json(data);
    });
});

// 2. POST (Save/Update) Marks
app.post('/student/marks/add', (req, res) => {
    const { student_id, academic_year, exam_type, marks_data } = req.body;

    // IMPORTANT: Because you might not have a UNIQUE constraint on (student_id, exam_type, subject),
    // we should delete old marks for this specific exam before inserting new ones to avoid duplicates.
    // If you DO have a unique constraint, let me know and I can switch to ON DUPLICATE KEY UPDATE.
    
    const deleteSql = "DELETE FROM student_academic_marks WHERE student_id = ? AND exam_type = ? AND academic_year = ?";
    
    db.query(deleteSql, [student_id, exam_type, academic_year], (err) => {
        if (err) {
            console.error("Error clearing old marks:", err);
            return res.status(500).json({ Error: "Failed to update marks" });
        }

        // Filter out empty marks
        const values = marks_data
            .filter(item => item.mark !== '' && item.mark !== null) 
            .map(item => [
                student_id, 
                item.subject, 
                exam_type, 
                item.mark,
                academic_year
            ]);

        if (values.length === 0) {
            return res.json({ Status: "Success", Message: "Marks cleared." });
        }

        const insertSql = `
            INSERT INTO student_academic_marks (student_id, subject, exam_type, marks_obtained, academic_year)
            VALUES ?
        `;

        db.query(insertSql, [values], (err, result) => {
            if (err) {
                console.error("Error saving marks:", err);
                return res.status(500).json({ Error: "Failed to save marks" });
            }
            return res.json({ Status: "Success" });
        });
    });
});
// ---------------------------------------------------------
// START SERVER
// ---------------------------------------------------------
app.listen(8081, () => {
    console.log("🚀 Server running on port 8081");
});