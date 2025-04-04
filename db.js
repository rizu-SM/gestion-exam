import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'supra_2006',
    database: process.env.DB_NAME || 'votre_bdd',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default pool;