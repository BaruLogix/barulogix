import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email)
    console.log('Password length:', password?.length)
    console.log('Timestamp:', new Date().toISOString())

    // Validar datos de entrada
    if (!email || !password) {
      console.log('ERROR: Missing email or password')
      return NextResponse.json({
        success: false,
        error: 'Email y contraseña son requeridos'
      }, { status: 400 })
    }

    // Crear cliente de Supabase
    const supabase = createClient()

    console.log('Attempting Supabase auth...')

    // Intentar autenticación
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: password
    })

    if (authError) {
      console.log('AUTH ERROR:', authError)
      console.log('Auth error code:', authError.status)
      console.log('Auth error message:', authError.message)
      
      return NextResponse.json({
        success: false,
        error: 'Credenciales inválidas',
        debug: {
          authError: authError.message,
          code: authError.status
        }
      }, { status: 401 })
    }

    if (!authData.user) {
      console.log('ERROR: No user returned from auth')
      return NextResponse.json({
        success: false,
        error: 'No se pudo autenticar el usuario'
      }, { status: 401 })
    }

    console.log('AUTH SUCCESS - User ID:', authData.user.id)
    console.log('User email from auth:', authData.user.email)

    // Obtener perfil del usuario
    console.log('Fetching user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('PROFILE ERROR:', profileError)
      
      // Si no existe perfil, crearlo automáticamente
      console.log('Creating missing profile for user:', authData.user.id)
      
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email || email,
          name: authData.user.user_metadata?.name || 'Usuario',
          role: 'user',
          subscription: 'basic',
          is_active: true
        })
        .select()
        .single()

      if (createError) {
        console.log('CREATE PROFILE ERROR:', createError)
        
        // Intentar obtener el perfil una vez más por si se creó entre tanto
        const { data: retryProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (retryProfile) {
          console.log('Profile found on retry:', retryProfile.id)
          return NextResponse.json({
            success: true,
            user: {
              id: retryProfile.id,
              email: retryProfile.email,
              name: retryProfile.name,
              role: retryProfile.role,
              isActive: retryProfile.is_active,
              subscription: retryProfile.subscription,
              company: retryProfile.company,
              phone: retryProfile.phone
            }
          })
        }

        return NextResponse.json({
          success: false,
          error: 'Error al crear perfil de usuario',
          debug: {
            createError: createError.message
          }
        }, { status: 500 })
      }

      console.log('Profile created successfully:', newProfile.id)

      return NextResponse.json({
        success: true,
        user: {
          id: newProfile.id,
          email: newProfile.email,
          name: newProfile.name,
          role: newProfile.role,
          isActive: newProfile.is_active,
          subscription: newProfile.subscription,
          company: newProfile.company,
          phone: newProfile.phone
        }
      })
    }

    console.log('Profile found:', profile.id)
    console.log('Profile active:', profile.is_active)

    // Verificar que el usuario esté activo
    if (!profile.is_active) {
      console.log('User is inactive:', profile.id)
      return NextResponse.json({
        success: false,
        error: 'Usuario desactivado'
      }, { status: 403 })
    }

    console.log('=== LOGIN SUCCESS ===')
    console.log('User ID:', profile.id)
    console.log('User role:', profile.role)

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
    console.log('=== LOGIN API ERROR ===')
    console.log('Error:', error)
    console.log('Stack:', error.stack)
    
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      debug: {
        message: error.message,
        stack: error.stack
      }
    }, { status: 500 })
  }
}

