const express = require('express');
const router = express.Router();
const db = require('../db'); // Ensure this points to your database connection
const fs = require('fs');
const path = require('path'); // <--- ADDED THIS (Required for Multer)
const multer = require('multer');


// ---------------------------------------------------------
// 0. STATIC FOLDER CONFIGURATION
// ---------------------------------------------------------
// NOTE: Ideally, put this line in your MAIN 'server.js' file, not here.
// If you put it here, the link might become /tutor/uploads/...
// app.use('/uploads', express.static('public/uploads')); 


// ---------------------------------------------------------
// 1. MULTER CONFIG (Disk Storage for PDFs)
// ---------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'public/uploads';
        // Create folder if it doesn't exist
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Generates: file_171562222_homework.pdf
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// 1. GET Assignments (Filtered by Tutor's Subject via ID)
// ==========================================
// 1. GET ALL ASSIGNMENTS
// ==========================================
router.get('/assignments', (req, res) => {
    const batch = req.query.batch || 'KK_01';
    const tutorId = req.query.tutor_id; 

    // If you want to filter by the logged-in tutor's subject:
    if (!tutorId) return res.status(400).json({ message: "Tutor ID missing" });

    const sql = `
        SELECT a.* FROM assignments a
        JOIN tutor_details t ON a.subject = t.subjects_handled
        WHERE a.batch = ? AND t.user_id = ?
        ORDER BY a.id DESC`;
    
    db.query(sql, [batch, tutorId], (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }
        res.json(data);
    });
});

// ==========================================
// 2. CREATE ASSIGNMENT
// ==========================================
router.post('/assignments/create', (req, res) => {
    const { title, description, due_date, batch, tutor_id } = req.body;
    const targetBatch = batch || 'KK_01';

    if (!tutor_id) return res.status(400).json({ message: "Tutor ID is required" });

    // Step 1: Get Tutor's Subject
    const sqlGetSubject = "SELECT subjects_handled FROM tutor_details WHERE user_id = ?";

    db.query(sqlGetSubject, [tutor_id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(400).json({ message: "Tutor not found" });

        const subject = result[0].subjects_handled;

        // Step 2: Insert Assignment
        const sqlInsert = "INSERT INTO assignments (title, subject, description, due_date, batch) VALUES (?, ?, ?, ?, ?)";
        
        db.query(sqlInsert, [title, subject, description, due_date, targetBatch], (insertErr, insertResult) => {
            if (insertErr) return res.status(500).json(insertErr);
            
            const assignmentId = insertResult.insertId;

            // Step 3: Distribute to Students
            const sqlStudents = `
                SELECT u.id FROM users u 
                JOIN student_details sd ON u.id = sd.user_id 
                WHERE sd.batch = ?`;

            db.query(sqlStudents, [targetBatch], (stuErr, students) => {
                if (stuErr) return res.status(500).json(stuErr);
                
                if (students.length === 0) {
                    return res.json({ message: "Assignment created (No students found)." });
                }

                const submissionValues = students.map(s => [s.id, assignmentId, 'Pending']);
                const sqlDistribute = "INSERT INTO student_submissions (student_id, assignment_id, status) VALUES ?";

                db.query(sqlDistribute, [submissionValues], (distErr) => {
                    if (distErr) return res.status(500).json(distErr);
                    res.json({ Status: "Success", Subject: subject });
                });
            });
        });
    });
});

// ==========================================
// 3. GET SUBMISSIONS FOR ASSIGNMENT
// ==========================================
router.get('/assignments/:assignmentId/submissions', (req, res) => {
    const assignId = req.params.assignmentId;
    
    const sql = `
        SELECT 
            s.id, 
            u.full_name, 
            s.status, 
            s.marks_obtained, 
            s.remarks,
            s.submission_date,
            s.file_path  
        FROM student_submissions s
        JOIN users u ON s.student_id = u.id
        WHERE s.assignment_id = ?
        ORDER BY u.full_name ASC
    `;

    db.query(sql, [assignId], (err, data) => {
        if (err) return res.status(500).json(err);
        res.json(data);
    });
});

// ==========================================
// 4. GRADE SUBMISSION
// ==========================================
router.post('/assignments/grade', (req, res) => {
    const { submission_id, marks, remarks } = req.body;
    const sql = "UPDATE student_submissions SET marks_obtained = ?, remarks = ?, status = 'Graded' WHERE id = ?";
    
    db.query(sql, [marks, remarks, submission_id], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ Status: "Success" });
    });
});

