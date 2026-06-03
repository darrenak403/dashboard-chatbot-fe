"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, User, Key, LogIn, Shield } from "lucide-react";
import { authService } from "@/lib/auth";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await authService.login({ email, password });

      // Check if user has admin role
      const userRole = response.data.user.role;
      if (userRole !== "admin" && userRole !== "super_admin") {
        setError(
          "Truy cập bị từ chối. Chỉ quản trị viên mới có thể truy cập hệ thống này."
        );
        return;
      }

      // Store token and user data
      authService.setToken(response.data.token);
      authService.setUserData(response.data.user);

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Đăng nhập thất bại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-between h-full px-12 py-12 text-white">
          {/* Logo FPT University */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-24 h-14 bg-white rounded-lg flex items-center justify-center p-2">
              <Image
                src="/Logo-FPT-1024x620.webp"
                alt="FPT University Logo"
                width={88}
                height={53}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="text-lg font-bold">FPT University</div>
              <div className="text-sm text-blue-100">Admission Management</div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">
                Hệ Thống Quản Trị Tuyển Sinh
              </h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                Nền tảng quản lý tuyển sinh hiện đại và toàn diện cho FPT
                University
              </p>
            </div>
            <div className="space-y-4 text-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Quản lý hồ sơ tuyển sinh</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Theo dõi tiến trình xét tuyển</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Báo cáo thống kê chi tiết</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span>Tích hợp chatbot hỗ trợ</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-24 h-16 bg-white border border-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4 p-3">
              <Image
                src="/Logo-FPT-1024x620.webp"
                alt="FPT University Logo"
                width={80}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">FPT University</h2>
            <p className="text-sm text-gray-600">Admission Management System</p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" strokeWidth={2} />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
              Chào mừng trở lại
            </h2>
            <p className="text-gray-600 text-center">
              Đăng nhập vào hệ thống quản trị tuyển sinh FPT University
            </p>
          </div>

          {/* Login Form */}
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" strokeWidth={2} />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-colors"
                  placeholder="Hãy nhập email của bạn"
                />
              </div>
            </div>

            <div>
              <Label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Mật khẩu
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-gray-400" strokeWidth={2} />
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-colors"
                  placeholder="Hãy nhập mật khẩu của bạn"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff
                      className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                      strokeWidth={2}
                    />
                  ) : (
                    <Eye
                      className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors"
                      strokeWidth={2}
                    />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Đang đăng nhập...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <LogIn className="h-4 w-4 mr-2" strokeWidth={2} />
                  Đăng nhập
                </div>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Chỉ dành cho cán bộ quản trị tuyển sinh FPT University
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
