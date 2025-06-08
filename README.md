# BaruLogix - Plataforma de Gestión Logística

## 🚀 Descripción
BaruLogix es una plataforma web profesional diseñada para pequeñas empresas de distribución que manejan paquetes de Shein, Temu y Dropi. Proporciona control completo sobre las operaciones logísticas con un diseño moderno y funcionalidades avanzadas.

## ✨ Características Principales

### 📦 Gestión de Entregas
- Registro y control de paquetes Shein/Temu/Dropi
- Estados: no entregado, entregado, devuelto
- Búsqueda avanzada y filtros múltiples
- Importación masiva de entregas
- Exportación de datos

### 👥 Control de Conductores
- Gestión completa del equipo
- Sistema de calificaciones
- Estadísticas de rendimiento
- Control de disponibilidad

### 📊 Reportes y Análisis
- Gráficos interactivos (barras, líneas, torta)
- Análisis temporal y por plataforma
- KPIs principales
- Exportación PDF/Excel

### 💳 Sistema de Pagos
- Múltiples métodos: PSE, Nequi, tarjetas
- Procesamiento seguro
- Suscripción mensual

### 🔐 Seguridad
- Autenticación JWT
- Encriptación de datos
- Control de acceso por roles

## 🛠️ Tecnologías

- **Frontend**: Next.js 14 + TypeScript
- **Diseño**: Tailwind CSS
- **Gráficos**: Recharts
- **Base de datos**: MongoDB
- **Autenticación**: NextAuth.js + JWT

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- MongoDB Atlas (o local)
- Git

### Instalación
```bash
# Clonar repositorio
git clone https://github.com/Barulogix/barulogix.git
cd barulogix

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Editar .env.local con tus configuraciones

# Ejecutar en desarrollo
npm run dev
```

### Variables de Entorno
```bash
NEXTAUTH_SECRET=tu-clave-secreta
NEXTAUTH_URL=http://localhost:3000
MONGODB_URI=tu-cadena-mongodb
JWT_SECRET=tu-jwt-secret
NODE_ENV=development
```

## 📱 Uso

1. **Registro/Login**: Crear cuenta o iniciar sesión
2. **Dashboard**: Ver métricas y estadísticas
3. **Entregas**: Gestionar paquetes y estados
4. **Conductores**: Administrar equipo de trabajo
5. **Reportes**: Analizar rendimiento
6. **Pagos**: Activar suscripción

## 🌐 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio con Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Otras opciones
- Netlify
- Railway
- DigitalOcean App Platform

## 📄 Licencia

Proyecto privado - BaruLogix © 2025

## 🤝 Soporte

Para soporte técnico, contactar al equipo de desarrollo.

---

**BaruLogix** - Optimiza tu operación logística 📦✨

