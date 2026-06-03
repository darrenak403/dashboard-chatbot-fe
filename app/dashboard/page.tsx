"use client";

import { useState, useEffect } from "react";
import { API_ENDPOINTS, ACTIVITY_COLORS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import WelcomeBanner from "@/components/dashboard/welcome-banner";
import { authService } from "@/lib/auth";

import {
  Building2,
  GraduationCap,
  MapPin,
  DollarSign,
  Activity,
  RefreshCw,
  Clock,
  Bell,
  Eye,
  MessageSquare,
} from "lucide-react";

// API Response Interfaces
interface DashboardStats {
  totalDepartments: number;
  totalPrograms: number;
  totalCampuses: number;
  totalStudents: number;
  totalTuitionPrograms: number;
  totalKnowledgeDocs: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  entityId: string;
  entityName: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  quickActions: QuickAction[];
}

interface StatCard {
  title: string;
  value: string;
  description: string;
  icon: any;
  color: string;
}

// Empty stats template for when no data is available
const createEmptyStatsArray = (): StatCard[] => [
  {
    title: "Tổng Số Khoa",
    value: "0",
    description: "Khoa đang hoạt động",
    icon: Building2,
    color: "text-blue-600",
  },
  {
    title: "Chương Trình",
    value: "0",
    description: "Chương trình có sẵn",
    icon: GraduationCap,
    color: "text-green-600",
  },
  {
    title: "Cơ Sở",
    value: "0",
    description: "Địa điểm cơ sở",
    icon: MapPin,
    color: "text-purple-600",
  },
  {
    title: "Học Phí Chương Trình",
    value: "0",
    description: "Chương trình có học phí",
    icon: DollarSign,
    color: "text-yellow-600",
  },
];

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [user, setUser] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user data
  useEffect(() => {
    const userData = authService.getUserData();
    setUser(userData);
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const response = await fetch(API_ENDPOINTS.DASHBOARD);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: Failed to fetch dashboard data`
        );
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error("Dashboard API Error:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load dashboard data"
      );
    }
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Refresh data
  const handleRefresh = async () => {
    await fetchDashboardData();
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Vừa xong";
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  // Get activity color based on type
  const getActivityColor = (type: string) => {
    return (
      ACTIVITY_COLORS[type as keyof typeof ACTIVITY_COLORS] || "bg-gray-600"
    );
  };

  // Create stats array from API data
  const createStatsArray = (stats: DashboardStats): StatCard[] => [
    {
      title: "Tổng Số Khoa",
      value: stats.totalDepartments.toString(),
      description: "Khoa đang hoạt động",
      icon: Building2,
      color: "text-blue-600",
    },
    {
      title: "Chương Trình",
      value: stats.totalPrograms.toString(),
      description: "Chương trình có sẵn",
      icon: GraduationCap,
      color: "text-green-600",
    },
    {
      title: "Cơ Sở",
      value: stats.totalCampuses.toString(),
      description: "Địa điểm cơ sở",
      icon: MapPin,
      color: "text-purple-600",
    },
    {
      title: "Học Phí Chương Trình",
      value: stats.totalTuitionPrograms.toString(),
      description: "Chương trình có học phí",
      icon: DollarSign,
      color: "text-yellow-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg animate-pulse"></div>
            <div className="h-6 w-96 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
          <div className="flex space-x-3">
            <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                  <div className="h-8 w-16 bg-gray-300 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border border-gray-200">
              <CardHeader className="border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {[...Array(5)].map((_, index) => (
                    <div
                      key={index}
                      className="flex items-start space-x-4 p-4 border border-gray-100 rounded-lg"
                    >
                      <div className="h-3 w-3 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-full bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            {[...Array(2)].map((_, index) => (
              <Card key={index} className="border border-gray-200">
                <CardHeader className="border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 w-full bg-gray-200 rounded-lg animate-pulse"
                      ></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Chào mừng đến với bảng điều khiển quản trị hiện đại
            </p>
          </div>
        </div>

        {/* Error State */}
        <div className="flex items-center justify-center min-h-[500px]">
          <Card className="border border-red-200 bg-gradient-to-br from-red-50 to-orange-50 max-w-md w-full">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center mx-auto">
                  <Bell className="h-10 w-10 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Không thể tải dữ liệu
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{error}</p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleRefresh}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Thử lại
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Báo cáo lỗi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = dashboardData
    ? createStatsArray(dashboardData.stats)
    : createEmptyStatsArray();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <WelcomeBanner userName={user?.username} userRole={user?.role} />

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Tổng quan hệ thống quản lý tuyển sinh
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden hover:-translate-y-1 transition-all duration-300 border border-gray-200 bg-gradient-to-br from-white to-gray-50"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                {stat.title}
              </CardTitle>
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${
                  index === 0
                    ? "from-blue-500 to-blue-600"
                    : index === 1
                    ? "from-green-500 to-green-600"
                    : index === 2
                    ? "from-purple-500 to-purple-600"
                    : "from-yellow-500 to-yellow-600"
                }`}
              >
                <stat.icon className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold text-gray-900">
                {stat.value}
              </div>
              <p className="text-sm text-gray-600">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="border border-gray-200 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">
                Hoạt Động Gần Đây
              </span>
              <CardDescription className="mt-1">
                Cập nhật mới nhất từ hệ thống
              </CardDescription>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {dashboardData?.recentActivities &&
          dashboardData.recentActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData.recentActivities.slice(0, 6).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
                >
                  <div className="flex-shrink-0">
                    <div
                      className={`w-3 h-3 ${getActivityColor(
                        activity.type
                      )} rounded-full`}
                    ></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {activity.entityName}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimestamp(activity.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-blue-600">
                        <Eye className="h-3 w-3" />
                        <span>Chi tiết</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Chưa có hoạt động
              </h3>
              <p className="text-gray-500">
                Các hoạt động mới sẽ xuất hiện ở đây
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
