import React from 'react';
import FormComponent from './components/FormComponent';

/**
 * App Component - Main component of the application
 * Use FormComponent to handle form and interact with IndexedDB
 */
function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">FormFill <span className="text-blue-600">Demo</span></h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Lưu trữ dữ liệu biểu mẫu an toàn với mã hóa AES-256 và IndexedDB
          </p>
        </header>
        
        <FormComponent />
        
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
            <p>FormFill Demo - Node.js & React</p>
            <div className="h-1 w-1 rounded-full bg-gray-400"></div>
          </div>
          <p className="mt-2 text-xs text-gray-400">© {new Date().getFullYear()} FormFill Demo</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
