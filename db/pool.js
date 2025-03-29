const { Pool } = require("pg");
const dotenv = require("dotenv");
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection(retries = 5) {
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log("✅ Database connected successfully!");
      client.release();
      return;
    } catch (error) {
      console.error("❌ Database connection error:", error.message);
      retries -= 1;
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
  throw new Error("Unable to connect to the database after multiple attempts.");
}

module.exports = {
  pool,
  testConnection,
};