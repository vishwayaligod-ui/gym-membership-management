import { z } from "zod";

export const ownerSignupSchema = z
  .object({
    gymName: z.string().trim().min(1, "Gym name is required"),
    ownerFullName: z.string().trim().min(1, "Owner name is required"),
    email: z.string().trim().min(1, "Email is required").email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type OwnerSignupInput = z.infer<typeof ownerSignupSchema>;
