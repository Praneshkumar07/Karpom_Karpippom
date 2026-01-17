const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points to your database connection
const moment = require('moment'); // FIXED: Import moment here
const mysql = require('mysql');   // FIXED: Import mysql here
// --- 2. DEFINE THE QUERY HELPER HERE ---
// This function was missing, causing "ReferenceError: query is not defined"
const query = (sql, args = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, args, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

// ==========================================
//              LEAD ROUTES
// ==========================================

// 1. GET Stats
router.get('/stats', async (req, res) => {
    const response = {
        totalStudents: 0,
        activeTutors: 0,
        avgAttendance: 0,
        pendingApprovals: 0
    };

    try {
        const students = await query("SELECT COUNT(*) as count FROM student_details");
        response.totalStudents = students[0].count;

        const tutors = await query("SELECT COUNT(*) as count FROM tutor_details WHERE status = 'Active'");
        response.activeTutors = tutors[0].count;

        const attendance = await query(`
            SELECT (SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) / COUNT(*)) * 100 as percentage 
            FROM attendance
        `);
        response.avgAttendance = attendance[0].percentage 
            ? parseFloat(attendance[0].percentage).toFixed(1) + "%" 
            : "0%";

        const pending = await query("SELECT COUNT(*) as count FROM requests WHERE status = 'PENDING'");
        response.pendingApprovals = pending[0].count;

        res.json(response);
    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ error: "Error fetching stats" });
    }
});

// 2. GET Attendance Chart
router.get('/attendance-chart', async (req, res) => {
    try {
        const sql = `
            SELECT date, COUNT(*) as present_count 
            FROM attendance 
            WHERE status = 'Present' 
            GROUP BY date 
            ORDER BY date DESC 
            LIMIT 7
        `;
        const results = await query(sql);

        // This line was failing because 'moment' wasn't imported
        const chartData = results.reverse().map(row => ({
            name: moment(row.date).format('ddd'), 
            attendance: row.present_count
        }));

        res.json(chartData);
    } catch (err) {
        console.error("Chart Error:", err);
        res.status(500).json({ error: "Error fetching chart data" });
    }
});

// 3. GET Top Tutors
router.get('/top-tutors', async (req, res) => {
    try {
        const sql = `
            SELECT 
                t.user_id as id,
                u.full_name as name,
                t.subjects_handled as subject,
                t.status,
                t.batch_handled,
                (SELECT COUNT(*) FROM student_details s WHERE s.batch = t.batch_handled) as students
            FROM tutor_details t
            JOIN users u ON t.user_id = u.id
            WHERE t.status = 'Active'
            LIMIT 5
        `;
        
        const results = await query(sql);
        
        const formatted = results.map(tutor => ({
            id: tutor.id,
            name: tutor.name,
            subject: tutor.subject,
            students: tutor.students,
            status: tutor.status,
            rating: (4.0 + Math.random()).toFixed(1)
        }));

        res.json(formatted);
    } catch (err) {
        console.error("Tutor Error:", err);
        res.status(500).json({ error: "Error fetching tutors" });
    }
});

// 4. GET Alerts
router.get('/alerts', async (req, res) => {
    const alerts = [];
    try {
        const recentReqs = await query(`
            SELECT r.created_at, u.full_name, r.request_type, r.reason
            FROM requests r
            JOIN users u ON r.requestor_id = u.id
            WHERE r.status IN ('PENDING', 'SWAP') 
            ORDER BY r.created_at DESC LIMIT 3
        `);

        recentReqs.forEach(req => {
            alerts.push({
                id: `req-${Math.random()}`,
                type: 'warning',
                text: `${req.request_type}: ${req.full_name} (${req.reason})`,
                time: moment(req.created_at).fromNow()
            });
        });

        const absentees = await query(`
            SELECT a.date, u.full_name
            FROM attendance a
            JOIN users u ON a.student_id = u.id
            WHERE a.status = 'Absent'
            ORDER BY a.date DESC LIMIT 3
        `);

        absentees.forEach(rec => {
            alerts.push({
                id: `abs-${Math.random()}`,
                type: 'info',
                text: `${rec.full_name} was absent`,
                time: moment(rec.date).fromNow()
            });
        });

        res.json(alerts);
    } catch (err) {
        console.error("Alerts Error:", err);
        res.status(500).json({ error: "Error fetching alerts" });
    }
});

