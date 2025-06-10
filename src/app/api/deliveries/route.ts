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

    // Verificar si es admin para ver todas las entregas o solo las propias
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('deliveries')
      .select(`
        *,
        conductors(name, phone),
        user_profiles!inner(name, email)
      `)

    // Si no es admin, solo ver sus propias entregas
    if (!profile || profile.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    const { data: deliveries, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al obtener entregas' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deliveries: deliveries || []
    })

  } catch (error) {
    console.error('Error en deliveries API:', error)
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

    const { 
      trackingNumber, 
      recipient, 
      address, 
      phone, 
      platform, 
      notes,
      conductorId 
    } = await request.json()

    if (!trackingNumber || !recipient || !address || !phone) {
      return NextResponse.json(
        { success: false, error: 'Número de seguimiento, destinatario, dirección y teléfono son requeridos' },
        { status: 400 }
      )
    }

    // Crear entrega
    const { data: delivery, error } = await supabase
      .from('deliveries')
      .insert({
        user_id: user.id,
        tracking_number: trackingNumber,
        recipient,
        address,
        phone,
        platform: platform || 'other',
        notes: notes || null,
        conductor_id: conductorId || null,
        status: conductorId ? 'assigned' : 'pending'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Error al crear entrega' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      delivery
    })

  } catch (error) {
    console.error('Error en deliveries POST:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

