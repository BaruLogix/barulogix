// API Route para registro de usuarios
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { User } from '@/lib/models';
import { hashPassword, isValidEmail, isValidPassword, sanitizeString, createSuccessResponse, createErrorResponse } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email, password, name, company } = await request.json();
    
    // Validaciones básicas
    if (!email || !password || !name) {
      return NextResponse.json(
        createErrorResponse('Email, contraseña y nombre son requeridos'),
        { status: 400 }
      );
    }
    
    if (!isValidEmail(email)) {
      return NextResponse.json(
        createErrorResponse('Email inválido'),
        { status: 400 }
      );
    }
    
    if (!isValidPassword(password)) {
      return NextResponse.json(
        createErrorResponse('La contraseña debe tener al menos 6 caracteres, incluyendo letras y números'),
        { status: 400 }
      );
    }
    
    if (name.trim().length < 2) {
      return NextResponse.json(
        createErrorResponse('El nombre debe tener al menos 2 caracteres'),
        { status: 400 }
      );
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        createErrorResponse('Ya existe un usuario con este email'),
        { status: 409 }
      );
    }
    
    // Hashear contraseña
    const hashedPassword = await hashPassword(password);
    
    // Crear usuario
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: sanitizeString(name),
      company: company ? sanitizeString(company) : undefined,
      role: 'user', // Por defecto todos son usuarios normales
      subscriptionStatus: 'pending' // Requiere pago para activar
    });
    
    await newUser.save();
    
    // Respuesta exitosa (sin incluir la contraseña)
    const userData = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      company: newUser.company,
      role: newUser.role,
      subscriptionStatus: newUser.subscriptionStatus
    };
    
    return NextResponse.json(
      createSuccessResponse(userData, 'Usuario registrado exitosamente. Procede con el pago para activar tu cuenta.'),
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error en registro:', error);
    
    // Manejar errores de duplicación de MongoDB
    if ((error as any).code === 11000) {
      return NextResponse.json(
        createErrorResponse('Ya existe un usuario con este email'),
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