// ==========================================
// 5. MANAGE USERS (Add/Search) - Optional
// ==========================================

// Search Users for the Header Search Bar
router.get('/search', (req, res) => {
    const term = req.query.q;
    if (!term) return res.json([]);

    const sql = "SELECT id, full_name, role FROM users WHERE full_name LIKE ? LIMIT 5";
    db.query(sql, [`%${term}%`], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// ... imports and setup

// ==========================================
// 6. GET PROFILE DATA
// ==========================================
router.get('/profile', (req, res) => {
    const userId = 2; // Hardcoded for now

    // Updated Query: Added Maatram_ID, course, passout_year, batch
    const sql = `
        SELECT 
            u.full_name, u.username as email, u.role, 
            ld.phone, ld.course, ld.location, ld.bio, ld.joining_date,
            ld.Maatram_ID, ld.passout_year, ld.batch
        FROM users u
        LEFT JOIN lead_details ld ON u.id = ld.user_id
        WHERE u.id = ?
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ error: "User not found" });

        const data = result[0];
        const nameParts = data.full_name ? data.full_name.split(' ') : ['',''];

        res.json({
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ') || '',
            email: data.email,
            role: data.role,
            // New Fields Mapped Here:
            phone: data.phone || '',
            course: data.course || '',
            location: data.location || '',
            bio: data.bio || '',
            Maatram_ID: data.Maatram_ID || '',
            passoutYear: data.passout_year || '',
            batch: data.batch || 'KK_01', 
            joinDate: data.joining_date 
        });
    });
});

// ==========================================
// 7. UPDATE PROFILE
// ==========================================
router.put('/profile', async (req, res) => {
    const userId = 2; 
    // Destructure new fields from request body
    const { 
        firstName, lastName, phone, course, 
        location, bio, Maatram_ID, passoutYear, batch 
    } = req.body;
    
    const fullName = `${firstName} ${lastName}`.trim();

    try {
        // 1. Update Users Table
        await new Promise((resolve, reject) => {
            db.query("UPDATE users SET full_name = ? WHERE id = ?", [fullName, userId], (err) => {
                if (err) reject(err); else resolve();
            });
        });

        // 2. Update Lead Details (Updated columns)
        const sqlDetails = `
            INSERT INTO lead_details (user_id, phone, course, location, bio, Maatram_ID, passout_year, batch)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            phone = VALUES(phone), 
            course = VALUES(course), 
            location = VALUES(location), 
            bio = VALUES(bio),
            Maatram_ID = VALUES(Maatram_ID),
            passout_year = VALUES(passout_year),
            batch = VALUES(batch)
        `;

        await new Promise((resolve, reject) => {
            db.query(sqlDetails, [userId, phone, course, location, bio, Maatram_ID, passoutYear, batch], (err) => {
                if (err) reject(err); else resolve();
            });
        });

        res.json({ message: "Profile updated successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error updating profile" });
    }
});
// ==========================================
// ANNOUNCEMENT MANAGEMENT ROUTES
// ==========================================

/// 3. GET: Fetch all announcements
// Final URL: http://localhost:8081/lead/announcements
router.get('/announcements', (req, res) => {
    const sql = "SELECT * FROM announcements ORDER BY publish_date DESC, id DESC";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("Error fetching announcements:", err);
            return res.status(500).send(err);
        }
        res.json(result);
    });
});

// 4. POST: Add new announcement
// Final URL: http://localhost:8081/lead/announcements
router.post('/announcements', (req, res) => {
    const { title, content, type, subject, event_date_time, link, priority, target_batch } = req.body;
  
    const sql = `
        INSERT INTO announcements 
        (title, content, type, subject, event_date_time, link, publish_date, priority, target_batch) 
        VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?)
    `;

    // Handle empty strings as NULL for optional fields
    const values = [
        title,
        content,
        type,
        subject || null, 
        event_date_time || null, 
        link || null, 
        priority, 
        target_batch
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Error adding announcement:", err);
            return res.status(500).send(err);
        }
        res.json({ id: result.insertId, ...req.body });
    });
});

// 5. DELETE: Remove announcement
// Final URL: http://localhost:8081/lead/announcements/:id
router.delete('/announcements/:id', (req, res) => {
    const sql = "DELETE FROM announcements WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Deleted successfully" });
    });
});

// ==========================================
// 📅 TIMETABLE ROUTES
// ==========================================

// 1. GET: Fetch all timetable entries (Sorted by Day)
router.get('/timetables', (req, res) => {
    // Custom sort to ensure Monday comes before Tuesday, etc.
    const sql = `
        SELECT * FROM timetables 
        ORDER BY 
        FIELD(day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), 
        period_order ASC
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// 2. POST: Add new entry
router.post('/timetables', (req, res) => {
    const { batch, day_of_week, period_order, time_slot, subject, teacher_name, type } = req.body;
    const sql = `
        INSERT INTO timetables 
        (batch, day_of_week, period_order, time_slot, subject, teacher_name, type) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [batch, day_of_week, period_order, time_slot, subject, teacher_name, type];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ id: result.insertId, ...req.body });
    });
});

// 3. PUT: Update existing entry
router.put('/timetables/:id', (req, res) => {
    const { batch, day_of_week, period_order, time_slot, subject, teacher_name, type } = req.body;
    const sql = `
        UPDATE timetables 
        SET batch=?, day_of_week=?, period_order=?, time_slot=?, subject=?, teacher_name=?, type=?
        WHERE id=?
    `;
    const values = [batch, day_of_week, period_order, time_slot, subject, teacher_name, type, req.params.id];

    db.query(sql, values, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Updated successfully" });
    });
});

// 4. DELETE: Remove entry
router.delete('/timetables/:id', (req, res) => {
    const sql = "DELETE FROM timetables WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Deleted successfully" });
    });
});

// ==========================================
// 👥 USER MANAGEMENT ROUTES (With Maatram ID & Parent Name)
// ==========================================

// 1. GET: Fetch Users WITH Batch, Maatram ID, and Parent Name
router.get('/manage-users', (req, res) => {
    const sql = `
        SELECT 
            u.id, u.full_name, u.username, u.role, u.status,
            COALESCE(s.batch, t.batch_handled) as batch,
            t.maatram_id,
            s.parent_name
        FROM users u
        LEFT JOIN student_details s ON u.id = s.user_id
        LEFT JOIN tutor_details t ON u.id = t.user_id
        WHERE u.role IN ('Student', 'Tutor')
        ORDER BY u.role, u.full_name
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// 2. POST: Add User
router.post('/manage-users', (req, res) => {
    const { 
        full_name, username, password, role, status, 
        batch, maatram_id, parent_name // New fields
    } = req.body;

    const user_type = role === 'Student' ? 'Student' : 'Staff';
    const finalPassword = password || '12345';

    // 1. Insert into core users table
    const sqlUser = `INSERT INTO users (full_name, username, password, user_type, role, status) VALUES (?, ?, ?, ?, ?, ?)`;

    db.query(sqlUser, [full_name, username, finalPassword, user_type, role, status], (err, result) => {
        if (err) return res.status(500).send(err);
        
        const newUserId = result.insertId;
        let sqlDetails = "";
        let params = [];

        // 2. Insert into respective detail table
        if (role === 'Student') {
            sqlDetails = `INSERT INTO student_details (user_id, batch, parent_name) VALUES (?, ?, ?)`;
            params = [newUserId, batch, parent_name];
        } else {
            sqlDetails = `INSERT INTO tutor_details (user_id, batch_handled, maatram_id) VALUES (?, ?, ?)`;
            params = [newUserId, batch, maatram_id];
        }

        db.query(sqlDetails, params, (err2) => {
            if (err2) {
                console.error("Error adding details:", err2);
                // Ideally, rollback or delete user here
            }
            res.json({ message: "User added successfully", id: newUserId });
        });
    });
});

// 3. PUT: Update User
router.put('/manage-users/:id', (req, res) => {
    const { 
        full_name, username, role, status, 
        batch, maatram_id, parent_name 
    } = req.body;
    
    const userId = req.params.id;
    const user_type = role === 'Student' ? 'Student' : 'Staff';

    // 1. Update core user info
    const sqlUser = `UPDATE users SET full_name=?, username=?, role=?, user_type=?, status=? WHERE id=?`;
    
    db.query(sqlUser, [full_name, username, role, user_type, status, userId], (err, result) => {
        if (err) return res.status(500).send(err);

        // 2. Update detail tables
        if (role === 'Student') {
            const sqlUpdate = `UPDATE student_details SET batch=?, parent_name=? WHERE user_id=?`;
            db.query(sqlUpdate, [batch, parent_name, userId], (err2, res2) => {
                if(res2.affectedRows === 0) {
                     // Insert if missing
                     db.query(`INSERT INTO student_details (user_id, batch, parent_name) VALUES (?, ?, ?)`, [userId, batch, parent_name]);
                }
            });
        } else {
            const sqlUpdate = `UPDATE tutor_details SET batch_handled=?, maatram_id=? WHERE user_id=?`;
            db.query(sqlUpdate, [batch, maatram_id, userId], (err2, res2) => {
                if(res2.affectedRows === 0) {
                     db.query(`INSERT INTO tutor_details (user_id, batch_handled, maatram_id) VALUES (?, ?, ?)`, [userId, batch, maatram_id]);
                }
            });
        }
        res.json({ message: "User updated successfully" });
    });
});

// 4. DELETE remains the same
router.delete('/manage-users/:id', (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM student_details WHERE user_id=?", [id], () => {
        db.query("DELETE FROM tutor_details WHERE user_id=?", [id], () => {
             db.query("DELETE FROM users WHERE id=?", [id], (err) => {
                if (err) return res.status(500).send(err);
                res.json({ message: "Deleted" });
             });
        });
    });
});

// ==========================================
// 📂 BULK IMPORT ROUTE (CSV Support)
// ==========================================

router.post('/manage-users/import', async (req, res) => {
    const users = req.body; // Expects an array of user objects
    
    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).send("Invalid data format.");
    }

    let successCount = 0;
    let errorCount = 0;

    // Helper function to insert a single user (Promisified)
    const insertUser = (userData) => {
        return new Promise((resolve, reject) => {
            const { full_name, username, password, role, batch, maatram_id, parent_name } = userData;
            
            // basic validation
            if (!full_name || !username || !role) {
                return resolve({ success: false, error: "Missing fields" });
            }

            const user_type = role === 'Student' ? 'Student' : 'Staff';
            const finalPassword = password || '12345';
            const status = 'Active'; // Default to Active on import

            // 1. Insert into users
            const sqlUser = `INSERT INTO users (full_name, username, password, user_type, role, status) VALUES (?, ?, ?, ?, ?, ?)`;
            
            db.query(sqlUser, [full_name, username, finalPassword, user_type, role, status], (err, result) => {
                if (err) return resolve({ success: false, error: err.code }); // Return duplicate entry errors gracefully

                const newUserId = result.insertId;
                let sqlDetails = "";
                let params = [];

                // 2. Insert Details
                if (role === 'Student') {
                    sqlDetails = `INSERT INTO student_details (user_id, batch, parent_name) VALUES (?, ?, ?)`;
                    params = [newUserId, batch, parent_name];
                } else {
                    sqlDetails = `INSERT INTO tutor_details (user_id, batch_handled, maatram_id) VALUES (?, ?, ?)`;
                    params = [newUserId, batch, maatram_id];
                }

                db.query(sqlDetails, params, (err2) => {
                    if (err2) console.error("Detail insert failed", err2); // Log but don't fail the whole user
                    resolve({ success: true });
                });
            });
        });
    };

    // Process all users sequentially to avoid connection pool exhaustion
    for (const user of users) {
        const result = await insertUser(user);
        if (result.success) successCount++;
        else errorCount++;
    }

    res.json({ 
        message: "Import processing complete", 
        success: successCount, 
        failed: errorCount 
    });
});

// ==========================================
// 1. GET PENDING REQUESTS
// Frontend URL: http://localhost:8081/lead/pending
// ==========================================
router.get('/pending', (req, res) => {
    const sql = `
        SELECT r.*, 
               u1.full_name AS requestor_name, 
               u2.full_name AS target_name
        FROM requests r
        JOIN users u1 ON r.requestor_id = u1.id
        LEFT JOIN users u2 ON r.target_id = u2.id
        WHERE r.status = 'PENDING_LEAD'
        ORDER BY r.created_at DESC
    `;
    
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching requests:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json(data);
    });
});

