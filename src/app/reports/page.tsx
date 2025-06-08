'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  ArrowLeft,
  Filter,
  RefreshCw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

interface ReportData {
  deliveriesByMonth: Array<{ month: string; delivered: number; returned: number; pending: number }>;
  deliveriesByPlatform: Array<{ platform: string; count: number; percentage: number }>;
  conductorPerformance: Array<{ name: string; delivered: number; returned: number; rating: number }>;
  dailyStats: Array<{ date: string; deliveries: number; revenue: number }>;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('last30days');
  const [selectedMetric, setSelectedMetric] = useState('deliveries');
  const router = useRouter();

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    // Simular carga de datos de reportes
    setTimeout(() => {
      setReportData({
        deliveriesByMonth: [
          { month: 'Ene', delivered: 145, returned: 12, pending: 8 },
          { month: 'Feb', delivered: 189, returned: 15, pending: 12 },
          { month: 'Mar', delivered: 234, returned: 18, pending: 15 },
          { month: 'Abr', delivered: 198, returned: 14, pending: 10 },
          { month: 'May', delivered: 267, returned: 22, pending: 18 },
          { month: 'Jun', delivered: 289, returned: 19, pending: 14 }
        ],
        deliveriesByPlatform: [
          { platform: 'Shein', count: 456, percentage: 45.6 },
          { platform: 'Temu', count: 334, percentage: 33.4 },
          { platform: 'Dropi', count: 210, percentage: 21.0 }
        ],
        conductorPerformance: [
          { name: 'Juan Pérez', delivered: 245, returned: 15, rating: 4.8 },
          { name: 'Ana Rodríguez', delivered: 189, returned: 8, rating: 4.9 },
          { name: 'Miguel Torres', delivered: 156, returned: 12, rating: 4.6 },
          { name: 'Laura Martínez', delivered: 98, returned: 6, rating: 4.7 }
        ],
        dailyStats: [
          { date: '01/06', deliveries: 23, revenue: 115000 },
          { date: '02/06', deliveries: 31, revenue: 155000 },
          { date: '03/06', deliveries: 28, revenue: 140000 },
          { date: '04/06', deliveries: 35, revenue: 175000 },
          { date: '05/06', deliveries: 29, revenue: 145000 },
          { date: '06/06', deliveries: 42, revenue: 210000 },
          { date: '07/06', deliveries: 38, revenue: 190000 }
        ]
      });
      setLoading(false);
    }, 1000);
  }, [router, dateRange]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  const totalDeliveries = reportData?.deliveriesByMonth.reduce((sum, month) => sum + month.delivered, 0) || 0;
  const totalReturned = reportData?.deliveriesByMonth.reduce((sum, month) => sum + month.returned, 0) || 0;
  const successRate = totalDeliveries > 0 ? ((totalDeliveries / (totalDeliveries + totalReturned)) * 100).toFixed(1) : '0.0';

  const generatePDF = () => {
    // Simular generación de PDF
    alert('Generando reporte PDF...');
  };

  const exportExcel = () => {
    // Simular exportación a Excel
    alert('Exportando a Excel...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generando reportes...</p>
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
              <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h1>
                <p className="text-sm text-gray-500">Analiza el rendimiento de tu operación</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="last7days">Últimos 7 días</option>
                <option value="last30days">Últimos 30 días</option>
                <option value="last3months">Últimos 3 meses</option>
                <option value="last6months">Últimos 6 meses</option>
                <option value="lastyear">Último año</option>
              </select>
              <button 
                onClick={exportExcel}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </button>
              <button 
                onClick={generatePDF}
                className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entregas Totales</p>
                <p className="text-3xl font-bold text-gray-900">{totalDeliveries.toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+12.5% vs período anterior</span>
                </div>
              </div>
              <Package className="h-12 w-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
                <p className="text-3xl font-bold text-green-600">{successRate}%</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+2.1% vs período anterior</span>
                </div>
              </div>
              <TrendingUp className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conductores Activos</p>
                <p className="text-3xl font-bold text-purple-600">12</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">+1 vs período anterior</span>
                </div>
              </div>
              <Users className="h-12 w-12 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Estimados</p>
                <p className="text-3xl font-bold text-yellow-600">$1.2M</p>
                <div className="flex items-center mt-2">
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600">-3.2% vs período anterior</span>
                </div>
              </div>
              <DollarSign className="h-12 w-12 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Entregas por Mes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Entregas por Mes</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Entregadas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Devueltas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Pendientes</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData?.deliveriesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="delivered" fill="#3B82F6" />
                <Bar dataKey="returned" fill="#EF4444" />
                <Bar dataKey="pending" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por Plataforma */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribución por Plataforma</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={reportData?.deliveriesByPlatform}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ platform, percentage }) => `${platform} ${percentage}%`}
                  >
                    {reportData?.deliveriesByPlatform.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {reportData?.deliveriesByPlatform.map((platform, index) => (
                <div key={platform.platform} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm text-gray-700">{platform.platform}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {platform.count} ({platform.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Rendimiento de Conductores */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Rendimiento de Conductores</h3>
            <div className="space-y-4">
              {reportData?.conductorPerformance.map((conductor, index) => (
                <div key={conductor.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{conductor.name}</h4>
                      <div className="flex items-center">
                        <span className="text-sm text-yellow-600 mr-1">★</span>
                        <span className="text-sm text-gray-600">{conductor.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Entregadas: {conductor.delivered}</span>
                      <span>Devueltas: {conductor.returned}</span>
                      <span>Éxito: {((conductor.delivered / (conductor.delivered + conductor.returned)) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${(conductor.delivered / (conductor.delivered + conductor.returned)) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tendencia Diaria */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Tendencia Diaria</h3>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="deliveries">Entregas</option>
                <option value="revenue">Ingresos</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData?.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    selectedMetric === 'revenue' ? `$${Number(value).toLocaleString()}` : value,
                    selectedMetric === 'deliveries' ? 'Entregas' : 'Ingresos'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedMetric} 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Table */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Resumen Detallado</h3>
            <button className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entregas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devueltas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasa Éxito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ingresos Est.
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData?.deliveriesByMonth.map((month, index) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {month.month} 2025
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.delivered}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.returned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {((month.delivered / (month.delivered + month.returned)) * 100).toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${(month.delivered * 5000).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

