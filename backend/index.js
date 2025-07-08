/**
 * Server Express.js provide API for FormFill application
 * Endpoints: /api/save, /api/load
 */
const express = require('express');
const cors = require('cors');
const { saveFormData, getFormData } = require('./src/cryptoModule');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Allow CORS
app.use(express.json()); // Parse JSON body

// Main route
app.get('/', (req, res) => {
  res.send('FormFill API Server - AES-256 Encryption');
});

/**
 * API endpoint to save form data
 * @param {Object} req.body.data - Form data to save
 * @param {number} req.body.expiryDays - Expiry days (default: 7)
 */
app.post('/api/save', (req, res) => {
  try {
    const { data, expiryDays } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }
    
    // Save data with expiry date
    const savedData = saveFormData(data, expiryDays || 7);
    
    // Return saved data (including encrypted data)
    res.json({
      encryptedData: savedData.encryptedData,
      iv: savedData.iv,
      expiryDate: savedData.expiryDate
    });
  } catch (error) {
    console.error('Error when save data:', error);
    res.status(500).json({ error: 'Server error when save data' });
  }
});

/**
 * API endpoint to load form data
 * @param {Object} req.body.encryptedData - (Optional) Encrypted data from frontend
 */
app.post('/api/load', (req, res) => {
  try {
    // Get data from file (ignore encryptedData from frontend because we save on server)
    const formData = getFormData();
    
    // Check error
    if (formData.error) {
      return res.status(404).json({ error: formData.error });
    }
    
    // Check expiry date
    if (formData.expired) {
      return res.status(410).json({ expired: true, message: 'Data expired' });
    }
    
    // Return decrypted data
    res.json({
      data: formData.data,
      expiryDate: formData.expiryDate
    });
  } catch (error) {
    console.error('Error when load data:', error);
    res.status(500).json({ error: 'Server error when load data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
}); 