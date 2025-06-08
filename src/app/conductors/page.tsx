'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

interface Conductor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  vehicleType: string;
  vehiclePlate: string;
  rating: number;
  totalDeliveries: number;
  completedDeliveries: number;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export default function ConductorsPage() {
  const [conductors, setConductors] = useState<Conductor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Simular carga de conductores
    setTimeout(() => {
      setConductors([
        {
          id: '1',
          name: 'Juan Pérez',
          email: 'juan.perez@email.com',
          phone: '+57 300 123 4567',
          address: 'Calle 123 #45-67, Bogotá',
          licenseNumber: 'CC123456789',
          vehicleType: 'Motocicleta',
          vehiclePlate: 'ABC123',
          rating: 4.8,
          totalDeliveries: 245,
          completedDeliveries: 230,
          status: 'active',
          joinedAt: '2024-01-15T00:00:00Z'
        },
        {
          id: '2',
          name: 'Ana Rodríguez',
          email: 'ana.rodriguez@email.com',
          phone: '+57 301 987 6543',
          address: 'Carrera 45 #12-34, Medellín',
          licenseNumber: 'CC987654321',
          vehicleType: 'Bicicleta',
          vehiclePlate: 'N/A',
          rating: 4.9,
          totalDeliveries: 189,
          completedDeliveries: 185,
          status: 'active',
          joinedAt: '2024-02-20T00:00:00Z'
        },
        {
          id: '3',
          name: 'Miguel Torres',
          email: 'miguel.torres@email.com',
          phone: '+57 302 456 7890',
          address: 'Avenida 68 #89-12, Cali',
          licenseNumber: 'CC456789123',
          vehicleType: 'Automóvil',
          vehiclePlate: 'XYZ789',
          rating: 4.6,
          totalDeliveries: 156,
          completedDeliveries: 148,
          status: 'active',
          joinedAt: '2024-03-10T00:00:00Z'
        },
        {
          id: '4',
          name: 'Laura Martínez',
          email: 'laura.martinez@email.com',
          phone: '+57 303 789 0123',
          address: 'Calle 50 #25-30, Barranquilla',
          licenseNumber: 'CC789012345',
          vehicleType: 'Motocicleta',
          vehiclePlate: 'DEF456',
          rating: 4.7,
          totalDeliveries: 98,
          completedDeliveries: 92,
          status: 'inactive',
          joinedAt: '2024-04-05T00:00:00Z'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, [router]);

  const filteredConductors = conductors.filter(conductor => {
    const matchesSearch = conductor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conductor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conductor.phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || conductor.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (status: string) => {
    return status === 'active' ? 'Activo' : 'Inactivo';
  };

  const getSuccessRate = (completed: number, total: number) => {
    return total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conductores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Conductores</h1>
                <p className="text-sm text-gray-500">Administra tu equipo de conductores</p>
              </div>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Conductor
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Conductores</p>
                <p className="text-2xl font-bold text-gray-900">{conductors.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-green-600">
                  {conductors.filter(c => c.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregas Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {conductors.reduce((sum, c) => sum + c.totalDeliveries, 0)}
                </p>
              </div>
              <Star className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rating Promedio</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {(conductors.reduce((sum, c) => sum + c.rating, 0) / conductors.length).toFixed(1)}
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Conductors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConductors.map((conductor) => (
            <div key={conductor.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {conductor.name}
                  </h3>
                  <div className="flex items-center mb-2">
                    {renderStars(conductor.rating)}
                    <span className="ml-2 text-sm text-gray-600">
                      {conductor.rating}
                    </span>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(conductor.status)}`}>
                    {getStatusText(conductor.status)}
                  </span>
                </div>
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
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {conductor.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {conductor.phone}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {conductor.address}
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">
                  {conductor.vehicleType}
                </p>
                <p className="text-xs text-gray-600">
                  {conductor.vehiclePlate !== 'N/A' ? `Placa: ${conductor.vehiclePlate}` : 'Sin placa'}
                </p>
                <p className="text-xs text-gray-600">
                  Licencia: {conductor.licenseNumber}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {conductor.totalDeliveries}
                  </p>
                  <p className="text-xs text-gray-600">Total Entregas</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-green-600">
                    {getSuccessRate(conductor.completedDeliveries, conductor.totalDeliveries)}%
                  </p>
                  <p className="text-xs text-gray-600">Éxito</p>
                </div>
              </div>

              {/* Join Date */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Desde: {new Date(conductor.joinedAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredConductors.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron conductores
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all' 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza agregando tu primer conductor'
              }
            </p>
            {!searchTerm && filterStatus === 'all' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Conductor
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

