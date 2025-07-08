/**
 * Module encryption AES-256 use crypto of Node.js
 * Support encryption and decryption data form
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// File save temporary data instead of database
const DATA_FILE = path.join(__dirname, '../data.json');

// Hardcoded key 32 bytes (256 bit) for AES-256
const SECRET_KEY = crypto.scryptSync('my-secret-key-for-aes-256-encryption', 'salt', 32);

/**
 * Encryption data using AES-256-CBC
 * @param {Object} data - Data to encrypt
 * @returns {Object} - Encrypted data with iv
 */
function encrypt(data) {
  try {
    // Create random 16 byte iv
    const iv = crypto.randomBytes(16);
    
    // Create cipher with aes-256-cbc algorithm
    const cipher = crypto.createCipheriv('aes-256-cbc', SECRET_KEY, iv);
    
    // Encrypt data
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      encryptedData: encrypted
    };
  } catch (error) {
    console.error('Error when encrypt:', error);
    throw new Error('Error when encrypt data');
  }
}

/**
 * Decryption data using AES-256-CBC
 * @param {string} encryptedData - Encrypted data
 * @param {string} iv - Initialization vector
 * @returns {Object} - Decrypted data
 */
function decrypt(encryptedData, iv) {
  try {
    // Create decipher with aes-256-cbc algorithm
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      SECRET_KEY,
      Buffer.from(iv, 'hex')
    );
    
    // Decrypt data
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error when decrypt:', error);
    throw new Error('Error when decrypt data');
  }
}

/**
 * Save form data encrypted to file
 * @param {Object} data - Form data to save
 * @param {number} expiryDays - Expiry days
 * @returns {Object} - Saved data including encrypted data
 */
function saveFormData(data, expiryDays = 7) {
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  // Encrypt data
  const encryptedData = encrypt(data);
  
  // Save data
  const saveData = {
    encryptedData: encryptedData.encryptedData,
    iv: encryptedData.iv,
    expiryDate: expiryDate.toISOString(),
    createdAt: new Date().toISOString()
  };
  
  // Check if file exists
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
  
  // Write data to file
  fs.writeFileSync(DATA_FILE, JSON.stringify(saveData, null, 2));
  
  return saveData;
}

/**
 * Get and decrypt form data from file
 * @returns {Object} - Decrypted data or expired message
 */
function getFormData() {
  try {
    // Check if file exists
    if (!fs.existsSync(DATA_FILE)) {
      return { error: 'File not found' };
    }
    
    // Read data from file
    const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    
    // Check expiry date
    const expiryDate = new Date(fileData.expiryDate);
    const currentDate = new Date();
    
    if (currentDate > expiryDate) {
      return { expired: true, message: 'Data expired' };
    }
    
    // Decrypt data
    const decryptedData = decrypt(fileData.encryptedData, fileData.iv);
    
    return {
      data: decryptedData,
      expiryDate: fileData.expiryDate
    };
  } catch (error) {
    console.error('Error when read data:', error);
    return { error: 'Error when read or decrypt data' };
  }
}

module.exports = {
  saveFormData,
  getFormData,
  encrypt,
  decrypt
}; 