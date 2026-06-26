import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RecipeDetail from './pages/RecipeDetail'
import Favorites from './pages/Favorites'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/favorites" element={<Favorites />} />
    </Routes>
  )
}

export default App