// ---------------------------------------------------------
// 3. TUTOR PROFILE ROUTES
// ---------------------------------------------------------

router.get('/profile/:id', (req, res) => {
    const sql = `
        SELECT u.full_name, u.username, td.* FROM users u 
        LEFT JOIN tutor_details td ON u.id = td.user_id 
        WHERE u.id = ?`;
        
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(result[0]);
    });
});
router.put('/profile/:id', (req, res) => {
    const id = req.params.id;

    // 1. Destructure all fields, including join_date
    const { 
        full_name, 
        contact_no, 
        college_name, 
        passed_out_year, 
        qualification, 
        experience_years, 
        subjects_handled, 
        bio,
        join_date // <--- EXTRACT THIS
    } = req.body;

    const sqlUser = "UPDATE users SET full_name = ? WHERE id = ?";
    
    // 2. Add join_date to the SQL query
    const sqlDetails = `
    UPDATE tutor_details 
    SET contact_no=?, college_name=?, passed_out_year=?, qualification=?, 
        subjects_handled=?, bio=?, join_date=?
    WHERE user_id=?`;

    db.beginTransaction((err) => {
        if (err) return res.status(500).json(err);

        db.query(sqlUser, [full_name, id], (err) => {
            if (err) return db.rollback(() => res.status(500).json(err));

            // 3. SAFE PARAMS: Use '|| null' to prevent "undefined" crashes
            const detailsParams = [
    contact_no || null, 
    college_name || null, 
    passed_out_year || null, 
    qualification || null, 
    // experience_years is removed
    subjects_handled || null, 
    bio || null, 
    join_date || null,
    id
];

            db.query(sqlDetails, detailsParams, (err) => {
                if (err) {
                    console.error("SQL Error:", err); // Log the actual error
                    return db.rollback(() => res.status(500).json(err));
                }
                
                db.commit((err) => {
                    if (err) return db.rollback(() => res.status(500).json(err));
                    res.json({ message: "Profile updated successfully" });
                });
            });
        });
    });
});
// ==========================================
// FIX FOR "LOADING..." SUBJECT
// ==========================================
// This handles: GET /tutor/profile?tutor_id=123
router.get('/profile', (req, res) => {
    const tutorId = req.query.tutor_id;

    if (!tutorId) {
        return res.status(400).json({ Error: "Tutor ID missing" });
    }

    // We use 'subjects_handled' from tutor_details table
    const sql = "SELECT subjects_handled FROM tutor_details WHERE user_id = ?";

    db.query(sql, [tutorId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Error: "Database Error" });
        }
        
        if (result.length > 0) {
            // Frontend expects 'subject', so we map 'subjects_handled' to it
            res.json({ Status: "Success", subject: result[0].subjects_handled });
        } else {
            res.json({ Error: "Tutor not found" });
        }
    });
});
// =========================================================
//  SECTION B: MATERIALS UPLOAD
// =========================================================

