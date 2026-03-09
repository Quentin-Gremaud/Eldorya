import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SigninFormData = z.infer<typeof signinSchema>;
