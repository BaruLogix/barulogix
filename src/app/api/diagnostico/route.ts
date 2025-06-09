// API Route de diagnóstico para BaruLogix en Vercel
// Este endpoint nos permitirá diagnosticar el problema directamente en producción

import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
    const diagnostico = {
        timestamp: new Date().toISOString(),
        variables: {},
        mongodb: {},
        errores: []
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

        // 2. Verificar conexión a MongoDB
        if (!process.env.MONGODB_URI) {
            diagnostico.errores.push('MONGODB_URI no está definida');
            return NextResponse.json(diagnostico, { status: 500 });
        }

        const client = new MongoClient(process.env.MONGODB_URI);
        
        try {
            await client.connect();
            diagnostico.mongodb.conexion = 'EXITOSA';
            
            const db = client.db('barulogix');
            const collections = await db.listCollections().toArray();
            diagnostico.mongodb.colecciones = collections.map(c => c.name);
            
            // Verificar usuario admin
            const usersCollection = db.collection('users');
            const adminUser = await usersCollection.findOne({ email: 'admin@barulogix.com' });
            
            if (adminUser) {
                diagnostico.mongodb.usuarioAdmin = 'EXISTE';
                diagnostico.mongodb.adminId = adminUser._id.toString();
            } else {
                diagnostico.mongodb.usuarioAdmin = 'NO EXISTE';
                
                // Crear usuario admin
                const hashedPassword = await bcrypt.hash('BaruAdmin2025!', 12);
                const result = await usersCollection.insertOne({
                    name: 'Administrador BaruLogix',
                    email: 'admin@barulogix.com',
                    password: hashedPassword,
                    role: 'admin',
                    isActive: true,
                    subscription: 'enterprise',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                diagnostico.mongodb.usuarioAdmin = 'CREADO';
                diagnostico.mongodb.adminId = result.insertedId.toString();
            }
            
            // Contar usuarios totales
            const totalUsers = await usersCollection.countDocuments();
            diagnostico.mongodb.totalUsuarios = totalUsers;
            
            await client.close();
            diagnostico.mongodb.conexionCerrada = 'EXITOSA';
            
        } catch (mongoError) {
            diagnostico.mongodb.error = {
                name: mongoError.name,
                message: mongoError.message
            };
            diagnostico.errores.push(`Error MongoDB: ${mongoError.message}`);
        }

        // 3. Verificar configuración de NextAuth
        diagnostico.nextauth = {
            urlCorrecta: process.env.NEXTAUTH_URL === 'https://barulogix.vercel.app',
            secretLongitud: process.env.NEXTAUTH_SECRET ? process.env.NEXTAUTH_SECRET.length : 0
        };

        return NextResponse.json(diagnostico, { 
            status: diagnostico.errores.length > 0 ? 500 : 200 
        });

    } catch (error) {
        diagnostico.errores.push(`Error general: ${error.message}`);
        return NextResponse.json(diagnostico, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { action } = await request.json();
        
        if (action === 'test-login') {
            // Probar login del usuario admin
            const client = new MongoClient(process.env.MONGODB_URI!);
            await client.connect();
            
            const db = client.db('barulogix');
            const usersCollection = db.collection('users');
            
            const adminUser = await usersCollection.findOne({ email: 'admin@barulogix.com' });
            
            if (!adminUser) {
                await client.close();
                return NextResponse.json({ 
                    success: false, 
                    error: 'Usuario admin no encontrado' 
                }, { status: 404 });
            }
            
            const passwordMatch = await bcrypt.compare('BaruAdmin2025!', adminUser.password);
            
            await client.close();
            
            return NextResponse.json({ 
                success: passwordMatch,
                userExists: true,
                passwordMatch,
                userId: adminUser._id.toString()
            });
        }
        
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
        
    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}

