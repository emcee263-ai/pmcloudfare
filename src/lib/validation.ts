import { z } from 'zod';

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
  country: '',
};

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'ecocash', label: 'Ecocash' },
  { value: 'paynow', label: 'Paynow' },
] as const;

export const checkoutSchema = z.object({
  address: addressSchema,
  paymentMethod: z.enum(['card', 'ecocash', 'paynow']),
  couponCode: z.string().nullable().optional(),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;
