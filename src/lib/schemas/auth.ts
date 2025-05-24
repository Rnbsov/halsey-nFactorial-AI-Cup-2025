import * as z from 'zod';

// Zod schema and type for signup form values
export const signupFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"], 
});
export type SignupFormValues = z.infer<typeof signupFormSchema>;

// Zod schema and type for login form values
export const loginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>; 