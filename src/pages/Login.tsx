import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setError('')
    try {
      await login(data.email, data.password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-6 group">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
            🍸
          </div>
          <h1 className="text-2xl font-bold text-indigo-900">Sabores con IA</h1>
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Iniciar Sesión</h2>
          <p className="text-gray-600 mt-2">Accede a tu panel de propietario</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'El email es obligatorio' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="owner@bar.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              {...register('password', { required: 'La contraseña es obligatoria' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-500 transition disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-500 font-medium">
            Registrarse
          </Link>
        </p>
      </div>
    </div>
  )
}
