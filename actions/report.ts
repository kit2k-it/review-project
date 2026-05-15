"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth, hasPermission, getUserCompanies } from "@/lib/auth";

/**
 * Parameters for report queries
 */
export interface ReportParams {
  companyId?: string;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
  limit?: number;
}

/**
 * Get accessible company IDs for the user
 */
async function getAccessibleCompanyIds(userId: string): Promise<string[]> {
  // Use getUserCompanies which handles permissions internally
  const companies = await getUserCompanies(userId);
  return companies.map(c => c.id);
}

/**
 * Build company filter based on user permissions
 */
async function buildCompanyFilter(userId: string, params?: ReportParams): Promise<any> {
  // Check if user is ADMIN by fetching user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // ADMIN sees all
  if (user?.role === "ADMIN") {
    if (params?.companyId) {
      return { companyId: params.companyId };
    }
    return {};
  }

  // Check global permissions
  const hasCompaniesRead = await hasPermission(userId, "companies:read");
  const hasCompaniesManage = await hasPermission(userId, "companies:update");

  if (hasCompaniesRead || hasCompaniesManage) {
    // Global permission holders see all companies (or filtered by specific company)
    if (params?.companyId) {
      return { companyId: params.companyId };
    }
    return {};
  }

  // Otherwise filter by accessible companies only
  const companyIds = await getAccessibleCompanyIds(userId);

  if (params?.companyId) {
    // Check if the specific company is accessible
    if (!companyIds.includes(params.companyId)) {
      return null; // No access
    }
    return { companyId: params.companyId };
  }

  if (companyIds.length === 0) {
    return { id: null }; // Force empty result
  }

  return { companyId: { in: companyIds } };
}

/**
 * Convert companyFilter to a Prisma where clause for companyId field
 */
function buildCompanyWhereClause(companyFilter: any): any {
  // No access - return empty where clause
  if (companyFilter.id === null) {
    return { id: null }; // forces empty result
  }

  // All companies (empty filter)
  if (companyFilter.companyId === undefined && companyFilter.companyId?.in === undefined) {
    return {};
  }

  // Specific company
  if (companyFilter.companyId) {
    return { companyId: companyFilter.companyId };
  }

  // Array of companies
  if (companyFilter.companyId?.in) {
    return { companyId: { in: companyFilter.companyId.in } };
  }

  return {};
}

/**
 * Convert companyFilter to a Prisma where clause for Company model's id field
 */
function buildCompanyIdWhere(companyFilter: any): any {
  // No access - return empty where clause
  if (companyFilter.id === null) {
    return { id: null }; // forces empty result
  }

  // All companies (empty filter)
  if (companyFilter.companyId === undefined && companyFilter.companyId?.in === undefined) {
    return {};
  }

  // Specific company
  if (companyFilter.companyId) {
    return { id: companyFilter.companyId };
  }

  // Array of companies
  if (companyFilter.companyId?.in) {
    return { id: { in: companyFilter.companyId.in } };
  }

  return {};
}

/**
 * Parse date range with defaults
 */
function parseDateRange(params?: ReportParams): { from: Date; to: Date } {
  const to = params?.dateTo ? new Date(params.dateTo) : new Date();
  const from = params?.dateFrom ? new Date(params.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default 30 days ago

  // Ensure 'to' is end of day
  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);

  return { from, to };
}

/**
 * Overview Statistics
 */
