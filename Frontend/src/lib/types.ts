// src/lib/types.ts

// UPDATED: Matched to your existing AuthContext roles
export type Role = "Admin" | "Worker" | "Volunteer"

export interface User {
  _id: string // UPDATED: Matched to your MongoDB _id
  name: string
  email: string
  role: Role
  status: "online" | "offline" | "away"
  lastActive: string
  avatar?: string
  
  // UPDATED: Added your specific fields
  skills?: string[] | string
  isAvailable?: boolean
  category?: string
  location?: any
}

export interface SystemStatus {
  cpu: number
  memory: number
  activeUsers: number
  uptime: string
}

export interface Activity {
  id: string
  userId: string
  action: string
  target: string
  timestamp: string
}