"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { User } from "@/lib/auth";

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
  onSave: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'admin' | 'staff' | 'super_admin';
  is_active: boolean;
}

export default function UserDialog({
  open,
  onOpenChange,
  user,
  onSave,
  isLoading = false,
}: UserDialogProps) {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    role: "staff",
    is_active: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);

  const isEditing = !!user;

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        setFormData({
          username: user.username,
          email: user.email,
          password: "", // Don't pre-fill password for editing
          role: user.role,
          is_active: user.is_active,
        });
      } else {
        setFormData({
          username: "",
          email: "",
          password: "",
          role: "staff",
          is_active: true,
        });
      }
      setErrors({});
      setShowPassword(false);
    }
  }, [open, user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Tên đăng nhập là bắt buộc";
    } else if (formData.username.length < 3) {
      newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
    } else if (formData.username.length > 50) {
      newErrors.username = "Tên đăng nhập không được quá 50 ký tự";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    // Password validation - required for new users, optional for editing
    if (!isEditing && !formData.password.trim()) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.trim() && formData.password.length < 8) {
      newErrors.password = "Mật khẩu phải có ít nhất 8 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving user:", error);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'staff':
        return 'Nhân viên';
      case 'student':
        return 'Sinh viên';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Chỉnh Sửa Người Dùng" : "Thêm Người Dùng Mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin người dùng."
              : "Tạo tài khoản người dùng mới. Các trường có dấu * là bắt buộc."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">
              Tên đăng nhập <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              placeholder="VD: john_doe"
              className={errors.username ? "border-red-500" : ""}
            />
            {errors.username && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.username}</span>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              placeholder="VD: john@example.com"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.email}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">
              Mật khẩu {!isEditing && <span className="text-red-500">*</span>}
              {isEditing && <span className="text-sm text-gray-500">(để trống nếu không đổi)</span>}
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={isEditing ? "Nhập mật khẩu mới..." : "Nhập mật khẩu..."}
                className={errors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange("role", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">{getRoleDisplayName("student")}</SelectItem>
                <SelectItem value="staff">{getRoleDisplayName("staff")}</SelectItem>
                <SelectItem value="admin">{getRoleDisplayName("admin")}</SelectItem>
                <SelectItem value="super_admin">{getRoleDisplayName("super_admin")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Is Active (only show in edit mode) */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange("is_active", checked)}
              />
              <Label htmlFor="is_active">Tài khoản đang hoạt động</Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Cập Nhật" : "Tạo Mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
