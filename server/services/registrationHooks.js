// Lightweight registration hooks so we can plug email confirmation later
const sendWelcomeEmail = require('./mailer');

module.exports = {
  async onUserRegistered(user) {
    try {
      // Placeholder: enqueue email verification, analytics, welcome notifications, etc.
      console.log(`[RegistrationHooks] onUserRegistered fired for ${user.email}`);
  // Send registration complete email using provided mailer
  await sendWelcomeEmail(user.email, user.firstName || user.first_name || 'there');
    } catch (err) {
      console.error('[RegistrationHooks] onUserRegistered error:', err.message);
    }
  }
};
