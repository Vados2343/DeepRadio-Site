import express from 'express';
import { pool } from './db.js';
import { authenticateToken } from './middleware.js';

const router = express.Router();

router.post('/favorites', authenticateToken, async (req, res) => {
  try {
    const { sessionId, stationId, action } = req.body;
    const userId = req.user.userId;

    if (!stationId || !action) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (action === 'add') {
      await pool.query(
        `INSERT INTO favorites (user_id, session_id, station_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, station_id) DO NOTHING`,
        [userId, sessionId, stationId]
      );
      res.json({ success: true, message: 'Favorite added' });
    } else if (action === 'remove') {
      await pool.query(
        'DELETE FROM favorites WHERE user_id = $1 AND station_id = $2',
        [userId, stationId]
      );
      res.json({ success: true, message: 'Favorite removed' });
    } else {
      res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Favorites error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/favorites', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT station_id FROM favorites WHERE user_id = $1 ORDER BY added_at DESC',
      [userId]
    );
    const favorites = result.rows.map(row => row.station_id);
    res.json({ favorites });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/stats', authenticateToken, async (req, res) => {
  try {
    const { sessionId, stationId, stationName, track, genres, duration, timestamp, liked } = req.body;
    const userId = req.user.userId;

    if (!stationId || !duration || !timestamp) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await pool.query(
      `INSERT INTO user_stats
       (user_id, session_id, station_id, station_name, track_artist, track_song, genres, duration, timestamp, liked)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (user_id, timestamp, station_id) DO NOTHING`,
      [
        userId,
        sessionId,
        stationId,
        stationName,
        track?.artist || null,
        track?.song || null,
        genres || [],
        duration,
        timestamp,
        liked || false
      ]
    );

    res.json({ success: true, message: 'Stats saved' });
  } catch (error) {
    console.error('Stats save error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      `SELECT stat_id, station_id, station_name, track_artist, track_song,
              genres, duration, timestamp, liked
       FROM user_stats
       WHERE user_id = $1
       ORDER BY timestamp DESC`,
      [userId]
    );

    const stats = result.rows.map(row => ({
      id: `session-${row.timestamp}-${row.station_id}`,
      stationId: row.station_id,
      stationName: row.station_name,
      track: row.track_artist ? {
        artist: row.track_artist,
        song: row.track_song
      } : null,
      genres: row.genres || [],
      time: row.duration,
      timestamp: parseInt(row.timestamp),
      liked: row.liked
    }));

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.delete('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    await pool.query('DELETE FROM user_stats WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'Stats cleared' });
  } catch (error) {
    console.error('Clear stats error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/gradients', authenticateToken, async (req, res) => {
  try {
    const { sessionId, gradients } = req.body;
    const userId = req.user.userId;

    if (!gradients) {
      return res.status(400).json({ error: 'Missing gradients data' });
    }

    await pool.query(
      `INSERT INTO user_gradients (user_id, session_id, gradient_data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (gradient_id) DO UPDATE
       SET gradient_data = $3, updated_at = NOW()`,
      [userId, sessionId, JSON.stringify(gradients)]
    );

    res.json({ success: true, message: 'Gradients saved' });
  } catch (error) {
    console.error('Gradients save error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/gradients', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT gradient_data FROM user_gradients WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );

    if (result.rows.length > 0) {
      res.json({ gradients: result.rows[0].gradient_data });
    } else {
      res.json({ gradients: [] });
    }
  } catch (error) {
    console.error('Get gradients error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const { sessionId, settings } = req.body;
    const userId = req.user.userId;

    if (!settings) {
      return res.status(400).json({ error: 'Missing settings data' });
    }

    await pool.query(
      `INSERT INTO user_settings (user_id, session_id, settings_data, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET settings_data = $3, session_id = $2, updated_at = NOW()`,
      [userId, sessionId, JSON.stringify(settings)]
    );

    res.json({ success: true, message: 'Settings saved' });
  } catch (error) {
    console.error('Settings save error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await pool.query(
      'SELECT settings_data FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      res.json({ settings: result.rows[0].settings_data });
    } else {
      res.json({ settings: null });
    }
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
