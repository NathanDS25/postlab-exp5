const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number, required: true },
  hobbies: [{ type: String }],
  bio: { type: String },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Indexes configuration as requested
userSchema.index({ name: 1 }); // Single field index on name
userSchema.index({ email: 1, age: -1 }); // Compound index
userSchema.index({ hobbies: 1 }); // Multikey index on hobbies
userSchema.index({ bio: 'text' }); // Text index on bio
userSchema.index({ userId: 'hashed' }); // Hashed index on userId
userSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 }); // TTL index on createdAt

module.exports = mongoose.model('User', userSchema);
