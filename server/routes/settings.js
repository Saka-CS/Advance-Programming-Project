import express from 'express';
import { dbQuery, dbRun } from '../db.js';

const router = express.Router();

// Get settings for a user
router.get('/:userId', async (req, res) => {
  try {
    const settings = await dbQuery('SELECT * FROM user_settings WHERE user_id = ?', [req.params.userId]);
    if (settings.length > 0) {
      const s = settings[0];
      res.json({
        gemini_api_key: s.gemini_api_key || '',
        gemini_model: s.gemini_model || '',
        emailjs_service_id: s.emailjs_service_id || '',
        emailjs_template_id: s.emailjs_template_id || '',
        emailjs_public_key: s.emailjs_public_key || '',
        saved_senders: s.saved_senders ? JSON.parse(s.saved_senders) : [],
        saved_receivers: s.saved_receivers ? JSON.parse(s.saved_receivers) : []
      });
    } else {
      res.json({});
    }
  } catch (error) {
    console.error('Fetch settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update settings for a user
router.put('/:userId', async (req, res) => {
  const { 
    gemini_api_key, 
    gemini_model, 
    emailjs_service_id, 
    emailjs_template_id, 
    emailjs_public_key,
    saved_senders,
    saved_receivers 
  } = req.body;

  try {
    // Check if settings exist
    const settings = await dbQuery('SELECT * FROM user_settings WHERE user_id = ?', [req.params.userId]);
    
    if (settings.length === 0) {
      // Insert
      await dbRun(`
        INSERT INTO user_settings (
          user_id, gemini_api_key, gemini_model, 
          emailjs_service_id, emailjs_template_id, emailjs_public_key, 
          saved_senders, saved_receivers
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.params.userId, gemini_api_key, gemini_model, 
        emailjs_service_id, emailjs_template_id, emailjs_public_key,
        saved_senders ? JSON.stringify(saved_senders) : '[]',
        saved_receivers ? JSON.stringify(saved_receivers) : '[]'
      ]);
    } else {
      // Update
      // Build dynamic query based on provided fields
      let query = 'UPDATE user_settings SET ';
      let params = [];
      
      const fields = {
        gemini_api_key, gemini_model, 
        emailjs_service_id, emailjs_template_id, emailjs_public_key
      };

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          query += `${key} = ?, `;
          params.push(value);
        }
      }

      if (saved_senders !== undefined) {
        query += `saved_senders = ?, `;
        params.push(JSON.stringify(saved_senders));
      }

      if (saved_receivers !== undefined) {
        query += `saved_receivers = ?, `;
        params.push(JSON.stringify(saved_receivers));
      }

      // Remove trailing comma and space
      query = query.slice(0, -2);
      query += ' WHERE user_id = ?';
      params.push(req.params.userId);

      if (params.length > 1) { // more than just userId
        await dbRun(query, params);
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
