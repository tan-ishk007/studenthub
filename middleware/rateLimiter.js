import rateLimit from 'express-rate-limit';

// Limits repeated login attempts per IP to slow down credential-stuffing/brute-force.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Too many login attempts. Please wait 15 minutes and try again.');
    res.redirect('/login');
  },
});

// Looser limit for registration — mainly to slow down mass fake-account creation.
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 accounts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    req.flash('error', 'Too many accounts created from this network. Please try again later.');
    res.redirect('/register');
  },
});
