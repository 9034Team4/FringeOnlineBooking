// bootstrap.ts
require('reflect-metadata');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config();

// Common settings
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

// Jest globalSetup function - must be exported as default
module.exports = async function() {
  console.log('Test environment initialization completed');
  return null;
}; 