import { Link } from 'react-router-dom'

interface HeroProps {
  title?: string
  subtitle?: string
  ctaText?: string
  ctaLink?: string
  showCta?: boolean
}

export default function Hero({
  title = 'Descubre Sabores con Inteligencia Artificial',
  subtitle = 'Recomendaciones personalizadas de bebidas, postres y platos para bares y restaurantes. Potenciado por IA.',
  ctaText = 'Comenzar Ahora',
  ctaLink = '/register',
  showCta = true,
}: HeroProps) {
  return (
    <section className="relative w-full h-[60vh] min-h-[400px] max-h-[700px] overflow-hidden">
      <img
        src="/buscadordebebidas.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
          {title}
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-amber-100 mb-8 drop-shadow max-w-2xl">
          {subtitle}
        </p>
        {showCta && (
          <Link
            to={ctaLink}
            className="inline-block bg-amber-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-base sm:text-lg font-semibold hover:bg-amber-500 transition shadow-lg"
          >
            {ctaText}
          </Link>
        )}
      </div>
    </section>
  )
}
