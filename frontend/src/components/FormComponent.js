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

  // Initialize IndexedDB when component mount
  useEffect(() => {
    initIndexedDB();
  }, []);

  // Function to initialize IndexedDB
  const initIndexedDB = () => {
    // Open or create new database if not exists
    const request = indexedDB.open('FormFillDB', 1);

    // Handle when need to upgrade DB structure
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Create object store if not exists
      if (!db.objectStoreNames.contains('formStore')) {
        db.createObjectStore('formStore', { keyPath: 'id' });
      }
    };

    // Handle error
    request.onerror = (event) => {
      setMessage('Error when access IndexedDB: ' + event.target.error);
    };

    // Success message
    request.onsuccess = () => {
      setMessage('Connected to IndexedDB successfully');
    };
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Save form data to backend (encrypt) and IndexedDB
  const handleSave = async () => {
    try {
      // Call API backend to encrypt data
      const response = await fetch('http://localhost:3001/api/save', {
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
        throw new Error('Connection error with server');
      }

      const encryptedData = await response.json();

      // Save encrypted data to IndexedDB
      const request = indexedDB.open('FormFillDB', 1);
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction('formStore', 'readwrite');
        const store = transaction.objectStore('formStore');
        
        // Save with fixed id 'form1'
        store.put({
          id: 'form1',
          encryptedData,
          timestamp: new Date().getTime()
        });
        
        transaction.oncomplete = () => {
          setMessage('Data saved successfully');
        };
        
        transaction.onerror = (error) => {
          setMessage('Error when save data: ' + error.target.error);
        };
      };
      
      request.onerror = (event) => {
        setMessage('Error when connect IndexedDB: ' + event.target.error);
      };
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  // Read data from IndexedDB and decrypt via backend
  const handleLoad = async () => {
    try {
      // Open connection to IndexedDB
      const request = indexedDB.open('FormFillDB', 1);
      
      request.onsuccess = async (event) => {
        const db = event.target.result;
        const transaction = db.transaction('formStore', 'readonly');
        const store = transaction.objectStore('formStore');
        
        // Read data with id 'form1'
        const getRequest = store.get('form1');
        
        getRequest.onsuccess = async () => {
          const data = getRequest.result;
          
          if (!data) {
            setMessage('Data not found in IndexedDB');
            return;
          }
          
          try {
            // Call API backend to decrypt
            const response = await fetch('http://localhost:3001/api/load', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ encryptedData: data.encryptedData })
            });
            
            // Handle different HTTP status codes
            if (response.status === 404) {
              const errorData = await response.json();
              setMessage('Error: ' + (errorData.error || 'Data not found on server'));
              return;
            }
            
            if (!response.ok) {
              throw new Error('Connection error with server');
            }
            
            const decryptedData = await response.json();
            
            // If data expired
            if (decryptedData.expired) {
              setMessage('Data expired');
              return;
            }
            
            // Update form with decrypted data
            setFormData(decryptedData.data);
            setMessage('Data loaded successfully');
          } catch (fetchError) {
            console.error('Error when call API:', fetchError);
            setMessage('Error: ' + fetchError.message);
          }
        };
        
        getRequest.onerror = (error) => {
          setMessage('Error when read data: ' + error.target.error);
        };
      };
      
      request.onerror = (event) => {
        setMessage('Error when connect IndexedDB: ' + event.target.error);
      };
    } catch (error) {
      setMessage('Error: ' + error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-xl font-bold mb-4">FormFill Demo</h1>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Full Name:</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div className="flex space-x-4">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save
        </button>
        
        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Load
        </button>
      </div>
      
      {message && (
        <div className="mt-4 p-2 bg-gray-100 border rounded">
          {message}
        </div>
      )}
    </div>
  );
};

export default FormComponent; 