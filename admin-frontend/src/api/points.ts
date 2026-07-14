import request from '@/utils/request';

export interface PointsProfile {
  points: number;
  isUnlimited?: boolean;
  makeupSignInChances: number;
  signedInToday: boolean;
  currentStreak: number;
  todaySignInPoints: number;
  costs: {
    drawGeneration: number;
    aiChat: number;
  };
}

export interface SignInCalendarDay {
  date: string;
  day: number;
  signedIn: boolean;
  isMakeup: boolean;
  points: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

export interface SignInCalendarResponse {
  month: string;
  points: number;
  isUnlimited?: boolean;
  makeupSignInChances: number;
  currentStreak: number;
  days: SignInCalendarDay[];
}

export interface PointLogItem {
  id: number;
  amount: number;
  balanceAfter: number;
  type: string;
  scene: string;
  description?: string | null;
  createdAt: string;
}

export interface PointLogResponse {
  list: PointLogItem[];
  total: number;
  page: number;
  pageSize: number;
}

export const getPointsProfile = () => {
  return request.get('/points/profile') as unknown as Promise<PointsProfile>;
};

export const signIn = () => {
  return request.post('/points/sign-in') as unknown as Promise<{
    signedIn: boolean;
    alreadySignedIn: boolean;
    points: number;
    isUnlimited?: boolean;
    earned: number;
    signDate: string;
    currentStreak: number;
    awardedMakeupChance: boolean;
    makeupSignInChances: number;
  }>;
};

export const makeupSignIn = (date: string) => {
  return request.post('/points/makeup-sign-in', {
    date,
  }) as unknown as Promise<{
    signedIn: boolean;
    makeup: boolean;
    signDate: string;
    points: number;
    isUnlimited?: boolean;
    earned: number;
    makeupSignInChances: number;
    currentStreak: number;
  }>;
};

export const getSignInCalendar = (params?: { month?: string }) => {
  return request.get('/points/calendar', {
    params,
  }) as unknown as Promise<SignInCalendarResponse>;
};

export const getPointLogs = (params?: { page?: number; pageSize?: number }) => {
  return request.get('/points/logs', {
    params,
  }) as unknown as Promise<PointLogResponse>;
};
