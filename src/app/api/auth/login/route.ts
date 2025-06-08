// API Route para autenticación - Login
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { verifyPassword, generateToken, isValidEmail, createSuccessResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password } = await request.json();
    
    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        createErrorResponse('Email y contraseña son requeridos'),
        { status: 400 }
      );
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json(
        createErrorResponse('Email inválido'),
        { status: 400 }
      );
    }
    
    // Buscar usuario
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        createErrorResponse('Credenciales inválidas'),
        { status: 401 }
      );
    }
    
    // Verificar contraseña
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        createErrorResponse('Credenciales inválidas'),
        { status: 401 }
      );
    }
    
    // Verificar estado de suscripción
    if (user.subscriptionStatus !== 'active') {
      return NextResponse.json(
        createErrorResponse('Suscripción inactiva. Por favor, renueva tu suscripción.'),
        { status: 403 }
      );
    }
    
    // Verificar si la suscripción ha expirado
    if (user.subscriptionExpiry && new Date() > user.subscriptionExpiry) {
      // Actualizar estado a inactivo
      await User.findByIdAndUpdate(user._id, { subscriptionStatus: 'inactive' });
      return NextResponse.json(
        createErrorResponse('Suscripción expirada. Por favor, renueva tu suscripción.'),
        { status: 403 }
      );
    }
    
    // Generar token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role
    });
    
    // Respuesta exitosa
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionExpiry: user.subscriptionExpiry,
      company: user.company
    };
    
    return NextResponse.json(
      createSuccessResponse({ user: userData, token }, 'Login exitoso'),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error en login:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

