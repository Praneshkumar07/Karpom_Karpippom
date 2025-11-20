const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pranesh@2006',
    database: 'karpom_karipom'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database: karpom_karipom');
});

// ---------------------------------------------------------
// LOGIN API
// ---------------------------------------------------------
app.post('/login', (req, res) => {
    const { userType, username, password } = req.body;

    const sql = "SELECT * FROM users WHERE username = ?";

    db.query(sql, [username], (err, data) => {
        if (err) return res.json({ Error: "Database Error" });

        if (data.length === 0) {
            return res.json({ Error: "User not found" });
        }

        const user = data[0];

        if (user.password !== password) {
            return res.json({ Error: "Wrong Password" });
        }

        if (user.user_type !== userType) {
            return res.json({ Error: "User Type Mismatch" });
        }

        return res.json({
            Status: "Success",
            role: user.role,
            username: user.username
        });
    });
});

// ---------------------------------------------------------
// STUDENT ROUTES
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
        if (err) {
            console.error("❌ DB Query Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({
            pending: result[0].pending || 0,
            completed: result[0].completed || 0,
            attendance: '80%'
        });
    });
});

// 2. Get Assignments List
app.get('/student/assignments/:userId', (req, res) => {
    const userId = req.params.userId;

    const sql = `
        SELECT 
            s.assignment_id AS id,
            a.subject,
            a.title,
            a.description,
            a.due_date,
            s.status,
            s.remarks
        FROM student_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = ?
        ORDER BY a.due_date ASC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error("❌ DB Query Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// 3. Submit Assignment
app.post('/student/assignment/submit', (req, res) => {
    const { student_id, assignment_id } = req.body;

    const sql = `
        UPDATE student_submissions 
        SET status = 'Submitted' 
        WHERE student_id = ? AND assignment_id = ?
    `;

    db.query(sql, [student_id, assignment_id], (err) => {
       	if (err) {
            console.error("❌ Submission Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ Status: "Success", message: "Assignment marked as submitted" });
    });
});

// ---------------------------------------------------------


// -------------------------------------------------------------
// NEW ROUTES: PROFILE (Matches your Schema)
// -------------------------------------------------------------

// 5. Get Student Profile
// Joins 'users' (id, username, email) with 'student_details' (batch, contact, address)
app.get('/student/profile/:id', (req, res) => {
    const userId = req.params.id;
    console.log(`📥 [PROFILE] Fetching profile for User ID: ${userId}`);

    const sql = `
        SELECT 
            u.username AS full_name,
            u.role,
            sd.batch,             -- From your schema
            sd.contact_number,    -- From your schema
            sd.address,           -- From your schema
            sd.parent_name        -- From your schema
        FROM users u
        LEFT JOIN student_details sd ON u.id = sd.user_id
        WHERE u.id = ?
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) {
            console.error("❌ Profile Fetch Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (result.length === 0) {
            // If no detail record exists, return basic user info or 404
            return res.status(404).json({ error: "User profile not found" });
        }
        res.json(result[0]);
    });
});

// 6. Update Student Profile
app.post('/student/profile/update', (req, res) => {
    const { id, contact_number, address } = req.body;
    // console.log(`📥 [PROFILE UPDATE] Updating User ID: ${id}`);

    // Updates specific fields in student_details
    const sql = `
        UPDATE student_details 
        SET contact_number = ?, address = ?
        WHERE user_id = ?
    `;

    db.query(sql, [contact_number, address, id], (err, result) => {
        if (err) {
            console.error("❌ Profile Update Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ Status: "Success", message: "Profile updated successfully" });
    });
});

// -------------------------------------------------------------
// NEW ROUTES: STUDY MATERIALS
// -------------------------------------------------------------

// 7. Get Materials (Filtered by Student's Batch)
app.get('/student/materials/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log(`📥 [MATERIALS] Fetching for User ID: ${userId}`);

    // Step 1: Get Student's Batch
    const batchSql = `SELECT batch FROM student_details WHERE user_id = ?`;
    
    db.query(batchSql, [userId], (err, userResult) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        // Default to 'KK_01' if no batch found (for testing safety)
        const batch = (userResult.length > 0 && userResult[0].batch) ? userResult[0].batch : 'KK_01';

        // Step 2: Fetch materials for that batch
        // Note: We DO NOT select 'file_data' here to keep the response light. 
        // We only fetch the blob when they click download.
        const materialSql = `
            SELECT id, title, subject, description, file_name, uploaded_at 
            FROM study_materials 
            WHERE batch = ?
            ORDER BY uploaded_at DESC
        `;

        db.query(materialSql, [batch], (err, materials) => {
            if (err) return res.status(500).json({ error: "Database error fetching materials" });
            res.json(materials);
        });
    });
});

