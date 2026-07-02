import { Routes, Route } from 'react-router-dom'
import PublicLayout from './components/PublicLayout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RecipeDetail from './pages/RecipeDetail'
import Favorites from './pages/Favorites'
import Collections from './pages/Collections'
import CollectionDetail from './pages/CollectionDetail'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/recipes/:id" element={<RecipeDetail />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/collections/:id" element={<CollectionDetail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
