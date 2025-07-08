import React from 'react';
import FormComponent from './components/FormComponent';

/**
 * App Component - Main component of the application
 * Use FormComponent to handle form and interact with IndexedDB
 */
function App() {
  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="container mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">FormFill Demo</h1>
          <p className="text-gray-600 mt-2">Save form data with AES-256 encryption and IndexedDB</p>
        </header>
        
        <FormComponent />
        
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>FormFill Demo - Node.js & React</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
