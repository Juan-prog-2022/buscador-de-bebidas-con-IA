import { useState } from 'react'
import api from '../api/client'

interface Post {
  caption: string
  hashtags: string[]
  callToAction: string
  emojis: string[]
}

interface Props {
  recipeName: string
  description?: string
  price?: number
  category?: string
}

const platforms = [
  { value: 'instagram', label: '📷 Instagram' },
  { value: 'facebook', label: '👍 Facebook' },
  { value: 'twitter', label: '🐦 Twitter/X' },
  { value: 'whatsapp', label: '💬 WhatsApp' },
]

const tones = [
  { value: 'casual', label: 'Casual' },
  { value: 'fun', label: 'Divertido' },
  { value: 'elegant', label: 'Elegante' },
  { value: 'professional', label: 'Profesional' },
]

export default function PostGenerator({ recipeName, description, price, category }: Props) {
  const [platform, setPlatform] = useState('instagram')
  const [tone, setTone] = useState('casual')
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setPost(null)
    try {
      const res = await api.post('/ai/generate-post', {
        recipeName,
        description: description || '',
        price: price || 0,
        category: category || '',
        platform,
        tone,
      })
      if (res.data.post) {
        setPost(res.data.post)
      }
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!post) return
    const text = `${post.emojis.join(' ')}\n\n${post.caption}\n\n${post.callToAction}\n\n${post.hashtags.join(' ')}`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const fullText = post
    ? `${post.emojis.join(' ')}\n\n${post.caption}\n\n${post.callToAction}\n\n${post.hashtags.join(' ')}`
    : ''

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Plataforma</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
          >
            {platforms.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Tono</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
          >
            {tones.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-pink-400 hover:to-purple-500 transition disabled:opacity-50"
          >
            {loading ? 'Generando...' : '✨ Generar Post'}
          </button>
        </div>
      </div>

      {post && (
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200 rounded-xl p-5">
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-gray-800 text-sm">Vista previa</h4>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${copied ? 'bg-green-100 text-green-700' : 'bg-white text-gray-600 hover:bg-gray-100'}`}
              >
                {copied ? '✅ Copiado' : '📋 Copiar'}
              </button>
              <button
                onClick={() => {
                  const text = `${post.emojis.join(' ')}\n\n${post.caption}\n\n${post.callToAction}\n\n${post.hashtags.join(' ')}`
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
                  window.open(url, '_blank')
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition"
              >
                💬 WhatsApp
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-sm border border-pink-100">
            <div className="text-2xl mb-2">{post.emojis.join(' ')}</div>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{post.caption}</p>
            <p className="text-pink-600 font-medium text-sm mt-3">{post.callToAction}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {post.hashtags.map((tag, i) => (
                <span key={i} className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Texto completo para copiar:</label>
            <textarea
              readOnly
              value={fullText}
              className="w-full h-28 px-3 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg resize-none bg-white"
              onClick={(e) => e.currentTarget.select()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
