import request from './http'

export interface PointsProfile {
  points: number
  isUnlimited?: boolean
  makeupSignInChances: number
  signedInToday: boolean
  currentStreak: number
  todaySignInPoints: number
  costs: {
    drawGeneration: number
    aiChat: number
  }
}

export interface SignInResponse {
  signedIn: boolean
  alreadySignedIn?: boolean
  points: number
  isUnlimited?: boolean
  earned: number
  signDate: string
  currentStreak?: number
  awardedMakeupChance?: boolean
  makeupSignInChances?: number
}

export interface MakeupSignInResponse {
  signedIn: boolean
  makeup: boolean
  signDate: string
  points: number
  isUnlimited?: boolean
  earned: number
  makeupSignInChances: number
  currentStreak: number
}

export interface CalendarDay {
  date: string
  day: number
  signedIn: boolean
  isMakeup: boolean
  points: number
  isToday: boolean
  isPast: boolean
  isFuture: boolean
}

export interface PointsCalendar {
  month: string
  points: number
  isUnlimited?: boolean
  makeupSignInChances: number
  currentStreak: number
  days: CalendarDay[]
}

export interface PointLogItem {
  id: number
  userId: number
  amount: number
  balanceAfter: number
  type: string
  scene: string
  description: string | null
  refType: string | null
  refId: number | null
  createdAt: string
}

export interface PointLogListResponse {
  list: PointLogItem[]
  total: number
  page: number
  pageSize: number
}

export const getPointsProfile = () => {
  return request.get('/points/profile') as unknown as Promise<PointsProfile>
}

export const signIn = () => {
  return request.post('/points/sign-in') as unknown as Promise<SignInResponse>
}

export const getPointsCalendar = (month?: string) => {
  return request.get('/points/calendar', { params: { month } }) as unknown as Promise<PointsCalendar>
}

export const makeupSignIn = (date: string) => {
  return request.post('/points/makeup-sign-in', { date }) as unknown as Promise<MakeupSignInResponse>
}

export const getPointLogs = (params?: { page?: number; pageSize?: number }) => {
  return request.get('/points/logs', { params }) as unknown as Promise<PointLogListResponse>
}
