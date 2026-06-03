"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, Users, Calendar, X } from "lucide-react";

interface WelcomeBannerProps {
  userName?: string;
  userRole?: string;
}

export default function WelcomeBanner({
  userName,
  userRole,
}: WelcomeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const getMotivationalMessage = () => {
    const messages = [
      "Hôm nay là một ngày tuyệt vời để quản lý hiệu quả!",
      "Bạn đang làm rất tốt! Tiếp tục phát huy nhé!",
      "Mỗi quyết định của bạn đều tạo nên sự khác biệt!",
      "Hãy biến những ý tưởng thành hiện thực!",
      "Thành công bắt đầu từ những bước đi nhỏ hôm nay!",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (!isVisible) return null;

  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

      <CardContent className="relative z-10 p-8">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {getGreeting()}, {userName || "Admin"}!
                </h2>
                <p className="text-blue-100 text-sm">
                  {currentTime.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <p className="text-lg text-blue-50 mb-6 max-w-2xl">
              {getMotivationalMessage()}
            </p>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  <Users className="h-3 w-3 mr-1" />
                  {userRole === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
              </div>

              <div className="flex items-center space-x-2 text-blue-100">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm">Hiệu suất: Xuất sắc</span>
              </div>

              <div className="flex items-center space-x-2 text-blue-100">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {currentTime.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