// Get Request History (Approved or Rejected)
router.get('/history', (req, res) => {
    const sql = `
        SELECT r.*, 
               u1.full_name AS requestor_name, 
               u2.full_name AS target_name
        FROM requests r
        JOIN users u1 ON r.requestor_id = u1.id
        LEFT JOIN users u2 ON r.target_id = u2.id
        WHERE r.status IN ('APPROVED', 'REJECTED')
        ORDER BY r.created_at DESC
    `;
    
    db.query(sql, (err, data) => {
        if (err) {
            console.error("Error fetching history:", err);
            return res.status(500).json({ error: "Database error" });
        }
        return res.json(data);
    });
});

// ==========================================
// 2. APPROVE / REJECT REQUEST
// Frontend URL: http://localhost:8081/lead/action/:id
// ==========================================
router.put('/action/:id', (req, res) => {
    const requestId = req.params.id;
    const { action } = req.body; // Expecting 'APPROVE' or 'REJECT'

    if (!requestId || !action) {
        return res.status(400).json({ error: "Missing ID or Action" });
    }

    // Convert frontend action to Database Status
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    const sql = "UPDATE requests SET status = ? WHERE id = ?";
    
    db.query(sql, [newStatus, requestId], (err, result) => {
        if (err) {
            console.error("Error updating status:", err);
            return res.status(500).json({ error: "Update failed" });
        }
        return res.json({ status: "Success", message: `Request ${newStatus}` });
    });
});



