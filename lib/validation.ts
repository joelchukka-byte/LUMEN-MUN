/**
 * Request validation. These schemas are the single source of truth for what a
 * valid submission looks like — the same rules run in the server action and are
 * mirrored in the client's inline field errors, so the two can't drift.
 */

import { z } from 'zod';

const trimmed = (max: number) => z.string().trim().max(max);

const phone = trimmed(24)
  .min(8, 'Enter a contact number')
  .regex(/^[+0-9][0-9\s\-()]{7,}$/, 'Enter a valid phone number');

const email = trimmed(160).toLowerCase().pipe(z.string().email('Enter a valid email address'));

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(200, 'That password is too long');

export const GRADES = [
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
  'Undergraduate, 1st year',
  'Undergraduate, 2nd year',
  'Undergraduate, 3rd year',
  'Undergraduate, 4th year',
] as const;

export const EXPERIENCE_LEVELS = [
  'First conference',
  '1-3 conferences',
  '4-7 conferences',
  '8+ conferences',
] as const;

export const DELEGATION_SIZES = ['5-10', '11-20', '21-30', '30+'] as const;

/* ------------------------------------------------------------ individual -- */

export const individualRegistration = z
  .object({
    name: trimmed(120).min(2, 'Enter your full name'),
    email,
    phone,
    school: trimmed(160).min(2, 'Enter your school or institution'),
    grade: z.enum(GRADES, { errorMap: () => ({ message: 'Choose your grade or year' }) }),
    city: trimmed(80).optional().or(z.literal('')),
    gender: trimmed(40).optional().or(z.literal('')),
    emergencyContact: trimmed(160).optional().or(z.literal('')),

    committee1: trimmed(80).min(1, 'Choose a first preference'),
    committee2: trimmed(80).optional().or(z.literal('')),
    committee3: trimmed(80).optional().or(z.literal('')),
    countryPref1: trimmed(80).optional().or(z.literal('')),
    countryPref2: trimmed(80).optional().or(z.literal('')),
    experience: z.enum(EXPERIENCE_LEVELS).optional(),
    portfolioNote: trimmed(200).optional().or(z.literal('')),
    notes: trimmed(1000).optional().or(z.literal('')),

    accommodation: z.coerce.boolean().default(false),

    password,
    passwordConfirm: z.string(),

    /** All three mandatory forms must be agreed before payment. */
    agreeCoc: z.literal(true, { errorMap: () => ({ message: 'Agree to the code of conduct' }) }),
    agreeLiability: z.literal(true, {
      errorMap: () => ({ message: 'Agree to the liability release' }),
    }),
    agreeTechnology: z.literal(true, {
      errorMap: () => ({ message: 'Agree to the technology release' }),
    }),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm'],
  })
  .refine((v) => !v.committee2 || v.committee2 !== v.committee1, {
    message: 'Choose a different committee from your first preference',
    path: ['committee2'],
  })
  .refine((v) => !v.committee3 || (v.committee3 !== v.committee1 && v.committee3 !== v.committee2), {
    message: 'Choose a committee you have not already picked',
    path: ['committee3'],
  });

export type IndividualRegistration = z.infer<typeof individualRegistration>;

/* ---------------------------------------------------------------- school -- */

export const schoolRegistration = z.object({
  institution: trimmed(160).min(2, 'Enter the institution name'),
  coordinatorName: trimmed(120).min(2, 'Enter the coordinator’s name'),
  designation: trimmed(120).optional().or(z.literal('')),
  email,
  phone,
  sizeBand: z.enum(DELEGATION_SIZES, {
    errorMap: () => ({ message: 'Choose a delegation size' }),
  }),
  facultyCount: trimmed(20).optional().or(z.literal('')),
  accommodation: z.enum(['none', 'partial', 'full']).default('none'),
  committeeSpread: trimmed(500).optional().or(z.literal('')),
  invoicingNotes: trimmed(1000).optional().or(z.literal('')),
});

export type SchoolRegistration = z.infer<typeof schoolRegistration>;

/* ---------------------------------------------------------------- others -- */

export const contactMessage = z.object({
  name: trimmed(120).min(2, 'Enter your name'),
  email,
  topic: trimmed(80).default('Something else'),
  message: trimmed(4000).min(10, 'Tell us a little more'),
});

export const delegateLogin = z.object({
  email,
  password: z.string().min(1, 'Enter your password'),
});

export const staffLogin = z.object({
  username: trimmed(80).min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export const paymentProof = z
  .object({
    ref: trimmed(20).min(3),
    method: z.enum(['reference', 'screenshot']),
    upiTxnId: trimmed(60).optional().or(z.literal('')),
  })
  .refine((v) => v.method !== 'reference' || (v.upiTxnId && v.upiTxnId.length >= 6), {
    message: 'Enter the UPI transaction reference',
    path: ['upiTxnId'],
  });

/** Flattens a ZodError into { field: message } for the form UI. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
