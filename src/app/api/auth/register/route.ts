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

    // Crear cliente de Supabase con service role para operaciones administrativas
    const supabase = createClient()

    // Verificar si el usuario ya existe en auth.users
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers()
    const userExists = existingAuthUser.users.some(user => user.email === email)

    if (userExists) {
      return NextResponse.json({
        success: false,
        error: 'El usuario ya existe'
      }, { status: 409 })
    }

    // Verificar si existe en user_profiles
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', email)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: false,
        error: 'El usuario ya existe'
      }, { status: 409 })
    }

    console.log('Creating user with email:', email)

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
      console.error('No user returned from signup')
      return NextResponse.json({
        success: false,
        error: 'No se pudo crear el usuario'
      }, { status: 500 })
    }

    console.log('User created in auth.users:', authData.user.id)

    // Esperar un momento para que el trigger tenga tiempo de ejecutarse
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Verificar si el trigger creó el perfil automáticamente
    const { data: autoProfile, error: autoProfileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (autoProfile) {
      console.log('Profile created automatically by trigger')
      return NextResponse.json({
        success: true,
        message: 'Usuario creado exitosamente',
        user: {
          id: autoProfile.id,
          email: autoProfile.email,
          name: autoProfile.name,
          role: autoProfile.role,
          isActive: autoProfile.is_active,
          subscription: autoProfile.subscription
        }
      })
    }

    console.log('Trigger did not create profile, creating manually')

    // Si el trigger no funcionó, crear perfil manualmente
    const { data: manualProfile, error: manualProfileError } = await supabase
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

    if (manualProfileError) {
      console.error('Manual profile creation error:', manualProfileError)
      
      // Si falla la creación manual, intentar obtener el perfil existente
      const { data: existingProfileRetry } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (existingProfileRetry) {
        console.log('Profile found on retry')
        return NextResponse.json({
          success: true,
          message: 'Usuario creado exitosamente',
          user: {
            id: existingProfileRetry.id,
            email: existingProfileRetry.email,
            name: existingProfileRetry.name,
            role: existingProfileRetry.role,
            isActive: existingProfileRetry.is_active,
            subscription: existingProfileRetry.subscription
          }
        })
      }

      // Si todo falla, eliminar el usuario de auth y reportar error
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error('Error deleting user after profile creation failure:', deleteError)
      }

      return NextResponse.json({
        success: false,
        error: 'Error al crear perfil de usuario'
      }, { status: 500 })
    }

    console.log('Profile created manually:', manualProfile.id)

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: manualProfile.id,
        email: manualProfile.email,
        name: manualProfile.name,
        role: manualProfile.role,
        isActive: manualProfile.is_active,
        subscription: manualProfile.subscription
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

