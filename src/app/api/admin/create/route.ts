// API Route para crear usuario administrador
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { adminKey } = await request.json();
    
    // Clave secreta para crear admin (solo tú la conoces)
    if (adminKey !== 'BARULOGIX_ADMIN_2025_SECRET') {
      return NextResponse.json(
        { error: 'Clave de administrador incorrecta' },
        { status: 401 }
      );
    }

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: 'admin@barulogix.com' });
    if (existingAdmin) {
      return NextResponse.json(
        { message: 'Usuario administrador ya existe', credentials: {
          email: 'admin@barulogix.com',
          password: 'BaruAdmin2025!'
        }},
        { status: 200 }
      );
    }

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('BaruAdmin2025!', 12);
    
    const adminUser = new User({
      name: 'Administrador BaruLogix',
      email: 'admin@barulogix.com',
      password: hashedPassword,
      role: 'admin',
      company: 'BaruLogix',
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
        features: {
          unlimitedDeliveries: true,
          unlimitedConductors: true,
          advancedReports: true,
          apiAccess: true,
          prioritySupport: true,
          customBranding: true
        }
      },
      permissions: {
        canViewAll: true,
        canEditAll: true,
        canDeleteAll: true,
        canManageUsers: true,
        canManageSettings: true,
        canAccessReports: true,
        canManagePayments: true
      }
    });

    await adminUser.save();

    return NextResponse.json({
      message: 'Usuario administrador creado exitosamente',
      credentials: {
        email: 'admin@barulogix.com',
        password: 'BaruAdmin2025!',
        role: 'admin',
        features: 'Acceso completo sin restricciones'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creando admin:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

