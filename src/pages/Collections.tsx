import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

interface Collection {
  id: string
  name: string
  description: string
  isPublic: boolean
  recipes: { id: string; name: string; imageUrl: string }[]
  User: { id: string; name: string }
}

export default function Collections() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      const res = await api.get('/collections')
      setCollections(res.data)
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formName.trim()) return
    try {
      await api.post('/collections', { name: formName.trim(), description: formDescription.trim() })
      setShowForm(false)
      setFormName('')
      setFormDescription('')
      loadCollections()
    } catch { /* ignore */ }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta colección?')) return
    try {
      await api.delete(`/collections/${id}`)
      loadCollections()
    } catch { /* ignore */ }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-gray-100">
      <header className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-md">
              🍸
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Sabores con IA</h1>
              <p className="text-xs text-indigo-300 -mt-1">Colecciones</p>
            </div>
          </Link>

          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            <span className={`block w-6 h-0.5 bg-white transition ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>

          <div className="hidden md:flex items-center gap-4">
            {user && (
              <>
                <Link to="/favorites" className="hover:text-indigo-300 transition text-sm">❤️ Favoritos</Link>
                <Link to="/dashboard" className="hover:text-indigo-300 transition text-sm">Dashboard</Link>
              </>
            )}
            {!user && (
              <Link to="/login" className="hover:text-indigo-300 transition text-sm">Iniciar Sesión</Link>
            )}
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-indigo-700/50">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              {user ? (
                <>
                  <Link to="/favorites" className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm" onClick={() => setMenuOpen(false)}>❤️ Favoritos</Link>
                  <Link to="/dashboard" className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                </>
              ) : (
                <Link to="/login" className="block px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm" onClick={() => setMenuOpen(false)}>Iniciar Sesión</Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-indigo-900">📚 Colecciones</h2>
          {user && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-500 transition text-sm"
            >
              + Nueva Colección
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 space-y-3">
            <h3 className="font-semibold text-gray-800">Nueva Colección</h3>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nombre de la colección"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition">Crear</button>
              <button onClick={() => setShowForm(false)} className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-400 transition">Cancelar</button>
            </div>
          </div>
        )}

        {loading ? (
          <p className="text-center text-indigo-700">Cargando...</p>
        ) : collections.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-6xl mb-4">📚</p>
            <p className="text-gray-600">No hay colecciones todavía.</p>
            {user && <p className="text-gray-500 text-sm mt-1">¡Crea tu primera colección de recetas!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <div key={col.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{col.name}</h3>
                    {col.isPublic && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Pública</span>}
                  </div>
                  {col.description && <p className="text-sm text-gray-600 mb-3">{col.description}</p>}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span>📖 {col.recipes?.length || 0} recetas</span>
                    <span>·</span>
                    <span>Por {col.User?.name || 'Anónimo'}</span>
                  </div>

                  {col.recipes && col.recipes.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 mb-4">
                      {col.recipes.slice(0, 3).map((r) => (
                        <div key={r.id} className="aspect-square rounded-lg overflow-hidden bg-indigo-100">
                          {r.imageUrl ? (
                            <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link
                      to={`/collections/${col.id}`}
                      className="flex-1 text-center bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition"
                    >
                      Ver Colección
                    </Link>
                    {user && (
                      <button
                        onClick={() => handleDelete(col.id)}
                        className="bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-200 transition"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
