import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'
import client from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const { data } = await client.post('/auth/login', { email, password })
        localStorage.setItem('token', data.token)
        set({ user: data.user, token: data.token })
      },

      register: async (name, email, password) => {
        const { data } = await client.post('/auth/register', { name, email, password })
        localStorage.setItem('token', data.token)
        set({ user: data.user, token: data.token })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },
    }),
    { name: 'auth-storage' }
  )
)
