// Scheduler - runs plant checks at 6am and 6pm daily
const cron = require("node-cron");
const { sendDailyReports } = require("./services/report.service");

// Run at 6:00 AM and 6:00 PM every day
cron.schedule("0 6,18 * * *", async () => {
  console.log(`Running scheduled plant check at ${new Date().toLocaleTimeString()}`);
  await sendDailyReports();
});

console.log("Scheduler started — checks run at 6am and 6pm daily");