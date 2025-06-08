// API Route para gestión de entregas
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Delivery, Conductor } from '@/lib/models';
import { extractTokenFromRequest, verifyToken, isValidTracking, sanitizeString, createSuccessResponse, createErrorResponse } from '@/lib/utils';

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

// GET - Obtener entregas con filtros
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
    
    const { searchParams } = new URL(request.url);
    const conductor = searchParams.get('conductor');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tracking = searchParams.get('tracking');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Construir filtros
    const filters: any = { userId: auth.userId };
    
    if (conductor) filters.conductor = conductor;
    if (status !== null && status !== '') filters.status = parseInt(status);
    if (type) filters.type = type;
    if (tracking) filters.tracking = new RegExp(tracking, 'i');
    
    if (startDate && endDate) {
      filters.deliveryDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Ejecutar consulta con paginación
    const skip = (page - 1) * limit;
    const deliveries = await Delivery.find(filters)
      .sort({ deliveryDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Delivery.countDocuments(filters);
    
    return NextResponse.json(
      createSuccessResponse({
        deliveries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error obteniendo entregas:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

// POST - Crear nuevas entregas (masivo)
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
    
    const { conductor, type, deliveryDate, packages } = await request.json();
    
    // Validaciones básicas
    if (!conductor || !type || !deliveryDate || !packages || !Array.isArray(packages)) {
      return NextResponse.json(
        createErrorResponse('Conductor, tipo, fecha de entrega y paquetes son requeridos'),
        { status: 400 }
      );
    }
    
    if (!['Shein/Temu', 'Dropi'].includes(type)) {
      return NextResponse.json(
        createErrorResponse('Tipo de paquete inválido'),
        { status: 400 }
      );
    }
    
    // Verificar que el conductor existe
    const conductorExists = await Conductor.findOne({
      userId: auth.userId,
      name: conductor,
      isActive: true
    });
    
    if (!conductorExists) {
      return NextResponse.json(
        createErrorResponse('Conductor no encontrado'),
        { status: 404 }
      );
    }
    
    // Validar fecha
    const deliveryDateObj = new Date(deliveryDate);
    if (isNaN(deliveryDateObj.getTime())) {
      return NextResponse.json(
        createErrorResponse('Fecha de entrega inválida'),
        { status: 400 }
      );
    }
    
    // Procesar paquetes
    const deliveriesToCreate = [];
    const duplicates = [];
    const errors = [];
    
    for (const pkg of packages) {
      const { tracking, value } = pkg;
      
      // Validar tracking
      if (!tracking || !isValidTracking(tracking)) {
        errors.push(`Tracking inválido: ${tracking}`);
        continue;
      }
      
      // Verificar duplicados en la base de datos
      const existingDelivery = await Delivery.findOne({
        userId: auth.userId,
        tracking: tracking.trim()
      });
      
      if (existingDelivery) {
        duplicates.push(tracking);
        continue;
      }
      
      // Validar valor para Dropi
      let packageValue = 0;
      if (type === 'Dropi') {
        packageValue = parseFloat(value) || 0;
        if (packageValue < 0) {
          errors.push(`Valor inválido para ${tracking}: ${value}`);
          continue;
        }
      }
      
      deliveriesToCreate.push({
        tracking: tracking.trim(),
        conductor: sanitizeString(conductor),
        type,
        deliveryDate: deliveryDateObj,
        value: packageValue,
        userId: auth.userId,
        status: 0 // No entregado por defecto
      });
    }
    
    // Si hay errores críticos, retornar
    if (errors.length > 0 && deliveriesToCreate.length === 0) {
      return NextResponse.json(
        createErrorResponse('Errores en los datos', errors.join(', ')),
        { status: 400 }
      );
    }
    
    // Crear entregas
    let createdDeliveries = [];
    if (deliveriesToCreate.length > 0) {
      createdDeliveries = await Delivery.insertMany(deliveriesToCreate);
    }
    
    // Respuesta con resumen
    const response = {
      created: createdDeliveries.length,
      duplicates: duplicates.length,
      errors: errors.length,
      duplicateTrackings: duplicates,
      errorMessages: errors
    };
    
    return NextResponse.json(
      createSuccessResponse(response, `Se crearon ${createdDeliveries.length} entregas exitosamente`),
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Error creando entregas:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de entregas
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        createErrorResponse('Token inválido o expirado'),
        { status: 401 }
      );
    }
    
    const { trackings, status, conductor } = await request.json();
    
    // Validaciones
    if (!trackings || !Array.isArray(trackings) || trackings.length === 0) {
      return NextResponse.json(
        createErrorResponse('Lista de trackings es requerida'),
        { status: 400 }
      );
    }
    
    if (![0, 1, 2].includes(status)) {
      return NextResponse.json(
        createErrorResponse('Estado inválido (0=no entregado, 1=entregado, 2=devuelto)'),
        { status: 400 }
      );
    }
    
    // Construir filtros
    const filters: any = {
      userId: auth.userId,
      tracking: { $in: trackings.map(t => t.trim()) }
    };
    
    if (conductor) {
      filters.conductor = conductor;
    }
    
    // Actualizar entregas
    const updateData: any = { status };
    
    // Si es devolución, actualizar fecha a hoy
    if (status === 2) {
      updateData.deliveryDate = new Date();
    }
    
    const result = await Delivery.updateMany(filters, updateData);
    
    return NextResponse.json(
      createSuccessResponse(
        { updated: result.modifiedCount },
        `Se actualizaron ${result.modifiedCount} entregas`
      ),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error actualizando entregas:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

// DELETE - Eliminar entregas
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
    const trackings = searchParams.get('trackings')?.split(',') || [];
    
    if (trackings.length === 0) {
      return NextResponse.json(
        createErrorResponse('Lista de trackings es requerida'),
        { status: 400 }
      );
    }
    
    const result = await Delivery.deleteMany({
      userId: auth.userId,
      tracking: { $in: trackings.map(t => t.trim()) }
    });
    
    return NextResponse.json(
      createSuccessResponse(
        { deleted: result.deletedCount },
        `Se eliminaron ${result.deletedCount} entregas`
      ),
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error eliminando entregas:', error);
    return NextResponse.json(
      createErrorResponse('Error interno del servidor'),
      { status: 500 }
    );
  }
}

