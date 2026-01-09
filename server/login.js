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
