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

    console.log('Login attempt for email:', email)

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
      console.error('No user returned from auth')
      return NextResponse.json({
        success: false,
        error: 'No se pudo autenticar el usuario'
      }, { status: 401 })
    }

    console.log('User authenticated:', authData.user.id)

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.error('Profile error:', profileError)
      
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
        console.error('Create profile error:', createError)
        
        // Intentar obtener el perfil una vez más por si se creó entre tanto
        const { data: retryProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (retryProfile) {
          console.log('Profile found on retry')
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
          error: 'Error al crear perfil de usuario'
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

    // Verificar que el usuario esté activo
    if (!profile.is_active) {
      console.log('User is inactive:', profile.id)
      return NextResponse.json({
        success: false,
        error: 'Usuario desactivado'
      }, { status: 403 })
    }

    console.log('Login successful for user:', profile.id)

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

