import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const userRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().regex(passwordRegex, {
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
  }),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  name: z.string().optional()
});

export const userLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const resetPasswordRequestSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().regex(passwordRegex, {
    message: 'Password must be at least 8 characters long and contain uppercase, lowercase, number and special character'
  })
});

export const verifyEmailSchema = z.object({
  token: z.string()
}); 