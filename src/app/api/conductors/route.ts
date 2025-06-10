import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Verificar si es admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    // Obtener conductores
    const { data: conductors, error } = await supabase
      .from('conductors')
      .select(`
        *,
        user_profiles!inner(name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener conductores' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conductors: conductors || []
    })

  } catch (error) {
    console.error('Error en conductors API:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { name, phone, vehicleType, licensePlate } = await request.json()

    if (!name || !phone || !vehicleType) {
      return NextResponse.json(
        { success: false, error: 'Nombre, teléfono y tipo de vehículo son requeridos' },
        { status: 400 }
      )
    }

    // Crear conductor
    const { data: conductor, error } = await supabase
      .from('conductors')
      .insert({
        user_id: user.id,
        name,
        phone,
        vehicle_type: vehicleType,
        license_plate: licensePlate || null
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al crear conductor' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      conductor
    })

  } catch (error) {
    console.error('Error en conductors POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

