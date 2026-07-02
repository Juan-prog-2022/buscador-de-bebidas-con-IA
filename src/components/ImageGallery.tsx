import { useState } from 'react'
import api from '../api/client'

interface ImageResult {
  id: string
  url: string
  thumb: string
  credit: string
  creditUrl: string
  alt: string
}

interface Props {
  onSelect: (url: string) => void
  currentImage?: string
  recipeName?: string
}

export default function ImageGallery({ onSelect, currentImage, recipeName }: Props) {
  const [query, setQuery] = useState(recipeName || '')
  const [images, setImages] = useState<ImageResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleSearch = async (q?: string) => {
    const searchQuery = q || query
    if (!searchQuery.trim()) return
    setLoading(true)
    try {
      const res = await api.get('/images/search', { params: { q: searchQuery, count: 12 } })
      setImages(res.data.images || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleAiSuggest = async () => {
    if (!recipeName) return
    setLoading(true)
    try {
      const res = await api.post('/ai/image-prompt', {
        recipeName,
        description: '',
        ingredients: [],
      })
      const queries = res.data.queries || []
      if (queries.length > 0) {
        setQuery(queries[0])
        await handleSearch(queries[0])
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleSelect = (img: ImageResult) => {
    setSelectedId(img.id)
    onSelect(img.url)
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar imágenes..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {loading ? '...' : '🔍'}
        </button>
        {recipeName && (
          <button
            onClick={handleAiSuggest}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-500 transition disabled:opacity-50"
            title="Sugerir con IA"
          >
            🤖
          </button>
        )}
      </div>

      {currentImage && !selectedId && (
        <div className="mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-200">
          <p className="text-xs text-gray-500 mb-1">Imagen actual:</p>
          <img src={currentImage} alt="Actual" className="w-full h-32 object-cover rounded" />
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
          {images.map((img) => (
            <button
              key={img.id}
              onClick={() => handleSelect(img)}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 transition ${
                selectedId === img.id ? 'border-indigo-600 ring-2 ring-indigo-300' : 'border-transparent hover:border-indigo-300'
              }`}
            >
              <img src={img.thumb} alt={img.alt} className="w-full h-full object-cover" />
              {selectedId === img.id && (
                <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          {images.length} resultados · Haz clic en una imagen para seleccionarla
        </p>
      )}
    </div>
  )
}
