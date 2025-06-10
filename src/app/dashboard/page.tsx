'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { User } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    completedDeliveries: 0,
    activeConductors: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadStats()
  }, [])

  const checkUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) {
        router.push('/auth/login')
        return
      }

      // Obtener perfil completo
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profile) {
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
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (!authUser) return

      // Obtener estadísticas
      const { data: deliveries } = await supabase
        .from('deliveries')
        .select('status')
        .eq('user_id', authUser.id)

      const { data: conductors } = await supabase
        .from('conductors')
        .select('is_active')
        .eq('user_id', authUser.id)

      if (deliveries) {
        setStats({
          totalDeliveries: deliveries.length,
          pendingDeliveries: deliveries.filter(d => d.status === 'pending').length,
          completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
          activeConductors: conductors?.filter(c => c.is_active).length || 0
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return null
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
            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">📋 Gestionar Entregas</h3>
                <p className="text-gray-600 text-sm">
                  Crear, editar y hacer seguimiento de entregas
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">🏍️ Gestionar Conductores</h3>
                <p className="text-gray-600 text-sm">
                  Administrar conductores y asignaciones
                </p>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">📊 Reportes</h3>
                <p className="text-gray-600 text-sm">
                  Ver estadísticas y generar reportes
                </p>
              </div>
            </div>

            {user.role === 'admin' && (
              <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">👑 Panel Admin</h3>
                  <p className="text-gray-600 text-sm">
                    Gestionar usuarios y configuración del sistema
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