// --- API ENDPOINTS ---

// 1. Subject Averages (Bar Chart)
// Using table: student_academic_marks
router.get('/performance/subject-averages', (req, res) => {
    const sql = `
        SELECT 
            subject, 
            ROUND(AVG(marks_obtained), 1) as avg_marks
        FROM student_academic_marks
        GROUP BY subject
    `;
    db.query(sql, (err, data) => {
        if(err) return res.json(err);
        return res.json(data);
    });
});

// 2. Exam Comparison (Line Chart)
// Compares Quarterly vs Half Yearly vs Public
// 2. Exam Comparison (Line Chart) - OPTIMIZED
router.get('/performance/exam-compare', (req, res) => {
    const sql = `
        SELECT 
            exam_type as name, 
            ROUND(AVG(marks_obtained), 1) as classAvg
        FROM student_academic_marks
        WHERE exam_type IN ('Quarterly', 'Half Yearly', 'Public') -- Optional: Filters out unit tests
        GROUP BY exam_type
        ORDER BY FIELD(exam_type, 'Quarterly', 'Half Yearly', 'Public')
    `;
    
    db.query(sql, (err, data) => {
        if(err) return res.json(err);
        // Returns: [{ name: 'Quarterly', classAvg: 75.5 }, { name: 'Half Yearly', classAvg: 82.0 }]
        return res.json(data);
    });
});
// 3. Student Overview (Table & Stats)
// Joins student_details with marks to get batch and averages
router.get('/performance/student-overview', (req, res) => {
    const sql = `
        SELECT 
            s.user_id,
            s.studentname as full_name, -- Using Parent Name as proxy since Student Name is missing in schema provided
            s.batch,
            ROUND(AVG(m.marks_obtained), 1) as overall_avg
        FROM student_details s
        JOIN student_academic_marks m ON s.user_id = m.student_id
        GROUP BY s.user_id
        ORDER BY overall_avg DESC
    `;
    db.query(sql, (err, data) => {
        if(err) return res.json(err);
        return res.json(data);
    });
});

module.exports = router;