export async function getReportOverview(params?: ReportParams): Promise<{
  totalUsers: number;
  usersByRole: { role: string; count: number }[];
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalQrCodes: number;
  activeQrCodes: number;
  totalReviews: number;
  reviewsByStatus: { status: string; count: number }[];
  averageRating: number | null;
  preGeneratedReviews: {
    total: number;
    available: number;
    used: number;
  };
}> {
  // Get userId from session or use provided userId
  let userId: string;

  try {
    const session = await requireAuth();
    userId = session.id;
  } catch {
    // If requireAuth fails, the calling page should handle auth
    throw new Error("Chưa đăng nhập");
  }

  // Build company filter
  const companyFilter = await buildCompanyFilter(userId, params);
  if (companyFilter === null) {
    throw new Error("Không có quyền truy cập dữ liệu");
  }

  // Parallel queries for overview
  const [
    totalUsers,
    usersByRole,
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalQrCodes,
    activeQrCodes,
    reviewsAgg,
    preGenAgg,
  ] = await Promise.all([
    // Total users (all users visible for admin stats)
    prisma.user.count(),
    // Users by role
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
      orderBy: { role: "asc" },
    }),
    // Total companies (filtered by permission)
    prisma.company.count({ where: buildCompanyIdWhere(companyFilter) }),
    // Active companies
    prisma.company.count({ where: { ...buildCompanyIdWhere(companyFilter), isActive: true } }),
    // Inactive companies
    prisma.company.count({ where: { ...buildCompanyIdWhere(companyFilter), isActive: false } }),
    // Total QR codes (filtered by company)
    companyFilter.id === null
      ? Promise.resolve(0)
      : prisma.qrCode.count({
        where: buildCompanyWhereClause(companyFilter),
      }),
    // Active QR codes
    companyFilter.id === null
      ? Promise.resolve(0)
      : prisma.qrCode.count({
        where: {
          ...buildCompanyWhereClause(companyFilter),
          isActive: true,
        },
      }),
    // Review statistics by status
    companyFilter.id === null
      ? Promise.resolve([])
      : prisma.review.groupBy({
        by: ["status"],
        where: {
          ...buildCompanyWhereClause(companyFilter),
        },
        _count: { id: true },
        orderBy: { status: "asc" },
      }),
    // Pre-generated review stats (only filter by company)
    companyFilter.id === null
      ? Promise.resolve([] as any[])
      : prisma.preGeneratedReview.groupBy({
        by: ["isUsed"],
        where: buildCompanyWhereClause(companyFilter),
        _count: { id: true },
      }),
  ]);

  // Calculate average rating (only for SUBMITTED reviews)
  const avgRatingResult = await prisma.review.aggregate({
    where: companyFilter.id === null
      ? { status: "SUBMITTED" }
      : {
        ...buildCompanyWhereClause(companyFilter),
        status: "SUBMITTED",
      },
    _avg: { rating: true },
  });

  // Transform pre-generated stats
  const available = preGenAgg.find(g => g.isUsed === false)?._count.id || 0;
  const used = preGenAgg.find(g => g.isUsed === true)?._count.id || 0;

  return {
    totalUsers,
    usersByRole: usersByRole.map(r => ({ role: r.role, count: r._count.id })),
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalQrCodes,
    activeQrCodes,
    totalReviews: reviewsAgg.reduce((sum, r) => sum + r._count.id, 0),
    reviewsByStatus: reviewsAgg.map(r => ({ status: r.status, count: r._count.id })),
    averageRating: avgRatingResult._avg.rating || null,
    preGeneratedReviews: {
      total: available + used,
      available,
      used,
    },
  };
}

/**
 * Time Series Data for trend charts
 */
