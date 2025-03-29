const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const poolConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: "pg-26bd21b5-antucruse621-8a6b.k.aivencloud.com",
  port: "15000",
  database: "defaultdb",
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(path.join(__dirname, "ca.pem")).toString(),
  },
  // Connection pool settings
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 10000, // How long to wait for a connection to become available
};

// Create the pool with explicit configuration
const pool = new Pool(poolConfig);

// Log connection errors at the pool level
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
});

// Function to test the database connection with retry logic
async function testConnection(retries = 5) {
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log("✅ Database connected successfully!");

      // Run a simple query to verify the connection is fully working
      const result = await client.query("SELECT VERSION()");
      console.log(
        `Database version: ${result.rows[0].version.split(" ")[0]} ${
          result.rows[0].version.split(" ")[1]
        }`
      );

      client.release();
      return true;
    } catch (error) {
      console.error("❌ Database connection error:", error.message);
      retries -= 1;
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise((res) => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
  throw new Error("Unable to connect to the database after multiple attempts.");
}

// Helper function to execute database queries
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(
      `Executed query: ${text.split(" ")[0]} ${
        text.split(" ")[1]
      } (${duration}ms)`
    );
    return res;
  } catch (err) {
    console.error("Error executing query", text, err.stack);
    throw err;
  }
}

module.exports = {
  pool,
  testConnection,
  query,
};
