// API Route para gestión de conductores
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Conductor, Delivery } from '@/lib/models';
import { extractTokenFromRequest, verifyToken, sanitizeString, createSuccessResponse, createErrorResponse } from '@/lib/utils';

// Middleware para verificar autenticación
async function verifyAuth(request: NextRequest) {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return null;
  }
  
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return null;
  }
  
  return decoded;
}

// GET - Obtener todos los conductores del usuario
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        createErrorResponse('Token inválido o expirado'),
        { status: 401 }
      );
    }
    
    const conductors = await Conductor.find({ 
      userId: auth.userId,
      isActive: true 
    }).sort({ name: 1 });
    
    return NextResponse.json(
      createSuccessResponse(conductors),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error obteniendo conductores:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

// POST - Crear nuevo conductor
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        createErrorResponse('Token inválido o expirado'),
        { status: 401 }
      );
    }
    
    const { name, phone, email } = await request.json();
    
    // Validaciones
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        createErrorResponse('El nombre del conductor es requerido (mínimo 2 caracteres)'),
        { status: 400 }
      );
    }
    
    // Verificar si ya existe un conductor con ese nombre para este usuario
    const existingConductor = await Conductor.findOne({
      userId: auth.userId,
      name: sanitizeString(name),
      isActive: true
    });
    
    if (existingConductor) {
      return NextResponse.json(
        createErrorResponse('Ya existe un conductor con ese nombre'),
        { status: 409 }
      );
    }
    
    // Crear conductor
    const newConductor = new Conductor({
      name: sanitizeString(name),
      userId: auth.userId,
      phone: phone ? sanitizeString(phone) : undefined,
      email: email ? sanitizeString(email.toLowerCase()) : undefined
    });
    
    await newConductor.save();
    
    return NextResponse.json(
      createSuccessResponse(newConductor, 'Conductor registrado exitosamente'),
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creando conductor:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

// DELETE - Eliminar conductor
export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        createErrorResponse('Token inválido o expirado'),
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const conductorId = searchParams.get('id');
    const deleteDeliveries = searchParams.get('deleteDeliveries') === 'true';
    
    if (!conductorId) {
      return NextResponse.json(
        createErrorResponse('ID del conductor es requerido'),
        { status: 400 }
      );
    }
    
    // Verificar que el conductor pertenece al usuario
    const conductor = await Conductor.findOne({
      _id: conductorId,
      userId: auth.userId
    });
    
    if (!conductor) {
      return NextResponse.json(
        createErrorResponse('Conductor no encontrado'),
        { status: 404 }
      );
    }
    
    // Si se solicita eliminar entregas, eliminarlas
    if (deleteDeliveries) {
      await Delivery.deleteMany({
        userId: auth.userId,
        conductor: conductor.name
      });
    }
    
    // Marcar conductor como inactivo en lugar de eliminarlo
    await Conductor.findByIdAndUpdate(conductorId, { isActive: false });
    
    return NextResponse.json(
      createSuccessResponse(null, 'Conductor eliminado exitosamente'),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error eliminando conductor:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

