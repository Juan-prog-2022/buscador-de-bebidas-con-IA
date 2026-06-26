import { Outlet } from 'react-router-dom'
import Header from './Header'
import Hero from './Hero'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-100">
      <Header />
      <Hero />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
