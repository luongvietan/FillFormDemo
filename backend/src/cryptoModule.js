/**
 * Module encryption AES-256 use crypto of Node.js
 * Support encryption and decryption data form
 */
const crypto = require('crypto');

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
    const iv = crypto.randomBytes(16); //initialization vector
    
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
 * Save form data with encryption to be used by IndexedDB
 * @param {Object} data - Form data to be encrypted and saved
 * @param {number} expiryDays - Number of days before data expires (default: 7)
 * @returns {Object} - Object containing encrypted data, iv and expiry date
 */
function saveFormData(data, expiryDays = 7) {
  // Encrypt the data
  const encryptedResult = encrypt(data);
  
  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + expiryDays);
  
  return {
    encryptedData: encryptedResult.encryptedData,
    iv: encryptedResult.iv,
    expiryDate: expiryDate.toISOString()
  };
}

/**
 * Get form data by decrypting stored data
 * @param {string} encryptedData - Encrypted data string
 * @param {string} iv - Initialization vector used for encryption
 * @returns {Object} - Decrypted form data
 */
function getFormData(encryptedData, iv) {
  // Decrypt the data
  return decrypt(encryptedData, iv);
}

module.exports = {
  encrypt,
  decrypt,
  saveFormData,
  getFormData
}; 