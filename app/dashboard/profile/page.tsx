"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Calendar, RefreshCw } from "lucide-react";
import { authService, User as UserType } from "@/lib/auth";

export default function ProfilePage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchProfile = async () => {
    try {
      setError("");
      const response = await authService.getProfile();
      setUser(response.data);
      // Update local storage with fresh data
      authService.setUserData(response.data);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không thể tải hồ sơ");
      if (error instanceof Error && error.message.includes("Authentication")) {
        authService.logout();
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      await fetchProfile();
      setIsLoading(false);
    };

    loadProfile();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProfile();
    setIsRefreshing(false);
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "super_admin":
        return "destructive";
      case "admin":
        return "default";
      default:
        return "default";
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Quản Trị Viên Cấp Cao";
      case "admin":
        return "Quản Trị Viên";
      default:
        return "Quản Trị Viên";
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hồ Sơ</h1>
            <p className="text-gray-600 mt-1">
              Quản lý thông tin tài khoản của bạn
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Làm Mới
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {user && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Profile Card */}
            <Card className="md:col-span-1">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src="/avatars/01.png"
                      alt={`@${user.username}`}
                    />
                    <AvatarFallback className="text-lg">
                      {getUserInitials(user.username)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{user.username}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
                <div className="flex justify-center mt-2">
                  <Badge variant={getRoleBadgeVariant(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Details Card */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Chi Tiết Tài Khoản
                </CardTitle>
                <CardDescription>
                  Thông tin tài khoản và cài đặt của bạn
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="user-id">ID Người Dùng</Label>
                    <Input
                      id="user-id"
                      value={user.id}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Tên Người Dùng</Label>
                    <Input
                      id="username"
                      value={user.username}
                      readOnly
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Địa Chỉ Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      value={user.email}
                      readOnly
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Vai Trò</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="role"
                      value={user.role.replace("_", " ").toUpperCase()}
                      readOnly
                      className="pl-10 bg-gray-50 capitalize"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="last-login">Đăng Nhập Lần Cuối</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="last-login"
                      value={
                        user.last_login_at
                          ? formatDate(user.last_login_at)
                          : "Chưa đăng nhập"
                      }
                      readOnly
                      className="pl-10 bg-gray-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
