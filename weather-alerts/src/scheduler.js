// Scheduler - runs plant checks every 5 minutes
const cron = require("node-cron");
const { sendDailyReports } = require("./services/report.service");

// Run every 5 minutes
cron.schedule("*/5 * * * *", async () => {
  console.log(`Running scheduled plant check at ${new Date().toLocaleTimeString()}`);
  await sendDailyReports();
});

console.log("Scheduler started - checks run every 5 minutes");
