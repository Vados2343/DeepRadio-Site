import express from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import jwt from 'jsonwebtoken';
import { pool } from './db.js';

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || 'http://localhost:3000/auth/google/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-hero';

passport.use(new GoogleStrategy(
  {
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: CALLBACK_URL
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;
      const avatar = profile.photos?.[0]?.value;
      if (!googleId || !email) return done(new Error('Missing Google profile data'));
      let user = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
      if (user.rows.length === 0) {
        user = await pool.query(
          `INSERT INTO users (google_id,email,name,avatar_url,created_at,last_login)
           VALUES ($1,$2,$3,$4,NOW(),NOW())
           RETURNING *`,
          [googleId, email, name, avatar]
        );
      } else {
        await pool.query(
          'UPDATE users SET last_login=NOW(), name=$1, avatar_url=$2 WHERE google_id=$3',
          [name, avatar, googleId]
        );
      }
      const userData = {
        userId: user.rows[0].user_id,
        sessionId: `google_${googleId}`,
        googleId,
        email,
        name,
        avatar
      };
      return done(null, userData);
    } catch (error) {
      return done(error);
    }
  }
));

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: FRONTEND_URL }),
  (req, res) => {
    try {
      const token = jwt.sign(req.user, JWT_SECRET, { expiresIn: '30d' });
      res.redirect(`${FRONTEND_URL}?auth_token=${token}&auth_success=true`);
    } catch (error) {
      res.redirect(`${FRONTEND_URL}?auth_error=token_failed`);
    }
  }
);

router.post('/verify', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
