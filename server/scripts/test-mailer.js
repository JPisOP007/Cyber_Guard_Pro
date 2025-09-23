require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const sendWelcomeEmail = require('../services/mailer');

(async () => {
  const to = process.argv[2] || process.env.TEST_MAIL_TO || process.env.EMAIL_USER;
  if (!to) {
    console.error('Usage: node scripts/test-mailer.js <toEmail>  (or set TEST_MAIL_TO in .env)');
    process.exit(1);
  }

  console.log(`Sending test welcome email to: ${to}`);
  await sendWelcomeEmail(to, 'Tester');
  console.log('Done. Check logs above for success or error.');
})();
