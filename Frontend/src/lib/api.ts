// src/lib/api.ts
import { User, SystemStatus, Activity } from "./types"

// UPDATED: Mock data now reflects your actual roles and fields
const mockUsers: User[] = [
  {
    _id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "Admin",
    status: "online",
    lastActive: new Date().toISOString(),
    avatar: "https://i.pravatar.cc/150?u=alice",
  },
  {
    _id: "2",
    name: "Bob Worker",
    email: "bob@example.com",
    role: "Worker",
    status: "away",
    lastActive: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    avatar: "https://i.pravatar.cc/150?u=bob",
  },
  {
    _id: "3",
    name: "Charlie Volunteer",
    email: "charlie@example.com",
    role: "Volunteer",
    status: "offline",
    lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    avatar: "https://i.pravatar.cc/150?u=charlie",
    skills: ["Heavy Machinery", "Logistics"],
    isAvailable: true,
  },
  {
    _id: "4",
    name: "Diana Volunteer",
    email: "diana@example.com",
    role: "Volunteer",
    status: "online",
    lastActive: new Date().toISOString(),
    skills: ["Medical", "First Aid"],
    isAvailable: false,
  },
]

const mockStatus: SystemStatus = {
  cpu: 45,
  memory: 62,
  activeUsers: 128,
  uptime: "14d 2h 45m",
}

const mockActivities: Activity[] = [
  {
    id: "1",
    userId: "1",
    action: "updated_settings",
    target: "System Configuration",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: "2",
    userId: "3",
    action: "status_change",
    target: "Available for Deployment",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "3",
    userId: "2",
    action: "logged_in",
    target: "Worker Portal",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
]

// Simulate network delay for API calls
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const fetchUsers = async (): Promise<User[]> => {
  await delay(800)
  return mockUsers
}

export const fetchSystemStatus = async (): Promise<SystemStatus> => {
  await delay(600)
  return mockStatus
}

export const fetchRecentActivity = async (): Promise<Activity[]> => {
  await delay(1000)
  return mockActivities
}