import express from 'express';
import { dbQuery, dbRun } from '../db.js';

const router = express.Router();

// Get all projects for a user
router.get('/:userId', async (req, res) => {
  try {
    const projects = await dbQuery('SELECT * FROM projects WHERE user_id = ?', [req.params.userId]);
    // Parse resources JSON string back to array
    const parsedProjects = projects.map(p => ({
      ...p,
      resources: p.resources ? JSON.parse(p.resources) : []
    }));
    res.json(parsedProjects);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  const { id, userId, name, content, resources } = req.body;
  if (!id || !userId || !name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await dbRun(
      'INSERT INTO projects (id, user_id, name, content, resources) VALUES (?, ?, ?, ?, ?)',
      [id, userId, name, content || '', JSON.stringify(resources || [])]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  const { name, content, resources } = req.body;
  try {
    await dbRun(
      'UPDATE projects SET name = ?, content = ?, resources = ? WHERE id = ?',
      [name, content, JSON.stringify(resources || []), req.params.id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM projects WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
