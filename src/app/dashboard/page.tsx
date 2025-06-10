'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

interface User {
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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    activeConductors: 0
  })
  const router = useRouter()

  useEffect(() => {
    initializeDashboard()
  }, [])

  const initializeDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const supabase = createClient()
      
      // Verificar autenticación
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error('Auth error:', authError)
        router.push('/auth/login')
        return
      }

      if (!authUser) {
        console.log('No authenticated user found')
        router.push('/auth/login')
        return
      }

      console.log('Authenticated user:', authUser.email)

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        setError('Error al cargar perfil de usuario')
        return
      }

      if (!profile) {
        console.error('No profile found for user')
        setError('Perfil de usuario no encontrado')
        return
      }

      console.log('User profile loaded:', profile)

      // Configurar usuario
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isActive: profile.is_active,
        subscription: profile.subscription,
        company: profile.company,
        phone: profile.phone,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      })

      // Cargar estadísticas
      await loadStats(authUser.id, supabase)

    } catch (error) {
      console.error('Dashboard initialization error:', error)
      setError('Error al inicializar dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (userId: string, supabase: any) => {
    try {
      console.log('Loading stats for user:', userId)

      // Obtener entregas
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('deliveries')
        .select('status')
        .eq('user_id', userId)

      if (deliveriesError) {
        console.error('Deliveries error:', deliveriesError)
      }

      // Obtener conductores
      const { data: conductors, error: conductorsError } = await supabase
        .from('conductors')
        .select('is_active')
        .eq('user_id', userId)

      if (conductorsError) {
        console.error('Conductors error:', conductorsError)
      }

      // Calcular estadísticas
      const totalDeliveries = deliveries?.length || 0
      const pendingDeliveries = deliveries?.filter(d => d.status === 'pending').length || 0
      const completedDeliveries = deliveries?.filter(d => d.status === 'delivered').length || 0
      const activeConductors = conductors?.filter(c => c.is_active).length || 0

      setStats({
        totalDeliveries,
        pendingDeliveries,
        completedDeliveries,
        activeConductors
      })

      console.log('Stats loaded:', { totalDeliveries, pendingDeliveries, completedDeliveries, activeConductors })

    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Estado de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Cargando dashboard...</div>
        </div>
      </div>
    )
  }

  // Estado de error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">❌ {error}</div>
          <button
            onClick={initializeDashboard}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  // Si no hay usuario después de cargar
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600 text-lg mb-4">No se pudo cargar el usuario</div>
          <button
            onClick={() => router.push('/auth/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Ir a Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">BaruLogix</h1>
              <p className="text-sm text-gray-600">Dashboard de {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Message */}
          <div className="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                ¡Bienvenido a BaruLogix! 🚀
              </h2>
              <p className="text-gray-600">
                Tu plataforma de gestión de entregas está funcionando perfectamente con Supabase.
              </p>
              {user.role === 'admin' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <p className="text-blue-800 font-medium">
                    🎉 ¡Migración completada exitosamente!
                  </p>
                  <p className="text-blue-700 text-sm mt-1">
                    Tienes acceso completo como administrador. Puedes gestionar usuarios, conductores y entregas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📦</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Entregas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.totalDeliveries}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">⏳</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Pendientes
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.pendingDeliveries}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">✅</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completadas
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.completedDeliveries}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🏍️</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Conductores
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.activeConductors}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/deliveries" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">📋 Gestionar Entregas</h3>
                <p className="text-gray-600 text-sm">
                  Crear, editar y hacer seguimiento de entregas
                </p>
              </div>
            </Link>

            <Link href="/conductors" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">🏍️ Gestionar Conductores</h3>
                <p className="text-gray-600 text-sm">
                  Administrar conductores y asignaciones
                </p>
              </div>
            </Link>

            <Link href="/reports" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">📊 Reportes</h3>
                <p className="text-gray-600 text-sm">
                  Ver estadísticas y generar reportes
                </p>
              </div>
            </Link>

            {user.role === 'admin' && (
              <Link href="/admin" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">👑 Panel Admin</h3>
                  <p className="text-gray-600 text-sm">
                    Gestionar usuarios y configuración del sistema
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* Debug Info (solo para admin) */}
          {user.role === 'admin' && (
            <div className="mt-8 bg-gray-100 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">🔧 Información de Debug</h3>
              <div className="text-xs text-gray-600">
                <p>Usuario ID: {user.id}</p>
                <p>Email: {user.email}</p>
                <p>Rol: {user.role}</p>
                <p>Suscripción: {user.subscription}</p>
                <p>Estado: {user.isActive ? 'Activo' : 'Inactivo'}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

