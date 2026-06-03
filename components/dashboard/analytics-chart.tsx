"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  Download
} from "lucide-react";

interface AnalyticsChartProps {
  className?: string;
}

export default function AnalyticsChart({ className }: AnalyticsChartProps) {
  // Mock data for the chart
  const chartData = [
    { month: "T1", value: 65, color: "bg-blue-500" },
    { month: "T2", value: 78, color: "bg-blue-500" },
    { month: "T3", value: 52, color: "bg-blue-500" },
    { month: "T4", value: 85, color: "bg-blue-500" },
    { month: "T5", value: 92, color: "bg-blue-500" },
    { month: "T6", value: 88, color: "bg-blue-500" },
    { month: "T7", value: 95, color: "bg-blue-500" },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value));

  return (
    <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 ${className}`}>
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Thống Kê Truy Cập</span>
              <p className="text-sm text-gray-600 mt-1">7 tháng gần đây</p>
            </div>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              <TrendingUp className="h-3 w-3 mr-1" />
              +23.5%
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Xuất
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Chart */}
          <div className="h-64 flex items-end justify-between space-x-2">
            {chartData.map((data, index) => (
              <div key={index} className="flex flex-col items-center space-y-2 flex-1">
                <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                  <div 
                    className={`${data.color} rounded-lg transition-all duration-1000 ease-out hover:bg-blue-600`}
                    style={{ 
                      height: `${(data.value / maxValue) * 200}px`,
                      minHeight: '20px'
                    }}
                  ></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {data.value}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-600">{data.month}</span>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">2.4K</p>
              <p className="text-sm text-gray-600">Trung bình/tháng</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">+18%</p>
              <p className="text-sm text-gray-600">Tăng trưởng</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">95</p>
              <p className="text-sm text-gray-600">Cao nhất</p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Button variant="outline" size="sm" className="text-xs">
              <Calendar className="h-3 w-3 mr-1" />
              7 ngày
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              30 ngày
            </Button>
            <Button variant="default" size="sm" className="text-xs bg-blue-600">
              7 tháng
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              1 năm
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
