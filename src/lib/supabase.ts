import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Tipos de datos para TypeScript
export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  isActive: boolean
  subscription: 'basic' | 'premium' | 'enterprise'
  company?: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface Conductor {
  id: string
  userId: string
  name: string
  phone: string
  vehicleType: string
  licensePlate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Delivery {
  id: string
  userId: string
  conductorId?: string
  trackingNumber: string
  recipient: string
  address: string
  phone: string
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'returned'
  platform: 'shein' | 'temu' | 'dropi' | 'other'
  notes?: string
  createdAt: string
  updatedAt: string
  deliveredAt?: string
}

