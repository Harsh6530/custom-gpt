const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// DB Connection
mongoose
    .connect('mongodb+srv://sharmaharsh634:rajesh530@cluster0.jtsxc.mongodb.net/project_name_prompts?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connected to MongoDB'))
    .catch(error => console.error('Error connecting to MongoDB:', error));

// Routes
app.use('/api', require('./routes/userRoutes'));
app.use('/api', require('./routes/projectRoutes'));
app.use('/api', require('./routes/settingsRoutes'));
app.use('/api', require('./routes/openaiRoutes'));

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
