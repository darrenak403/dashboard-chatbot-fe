"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { AdmissionMethod } from "@/lib/auth";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionMethod: AdmissionMethod | null;
  onConfirm: () => Promise<void>;
  isLoading?: boolean;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  admissionMethod,
  onConfirm,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting admission method:", error);
    }
  };

  if (!admissionMethod) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <AlertDialogTitle>Xác Nhận Xóa</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>
              Bạn có chắc chắn muốn xóa phương thức tuyển sinh này không?
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-gray-900">
                <span className="text-gray-600">Mã:</span> {admissionMethod.method_code}
              </p>
              <p className="font-medium text-gray-900">
                <span className="text-gray-600">Tên:</span> {admissionMethod.name}
              </p>
              <p className="text-sm text-gray-600">
                <span className="text-gray-600">Năm:</span> {admissionMethod.year}
              </p>
            </div>
            <p className="text-sm text-red-600">
              <strong>Lưu ý:</strong> Hành động này sẽ thực hiện soft delete. 
              Phương thức sẽ được đánh dấu là không hoạt động và không hiển thị trong danh sách.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Hủy
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
