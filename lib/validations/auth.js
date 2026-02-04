import { z } from 'zod';

// Common disposable and invalid email domains to block
const invalidEmailDomains = [
  'test.com', 'example.com', 'test.test', 'abc.com', 'xyz.com',
  'temp-mail.org', 'guerrillamail.com', 'mailinator.com', '10minutemail.com',
  'throwaway.email', 'tempmail.com', 'fakeinbox.com', 'trashmail.com'
];

// Email validation helper
const isValidBusinessEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  
  // Check if domain exists
  if (!domain) return false;
  
  // Block invalid domains
  if (invalidEmailDomains.includes(domain)) return false;
  
  // Block generic patterns
  if (/^(test|demo|sample|example|fake|dummy)/.test(domain)) return false;
  
  // Require proper domain structure
  if (!domain.includes('.') || domain.split('.').length < 2) return false;
  
  // Block single letter domains
  const domainParts = domain.split('.');
  if (domainParts[0].length === 1 || domainParts[1].length === 1) return false;
  
  return true;
};

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine(isValidBusinessEmail, 'Please use a valid business email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

// Password strength calculation
export const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  
  let score = 0;
  
  // Length bonus
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 2; // Special characters worth more
  
  // Penalty for common patterns
  if (/^(password|123456|qwerty|abc123)/i.test(password)) score -= 3;
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  
  // Ensure score is between 0 and 10
  score = Math.max(0, Math.min(10, score));
  
  // Map score to strength label
  if (score <= 3) return { score, label: 'Weak', color: 'bg-red-500' };
  if (score <= 5) return { score, label: 'Fair', color: 'bg-orange-500' };
  if (score <= 7) return { score, label: 'Good', color: 'bg-yellow-500' };
  if (score <= 8) return { score, label: 'Strong', color: 'bg-emerald-500' };
  return { score, label: 'Very Strong', color: 'bg-green-600' };
};

// Signup validation schema
export const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(255, 'Email is too long')
    .refine(isValidBusinessEmail, 'Please use a valid business or professional email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// KYC validation schemas
export const businessDetailsSchema = z.object({
  businessName: z
    .string()
    .min(1, 'Business name is required')
    .min(2, 'Business name must be at least 2 characters')
    .max(200, 'Business name is too long'),
  industry: z
    .string()
    .min(1, 'Industry is required'),
  businessType: z
    .string()
    .min(1, 'Business type is required'),
  registrationNumber: z
    .string()
    .optional(),
  website: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .min(1, 'Address is required')
    .min(5, 'Please enter a complete address'),
  city: z
    .string()
    .min(1, 'City is required'),
  state: z
    .string()
    .min(1, 'State/Province is required'),
  zipCode: z
    .string()
    .min(1, 'ZIP/Postal code is required')
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid ZIP/Postal code format'),
  country: z
    .string()
    .min(1, 'Country is required'),
  phone: z
    .string()
    .min(1, 'Phone number is required')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
});

export const businessMetricsSchema = z.object({
  annualRevenue: z
    .string()
    .min(1, 'Annual revenue is required'),
  numberOfEmployees: z
    .string()
    .min(1, 'Number of employees is required'),
  numberOfLocations: z
    .number()
    .min(1, 'Must have at least 1 location')
    .max(10000, 'Number of locations is too high'),
  averageTransactionValue: z
    .number()
    .min(0, 'Average transaction value must be positive')
    .optional(),
  customerBase: z
    .number()
    .min(0, 'Customer base must be positive')
    .optional(),
});

export const businessGoalsSchema = z.object({
  primaryGoals: z
    .array(z.string())
    .min(1, 'Please select at least one primary goal')
    .max(5, 'Please select up to 5 goals'),
  timeframe: z
    .string()
    .min(1, 'Timeframe is required'),
  specificChallenges: z
    .string()
    .max(1000, 'Description is too long')
    .optional(),
});

// Complete KYC schema
export const kycSchema = z.object({
  businessProfile: businessDetailsSchema.merge(businessMetricsSchema).merge(businessGoalsSchema),
});
