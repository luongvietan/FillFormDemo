/**
 * Server Express.js provide API for FormFill application
 * Endpoints: /api/saveFormData, /api/getFormData
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
 * API endpoint to save form data with encryption
 * @param {Object} req.body.data - Form data to encrypt
 * @param {number} req.body.expiryDays - Number of days before data expires (default: 7)
 */
app.post('/api/saveFormData', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Invalid data' });
    }
    
    // Get expiry days
    const expiryDays = req.body.expiryDays || 7;
    
    // Use saveFormData function
    const result = saveFormData(data, expiryDays);
    
    // Return encrypted data
    res.json(result);
  } catch (error) {
    console.error('Error when saving form data:', error);
    res.status(500).json({ error: 'Server error when saving form data' });
  }
});

/**
 * API endpoint to get and decrypt form data
 * @param {string} req.body.encryptedData - Encrypted data from frontend
 * @param {string} req.body.iv - Initialization vector from frontend
 */
app.post('/api/getFormData', (req, res) => {
  try {
    const { encryptedData, iv } = req.body;
    
    if (!encryptedData || !iv) {
      return res.status(400).json({ error: 'Missing encrypted data or IV' });
    }
    
    // Use getFormData function
    const data = getFormData(encryptedData, iv);
    
    // Return decrypted data
    res.json({
      data: data
    });
  } catch (error) {
    console.error('Error when getting form data:', error);
    res.status(500).json({ error: 'Server error when getting form data' });
  }
});

// Legacy endpoints for backward compatibility
app.post('/api/encrypt', (req, res) => {
  try {
    const { data, expiryDays } = req.body;
    const result = saveFormData(data, expiryDays || 7);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/decrypt', (req, res) => {
  try {
    const { encryptedData, iv } = req.body;
    const data = getFormData(encryptedData, iv);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
}); 