import { z } from "zod";

export const signupSchema = z.object({
  emailAddress: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  ageConfirmed: z.literal(true, {
    message: "You must confirm you are 16 years or older",
  }),
});

export type SignupFormData = z.infer<typeof signupSchema>;
