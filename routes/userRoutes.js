const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST: Create a user
router.post('/', async (req, res) => {
  try {
    const newUser = new User(req.body);
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Duplicate key error', details: error.keyValue });
    }
    res.status(400).json({ error: error.message });
  }
});

// GET: Retrieve all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Search users (incorporates find by name, hobbies, bio, email & age)
router.get('/search', async (req, res) => {
  try {
    const { name, email, age, hobbies, bioSearch, explain } = req.query;
    let filter = {};

    if (name) filter.name = name;
    if (email && age) {
        filter.email = email;
        filter.age = Number(age);
    } else if (email) {
        filter.email = email;
    } else if (age) {
        filter.age = Number(age);
    }
    if (hobbies) filter.hobbies = { $regex: hobbies, $options: 'i' };
    if (bioSearch) filter.$text = { $search: bioSearch };

    let query = User.find(filter);
    
    if (explain === 'true') {
       const stats = await query.explain("executionStats");
       return res.json(stats);
    }

    const users = await query;
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET: Individual explain endpoint
router.get('/explain', async (req, res) => {
    try {
        const filterStr = req.query.filter || "{}";
        const filter = JSON.parse(filterStr);
        const stats = await User.find(filter).explain("executionStats");
        res.json(stats);
    } catch(e) {
        res.status(400).json({error: e.message});
    }
})

// PUT: Update user by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE: Delete user by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
