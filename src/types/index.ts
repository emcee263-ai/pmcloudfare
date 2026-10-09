// Mirrors the PostgreSQL schema (profiles, products, product_variants,
// product_images, orders, order_items).

export type ProductKind = 'hoodie' | 'tee' | 'cap' | 'bottom';
export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  is_drop: boolean;
  /** Optional column, see supabase/extras.sql. When set, drives the countdown. */
  drop_at?: string | null;
  created_at: string;
  product_variants: ProductVariant[];
  product_images: ProductImage[];
}

export interface ShippingAddress {
  full_name: string;
  email: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  region: string;
  postal_code?: string;
  country: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_purchase: number;
  product_variants?: {
    size: string;
    color: string;
    products?: { name: string; slug: string } | null;
  } | null;
}

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_amount: number;
  shipping_address: ShippingAddress;
  created_at: string;
  order_items?: OrderItem[];
}