export async function getTimeSeriesData(params?: ReportParams): Promise<{
  dates: string[];
  companies: number[];
  qrCodes: number[];
  reviews: number[];
}> {
  const session = await requireAuth();
  const userId = session.id;
  const { from, to } = parseDateRange(params);

  // Build company filter
  const companyFilter = await buildCompanyFilter(userId, params);
  if (companyFilter === null) {
    throw new Error("Không có quyền truy cập dữ liệu");
  }

  // Determine date range bucket (daily)
  // We'll generate all dates between from and to
  const dates: string[] = [];
  const dateMap = new Map<string, {
    companiesCreated: number;
    qrCodesCreated: number;
    reviewsSubmitted: number;
  }>();

  let current = new Date(from);
  while (current <= to) {
    const dateStr = current.toISOString().split('T')[0];
    dates.push(dateStr);
    dateMap.set(dateStr, { companiesCreated: 0, qrCodesCreated: 0, reviewsSubmitted: 0 });
    current.setDate(current.getDate() + 1);
  }

  // Query companies created per day
  const companiesByDay = await prisma.company.groupBy({
    by: ["createdAt"],
    where: {
      ...buildCompanyIdWhere(companyFilter),
      createdAt: { gte: from, lte: to },
    },
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  });

  companiesByDay.forEach(c => {
    const dateStr = c.createdAt.toISOString().split('T')[0];
    const data = dateMap.get(dateStr);
    if (data) data.companiesCreated = c._count.id;
  });

  // Query QR codes created per day (filter by company)
  const qrCodeFilter = {
    ...buildCompanyWhereClause(companyFilter),
    createdAt: { gte: from, lte: to },
  };

  const qrCodesByDay = await prisma.qrCode.groupBy({
    by: ["createdAt"],
    where: qrCodeFilter,
    _count: { id: true },
    orderBy: { createdAt: "asc" },
  });

  qrCodesByDay.forEach(q => {
    const dateStr = q.createdAt.toISOString().split('T')[0];
    const data = dateMap.get(dateStr);
    if (data) data.qrCodesCreated = q._count.id;
  });

  // Query reviews submitted per day (use submittedAt)
  const reviewFilter = {
    ...buildCompanyWhereClause(companyFilter),
    status: "SUBMITTED",
    submittedAt: { gte: from, lte: to },
  };

  const reviewsByDay = await prisma.review.groupBy({
    by: ["submittedAt"],
    where: reviewFilter,
    _count: { id: true },
    orderBy: { submittedAt: "asc" },
  });

  reviewsByDay.forEach(r => {
    if (!r.submittedAt) return; // Skip if submittedAt is null
    const dateStr = r.submittedAt.toISOString().split('T')[0];
    const data = dateMap.get(dateStr);
    if (data) data.reviewsSubmitted = r._count.id;
  });

  return {
    dates,
    companies: dates.map(d => dateMap.get(d)!.companiesCreated),
    qrCodes: dates.map(d => dateMap.get(d)!.qrCodesCreated),
    reviews: dates.map(d => dateMap.get(d)!.reviewsSubmitted),
  };
}

/**
 * Review Rating Distribution
 */
export async function getReviewRatingDistribution(params?: ReportParams): Promise<{
  rating: number;
  count: number;
  percentage: number;
}[]> {
  const session = await requireAuth();
  const userId = session.id;

  const companyFilter = await buildCompanyFilter(userId, params);
  if (companyFilter === null) {
    throw new Error("Không có quyền truy cập dữ liệu");
  }

  const filter = {
    ...buildCompanyWhereClause(companyFilter),
    status: "SUBMITTED",
  };

  const result = await prisma.review.groupBy({
    by: ["rating"],
    where: filter,
    _count: { id: true },
    orderBy: { rating: "asc" },
  });

  const total = result.reduce((sum, r) => sum + r._count.id, 0);

  return result
    .map(r => ({
      rating: r.rating,
      count: r._count.id,
      percentage: total > 0 ? (r._count.id / total) * 100 : 0,
    }))
    .sort((a, b) => a.rating - b.rating);
}

/**
 * Top Companies by Review Count
 */
