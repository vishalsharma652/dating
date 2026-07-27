const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID || '';
const key_secret = process.env.RAZORPAY_KEY_SECRET || '';

let razorpayInstance = null;
if (key_id && key_secret && key_id !== 'rzp_test_placeholder') {
  razorpayInstance = new Razorpay({
    key_id,
    key_secret,
  });
}

module.exports = {
  razorpay: razorpayInstance,
  keyId: key_id,
  isConfigured: Boolean(razorpayInstance),
};
