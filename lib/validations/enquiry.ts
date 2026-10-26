import { z } from "zod";

export function normalizeIndianMobileNumber(value: string): string | null {
  const compact = value.trim().replace(/[\s().-]/g, "");
  const digits = compact.replace(/^\+/, "");
  const nationalNumber =
    digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits;

  return /^[6-9]\d{9}$/.test(nationalNumber) ? nationalNumber : null;
}

const mobileNumberSchema = z
  .string()
  .trim()
  .min(1, "Mobile number is required")
  .transform((value) => normalizeIndianMobileNumber(value))
  .refine((value): value is string => value !== null, {
    message: "Enter a valid 10-digit Indian mobile number",
  });

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Use a valid date");

export const createEnquirySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
    mobileNumber: mobileNumberSchema,
    nextFollowUpDate: dateStringSchema,
    notes: z.string().trim().max(2000).optional().default(""),
  })
  .strict();

export const updateEnquirySchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(100).optional(),
    mobileNumber: mobileNumberSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const enquiryFollowUpSchema = z
  .object({
    outcome: z.enum([
      "CONTACTED",
      "NO_ANSWER",
      "CALLBACK_REQUESTED",
      "CONVERTED",
      "NOT_INTERESTED",
    ]),
    notes: z.string().trim().max(2000).optional().default(""),
    nextFollowUpDate: dateStringSchema.optional(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.outcome === "CALLBACK_REQUESTED" && !value.nextFollowUpDate) {
      context.addIssue({
        code: "custom",
        path: ["nextFollowUpDate"],
        message: "A next follow-up date is required for a callback",
      });
    }

    if (
      (value.outcome === "CONVERTED" || value.outcome === "NOT_INTERESTED") &&
      value.nextFollowUpDate
    ) {
      context.addIssue({
        code: "custom",
        path: ["nextFollowUpDate"],
        message: "Closed enquiries cannot have a next follow-up date",
      });
    }
  });

export const enquiryListQuerySchema = z.object({
  bucket: z.enum(["today", "overdue", "upcoming", "all"]).default("all"),
  status: z.enum(["PENDING", "CONTACTED", "CONVERTED", "NOT_INTERESTED"]).optional(),
  search: z.string().trim().max(100).default(""),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type EnquiryFollowUpInput = z.infer<typeof enquiryFollowUpSchema>;