export async function getTopCompaniesByReviews(params: ReportParams & { limit?: number } = {}): Promise<{
  companyId: string;
  companyName: string;
  reviewCount: number;
  averageRating: number | null;
}[]> {
  const session = await requireAuth();
  const userId = session.id;
  const limit = params.limit || 10;

  const companyFilter = await buildCompanyFilter(userId, params);
  if (companyFilter === null) {
    throw new Error("Không có quyền truy cập dữ liệu");
  }

  const where = buildCompanyWhereClause(companyFilter);

  const result = await prisma.review.groupBy({
    by: ["companyId"],
    where: {
      ...where,
      status: "SUBMITTED",
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  // Fetch company names and ratings in parallel
  const data = await Promise.all(
    result.map(async (r) => {
      const company = await prisma.company.findUnique({
        where: { id: r.companyId },
        select: { name: true },
      });

      const avgRating = await prisma.review.aggregate({
        where: { companyId: r.companyId, status: "SUBMITTED" },
        _avg: { rating: true },
      });

      return {
        companyId: r.companyId,
        companyName: company?.name || "Unknown",
        reviewCount: r._count.id,
        averageRating: avgRating._avg.rating || null,
      };
    })
  );

  return data;
}

/**
 * Top QR Codes by Usage (review count)
 */
export async function getTopQrCodesByUsage(params: ReportParams & { limit?: number } = {}): Promise<{
  qrCodeId: string;
  qrCodeCode: string;
  companyName: string;
  reviewCount: number;
}[]> {
  const session = await requireAuth();
  const userId = session.id;
  const limit = params.limit || 10;

  const companyFilter = await buildCompanyFilter(userId, params);
  if (companyFilter === null) {
    throw new Error("Không có quyền truy cập dữ liệu");
  }

  // Build review where clause with company filter
  const reviewWhere = {
    ...buildCompanyWhereClause(companyFilter),
    status: "SUBMITTED",
  };

  const result = await prisma.review.groupBy({
    by: ["qrCodeId"],
    where: reviewWhere,
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  // Fetch QR code details and company names in parallel
  const data = await Promise.all(
    result.map(async (r) => {
      const qrCode = await prisma.qrCode.findUnique({
        where: { id: r.qrCodeId },
        include: { company: { select: { name: true } } },
      });

      return {
        qrCodeId: r.qrCodeId,
        qrCodeCode: qrCode?.code || "Unknown",
        companyName: qrCode?.company?.name || "Unknown",
        reviewCount: r._count.id,
      };
    })
  );

  return data;
}

/**
 * Background Job Statistics
 */
export async function getBackgroundJobStats(params?: ReportParams): Promise<{
  totalJobs: number;
  jobsByStatus: { status: string; count: number }[];
  completionRate: number;
  averageAttempts: number;
  recentFailures: { id: string; companyId: string; errorMsg: string | null; createdAt: Date }[];
}> {
  const session = await requireAuth();
  const userId = session.id;

  const companyFilter = await buildCompanyFilter(userId, params);
  if (companyFilter === null) {
    throw new Error("Không có quyền truy cập dữ liệu");
  }

  // Build where clause for background jobs
  const jobWhere = buildCompanyWhereClause(companyFilter);

  const [
    totalJobs,
    jobsByStatus,
    avgAttempts,
    failures,
  ] = await Promise.all([
    prisma.backgroundJob.count({ where: jobWhere }),
    prisma.backgroundJob.groupBy({
      by: ["status"],
      where: jobWhere,
      _count: { id: true },
      orderBy: { status: "asc" },
    }),
    prisma.backgroundJob.aggregate({
      where: jobWhere,
      _avg: { attempts: true },
    }),
    prisma.backgroundJob.findMany({
      where: { ...jobWhere, status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, companyId: true, errorMsg: true, createdAt: true },
    }),
  ]);

  const completed = jobsByStatus.find(j => j.status === "COMPLETED")?._count.id || 0;
  const totalWithStatus = jobsByStatus.reduce((sum, j) => sum + j._count.id, 0);
  const completionRate = totalWithStatus > 0 ? (completed / totalWithStatus) * 100 : 0;

  return {
    totalJobs,
    jobsByStatus: jobsByStatus.map(j => ({ status: j.status, count: j._count.id })),
    completionRate,
    averageAttempts: avgAttempts._avg.attempts || 0,
    recentFailures: failures,
  };
}

/**
 * CSV Export (placeholder - can be extended)
 */
export async function exportReportCsv(params?: ReportParams): Promise<Blob> {
  // For now, export overview data as CSV
  const overview = await getReportOverview(params);

  const csvContent = [
    ["Metric", "Value"],
    ["Total Users", overview.totalUsers.toString()],
    ["Total Companies", overview.totalCompanies],
    ["Active Companies", overview.activeCompanies],
    ["Inactive Companies", overview.inactiveCompanies],
    ["Total QR Codes", overview.totalQrCodes],
    ["Active QR Codes", overview.activeQrCodes],
    ["Total Reviews", overview.totalReviews],
    ["Average Rating", overview.averageRating?.toFixed(2) || "N/A"],
    ["Pre-generated Available", overview.preGeneratedReviews.available],
    ["Pre-generated Used", overview.preGeneratedReviews.used],
    [],
    ["Users by Role"],
    ...overview.usersByRole.map(u => [u.role, u.count.toString()]),
    [],
    ["Reviews by Status"],
    ...overview.reviewsByStatus.map(s => [s.status, s.count.toString()]),
  ]
    .map(row => row.join(","))
    .join("\n");

  return new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
}

/**
 * Get report overview for EMPLOYEE role
 * Only shows data for companies they manage/own
 */
export async function getEmployeeReportOverview(userId: string, params?: ReportParams): Promise<{
  totalCompanies: number;
  activeCompanies: number;
  inactiveCompanies: number;
  totalQrCodes: number;
  activeQrCodes: number;
  totalReviews: number;
  reviewsByStatus: { status: string; count: number }[];
  averageRating: number | null;
  preGeneratedReviews: {
    total: number;
    available: number;
    used: number;
  };
}> {
  // Get companies this employee owns
  const ownedCompanies = await prisma.company.findMany({
    where: { userId },
    select: { id: true },
  });
  const ownedIds = ownedCompanies.map(c => c.id);

  // Get companies user has permissions for (from userPermission)
  const permCompanies = await prisma.userPermission.findMany({
    where: {
      userId,
      companyId: { not: null },
    },
    select: { companyId: true },
    distinct: ['companyId'],
  });
  const permIds = permCompanies.map(p => p.companyId!).filter(Boolean);

  // Merge all company IDs (owned + permission-based)
  const allCompanyIds = [...new Set([...ownedIds, ...permIds])];

  if (allCompanyIds.length === 0) {
    return {
      totalCompanies: 0,
      activeCompanies: 0,
      inactiveCompanies: 0,
      totalQrCodes: 0,
      activeQrCodes: 0,
      totalReviews: 0,
      reviewsByStatus: [],
      averageRating: null,
      preGeneratedReviews: { total: 0, available: 0, used: 0 },
    };
  }

  const { from, to } = parseDateRange(params);

  // Build where clause for date range
  const dateFilter: any = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.gte = from;
    if (to) dateFilter.createdAt.lte = to;
  }

  const [
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalQrCodes,
    activeQrCodes,
    reviewsAgg,
    preGenAgg,
  ] = await Promise.all([
    prisma.company.count({ where: { id: { in: allCompanyIds } } }),
    prisma.company.count({ where: { id: { in: allCompanyIds }, isActive: true } }),
    prisma.company.count({ where: { id: { in: allCompanyIds }, isActive: false } }),
    prisma.qrCode.count({ where: { companyId: { in: allCompanyIds } } }),
    prisma.qrCode.count({ where: { companyId: { in: allCompanyIds }, isActive: true } }),
    prisma.review.groupBy({
      by: ["status"],
      where: { companyId: { in: allCompanyIds } },
      _count: { id: true },
      orderBy: { status: "asc" },
    }),
    prisma.preGeneratedReview.groupBy({
      by: ["isUsed"],
      where: { companyId: { in: allCompanyIds } },
      _count: { id: true },
    }),
  ]);

  // Calculate average rating
  const avgRatingResult = await prisma.review.aggregate({
    where: { companyId: { in: allCompanyIds }, status: "SUBMITTED" },
    _avg: { rating: true },
  });

  const available = preGenAgg.find(g => g.isUsed === false)?._count.id || 0;
  const used = preGenAgg.find(g => g.isUsed === true)?._count.id || 0;

  return {
    totalCompanies,
    activeCompanies,
    inactiveCompanies,
    totalQrCodes,
    activeQrCodes,
    totalReviews: reviewsAgg.reduce((sum, r) => sum + r._count.id, 0),
    reviewsByStatus: reviewsAgg.map(r => ({ status: r.status, count: r._count.id })),
    averageRating: avgRatingResult._avg.rating || null,
    preGeneratedReviews: {
      total: available + used,
      available,
      used,
    },
  };
}
