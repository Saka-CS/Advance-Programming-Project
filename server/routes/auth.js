import express from 'express';
import bcrypt from 'bcrypt';
import { dbQuery, dbRun } from '../db.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Email, username, and password are required' });
  }

  try {
    const existingUser = await dbQuery('SELECT * FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser.length > 0) {
      if (existingUser[0].email === email) return res.status(400).json({ error: 'Email already exists' });
      return res.status(400).json({ error: 'Username already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userId = Date.now().toString();

    await dbRun('INSERT INTO users (id, username, email, password_hash) VALUES (?, ?, ?, ?)', [userId, username, email, passwordHash]);
    
    // Create an empty settings row for the new user
    await dbRun('INSERT INTO user_settings (user_id) VALUES (?)', [userId]);

    res.status(201).json({ id: userId, username });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const users = await dbQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    
    if (match) {
      res.json({ id: user.id, username: user.username, email: user.email });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
