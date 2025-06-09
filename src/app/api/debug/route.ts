// API de diagnóstico profundo para identificar errores específicos
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const diagnostico = {
        timestamp: new Date().toISOString(),
        variables: {},
        mongodb: {},
        errores: [],
        detalles: {}
    };

    try {
        // 1. Verificar variables de entorno
        diagnostico.variables = {
            MONGODB_URI: process.env.MONGODB_URI ? 'DEFINIDA' : 'NO DEFINIDA',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NO DEFINIDA',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINIDA' : 'NO DEFINIDA',
            JWT_SECRET: process.env.JWT_SECRET ? 'DEFINIDA' : 'NO DEFINIDA',
            NODE_ENV: process.env.NODE_ENV || 'NO DEFINIDA'
        };

        // 2. Verificar si las variables críticas existen
        if (!process.env.MONGODB_URI) {
            diagnostico.errores.push('MONGODB_URI no está definida');
            return NextResponse.json(diagnostico, { status: 500 });
        }

        // 3. Intentar importar MongoDB
        try {
            const { MongoClient } = await import('mongodb');
            diagnostico.mongodb.importacion = 'EXITOSA';
            
            // 4. Intentar crear cliente
            const client = new MongoClient(process.env.MONGODB_URI);
            diagnostico.mongodb.clienteCreado = 'EXITOSO';
            
            // 5. Intentar conectar
            await client.connect();
            diagnostico.mongodb.conexion = 'EXITOSA';
            
            // 6. Verificar base de datos
            const db = client.db('barulogix');
            diagnostico.mongodb.baseDatos = 'ACCESIBLE';
            
            // 7. Listar colecciones
            const collections = await db.listCollections().toArray();
            diagnostico.mongodb.colecciones = collections.map(c => c.name);
            
            // 8. Verificar colección de usuarios
            const usersCollection = db.collection('users');
            const userCount = await usersCollection.countDocuments();
            diagnostico.mongodb.totalUsuarios = userCount;
            
            // 9. Verificar usuario admin
            const adminUser = await usersCollection.findOne({ email: 'admin@barulogix.com' });
            diagnostico.mongodb.usuarioAdmin = adminUser ? 'EXISTE' : 'NO EXISTE';
            
            await client.close();
            diagnostico.mongodb.conexionCerrada = 'EXITOSA';
            
        } catch (mongoError) {
            diagnostico.mongodb.error = {
                name: mongoError.name,
                message: mongoError.message,
                stack: mongoError.stack?.split('\n').slice(0, 5) // Primeras 5 líneas del stack
            };
            diagnostico.errores.push(`Error MongoDB: ${mongoError.message}`);
        }

        // 10. Probar importaciones críticas
        try {
            await import('bcryptjs');
            diagnostico.detalles.bcryptjs = 'DISPONIBLE';
        } catch (err) {
            diagnostico.detalles.bcryptjs = `ERROR: ${err.message}`;
        }

        try {
            await import('jsonwebtoken');
            diagnostico.detalles.jsonwebtoken = 'DISPONIBLE';
        } catch (err) {
            diagnostico.detalles.jsonwebtoken = `ERROR: ${err.message}`;
        }

        // 11. Verificar estructura de archivos críticos
        try {
            await import('@/lib/mongodb');
            diagnostico.detalles.libMongodb = 'DISPONIBLE';
        } catch (err) {
            diagnostico.detalles.libMongodb = `ERROR: ${err.message}`;
        }

        try {
            await import('@/lib/models');
            diagnostico.detalles.libModels = 'DISPONIBLE';
        } catch (err) {
            diagnostico.detalles.libModels = `ERROR: ${err.message}`;
        }

        return NextResponse.json(diagnostico, { 
            status: diagnostico.errores.length > 0 ? 500 : 200 
        });

    } catch (error) {
        diagnostico.errores.push(`Error general: ${error.message}`);
        diagnostico.detalles.errorGeneral = {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5)
        };
        return NextResponse.json(diagnostico, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        
        if (action === 'test-register') {
            // Simular el proceso de registro paso a paso
            const resultado = {
                pasos: {},
                errores: []
            };

            try {
                // Paso 1: Importar dependencias
                const { MongoClient } = await import('mongodb');
                const bcrypt = await import('bcryptjs');
                resultado.pasos.importaciones = 'EXITOSO';

                // Paso 2: Conectar a MongoDB
                const client = new MongoClient(process.env.MONGODB_URI!);
                await client.connect();
                resultado.pasos.conexionMongoDB = 'EXITOSO';

                // Paso 3: Acceder a la base de datos
                const db = client.db('barulogix');
                const usersCollection = db.collection('users');
                resultado.pasos.accesoBaseDatos = 'EXITOSO';

                // Paso 4: Verificar si el usuario ya existe
                const existingUser = await usersCollection.findOne({ email: 'test@test.com' });
                resultado.pasos.verificacionUsuario = existingUser ? 'USUARIO_EXISTE' : 'USUARIO_NO_EXISTE';

                // Paso 5: Hash de contraseña
                const hashedPassword = await bcrypt.hash('Test123!', 12);
                resultado.pasos.hashPassword = 'EXITOSO';

                // Paso 6: Crear usuario (solo si no existe)
                if (!existingUser) {
                    const newUser = await usersCollection.insertOne({
                        name: 'Test User',
                        email: 'test@test.com',
                        password: hashedPassword,
                        role: 'user',
                        isActive: true,
                        subscription: 'basic',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    resultado.pasos.creacionUsuario = 'EXITOSO';
                    resultado.pasos.userId = newUser.insertedId.toString();
                } else {
                    resultado.pasos.creacionUsuario = 'OMITIDO_USUARIO_EXISTE';
                }

                await client.close();
                resultado.pasos.cierreConexion = 'EXITOSO';

                return NextResponse.json({ 
                    success: true, 
                    resultado 
                });

            } catch (error) {
                resultado.errores.push({
                    paso: 'ERROR_EN_PROCESO',
                    error: error.message,
                    stack: error.stack?.split('\n').slice(0, 3)
                });

                return NextResponse.json({ 
                    success: false, 
                    resultado 
                }, { status: 500 });
            }
        }
        
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}

