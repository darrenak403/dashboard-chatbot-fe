"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, LogOut, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService, User as UserType } from "@/lib/auth";

export default function Header() {
  const [user, setUser] = useState<UserType | null>(null);
  const router = useRouter();

  useEffect(() => {
    const userData = authService.getUserData();
    console.log("Header - User data:", userData);
    setUser(userData);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-6 h-16 sticky top-0 z-40">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative hover:bg-gray-100"
          >
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            <Bell className="h-5 w-5 text-gray-600" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-auto px-3 rounded-full hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8 ring-2 ring-blue-500/20">
                    <AvatarImage
                      src="/avatars/01.png"
                      alt={`@${user?.username}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                      {user ? getUserInitials(user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.username || "Người dùng"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.role === "super_admin" ? "Super Admin" : "Admin"}
                    </p>
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-64 p-2 z-50 border border-gray-200"
              align="end"
              forceMount
              sideOffset={5}
            >
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 ring-2 ring-blue-500/20">
                    <AvatarImage
                      src="/avatars/01.png"
                      alt={`@${user?.username}`}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                      {user ? getUserInitials(user.username) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold leading-none">
                      {user?.username || "Người dùng"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || "user@example.com"}
                    </p>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                      {user?.role === "super_admin"
                        ? "Quản Trị Viên Cấp Cao"
                        : "Quản Trị Viên"}
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link
                  href="/dashboard/profile"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-medium">Hồ Sơ</span>
                    <p className="text-xs text-gray-500">
                      Quản lý thông tin cá nhân
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer p-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="p-2 bg-red-100 rounded-lg mr-3">
                  <LogOut className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <span className="font-medium text-red-700">Đăng Xuất</span>
                  <p className="text-xs text-gray-500">Thoát khỏi hệ thống</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