// 8. Download Material File
app.get('/materials/download/:id', (req, res) => {
    const materialId = req.params.id;
    const sql = `SELECT file_name, file_data, mime_type FROM study_materials WHERE id = ?`;

    db.query(sql, [materialId], (err, result) => {
        if (err) return res.status(500).send("Database error");
        if (result.length === 0 || !result[0].file_data) return res.status(404).send("File not found");

        const file = result[0];

        // Set headers to prompt download
        res.setHeader('Content-Type', file.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
        res.send(file.file_data);
    });
});


// 9. Upload Material
// app.post('/admin/materials/upload', upload.single('file'), (req, res) => {
//     const { title, subject, description, batch } = req.body;
//     const file = req.file;
//     if (!file || !title) return res.status(400).json({ error: "Missing file or title" });
//     const sql = `INSERT INTO study_materials (title, subject, description, file_name, file_data, mime_type, batch) VALUES (?, ?, ?, ?, ?, ?, ?)`;
//     db.query(sql, [title, subject, description, file.originalname, file.buffer, file.mimetype, batch || 'KK_01'], (err, result) => {
//         if (err) return res.status(500).json({ error: "Database error" });
//         res.json({ message: "Material uploaded successfully" });
//     });
// });

// -------------------------------------------------------------
// NEW ROUTES: MARKS & EXAMS
// -------------------------------------------------------------

// 10. Get Exam Results
app.get('/student/marks/exams/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log(`📥 [MARKS] Fetching exams for User ID: ${userId}`);

    const sql = `
        SELECT id, exam_name, subject, marks_obtained, total_marks, grade, exam_date 
        FROM exam_results 
        WHERE student_id = ? 
        ORDER BY exam_date DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error fetching marks" });
        }
        res.json(results);
    });
});

// -------------------------------------------------------------
// NEW ROUTES: TIMETABLE
// -------------------------------------------------------------

// 11. Get Student Timetable
app.get('/student/timetable/:userId', (req, res) => {
    const userId = req.params.userId;
    // console.log(`📥 [TIMETABLE] Fetching for User ID: ${userId}`);

    // Step 1: Find Student Batch
    const batchSql = `SELECT batch FROM student_details WHERE user_id = ?`;
    
    db.query(batchSql, [userId], (err, userResult) => {
        if (err) return res.status(500).json({ error: "Database error" });
        
        const batch = (userResult.length > 0 && userResult[0].batch) ? userResult[0].batch : 'KK_01';

        // Step 2: Get Schedule for Batch
        const scheduleSql = `
            SELECT day_of_week, period_order, time_slot, subject, teacher_name, type
            FROM timetables 
            WHERE batch = ?
            ORDER BY 
                FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
                period_order ASC
        `;

        db.query(scheduleSql, [batch], (err, schedule) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: "Database error fetching schedule" });
            }
            res.json(schedule);
        });
    });
});

// 12. Get Attendance History (REQUIRED FOR REPORT)
app.get('/student/attendance/:userId', (req, res) => {
    const userId = req.params.userId;
    // console.log(`📥 [ATTENDANCE] Fetching for User ID: ${userId}`);

    // We fetch ALL history here. 
    // The frontend handles the filtering by Month/Year for the report.
    const sql = `
        SELECT id, date, status, remarks 
        FROM attendance 
        WHERE student_id = ? 
        ORDER BY date DESC
    `;

    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// -------------------------------------------------------------
// UPDATED ROUTE: ANNOUNCEMENTS (With Links & Type)
// -------------------------------------------------------------

// 13. Get Announcements
app.get('/student/announcements', (req, res) => {
    // console.log(`📥 [ANNOUNCEMENTS] Fetching all public notices...`);
    
    // Fetch announcements including type, links, and event times
    const sql = `
        SELECT id, title, content, type, subject, event_date_time, link, publish_date, priority 
        FROM announcements 
        ORDER BY priority = 'High' DESC, event_date_time ASC, publish_date DESC 
        LIMIT 10
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("❌ Announcement Fetch Error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

app.listen(8081, () => {
    console.log("🚀 Server running on port 8081");
});
