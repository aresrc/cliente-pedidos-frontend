import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  icon?: LucideIcon;
  'data-ai-hint'?: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface MenuCategory {
  name: string;
  icon?: LucideIcon;
  items: MenuItem[];
}

export interface MenuData {
  categories: MenuCategory[];
}

// KDS Specific Types
export interface KDSOrderItem {
  id: string; // Original menu item ID
  name: string;
  quantity: number;
  price: number; // Price per unit
}

export type KDSOrderStatus = 'pending' | 'preparing' | 'ready' | 'served';

export interface KDSOrder {
  id: string; // Unique ID for the KDS order (e.g., timestamp)
  items: KDSOrderItem[];
  totalCost: number;
  timestamp: string; // ISO string for when the order was placed
  status: KDSOrderStatus;
  servedAt?: string; // ISO string for when the order was marked as served
  tableNumber?: string; // Assigned table number
}

// Receipt Specific Types
export interface ConsolidatedReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  items: ConsolidatedReceiptItem[];
  grandTotal: number;
  tableNumber?: string;
  orderIds: string[]; // Short IDs of orders included
  date: string; // Formatted date string
  restaurantName?: string;
  receiptTitle?: string;
}
