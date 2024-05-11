const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const path = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/cv_database', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Define CV schema
const cvSchema = new mongoose.Schema({
  name: String,
  email: String,
  skills: [String],
  photo: {
    data: Buffer,
    contentType: String
  }
});

const CV = mongoose.model('CV', cvSchema);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set EJS as view engine
app.set('view engine', 'ejs');

// Set up body-parser
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Main page route (submit form)
app.get('/', (req, res) => {
  res.render('index');
});

// Search page route
app.get('/search', (req, res) => {
  res.render('search');
});
// Render search results page


// Submit CV route
app.post('/submit_cv', upload.single('photo'), async (req, res) => {
  const newCV = new CV({
    name: req.body.name,
    email: req.body.email,
    skills: req.body.skills.split(',').map(skill => skill.trim()),
    photo: {
      data: req.file.buffer,
      contentType: req.file.mimetype
    }
  });
  await newCV.save();
  res.send('CV submitted successfully!');
});

// List all CVs route
app.get('/list_cvs', async (req, res) => {
  try {
    const cvs = await CV.find();
    res.render('list', { cvs });
  } catch (error) {
    res.status(500).send('Error listing CVs');
  }
});

// Search CVs based on skills route
app.get('/search_cvs', async (req, res) => {
    try {
      const skills = req.query.skills.split(',').map(skill => skill.trim());
      const cvs = await CV.find({ skills: { $in: skills } });
      res.json(cvs); // Send JSON response with the search results
    } catch (error) {
      console.error('Error searching CVs:', error);
      res.status(500).json({ error: 'Error searching CVs' }); // Send JSON error response
    }
  });
  
  
  



// Start server
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
