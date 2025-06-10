import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar datos de entrada
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    // Crear cliente de Supabase
    const supabase = createClient()

    // Intentar autenticación
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas'
      }, { status: 401 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo autenticar el usuario'
      }, { status: 401 })
    }

    // Obtener perfil del usuario (SIN restricciones RLS)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      // Si no existe perfil, crearlo automáticamente
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.user_metadata?.name || 'Usuario',
          role: 'user',
          subscription: 'basic',
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.error('Create profile error:', createError)
        return NextResponse.json({
          success: false,
          error: 'Error al crear perfil de usuario'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        user: {
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          role: newProfile.role,
          isActive: newProfile.is_active,
          subscription: newProfile.subscription
        }
      })
    }

    // Verificar que el usuario esté activo
    if (!profile.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Usuario desactivado'
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isActive: profile.is_active,
        subscription: profile.subscription,
        company: profile.company,
        phone: profile.phone
      }
    })

  } catch (error: any) {
    console.error('Login API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

