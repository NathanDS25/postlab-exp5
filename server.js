require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend UI correctly in Vercel Serverless

// Fallback to ensure Vercel loads the index page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const https = require('https');

async function resolveAtlasDoH(domain) {
  const getDns = (name, type) => new Promise(res => {
    https.get(`https://dns.google/resolve?name=${name}&type=${type}`, r => {
      let d = ''; r.on('data', c => d+=c); r.on('end', () => res(JSON.parse(d)));
    });
  });

  const srv = await getDns(`_mongodb._tcp.${domain}`, 'SRV');
  const txt = await getDns(domain, 'TXT');
  
  const hosts = srv.Answer.map(a => a.data.split(' ')[3].replace(/\.$/, '') + ':27017').join(',');
  const authOpts = txt.Answer[0].data.replace(/"/g, ''); // "authSource=admin&replicaSet=atlas-mjpue1-shard-0"
  
  return { hosts, authOpts };
}

// Globally disable Mongoose buffering so disconnected operations fail instantly instead of hanging
mongoose.set('bufferCommands', false);

async function connectToMongo() {
  // readyState 1 means strictly connected
  if (mongoose.connection.readyState === 1) return;
  
  // If currently connecting (readyState 2), wait for it to finish rather than throwing or duplicating
  if (mongoose.connection.readyState === 2) {
      await new Promise(resolve => {
          mongoose.connection.once('connected', resolve);
      });
      return;
  }
  try {
    let uri = process.env.MONGO_URI || '';
    
    // Only use the DoH bypass locally (Windows).
    if (process.env.NODE_ENV !== 'production' && uri.startsWith('mongodb+srv://')) {
      console.log('Resolving Atlas bypassing Windows DNS block...');
      const match = uri.match(/^mongodb\+srv:\/\/(.+?:.+?)@([^/]+)\/(.*?)$/);
      const credentials = match[1];
      const domain = match[2];
      const dbAndQuery = match[3]; 
      
      const { hosts, authOpts } = await resolveAtlasDoH(domain);
      
      // Separate dbName from user query
      const [dbName, userQuery] = dbAndQuery.split('?');
      const finalQuery = userQuery ? `${authOpts}&${userQuery}&ssl=true` : `${authOpts}&ssl=true`;
      
      uri = `mongodb://${credentials}@${hosts}/${dbName}?${finalQuery}`;
    }
    
    await mongoose.connect(uri, { 
        serverSelectionTimeoutMS: 5000
    });
    console.log('Successfully connected to MongoDB Atlas!');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    throw err; // Force the error up to the middleware
  }
}

// Ensure the database is connected BEFORE processing any API request
app.use(async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        try {
            await connectToMongo();
        } catch (err) {
            return res.status(500).json({ error: 'CRITICAL DB ERROR: ' + err.message });
        }
    }
    next();
});

// Routes
app.use('/api/users', userRoutes);

// Only listen locally, Vercel will process requests through the exported app
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running locally - UI IS LOADED on port ${PORT}`);
  });
}

// Export for Vercel Serverless Architecture
module.exports = app;

