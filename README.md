# FormFill - Form Data Encryption and Storage Demo

A prototype application for securely storing and retrieving form data using AES-256 encryption and IndexedDB storage. The application consists of two main components:

- **Backend**: Node.js with Express
- **Frontend**: React with Tailwind CSS

## Features

- AES-256-CBC encryption/decryption of form data
- Secure storage in IndexedDB with expiration handling
- Form validation with visual feedback
- Configurable data expiration (default: 7 days)

## Installation and Setup

### Prerequisites
- Node.js (v14+)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
npm start
```

The backend server will run at http://localhost:3001

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

The frontend application will run at http://localhost:3000

## Technical Implementation

### Backend Module (cryptoModule.js)

The core module provides two main functions as required:

1. **saveFormData(data, expiryDays)**
   - Parameters:
     - `data`: Object containing form fields (firstName, email)
     - `expiryDays`: Number of days before data expires (default: 7)
   - Returns: Object with encrypted data, IV, and expiry date
   - Implementation: Uses AES-256-CBC encryption with a random IV

2. **getFormData(encryptedData, iv)**
   - Parameters:
     - `encryptedData`: The encrypted data string
     - `iv`: The initialization vector used for encryption
   - Returns: Original form data object
   - Implementation: Decrypts using AES-256-CBC algorithm

### Security Considerations

- Uses hardcoded encryption key (for demo purposes only)
- In a production environment, secure key management would be implemented:
  - Key rotation
  - Secure storage (e.g., AWS KMS, HashiCorp Vault)
  - Environment-based keys

### Frontend Implementation

- React form component with field validation
- Integration with IndexedDB for client-side storage
- Visual feedback for form errors and operation status

### Data Storage Flow

1. User submits form data
2. Frontend validates form data
3. Backend encrypts data with AES-256-CBC and returns encrypted data with IV
4. Frontend stores encrypted data in IndexedDB with expiration date
5. When loading, frontend retrieves encrypted data and sends to backend
6. Backend decrypts data and returns it to frontend
7. Frontend updates form fields with decrypted data

## API Endpoints

### POST /api/saveFormData
Save and encrypt form data
- Request body: `{ data: { firstName, email }, expiryDays: 7 }`
- Response: `{ encryptedData, iv, expiryDate }`

### POST /api/getFormData
Load and decrypt form data
- Request body: `{ encryptedData, iv }`
- Response: `{ data: { firstName, email } }`

## Limitations

- This is a prototype application and not intended for production use
- The encryption key is hardcoded for demonstration purposes
- Error handling is basic and would need enhancement for production
- No user authentication or session management implemented