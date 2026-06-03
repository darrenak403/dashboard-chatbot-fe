"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, 
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight
} from "lucide-react";

interface RecentUpdatesProps {
  className?: string;
}

interface Update {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export default function RecentUpdates({ className }: RecentUpdatesProps) {
  const updates: Update[] = [
    {
      id: "1",
      type: "success",
      title: "Cập nhật thành công",
      description: "Đã thêm 15 chương trình đào tạo mới vào hệ thống",
      timestamp: "2 phút trước",
      user: {
        name: "Nguyễn Văn A",
        avatar: "/avatars/01.png"
      }
    },
    {
      id: "2",
      type: "info",
      title: "Thông báo hệ thống",
      description: "Bảo trì định kỳ sẽ được thực hiện vào 2:00 AM ngày mai",
      timestamp: "15 phút trước"
    },
    {
      id: "3",
      type: "warning",
      title: "Cảnh báo dung lượng",
      description: "Dung lượng lưu trữ đã sử dụng 85% - cần dọn dẹp",
      timestamp: "1 giờ trước"
    },
    {
      id: "4",
      type: "success",
      title: "Đồng bộ dữ liệu",
      description: "Đã đồng bộ thành công 1,234 hồ sơ sinh viên",
      timestamp: "2 giờ trước",
      user: {
        name: "Trần Thị B",
        avatar: "/avatars/02.png"
      }
    },
    {
      id: "5",
      type: "info",
      title: "Cập nhật tính năng",
      description: "Phiên bản 2.1.0 đã được triển khai với nhiều cải tiến",
      timestamp: "1 ngày trước"
    }
  ];

  const getIcon = (type: Update['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getBadgeColor = (type: Update['type']) => {
    switch (type) {
      case 'success':
        return "bg-green-100 text-green-700 hover:bg-green-100";
      case 'warning':
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
      case 'error':
        return "bg-red-100 text-red-700 hover:bg-red-100";
      default:
        return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    }
  };

  return (
    <Card className={`border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 ${className}`}>
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-gray-900">Cập Nhật Gần Đây</span>
              <p className="text-sm text-gray-600 mt-1">Theo dõi các thay đổi mới nhất</p>
            </div>
          </div>
          <Button variant="outline" size="sm">
            Xem tất cả
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-4">
          {updates.map((update) => (
            <div 
              key={update.id} 
              className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-100"
            >
              <div className="flex-shrink-0 mt-1">
                {getIcon(update.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {update.title}
                  </h4>
                  <Badge className={`text-xs ${getBadgeColor(update.type)}`}>
                    {update.type === 'success' && 'Thành công'}
                    {update.type === 'warning' && 'Cảnh báo'}
                    {update.type === 'error' && 'Lỗi'}
                    {update.type === 'info' && 'Thông tin'}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {update.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{update.timestamp}</span>
                  </div>
                  
                  {update.user && (
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={update.user.avatar} alt={update.user.name} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {update.user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500">{update.user.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" className="w-full justify-center">
            <Bell className="h-4 w-4 mr-2" />
            Đăng ký nhận thông báo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
