const Stripe = require('stripe');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

let stripeInstance = null;
if (stripeSecretKey && stripeSecretKey !== 'sk_test_placeholder' && !stripeSecretKey.includes('placeholder')) {
  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
  });
}

module.exports = {
  stripe: stripeInstance,
  secretKey: stripeSecretKey,
  isConfigured: Boolean(stripeInstance),
};
