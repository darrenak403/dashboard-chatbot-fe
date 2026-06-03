"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { User } from "@/lib/auth";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export default function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onConfirm,
  isLoading = false,
}: DeleteUserDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting user:", error);
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span>Xác Nhận Xóa Người Dùng</span>
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa người dùng này không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Tên đăng nhập:</span>
              <p className="font-medium">{user.username}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">Vai trò:</span>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={getRoleBadgeColor(user.role)}
                >
                  {getRoleDisplayName(user.role)}
                </Badge>
              </div>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-600">Trạng thái:</span>
              <div className="mt-1">
                <Badge variant={user.is_active ? "default" : "secondary"}>
                  {user.is_active ? "Hoạt động" : "Không hoạt động"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Lưu ý quan trọng:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Đây là thao tác xóa mềm, tài khoản sẽ bị vô hiệu hóa</li>
                  <li>Người dùng sẽ không thể đăng nhập vào hệ thống</li>
                  <li>Dữ liệu liên quan đến người dùng sẽ được giữ lại</li>
                  <li>Có thể khôi phục tài khoản sau này nếu cần</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa Người Dùng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
