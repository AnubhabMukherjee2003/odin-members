const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

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
  console.error("❌ Unexpected error on idle client:", err.message);
  if (err.stack) console.error(err.stack);
});
pool.on("connect", () => {
  console.log("🔄 New database connection established");
});
async function testConnection(retries = 5, delay = 5000) {
  let lastError = null;
  
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
      lastError = error;
      console.error("❌ Database connection error:", error.message);
      
      // Log more details for specific errors
      if (error.code === 'ENOTFOUND') {
        console.error("DNS resolution failed. Check hostname in DATABASE_URL");
      } else if (error.code === 'ECONNREFUSED') {
        console.error("Connection refused. Check if database server is running and accessible");
      } else if (error.message.includes('self-signed certificate')) {
        console.error("SSL certificate validation failed. Check SSL settings");
      }
      
      retries -= 1;
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`);
        await new Promise((res) => setTimeout(res, delay));
      }
    }
  }
  
  throw new Error(`Unable to connect to the database after multiple attempts: ${lastError.message}`);
}

// Helper function to execute database queries with error handling
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(
      `Executed query: ${text.split(" ")[0]} ${
        text.split(" ")[1] || ''
      } (${duration}ms)`
    );
    return res;
  } catch (err) {
    console.error("❌ Error executing query:", text);
    console.error("Parameters:", params);
    console.error("Error:", err.message);
    
    // Enhance error with query info for better debugging
    err.query = text;
    err.params = params;
    throw err;
  }
}

module.exports = {
  pool,
  testConnection,
  query,
};
