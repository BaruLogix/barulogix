'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  Users, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  MapPin,
  ArrowLeft,
  Star,
  TrendingUp
} from 'lucide-react'

interface Conductor {
  id: string
  name: string
  phone: string
  vehicleType: string
  licensePlate?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface User {
  id: string
  role: 'admin' | 'user'
}

export default function ConductorsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [conductors, setConductors] = useState<Conductor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    initializeConductors()
  }, [])

  const initializeConductors = async () => {
    try {
      setLoading(true)
      
      const supabase = createClient()
      
      // Verificar autenticación
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

      if (authError || !authUser) {
        router.push('/auth/login')
        return
      }

      // Obtener perfil del usuario
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, role')
        .eq('id', authUser.id)
        .single()

      if (profileError || !profile) {
        router.push('/auth/login')
        return
      }

      setUser({
        id: profile.id,
        role: profile.role
      })

      // Cargar conductores
      await loadConductors(authUser.id, profile.role, supabase)

    } catch (error) {
      console.error('Error initializing conductors:', error)
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const loadConductors = async (userId: string, userRole: string, supabase: any) => {
    try {
      let query = supabase
        .from('conductors')
        .select('*')

      // Si no es admin, solo mostrar sus conductores
      if (userRole !== 'admin') {
        query = query.eq('user_id', userId)
      }

      const { data: conductorsData, error: conductorsError } = await query
        .order('created_at', { ascending: false })

      if (conductorsError) {
        console.error('Error loading conductors:', conductorsError)
        return
      }

      const formattedConductors = conductorsData?.map((conductor: any) => ({
        id: conductor.id,
        name: conductor.name,
        phone: conductor.phone,
        vehicleType: conductor.vehicle_type,
        licensePlate: conductor.license_plate,
        isActive: conductor.is_active,
        createdAt: conductor.created_at,
        updatedAt: conductor.updated_at
      })) || []

      setConductors(formattedConductors)

    } catch (error) {
      console.error('Error loading conductors:', error)
    }
  }

  const toggleConductorStatus = async (conductorId: string, currentStatus: boolean) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('conductors')
        .update({ is_active: !currentStatus })
        .eq('id', conductorId)

      if (error) {
        console.error('Error updating conductor status:', error)
        alert('Error al actualizar estado del conductor')
        return
      }

      // Recargar conductores
      const authUser = await supabase.auth.getUser()
      if (authUser.data.user && user) {
        await loadConductors(user.id, user.role, supabase)
      }
      
      alert('Estado del conductor actualizado exitosamente')

    } catch (error) {
      console.error('Error toggling conductor status:', error)
      alert('Error al cambiar estado del conductor')
    }
  }

  // Filtrar conductores
  const filteredConductors = conductors.filter(conductor => {
    const matchesSearch = 
      conductor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conductor.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conductor.vehicleType.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && conductor.isActive) ||
      (filterStatus === 'inactive' && !conductor.isActive)

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Cargando conductores...</div>
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
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">🏍️ Gestión de Conductores</h1>
                <p className="text-sm text-gray-600">Administra tu equipo de conductores</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Conductor
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, teléfono o tipo de vehículo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Conductores
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {conductors.length}
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
                    <TrendingUp className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Activos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {conductors.filter(c => c.isActive).length}
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
                    <Star className="h-6 w-6 text-yellow-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Disponibles
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {conductors.filter(c => c.isActive).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conductors Table */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Lista de Conductores ({filteredConductors.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conductor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConductors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        {conductors.length === 0 ? 'No hay conductores registrados' : 'No se encontraron conductores con los filtros aplicados'}
                      </td>
                    </tr>
                  ) : (
                    filteredConductors.map((conductor) => (
                      <tr key={conductor.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-medium">
                                  {conductor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {conductor.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="h-4 w-4 mr-2 text-gray-400" />
                            {conductor.phone}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {conductor.vehicleType}
                            </div>
                            {conductor.licensePlate && (
                              <div className="text-sm text-gray-500">
                                Placa: {conductor.licensePlate}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleConductorStatus(conductor.id, conductor.isActive)}
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${
                              conductor.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {conductor.isActive ? '✅ Activo' : '❌ Inactivo'}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(conductor.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-green-600 hover:text-green-900">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Modal Placeholder */}
          {showAddModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                  <h3 className="text-lg font-medium text-gray-900">Nuevo Conductor</h3>
                  <div className="mt-2 px-7 py-3">
                    <p className="text-sm text-gray-500">
                      Funcionalidad de agregar conductor en desarrollo...
                    </p>
                  </div>
                  <div className="items-center px-4 py-3">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

