import dotenv from "dotenv";
dotenv.config({ path: "./.env" });
import pg from "pg";

const { Pool } = pg;

async function fixSessionsTable() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("Dropping existing sessions table...");
    await pool.query(`DROP TABLE IF EXISTS sessions CASCADE`);

    console.log("Creating sessions table with correct schema...");
    await pool.query(`
      CREATE TABLE sessions (
        sid varchar PRIMARY KEY,
        sess jsonb NOT NULL,
        expire timestamp NOT NULL
      )
    `);

    console.log("Creating index on expire column...");
    await pool.query(`
      CREATE INDEX IDX_session_expire ON sessions(expire)
    `);

    console.log("Sessions table recreated successfully!");

  } catch (error) {
    console.error("Error fixing sessions table:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fixSessionsTable();
