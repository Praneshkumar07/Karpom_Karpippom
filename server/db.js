const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Pranesh@2006', // Your Password
    database: 'karpom_karipom'
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database Connection Failed:', err);
        return;
    }
    console.log('✅ Connected to MySQL Database: karpom_karipom');
});

module.exports = db;