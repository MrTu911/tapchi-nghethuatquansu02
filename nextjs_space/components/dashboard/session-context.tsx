'use client'

import { createContext, useContext } from 'react'

export interface DashboardSession {
  uid: string
  fullName: string
  email: string
  role: string
}

export const DashboardSessionContext = createContext<DashboardSession | null>(null)

export function useDashboardSession(): DashboardSession | null {
  return useContext(DashboardSessionContext)
}