// Upload Material (Dynamic - Requires tutor_id in Form Data)
// Update this section in your existing code to match table names
router.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ Error: "No file uploaded" });

    const { title, description, batch, tutor_id } = req.body;
    
    // CORRECTED SQL: Use 'tutor_details' and 'subjects_handled'
    const getSubjectSql = "SELECT subjects_handled FROM tutor_details WHERE user_id = ?";
    
    db.query(getSubjectSql, [tutor_id], (err, tutorResult) => {
        if (err || tutorResult.length === 0) {
            return res.status(500).json({ Error: "Could not find tutor info" });
        }

        const enforcedSubject = tutorResult[0].subjects_handled; // <--- Corrected Column
        const fileName = req.file.filename; 
        const mimeType = req.file.mimetype;

        const insertSql = `
            INSERT INTO study_materials 
            (title, subject, description, file_name, mime_type, batch) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [title, enforcedSubject, description, fileName, mimeType, batch], (err, result) => {
            if (err) return res.status(500).json({ Error: "Database error" });
            res.json({ Status: "Success" });
        });
    });
});

// List Materials (Public)
// GET: List Materials (Filtered by Tutor's Subject)
router.get('/materials', (req, res) => {
    const tutorId = req.query.tutor_id;

    // Security: If no ID sent, return nothing
    if (!tutorId) {
        return res.json([]); 
    }

    // 1. Find out which subject this tutor handles
    const sqlSubject = "SELECT subjects_handled FROM tutor_details WHERE user_id = ?";
    
    db.query(sqlSubject, [tutorId], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Error: "Database error" });
        }
        
        if (result.length === 0) {
            return res.json([]); // Tutor not found
        }

        const subject = result[0].subjects_handled;

        // 2. Fetch only materials for that subject
        const sqlMaterials = "SELECT * FROM study_materials WHERE subject = ? ORDER BY id DESC";
        
        db.query(sqlMaterials, [subject], (err, materials) => {
            if (err) return res.status(500).json({ Error: err.message });
            res.json(materials);
        });
    });
});



// ---------------------------------------------------------
// 6. SYLLABUS & DASHBOARD ROUTES (UPDATED)
// ---------------------------------------------------------

// GET: Fetch Syllabus (Filtered strictly by Tutor's Subjects)
router.get('/syllabus', async (req, res) => {
    const batch = req.query.batch || 'KK_01';
    const tutorId = req.query.tutor_id;

    const query = (sql, params) => new Promise((resolve, reject) => {
        db.query(sql, params, (err, res) => err ? reject(err) : resolve(res));
    });

    try {
        // SECURITY FIX: If no tutorId is sent, return empty immediately
        if (!tutorId) {
            return res.json([]); 
        }

        let subjectFilter = "";
        let sqlParams = [batch];

        // 1. Get Tutor's Subjects
        const tutorData = await query("SELECT subjects_handled FROM tutor_details WHERE user_id = ?", [tutorId]);
        
        let subjects = [];
        if (tutorData.length > 0 && tutorData[0].subjects_handled) {
            subjects = tutorData[0].subjects_handled.split(',').map(s => s.trim());
        }

        // SECURITY FIX: If tutor has NO subjects assigned, return empty list
        // (Previously, this would skip the filter and return ALL subjects)
        if (subjects.length === 0) {
            return res.json([]); 
        }

        // 2. Build the Subject Filter
        const placeholders = subjects.map(() => '?').join(',');
        subjectFilter = `AND m.subject IN (${placeholders})`;
        sqlParams.push(...subjects);

        // 3. Main Query
        const sql = `
            SELECT 
                m.id as master_id,
                m.unit_no,
                m.subject,
                m.topic_name,
                m.category,
                m.chapter_name,
                COALESCE(s.status, 'Pending') as status,
                COALESCE(s.remarks, '') as remarks,
                DATE_FORMAT(s.completion_date, '%Y-%m-%d') as completion_date
            FROM syllabus_master m
            LEFT JOIN syllabus s 
                ON m.topic_name = s.topic 
                AND m.subject = s.subject 
                AND s.batch = ?
            WHERE 1=1 
            ${subjectFilter} 
            ORDER BY m.subject, m.unit_no, m.id
        `;

        const results = await query(sql, sqlParams);
        res.json(results);

    } catch (err) {
        console.error("Error fetching syllabus:", err);
        res.status(500).json({ error: "Database error" });
    }
});

// POST: Update Syllabus Progress (The "Save" Button)
// Uses Promises to handle the multi-step "Check Master -> Check Progress -> Update/Insert" logic
// POST: Update Syllabus & Notify Students
router.post('/syllabus/update', (req, res) => {
    const { master_id, batch_name, status, remarks, tutor_id } = req.body;

    // Validate Input
    if (!master_id || !batch_name || !status || !tutor_id) {
        return res.status(400).json({ Status: "Failed", Message: "Missing fields" });
    }

    const completion_date = status === 'Completed' ? new Date() : null;

    // Helper for async/await
    const query = (sql, params) => {
        return new Promise((resolve, reject) => {
            db.query(sql, params, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };

    const handleUpdate = async () => {
        try {
            // STEP A: Get Subject & Topic Name
            const masterData = await query("SELECT subject, topic_name FROM syllabus_master WHERE id = ?", [master_id]);
            
            if (masterData.length === 0) return res.status(404).json({ Status: "Failed", Message: "Invalid Master ID" });
            
            const { subject, topic_name } = masterData[0];

            // STEP B: Check existing record
            const existingData = await query(
                "SELECT id FROM syllabus WHERE batch = ? AND subject = ? AND topic = ?", 
                [batch_name, subject, topic_name]
            );

            // STEP C: Update or Insert Syllabus Progress
            if (existingData.length > 0) {
                await query(
                    "UPDATE syllabus SET status = ?, remarks = ?, completion_date = ? WHERE id = ?",
                    [status, remarks || '', completion_date, existingData[0].id]
                );
            } else {
                await query(
                    "INSERT INTO syllabus (subject, topic, batch, status, remarks, completion_date) VALUES (?, ?, ?, ?, ?, ?)",
                    [subject, topic_name, batch_name, status, remarks || '', completion_date]
                );
            }

            // =========================================================
            // STEP D: SEND NOTIFICATIONS TO STUDENTS
            // =========================================================
            
            // 1. Find all students in this batch
            // (Assuming you have a 'student_details' table with 'user_id' and 'batch')
            const students = await query("SELECT user_id FROM student_details WHERE batch = ?", [batch_name]);

            if (students.length > 0) {
                // 2. Create the message
                const notifMessage = `Syllabus Update: '${topic_name}' (${subject}) is now ${status}.`;

                // 3. Prepare Bulk Insert Data
                const notificationValues = students.map(s => [s.user_id, notifMessage, false]);

                // 4. Insert into Notifications Table
                const insertNotifSql = "INSERT INTO notifications (user_id, message, is_read) VALUES ?";
                await query(insertNotifSql, [notificationValues]);
            }

            res.json({ Status: "Success", Message: "Syllabus updated and students notified" });

        } catch (err) {
            console.error("Update Error:", err);
            res.status(500).json({ Status: "Failed", Message: "Database Error" });
        }
    };

    handleUpdate();
});
// DASHBOARD STATS (Kept as is, just ensuring it's at the end)
// Ensure you import your middleware at the top if not already there
// const verifyUser = require('../middleware/verifyUser'); 

// Remove verifyUser from the arguments
// ... existing database connection and other routes ...

// ---------------------------------------------------------
// 1. EXISTING ROUTE: Dashboard Stats (Counts & Syllabus)
// ---------------------------------------------------------
router.get('/dashboard-stats', async (req, res) => {
    const batch = 'KK_01';
    const userId = req.query.tutor_id;

    try {
        const query = (sql, params) => new Promise((resolve, reject) => {
            db.query(sql, params, (err, res) => err ? reject(err) : resolve(res));
        });

        // Get Tutor Subjects
        const tutorData = await query("SELECT subjects_handled FROM tutor_details WHERE user_id = ?", [userId]);
        
        let mySubjects = [];
        if (tutorData.length > 0 && tutorData[0].subjects_handled) {
            mySubjects = tutorData[0].subjects_handled.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }

        // Get Counts
        const studentCount = (await query("SELECT COUNT(*) AS count FROM student_details WHERE batch = ?", [batch]))[0].count;
        const pendingGrading = (await query("SELECT COUNT(*) AS count FROM student_submissions WHERE status = 'Submitted'", []))[0].count;

        // Get Syllabus Progress
        let syllabus = [];
        if (mySubjects.length > 0) {
            const placeholders = mySubjects.map(() => '?').join(',');
            const sqlSyllabus = `
                SELECT subject, COUNT(*) as total, SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
                FROM syllabus WHERE subject IN (${placeholders}) GROUP BY subject`;
            
            const syllabusRaw = await query(sqlSyllabus, mySubjects);
            syllabus = syllabusRaw.map(row => ({
                subject: row.subject,
                percent: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0
            }));
        }

        res.json({ studentCount, pendingGrading, syllabus });

    } catch (err) {
        console.error("Dashboard Stats Error:", err);
        res.status(500).json({ Error: "Server Error" });
    }
});

// ---------------------------------------------------------
// 2. NEW ROUTE: Fetch Timetable
// ---------------------------------------------------------
// --- ADD THIS NEW ROUTE FOR TIMETABLE ---

// Timetable Route
// NEW: Fetch ALL timetable entries (No ID required)
// Correct Route for fetching ALL data (No ID)
// Fetch ALL Timetable Data (No ID required)
// CORRECT ROUTE (No /:id at the end)
router.get('/timetable', (req, res) => {
    const sql = "SELECT * FROM timetables ORDER BY period_order ASC"; 
    db.query(sql, (err, data) => {
        if(err) return res.json(err);
        return res.json(data);
    });
});


// --- 1. Fetch all Students for the dropdown ---
router.get('/students', (req, res) => {
    // Select only users with role 'Student'
    const sql = "SELECT id, full_name, username FROM users WHERE role = 'Student'";
    db.query(sql, (err, data) => {
        if(err) return res.json(err);
        return res.json(data);
    });
});

// --- 2. Check Existing Attendance for Student + Date ---
router.post('/attendance/check', (req, res) => {
    const { student_id, date } = req.body;
    // We limit to 1 to handle the duplicate issue seen in your data
    const sql = "SELECT * FROM attendance WHERE student_id = ? AND date = ? LIMIT 1";
    
    db.query(sql, [student_id, date], (err, data) => {
        if(err) return res.json(err);
        return res.json(data[0] || null); // Return the record or null
    });
});

// --- 3. Update or Insert Attendance ---
router.post('/attendance/update', (req, res) => {
    const { student_id, date, status, remarks } = req.body;

    // First check if a record exists
    const checkSql = "SELECT id FROM attendance WHERE student_id = ? AND date = ?";
    
    db.query(checkSql, [student_id, date], (err, data) => {
        if (err) return res.json(err);

        if (data.length > 0) {
            // UPDATE existing record
            const updateSql = "UPDATE attendance SET status = ?, remarks = ? WHERE student_id = ? AND date = ?";
            db.query(updateSql, [status, remarks, student_id, date], (err, result) => {
                if(err) return res.json(err);
                return res.json({ message: "Updated", status: "success" });
            });
        } else {
            // INSERT new record
            const insertSql = "INSERT INTO attendance (student_id, date, status, remarks) VALUES (?, ?, ?, ?)";
            db.query(insertSql, [student_id, date, status, remarks], (err, result) => {
                if(err) return res.json(err);
                return res.json({ message: "Marked", status: "success" });
            });
        }
    });
});
// --- 4. Bulk Attendance Import (Google Meet/Zoom) ---
// --- 4. Bulk Attendance Import (Updated) ---
// --- 4. Bulk Attendance Import (Auto-Absent Logic) ---
router.post('/attendance/bulk-import', (req, res) => {
    const { date, names_list, remarks } = req.body; 
    
    // Default remarks
    const userRemark = remarks || "Class Import"; 

    // 1. Get ALL students from Database
    const studentSql = "SELECT id, full_name FROM users WHERE role = 'Student'";
    
    db.query(studentSql, (err, allStudents) => {
        if (err) return res.json(err);

        // 2. Process every student in the database
        const queries = allStudents.map(student => {
            
            // Check if this student exists in the uploaded CSV list
            const isPresent = names_list.some(csvName => 
                // Exact Match
                csvName.toLowerCase().trim() === student.full_name.toLowerCase().trim() || 
                // Partial Match (e.g. CSV has "John", DB has "John Smith")
                student.full_name.toLowerCase().includes(csvName.toLowerCase().trim())
            );

            // Determine Status and Remark
            const status = isPresent ? 'Present' : 'Absent';
            // If absent, we append a small note, otherwise use the user's remark
            const finalRemark = isPresent ? userRemark : `${userRemark} (Not in CSV)`;

            return new Promise((resolve, reject) => {
                // Check if a record already exists for this day
                const checkSql = "SELECT id FROM attendance WHERE student_id = ? AND date = ?";
                
                db.query(checkSql, [student.id, date], (err, data) => {
                    if (err) return reject(err);

                    if (data.length > 0) {
                        // UPDATE existing record
                        const updateSql = "UPDATE attendance SET status = ?, remarks = ? WHERE student_id = ? AND date = ?";
                        db.query(updateSql, [status, finalRemark, student.id, date], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    } else {
                        // INSERT new record
                        const insertSql = "INSERT INTO attendance (student_id, date, status, remarks) VALUES (?, ?, ?, ?)";
                        db.query(insertSql, [student.id, date, status, finalRemark], (err) => {
                            if (err) reject(err);
                            else resolve();
                        });
                    }
                });
            });
        });

        // 3. Execute all updates
        Promise.all(queries)
            .then(() => {
                // Count how many were present vs absent for the response message
                const presentCount = queries.filter((_, i) => 
                    names_list.some(n => allStudents[i].full_name.toLowerCase().includes(n.toLowerCase().trim()))
                ).length;

                res.json({ 
                    status: 'success', 
                    message: `Processed Class. Present: ${presentCount}, Absent: ${allStudents.length - presentCount}` 
                });
            })
            .catch(err => res.status(500).json(err));
    });
});

// --- 5. Generate Attendance Report ---
router.get('/attendance/report', (req, res) => {
    const { start_date, end_date } = req.query;

    // We use LEFT JOIN so even students with 0 attendance records appear in the list
    // We filter by date INSIDE the join condition to preserve the list of all students
    const sql = `
        SELECT 
            u.id, 
            u.full_name, 
            u.username,
            COUNT(a.id) as total_classes,
            SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present,
            SUM(CASE WHEN a.status = 'Absent' THEN 1 ELSE 0 END) as absent,
            SUM(CASE WHEN a.status = 'Late' THEN 1 ELSE 0 END) as late,
            SUM(CASE WHEN a.status = 'On Leave' THEN 1 ELSE 0 END) as on_leave
        FROM users u
        LEFT JOIN attendance a ON u.id = a.student_id 
            AND a.date >= ? AND a.date <= ?
        WHERE u.role = 'Student'
        GROUP BY u.id, u.full_name, u.username
        ORDER BY u.full_name ASC
    `;

    db.query(sql, [start_date, end_date], (err, data) => {
        if(err) return res.json(err);
        return res.json(data);
    });
});

// --- 6. Manual Bulk Update (Multi-Select) ---
router.post('/attendance/manual-bulk', (req, res) => {
    // Expects 'student_ids' to be an array: [1, 2, 4, ...]
    const { student_ids, date, status, remarks } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
        return res.json({ status: 'error', message: 'No students selected.' });
    }

    // Create a promise for every student ID
    const queries = student_ids.map(id => {
        return new Promise((resolve, reject) => {
            const checkSql = "SELECT id FROM attendance WHERE student_id = ? AND date = ?";
            
            db.query(checkSql, [id, date], (err, data) => {
                if (err) return reject(err);

                if (data.length > 0) {
                    // Update existing record
                    const updateSql = "UPDATE attendance SET status = ?, remarks = ? WHERE student_id = ? AND date = ?";
                    db.query(updateSql, [status, remarks, id, date], (err) => {
                        if(err) reject(err); else resolve();
                    });
                } else {
                    // Insert new record
                    const insertSql = "INSERT INTO attendance (student_id, date, status, remarks) VALUES (?, ?, ?, ?)";
                    db.query(insertSql, [id, date, status, remarks], (err) => {
                        if(err) reject(err); else resolve();
                    });
                }
            });
        });
    });

    // Run all queries
    Promise.all(queries)
        .then(() => res.json({ status: 'success', message: `Successfully updated ${student_ids.length} students.` }))
        .catch(err => res.status(500).json(err));
});

// ==========================================
// 1. GET: List of Tutors (for the Dropdown)
// ==========================================
router.get('/tutors-list', (req, res) => {
    // Selects all users who are Tutors so they appear in the "Swap With" dropdown
    const sql = "SELECT id, full_name FROM users WHERE role = 'Tutor'";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// ==========================================
// 2. POST: Create a New Request
// ==========================================
router.post('/create', (req, res) => {
    const { requestor_id, request_type, target_id, batch, subject, class_date, class_time, reason } = req.body;

    // LOGIC: 
    // If it is a SWAP, the status starts as 'PENDING_TUTOR' (Target tutor must accept first).
    // If it is CANCEL or RELIEF, it goes straight to 'PENDING_LEAD' (Only Admin needs to approve).
    const initialStatus = (request_type === 'SWAP') ? 'PENDING_TUTOR' : 'PENDING_LEAD';

    const sql = `
        INSERT INTO requests 
        (requestor_id, request_type, target_id, batch, subject, class_date, class_time, reason, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [requestor_id, request_type, target_id, batch, subject, class_date, class_time, reason, initialStatus];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Request created successfully", id: result.insertId });
    });
});

