import { db } from "./server/db.js";

async function checkSessions() {
  try {
    console.log("Checking sessions in database...");

    // Check if sessions table exists and has data
    const sessions = await db.execute("SELECT COUNT(*) as count FROM sessions");
    console.log(`Sessions table has ${sessions.rows[0].count} records`);

    if (sessions.rows[0].count > 0) {
      const recentSessions = await db.execute("SELECT sid, sess, expire FROM sessions ORDER BY expire DESC LIMIT 5");
      console.log("Recent sessions:");
      recentSessions.rows.forEach((row, index) => {
        console.log(`${index + 1}. SID: ${row.sid.substring(0, 20)}...`);
        console.log(`   Expire: ${row.expire}`);
        try {
          let sessData;
          if (typeof row.sess === 'string') {
            sessData = JSON.parse(row.sess);
          } else {
            sessData = row.sess;
          }
          if (sessData.passport && sessData.passport.user) {
            console.log(`   User ID: ${sessData.passport.user}`);
          } else {
            console.log(`   No passport user data`);
          }
          console.log(`   Full session data:`, JSON.stringify(sessData, null, 2));
        } catch (e) {
          console.log(`   Session data parse error: ${e.message}`);
          console.log(`   Raw session data:`, row.sess);
        }
        console.log("");
      });
    }

  } catch (error) {
    console.error("Error checking sessions:", error);
  } finally {
    process.exit(0);
  }
}

checkSessions();
