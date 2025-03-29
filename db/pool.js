const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

// Test the database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully!");
    client.release();
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error;
  }
}

module.exports = {
  pool, // Export the pool object
  testConnection, // Export the testConnection function
};