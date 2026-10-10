import { z } from 'zod';

/** Accepts 0771234567, +263771234567 or 263771234567 and returns the 10-digit local form. */
export function normaliseZimPhone(input: string): string | null {
  let v = input.replace(/[\s\-()]/g, '');
  if (v.startsWith('+263')) v = '0' + v.slice(4);
  else if (v.startsWith('263') && v.length === 12) v = '0' + v.slice(3);
  return /^0\d{9}$/.test(v) ? v : null;
}

export const addressSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().min(7, 'Enter a phone number we can reach you on'),
  line1: z.string().trim().min(3, 'Enter your street address'),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Enter your city'),
  region: z.string().trim().min(2, 'Enter your province or state'),
  postal_code: z.string().trim().optional(),
  country: z.string().trim().min(2, 'Enter your country'),
});

export type Address = z.infer<typeof addressSchema>;

export const EMPTY_ADDRESS: Address = {
  full_name: '',
  email: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  region: '',
  postal_code: '',
  country: 'Zimbabwe',
};

export const PAYMENT_METHODS = [
  {
    value: 'paynow',
    label: 'Visa, Mastercard or other',
    short: 'Card',
    hint: 'You pay on Paynow\'s secure page. Card details are entered there, never on this site.',
  },
  { value: 'ecocash', label: 'Ecocash', short: 'Ecocash', hint: 'You approve the payment on your phone with your PIN.' },
  { value: 'onemoney', label: 'OneMoney', short: 'OneMoney', hint: 'You approve the payment on your phone with your PIN.' },
] as const;

export const checkoutSchema = z
  .object({
    address: addressSchema,
    paymentMethod: z.enum(['ecocash', 'onemoney', 'paynow']),
    mobileNumber: z.string().trim().optional(),
    couponCode: z.string().nullable().optional(),
    items: z
      .array(
        z.object({
          variantId: z.string().min(1),
          quantity: z.number().int().min(1).max(10),
        }),
      )
      .min(1)
      .max(20),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMethod !== 'paynow' && !normaliseZimPhone(value.mobileNumber ?? '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['mobileNumber'],
        message: 'Enter the mobile money number, for example 0771234567',
      });
    }
  });

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password').max(200),
});

export const signupSchema = z.object({
  full_name: z.string().trim().min(2, 'Enter your full name').max(100),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
});

const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v.startsWith('https://') || v.startsWith('/'), 'Image links must start with https://');

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter a product name').max(120),
  slug: z
    .string()
    .trim()
    .min(2, 'Enter a web address for the product')
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'The web address can only use lowercase letters, numbers and dashes'),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().min(0, 'Price cannot be negative').max(100000),
  is_drop: z.boolean(),
  is_active: z.boolean(),
  drop_at: z
    .string()
    .trim()
    .nullable()
    .optional()
    .refine((v) => !v || !Number.isNaN(new Date(v).getTime()), 'Enter a valid drop date'),
  variants: z
    .array(
      z.object({
        id: z.string().optional(),
        size: z.string().trim().min(1, 'Every size needs a name').max(20),
        color: z.string().trim().min(1, 'Every variant needs a colour').max(30),
        stock_quantity: z.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(100000),
        /** What the form loaded. When present, the save adds the difference, so sales made meanwhile are not undone. */
        stock_before: z.number().int().min(0).max(1000000).optional(),
        sku: z.string().trim().max(60).nullable().optional(),
      }),
    )
    .min(1, 'Add at least one size')
    .max(30),
  images: z.array(z.object({ image_url: imageUrl })).max(12),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'shipped', 'delivered', 'cancelled']),
});

export const forgotSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
});

export const resetSchema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
});
