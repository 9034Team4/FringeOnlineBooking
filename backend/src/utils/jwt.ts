import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
/*
  create token
*/
export function generateToken(payload: object): string {
  return jwt.sign(payload, authConfig.jwtSecret);
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, authConfig.jwtSecret);
  } catch (error) {
    throw new Error('Invalid token');
  }
}
