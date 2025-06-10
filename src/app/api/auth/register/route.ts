import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    // Validar datos de entrada
    if (!name || !email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Todos los campos son requeridos'
      }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Formato de email inválido'
      }, { status: 400 })
    }

    // Validar contraseña
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      }, { status: 400 })
    }

    // Crear cliente de Supabase
    const supabase = createClient()

    // Verificar si el usuario ya existe
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'El usuario ya existe'
      }, { status: 409 })
    }

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      return NextResponse.json({
        success: false,
        error: 'Error al crear usuario: ' + authError.message
      }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({
        success: false,
        error: 'No se pudo crear el usuario'
      }, { status: 500 })
    }

    // Crear perfil de usuario (el trigger debería hacerlo, pero lo hacemos manualmente por seguridad)
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: email,
        name: name,
        role: 'user',
        subscription: 'basic',
        is_active: true
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Si hay error, el trigger probablemente ya creó el perfil
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (existingProfile) {
        return NextResponse.json({
          success: true,
          message: 'Usuario creado exitosamente',
          user: {
            id: existingProfile.id,
            email: existingProfile.email,
            name: existingProfile.name,
            role: existingProfile.role
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Error al crear perfil de usuario'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        isActive: profile.is_active,
        subscription: profile.subscription
      }
    })

  } catch (error: any) {
    console.error('Register API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

