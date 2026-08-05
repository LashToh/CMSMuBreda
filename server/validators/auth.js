import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9]{4,10}$/, 'Username must be 4–10 alphanumeric characters.'),
    password: z.string().min(4, 'Password must be 4–20 characters.').max(20),
    confirmPassword: z.string(),
    email: z.string().trim().email('Invalid email address.').max(50),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required.').max(10),
  password: z.string().min(1, 'Password is required.').max(20),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(4).max(20),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address.').max(50),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(16),
    newPassword: z.string().min(4).max(20),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
