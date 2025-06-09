// Script de diagnóstico para BaruLogix
// Este script verifica la conexión a MongoDB y las variables de entorno

const { MongoClient } = require('mongodb');

async function diagnosticarBaruLogix() {
    console.log('🔍 DIAGNÓSTICO COMPLETO DE BARULOGIX');
    console.log('=====================================\n');

    // 1. Verificar variables de entorno
    console.log('1. VERIFICANDO VARIABLES DE ENTORNO:');
    console.log('------------------------------------');
    
    const variablesRequeridas = [
        'MONGODB_URI',
        'NEXTAUTH_URL', 
        'NEXTAUTH_SECRET',
        'JWT_SECRET',
        'NODE_ENV'
    ];

    let variablesFaltantes = [];
    
    variablesRequeridas.forEach(variable => {
        if (process.env[variable]) {
            console.log(`✅ ${variable}: ${variable === 'MONGODB_URI' ? 'mongodb+srv://***' : process.env[variable]}`);
        } else {
            console.log(`❌ ${variable}: NO DEFINIDA`);
            variablesFaltantes.push(variable);
        }
    });

    if (variablesFaltantes.length > 0) {
        console.log(`\n🚨 PROBLEMA: Faltan ${variablesFaltantes.length} variables de entorno`);
        return false;
    }

    // 2. Verificar conexión a MongoDB
    console.log('\n2. VERIFICANDO CONEXIÓN A MONGODB:');
    console.log('----------------------------------');
    
    try {
        const mongoUri = process.env.MONGODB_URI;
        console.log('🔗 Intentando conectar a MongoDB Atlas...');
        
        const client = new MongoClient(mongoUri);
        await client.connect();
        
        console.log('✅ Conexión a MongoDB exitosa');
        
        // Verificar base de datos
        const db = client.db('barulogix');
        const collections = await db.listCollections().toArray();
        
        console.log(`📊 Base de datos 'barulogix' encontrada`);
        console.log(`📁 Colecciones disponibles: ${collections.length}`);
        
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });

        // Verificar si existe el usuario admin
        const usersCollection = db.collection('users');
        const adminUser = await usersCollection.findOne({ email: 'admin@barulogix.com' });
        
        if (adminUser) {
            console.log('👑 Usuario administrador encontrado');
        } else {
            console.log('❌ Usuario administrador NO encontrado');
            
            // Crear usuario administrador
            console.log('🔧 Creando usuario administrador...');
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('BaruAdmin2025!', 12);
            
            await usersCollection.insertOne({
                name: 'Administrador BaruLogix',
                email: 'admin@barulogix.com',
                password: hashedPassword,
                role: 'admin',
                isActive: true,
                subscription: 'enterprise',
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            console.log('✅ Usuario administrador creado exitosamente');
        }
        
        await client.close();
        console.log('🔐 Conexión cerrada correctamente');
        
    } catch (error) {
        console.log('❌ Error de conexión a MongoDB:');
        console.log(`   Tipo: ${error.name}`);
        console.log(`   Mensaje: ${error.message}`);
        
        if (error.message.includes('authentication failed')) {
            console.log('🔑 PROBLEMA: Credenciales de MongoDB incorrectas');
        } else if (error.message.includes('network')) {
            console.log('🌐 PROBLEMA: Error de red o conectividad');
        } else if (error.message.includes('timeout')) {
            console.log('⏰ PROBLEMA: Timeout de conexión');
        }
        
        return false;
    }

    // 3. Verificar configuración de NextAuth
    console.log('\n3. VERIFICANDO CONFIGURACIÓN DE NEXTAUTH:');
    console.log('------------------------------------------');
    
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    const nextAuthSecret = process.env.NEXTAUTH_SECRET;
    
    if (nextAuthUrl === 'https://barulogix.vercel.app') {
        console.log('✅ NEXTAUTH_URL configurada correctamente');
    } else {
        console.log(`❌ NEXTAUTH_URL incorrecta: ${nextAuthUrl}`);
        console.log('   Debería ser: https://barulogix.vercel.app');
    }
    
    if (nextAuthSecret && nextAuthSecret.length >= 32) {
        console.log('✅ NEXTAUTH_SECRET tiene longitud adecuada');
    } else {
        console.log('❌ NEXTAUTH_SECRET muy corta o no definida');
    }

    console.log('\n🎉 DIAGNÓSTICO COMPLETADO');
    console.log('========================');
    
    return true;
}

// Ejecutar diagnóstico
diagnosticarBaruLogix()
    .then(success => {
        if (success) {
            console.log('\n✅ BaruLogix debería funcionar correctamente');
        } else {
            console.log('\n❌ Se encontraron problemas que deben solucionarse');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Error durante el diagnóstico:', error);
        process.exit(1);
    });

