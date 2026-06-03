"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Database,
  Server,
  Wifi,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

interface PerformanceMetricsProps {
  className?: string;
}

interface Metric {
  id: string;
  label: string;
  value: number;
  unit: string;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  trend: {
    value: number;
    isPositive: boolean;
  };
  icon: any;
  description: string;
}

export default function PerformanceMetrics({ className }: PerformanceMetricsProps) {
  const metrics: Metric[] = [
    {
      id: "response_time",
      label: "Thời gian phản hồi",
      value: 1.2,
      unit: "s",
      status: "excellent",
      trend: { value: 15, isPositive: true },
      icon: Zap,
      description: "Thời gian phản hồi trung bình của API"
    },
    {
      id: "database_performance",
      label: "Hiệu suất Database",
      value: 94,
      unit: "%",
      status: "excellent",
      trend: { value: 8, isPositive: true },
      icon: Database,
      description: "Hiệu suất truy vấn cơ sở dữ liệu"
    },
    {
      id: "server_uptime",
      label: "Thời gian hoạt động",
      value: 99.9,
      unit: "%",
      status: "excellent",
      trend: { value: 2, isPositive: true },
      icon: Server,
      description: "Tỷ lệ thời gian server hoạt động"
    },
    {
      id: "network_latency",
      label: "Độ trễ mạng",
      value: 45,
      unit: "ms",
      status: "good",
      trend: { value: 5, isPositive: false },
      icon: Wifi,
      description: "Độ trễ mạng trung bình"
    }
  ];

  const getStatusColor = (status: Metric['status']) => {
    switch (status) {
      case 'excellent':
        return {
          bg: 'bg-green-100',
          text: 'text-green-700',
          progress: 'bg-green-500'
        };
      case 'good':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          progress: 'bg-blue-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          progress: 'bg-yellow-500'
        };
      case 'critical':
        return {
          bg: 'bg-red-100',
          text: 'text-red-700',
          progress: 'bg-red-500'
        };
    }
  };

  const getStatusLabel = (status: Metric['status']) => {
    switch (status) {
      case 'excellent':
        return 'Xuất sắc';
      case 'good':
        return 'Tốt';
      case 'warning':
        return 'Cảnh báo';
      case 'critical':
        return 'Nghiêm trọng';
    }
  };

  const getProgressValue = (metric: Metric) => {
    if (metric.unit === '%') return metric.value;
    if (metric.id === 'response_time') return Math.max(0, 100 - (metric.value * 20));
    if (metric.id === 'network_latency') return Math.max(0, 100 - (metric.value / 2));
    return metric.value;
  };

  return (
    <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 ${className}`}>
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-gray-900">Chỉ Số Hiệu Suất</span>
            <p className="text-sm text-gray-600 mt-1">Theo dõi hiệu suất hệ thống real-time</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {metrics.map((metric) => {
            const colors = getStatusColor(metric.status);
            const progressValue = getProgressValue(metric);
            
            return (
              <div 
                key={metric.id}
                className="p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200 bg-white/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <metric.icon className={`h-4 w-4 ${colors.text}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {metric.label}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {metric.description}
                      </p>
                    </div>
                  </div>
                  
                  <Badge className={`${colors.bg} ${colors.text} hover:${colors.bg}`}>
                    {getStatusLabel(metric.status)}
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}{metric.unit}
                    </span>
                    <div className={`flex items-center space-x-1 text-sm ${
                      metric.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.trend.isPositive ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>{metric.trend.value}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Progress 
                      value={progressValue} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0</span>
                      <span>{metric.unit === '%' ? '100%' : 'Tối ưu'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-green-600">98.5%</p>
              <p className="text-xs text-gray-600">Hiệu suất tổng thể</p>
            </div>
            <div>
              <p className="text-lg font-bold text-blue-600">24/7</p>
              <p className="text-xs text-gray-600">Giám sát liên tục</p>
            </div>
            <div>
              <p className="text-lg font-bold text-purple-600">0</p>
              <p className="text-xs text-gray-600">Sự cố nghiêm trọng</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
