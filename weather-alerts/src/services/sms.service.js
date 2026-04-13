// SMS service - not implemented for this project
async function sendSMS({ to, body }) {
    console.log(`SMS skipped (not configured). Would have sent to ${to}: ${body}`);
  }
  
  module.exports = { sendSMS };