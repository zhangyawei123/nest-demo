import request from '@/utils/request';

export type JdTrendProduct = {
  id: number;
  sku: string;
  url: string;
  name: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JdTrendItem = {
  id: number;
  sku: string;
  snapshotDate: string;
  capturedAt: string;
  productUrl: string;
  title: string;
  price: number | null;
  commentCount: number | null;
  shop: string;
  stockText: string;
  rankName: string;
  rankPosition: number | null;
  rankText: string;
  pageStatus: string;
  error: string;
  previousDate: string | null;
  previousPrice: number | null;
  priceChange: number | null;
  previousCommentCount: number | null;
  commentChange: number | null;
  previousRankPosition: number | null;
  rankChange: number | null;
  sampleCount: number;
  dailyMinPrice: number | null;
  dailyMaxPrice: number | null;
};

export type JdTrendReport = {
  id: number;
  reportDate: string;
  status: string;
  productCount: number;
  successCount: number;
  cookieStatus: string;
  collectionSlot: string;
  summary: {
    message: string;
    topCommentGrowth: JdTrendItem[];
    topPriceDrops: JdTrendItem[];
    topRankGrowth: JdTrendItem[];
  };
  items: JdTrendItem[];
  createdAt: string;
  updatedAt: string;
};

export type JdTrendConfiguration = {
  cookieConfigured: boolean;
  browserExecutable: string | null;
  collectionSchedule: string[];
  reportTime: string;
  timeZone: string;
  pacingSeconds: string;
  riskCooldownUntil: string | null;
  dingtalkConfigured: boolean;
  wecomConfigured: boolean;
  reportNotificationEnabled: boolean;
};

export const getJdTrendProducts = () =>
  request.get('/admin/jd-trends/products') as unknown as Promise<
    JdTrendProduct[]
  >;

export const createJdTrendProduct = (data: { value: string; name?: string }) =>
  request.post(
    '/admin/jd-trends/products',
    data,
  ) as unknown as Promise<JdTrendProduct>;

export const updateJdTrendProduct = (
  id: number,
  data: { name?: string; enabled?: boolean },
) =>
  request.patch(
    `/admin/jd-trends/products/${id}`,
    data,
  ) as unknown as Promise<JdTrendProduct>;

export const deleteJdTrendProduct = (id: number) =>
  request.delete(`/admin/jd-trends/products/${id}`) as unknown as Promise<{
    deleted: boolean;
  }>;

export const collectJdTrends = () =>
  request.post(
    '/admin/jd-trends/collect',
    {},
    { timeout: 10 * 60 * 1000 },
  ) as unknown as Promise<JdTrendReport>;

export const getLatestJdTrendReport = () =>
  request.get(
    '/admin/jd-trends/reports/latest',
  ) as unknown as Promise<JdTrendReport | null>;

export const getJdTrendReports = () =>
  request.get('/admin/jd-trends/reports') as unknown as Promise<
    JdTrendReport[]
  >;

export const getJdTrendConfiguration = () =>
  request.get(
    '/admin/jd-trends/configuration',
  ) as unknown as Promise<JdTrendConfiguration>;
