import express from 'express';
import { pool } from './db.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-hero';

// Middleware to verify JWT and extract user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database using google_id or user_id
    let user;
    if (decoded.userId) {
      const result = await pool.query('SELECT * FROM users WHERE user_id = $1', [decoded.userId]);
      user = result.rows[0];
    } else if (decoded.googleId) {
      const result = await pool.query('SELECT * FROM users WHERE google_id = $1', [decoded.googleId]);
      user = result.rows[0];
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    req.sessionId = decoded.sessionId || `google_${user.google_id}`;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== FAVORITES ====================

router.get('/favorites', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT station_id FROM favorites WHERE user_id = $1',
      [req.user.user_id]
    );

    const favorites = result.rows.map(row => row.station_id);
    res.json({ favorites });
  } catch (error) {
    console.error('Error loading favorites:', error);
    res.status(500).json({ error: 'Failed to load favorites' });
  }
});

router.post('/favorites', authenticate, async (req, res) => {
  try {
    const { stationId, action, favorites } = req.body;

    // Bulk sync favorites
    if (Array.isArray(favorites)) {
      await pool.query('DELETE FROM favorites WHERE user_id = $1', [req.user.user_id]);

      if (favorites.length > 0) {
        const values = favorites.map((sid, idx) =>
          `($1, $2, $${idx + 3})`
        ).join(',');

        const params = [req.user.user_id, req.sessionId, ...favorites];
        await pool.query(
          `INSERT INTO favorites (user_id, session_id, station_id)
           VALUES ${values}
           ON CONFLICT (user_id, station_id) DO NOTHING`,
          params
        );
      }

      return res.json({ success: true });
    }

    // Single favorite action
    if (action === 'add') {
      await pool.query(
        `INSERT INTO favorites (user_id, session_id, station_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, station_id) DO NOTHING`,
        [req.user.user_id, req.sessionId, stationId]
      );
    } else if (action === 'remove') {
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND station_id = $2',
        [req.user.user_id, stationId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving favorite:', error);
    res.status(500).json({ error: 'Failed to save favorite' });
  }
});

// ==================== STATS ====================

router.get('/stats', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT station_id, station_name, track_artist, track_song,
              genres, duration, timestamp, liked
       FROM user_stats
       WHERE user_id = $1
       ORDER BY timestamp DESC
       LIMIT 1000`,
      [req.user.user_id]
    );

    res.json({ stats: result.rows });
  } catch (error) {
    console.error('Error loading stats:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.post('/stats', authenticate, async (req, res) => {
  try {
    const { stationId, stationName, track, genres, duration, timestamp, liked } = req.body;

    await pool.query(
      `INSERT INTO user_stats
       (user_id, session_id, station_id, station_name, track_artist, track_song,
        genres, duration, timestamp, liked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, timestamp, station_id) DO UPDATE
       SET duration = EXCLUDED.duration, liked = EXCLUDED.liked`,
      [
        req.user.user_id,
        req.sessionId,
        stationId,
        stationName,
        track?.artist || null,
        track?.song || null,
        genres || [],
        duration || 0,
        timestamp,
        liked || false
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving stats:', error);
    res.status(500).json({ error: 'Failed to save stats' });
  }
});

router.delete('/stats', authenticate, async (req, res) => {
  try {
    await pool.query('DELETE FROM user_stats WHERE user_id = $1', [req.user.user_id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing stats:', error);
    res.status(500).json({ error: 'Failed to clear stats' });
  }
});

// ==================== GRADIENTS ====================

router.get('/gradients', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT gradient_data FROM user_gradients WHERE user_id = $1',
      [req.user.user_id]
    );

    const gradients = result.rows.length > 0 ? result.rows[0].gradient_data : [];
    res.json({ gradients });
  } catch (error) {
    console.error('Error loading gradients:', error);
    res.status(500).json({ error: 'Failed to load gradients' });
  }
});

router.post('/gradients', authenticate, async (req, res) => {
  try {
    const { gradients } = req.body;

    await pool.query(
      `INSERT INTO user_gradients (user_id, session_id, gradient_data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET gradient_data = EXCLUDED.gradient_data,
           updated_at = NOW()`,
      [req.user.user_id, req.sessionId, JSON.stringify(gradients)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving gradients:', error);
    res.status(500).json({ error: 'Failed to save gradients' });
  }
});

// ==================== SETTINGS ====================

router.get('/settings', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT settings_data FROM user_settings WHERE user_id = $1',
      [req.user.user_id]
    );

    const settings = result.rows.length > 0 ? result.rows[0].settings_data : null;
    res.json({ settings });
  } catch (error) {
    console.error('Error loading settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

router.post('/settings', authenticate, async (req, res) => {
  try {
    const { settings } = req.body;

    await pool.query(
      `INSERT INTO user_settings (user_id, session_id, settings_data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET settings_data = EXCLUDED.settings_data,
           session_id = EXCLUDED.session_id,
           updated_at = NOW()`,
      [req.user.user_id, req.sessionId, JSON.stringify(settings)]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

export default router;
