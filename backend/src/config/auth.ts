import 'dotenv/config';

export const authConfig = {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    saltRounds: 10,
    verificationTokenExpiresIn: '24h',
    resetPasswordTokenExpiresIn: '1h'
}; 