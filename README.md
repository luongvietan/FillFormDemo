# FormFill - Application Demo save and load form data with AES-256 encryption

The prototype application consists of 2 parts:
- **Backend**: Node.js with Express
- **Frontend**: React with Tailwind CSS

## Main features

- Encrypt/decrypt form data with AES-256-CBC algorithm
- Store encrypted data in IndexedDB
- Manage data expiration (default 7 days)
- Simple interface with two input fields: firstName and email

## Installation

### Backend

```bash
cd backend
npm install
npm start
```

Backend will run at: http://localhost:3001

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend will run at: http://localhost:3000

## Architecture

### AES-256 Encryption

- Uses Node.js `crypto` module

- Encryption algorithm: `aes-256-cbc`
- Initialization Vector (IV): randomly generated for each encryption

- Encryption key: 32 bytes (256 bits) fixed

### Data storage

#### Backend
- Data is encrypted and saved to JSON file
- Each record includes: encrypted data, IV, expiration time

#### Frontend
- Encrypted data is stored in IndexedDB
- Database: `FormFillDB`
- ObjectStore: `formStore`
- Fixed ID: `form1`

### Expiration rule

- By default, data expires after 7 days
- Check expiration every time data is loaded
- Expired data will not be decrypted

## API Endpoints

### POST /api/save
Save and encrypt form data
- Request body: `{ data: { firstName, email }, expiryDays: 7 }`
- Response: `{ encryptedData, iv, expiryDate }`

### POST /api/load
Load and decrypt form data
- Request body: `{ encryptedData }` (optional)
- Response: `{ data: { firstName, email }, expiryDate }`

## Limitations

- This project is just a prototype, should not be used in production environment
- Hardcoded keys in code are not safe for real applications
- Saving data to file instead of database is only suitable for demo