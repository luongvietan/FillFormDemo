import React, { useState, useEffect } from 'react';

/**
 * FormComponent - Component handle form and interact with IndexedDB
 * There are 2 input fields: firstName and email
 * 2 main functions: Save (save to IndexedDB) and Load (read from IndexedDB)
 */
const FormComponent = () => {
  // State for form fields
  const [formData, setFormData] = useState({
    firstName: '',
    email: ''
  });
  
  // State for displaying message
  const [message, setMessage] = useState('');
  // State for validation errors
  const [errors, setErrors] = useState({});
  // State for loading status
  const [isLoading, setIsLoading] = useState(false);
  // State for success animation
  const [showSuccess, setShowSuccess] = useState(false);

  // Initialize IndexedDB when component mount
  useEffect(() => {
    initIndexedDB();
  }, []);

  // Function to initialize IndexedDB
  const initIndexedDB = () => {
    createDatabase();
  };
  
  // Function to create database
  const createDatabase = () => {
    // Open or create new database if not exists
    const request = indexedDB.open('FormFillDB', 1);

    // Handle when need to upgrade DB structure
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if not exists
      if (!db.objectStoreNames.contains('formStore')) {
        console.log('Creating formStore object store');
        db.createObjectStore('formStore', { keyPath: 'id' });
      }
    };

    // Handle error
    request.onerror = (event) => {
      console.error('Database error:', event.target.error);
      setMessage('Error when connect to IndexedDB: ' + event.target.error);
    };

    // Success message
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Check if object store exists
      if (!db.objectStoreNames.contains('formStore')) {
        // If not exists, close connection and create new with new version
        db.close();
        const newVersionRequest = indexedDB.open('FormFillDB', db.version + 1);
        
        newVersionRequest.onupgradeneeded = (upgradeEvent) => {
          const newDb = upgradeEvent.target.result;
          newDb.createObjectStore('formStore', { keyPath: 'id' });
        };
        
        newVersionRequest.onsuccess = () => {
          setMessage('Connected to IndexedDB successfully');
        };
        
        newVersionRequest.onerror = (errorEvent) => {
          setMessage('Error when upgrade IndexedDB: ' + errorEvent.target.error);
        };
      } else {
        setMessage('Connected to IndexedDB successfully');
      }
    };
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation errors when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save form data to backend (encrypt) and IndexedDB
  const handleSave = async () => {
    try {
      // Validate form data before saving
      if (!validateForm()) {
        setMessage('Please fix the errors in the form');
        return;
      }

      setIsLoading(true);

      // Call API backend to encrypt data
      const response = await fetch('http://localhost:3001/api/saveFormData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: formData,
          expiryDays: 7 // Default expiry after 7 days
        })
      });

      if (!response.ok) {
        throw new Error('Error when connect to server');
      }

      const encryptedData = await response.json();

      // Save encrypted data to IndexedDB
      const request = indexedDB.open('FormFillDB', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        // Check if object store exists
        if (!db.objectStoreNames.contains('formStore')) {
          setMessage('Error: Object store not found. Reinitializing database...');
          db.close();
          initIndexedDB(); // Reinitialize database
          setIsLoading(false);
          return;
        }
        
        const transaction = db.transaction('formStore', 'readwrite');
        const store = transaction.objectStore('formStore');
        
        // Save with fixed id 'form1'
        store.put({
          id: 'form1',
          encryptedData: encryptedData.encryptedData,
          iv: encryptedData.iv,
          expiryDate: encryptedData.expiryDate,
          timestamp: new Date().getTime()
        });
        
        transaction.oncomplete = () => {
          setMessage('Save data successfully');
          setIsLoading(false);
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 2000);
        };
        
        transaction.onerror = (error) => {
          console.error('Transaction error:', error.target.error);
          setMessage('Error when save data: ' + error.target.error);
          setIsLoading(false);
        };
      };
      
      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        setMessage('Error when connect to IndexedDB: ' + event.target.error);
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Save error:', error);
      setMessage('Error: ' + error.message);
      setIsLoading(false);
    }
  };

  // Read data from IndexedDB and decrypt via backend
  const handleLoad = async () => {
    try {
      setIsLoading(true);
      // Open connection to IndexedDB
      const request = indexedDB.open('FormFillDB', 1);
      
      request.onsuccess = async (event) => {
        const db = event.target.result;
        
        // Check if object store exists
        if (!db.objectStoreNames.contains('formStore')) {
          setMessage('Error: Object store not found. Reinitializing database...');
          db.close();
          initIndexedDB(); // Reinitialize database
          setIsLoading(false);
          return;
        }
        
        const transaction = db.transaction('formStore', 'readonly');
        const store = transaction.objectStore('formStore');
        
        // Read data with id 'form1'
        const getRequest = store.get('form1');
        
        getRequest.onsuccess = async () => {
          const storedData = getRequest.result;
          
          if (!storedData) {
            setMessage('Data not found in IndexedDB');
            setIsLoading(false);
            return;
          }
          
          // Check expiry date
          const expiryDate = new Date(storedData.expiryDate);
          const currentDate = new Date();
          
          if (currentDate > expiryDate) {
            setMessage('Data expired');
            setIsLoading(false);
            return;
          }
          
          try {
            // Call API backend to decrypt
            const response = await fetch('http://localhost:3001/api/getFormData', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                encryptedData: storedData.encryptedData,
                iv: storedData.iv
              })
            });
            
            if (!response.ok) {
              throw new Error('Error when connect to server');
            }
            
            const decryptedData = await response.json();
            
            // Update form with decrypted data
            setFormData(decryptedData.data);
            setMessage('Load data successfully');
            setIsLoading(false);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
          } catch (fetchError) {
            console.error('Error when call API:', fetchError);
            setMessage('Error when call API: ' + fetchError.message);
            setIsLoading(false);
          }
        };
        
        getRequest.onerror = (error) => {
          console.error('Get request error:', error.target.error);
          setMessage('Error when read data: ' + error.target.error);
          setIsLoading(false);
        };
      };
      
      request.onerror = (event) => {
        console.error('Database error:', event.target.error);
        setMessage('Error when connect to IndexedDB: ' + event.target.error);
        setIsLoading(false);
      };
    } catch (error) {
      console.error('Load error:', error);
      setMessage('Error: ' + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl transition-all duration-300 hover:shadow-lg animate-fadeIn">
      <div className="p-8">
        <div className="mb-6 animate-slideIn">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Form information</h2>
          <p className="text-gray-600">Enter your information and save securely with AES-256 encryption</p>
        </div>
        
        <div className="space-y-6">
          {/* First Name Field */}
          <div className="animate-slideIn" style={{ animationDelay: '0.1s' }}>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              placeholder="Input your first name"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>
          
          {/* Email Field */}
          <div className="animate-slideIn" style={{ animationDelay: '0.2s' }}>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
              placeholder="Input your email address"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>
          
          {/* Buttons */}
          <div className="flex space-x-4 pt-4 animate-slideIn" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} hover:scale-105 transform transition-transform`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Save
            </button>
            <button
              onClick={handleLoad}
              disabled={isLoading}
              className={`flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''} hover:scale-105 transform transition-transform`}
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              Load
            </button>
          </div>
        </div>
        
        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-orange-50 text-orange-800'} ${showSuccess ? 'animate-pulse' : ''} animate-fadeIn`}>
            {message}
          </div>
        )}
        
        {/* Success Animation */}
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-green-500 bg-opacity-20 rounded-full p-10 animate-ping"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormComponent; 