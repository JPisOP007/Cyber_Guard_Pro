// DEPRECATED: Use ./mailer directly. This wrapper keeps backward compatibility.
const sendWelcomeEmail = require('./mailer');

module.exports = {
  // Back-compat API
  async sendRegistrationCompleteEmail(user) {
    try {
      console.warn('[EmailService] Deprecated. Use services/mailer.js directly.');
      await sendWelcomeEmail(user.email, user.firstName || user.first_name || 'there');
      return { queued: true };
    } catch (err) {
      console.error('[EmailService] sendRegistrationCompleteEmail error:', err.message);
      return { queued: false, error: err.message };
    }
  }
};
