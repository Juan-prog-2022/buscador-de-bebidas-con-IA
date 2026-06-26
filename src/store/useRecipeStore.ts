import { create } from 'zustand'
import api from '../api/client'

export interface Recipe {
  id: string
  name: string
  description: string
  ingredients: string[]
  instructions: string
  imageUrl: string
  averageRating: number
  favoriteCount: number
  Category: { id: string; name: string; type: string }
  User: { id: string; name: string }
}

interface RecipeStore {
  recipes: Recipe[]
  loading: boolean
  modalRecipe: Recipe | null
  modalOpen: boolean
  fetchRecipes: () => Promise<void>
  openModal: (recipe: Recipe) => void
  closeModal: () => void
}

export const useRecipeStore = create<RecipeStore>((set) => ({
  recipes: [],
  loading: false,
  modalRecipe: null,
  modalOpen: false,
  fetchRecipes: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/recipes')
      set({ recipes: res.data, loading: false })
    } catch {
      set({ loading: false })
    }
  },
  openModal: (recipe) => set({ modalRecipe: recipe, modalOpen: true }),
  closeModal: () => set({ modalOpen: false, modalRecipe: null }),
}))