// ==========================================
// 3. GET: Fetch Requests for a Specific Tutor
// ==========================================
router.get('/requests/:id', (req, res) => {
    const userId = req.params.id;

    // We fetch requests where the user is either the REQUESTOR or the TARGET
    // We join with the 'users' table twice to get the names of both parties
    const sql = `
        SELECT 
            r.*, 
            u1.full_name as requestor_name, 
            u2.full_name as target_name,
            DATE_FORMAT(r.class_date, '%Y-%m-%d') as class_date -- Formatting date for React
        FROM requests r
        LEFT JOIN users u1 ON r.requestor_id = u1.id
        LEFT JOIN users u2 ON r.target_id = u2.id
        WHERE r.requestor_id = ? OR r.target_id = ?
        ORDER BY r.id DESC
    `;

    db.query(sql, [userId, userId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// ==========================================
// 4. PUT: Tutor Responds to a Swap Request
// ==========================================
router.put('/respond/:id', (req, res) => {
    const { action } = req.body; // Action will be 'ACCEPT' or 'REJECT'
    const requestId = req.params.id;

    let newStatus = '';
    
    if (action === 'REJECT') {
        newStatus = 'REJECTED';
    } else if (action === 'ACCEPT') {
        // If Tutor B accepts the swap, it doesn't become "APPROVED" yet.
        // It goes to "PENDING_LEAD" so the Admin can view and finalize the timetable change.
        newStatus = 'PENDING_LEAD';
    }

    const sql = "UPDATE requests SET status = ? WHERE id = ?";
    
    db.query(sql, [newStatus, requestId], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: `Request ${newStatus}` });
    });
});
// GET: Auto-fetch Subject & Tutor based on Date & Batch
router.get('/class-info', (req, res) => {
    const { date, batch } = req.query;

    if (!date || !batch) {
        return res.status(400).json({ error: "Date and Batch are required" });
    }

    // 1. Convert YYYY-MM-DD string to a Day Name (e.g., "Tuesday")
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const d = new Date(date);
    const dayName = days[d.getDay()];

    console.log(`Checking Timetable for: ${dayName}, Batch: ${batch}`);

    // 2. Query the timetables table
    const sql = "SELECT subject, teacher_name FROM timetables WHERE batch = ? AND day_of_week = ?";
    
    db.query(sql, [batch, dayName], (err, result) => {
        if (err) return res.status(500).json(err);
        
        if (result.length > 0) {
            // Found a class! Return the subject and teacher
            res.json({ 
                found: true, 
                subject: result[0].subject, 
                teacher: result[0].teacher_name 
            });
        } else {
            // No class scheduled for this batch on this day
            res.json({ found: false, message: "No class found for this day." });
        }
    });
});
// Add this to your server.js if not already present
router.get('/announcements', (req, res) => {
    // Fetches recent announcements, prioritizing High priority
    const sql = `
        SELECT id, title, content, type, subject, event_date_time, priority 
        FROM announcements 
        ORDER BY priority = 'High' DESC, event_date_time ASC, publish_date DESC 
        LIMIT 5
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching announcements:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});
router.get('/performance', (req, res) => {
    const tutorId = req.query.tutor_id;

    const sql = `
        SELECT 
            sam.subject,
            sam.exam_type,
            ROUND(AVG(sam.marks_obtained), 1) as avg_marks
        FROM 
            student_academic_marks sam
        JOIN 
            tutor_details td ON sam.subject = td.subjects_handled
        WHERE 
            td.user_id = ?
        GROUP BY 
            sam.subject, sam.exam_type
        ORDER BY 
            sam.subject, 
            FIELD(sam.exam_type, 'Quarterly', 'Half Yearly', 'Public')
    `;

    db.query(sql, [tutorId], (err, results) => {
        if (err) {
            console.error("Error fetching performance:", err);
            return res.status(500).json({ error: "Database error" });
        }
        // Send the JSON directly to the frontend
        res.json(results);
    });
});

// GET Detailed Student Marks (Individual)
router.get('/student-marks', (req, res) => {
    const tutorId = req.query.tutor_id;

    const sql = `
        SELECT 
            sam.student_id,
            sam.subject,
            sam.exam_type,
            sam.marks_obtained
        FROM 
            student_academic_marks sam
        JOIN 
            tutor_details td ON sam.subject = td.subjects_handled
        WHERE 
            td.user_id = ?
        ORDER BY 
            sam.student_id ASC, 
            FIELD(sam.exam_type, 'Quarterly', 'Half Yearly', 'Public')
    `;

    db.query(sql, [tutorId], (err, results) => {
        if (err) {
            console.error("Error fetching detailed marks:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

module.exports = router;