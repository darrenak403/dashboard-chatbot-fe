"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Eye,
  MessageSquare,
  Clock
} from "lucide-react";

interface QuickStatsProps {
  className?: string;
}

export default function QuickStats({ className }: QuickStatsProps) {
  const quickStats = [
    {
      label: "Lượt truy cập hôm nay",
      value: "2,847",
      change: "+12.5%",
      isPositive: true,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      label: "Người dùng hoạt động",
      value: "1,234",
      change: "+8.2%",
      isPositive: true,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      label: "Tin nhắn mới",
      value: "89",
      change: "-2.1%",
      isPositive: false,
      icon: MessageSquare,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      label: "Thời gian phản hồi",
      value: "1.2s",
      change: "-15.3%",
      isPositive: true,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    }
  ];

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {quickStats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <Badge 
                variant={stat.isPositive ? "default" : "destructive"}
                className={`text-xs ${
                  stat.isPositive 
                    ? "bg-green-100 text-green-700 hover:bg-green-100" 
                    : "bg-red-100 text-red-700 hover:bg-red-100"
                }`}
              >
                {stat.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {stat.change}
              </Badge>
            </div>
            
            <div className="space-y-1">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
