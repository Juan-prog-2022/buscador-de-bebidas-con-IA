import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function DigitalMenuPanel() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    businessName: '',
    logo: '',
    primaryColor: '#4338ca',
    accentColor: '#6d28d9',
    welcomeMessage: '',
    isActive: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/menu/profile')
      if (res.data) {
        setProfile({
          businessName: res.data.businessName || '',
          logo: res.data.logo || '',
          primaryColor: res.data.primaryColor || '#4338ca',
          accentColor: res.data.accentColor || '#6d28d9',
          welcomeMessage: res.data.welcomeMessage || '',
          isActive: res.data.isActive !== false,
        })
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/menu/profile', profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch { /* ignore */ } finally {
      setSaving(false)
    }
  }

  const handleGenerateQr = async () => {
    try {
      await api.get(`/menu/qr/${user?.id}`)
      const menuUrl = `${window.location.origin}/api/menu/view/${user?.id}`
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(menuUrl)}`
      setQrUrl(qrApi)
      setShowQr(true)
    } catch { /* ignore */ }
  }

  if (loading) return <div className="text-center py-8 text-gray-500">Cargando...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800">📄 Menú Digital</h3>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={profile.isActive}
            onChange={(e) => setProfile({ ...profile, isActive: e.target.checked })}
            className="accent-indigo-600"
          />
          Activo
        </label>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Nombre del negocio</label>
          <input
            type="text"
            value={profile.businessName}
            onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
            placeholder="Ej: Bar La Esquina"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Mensaje de bienvenida</label>
          <textarea
            value={profile.welcomeMessage}
            onChange={(e) => setProfile({ ...profile, welcomeMessage: e.target.value })}
            placeholder="¡Bienvenidos! Disfruta de nuestra carta..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            rows={2}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Color primario</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={profile.primaryColor}
                onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border"
              />
              <input
                type="text"
                value={profile.primaryColor}
                onChange={(e) => setProfile({ ...profile, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Color acento</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={profile.accentColor}
                onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
                className="w-10 h-10 rounded cursor-pointer border"
              />
              <input
                type="text"
                value={profile.accentColor}
                onChange={(e) => setProfile({ ...profile, accentColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
              />
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">URL del logo (opcional)</label>
          <input
            type="url"
            value={profile.logo}
            onChange={(e) => setProfile({ ...profile, logo: e.target.value })}
            placeholder="https://ejemplo.com/logo.png"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
              saved
                ? 'bg-green-100 text-green-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {saving ? 'Guardando...' : saved ? '✅ Guardado' : 'Guardar configuración'}
          </button>
          {profile.isActive && (
              <button
                onClick={() => window.open(`/api/menu/view/${user?.id}`, '_blank')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
              >
                👁️ Vista previa
              </button>
          )}
        </div>

        {profile.isActive && (
          <div className="border-t pt-4 mt-2">
            <button
              onClick={handleGenerateQr}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-500 hover:to-purple-500 transition"
            >
              📱 Generar Código QR
            </button>

            {showQr && (
              <div className="mt-4 text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/api/menu/view/' + user?.id)}`}
                  alt="QR Code"
                  className="mx-auto rounded-xl shadow-lg"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Escaneá el QR para ver el menú digital
                </p>
                <button
                  onClick={() => {
                    const link = document.createElement('a')
                    link.download = 'menu-qr.png'
                    link.href = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/api/menu/view/' + user?.id)}`
                    link.click()
                  }}
                  className="mt-2 text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                >
                  Descargar QR
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
