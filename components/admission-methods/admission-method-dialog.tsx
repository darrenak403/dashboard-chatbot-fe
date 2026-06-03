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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle } from "lucide-react";
import { AdmissionMethod } from "@/lib/auth";

interface AdmissionMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  admissionMethod?: AdmissionMethod | null;
  onSave: (data: AdmissionMethodFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface AdmissionMethodFormData {
  method_code: string;
  name: string;
  requirements: string;
  notes: string;
  year: number;
  is_active: boolean;
}

export default function AdmissionMethodDialog({
  open,
  onOpenChange,
  admissionMethod,
  onSave,
  isLoading = false,
}: AdmissionMethodDialogProps) {
  const [formData, setFormData] = useState<AdmissionMethodFormData>({
    method_code: "",
    name: "",
    requirements: "",
    notes: "",
    year: new Date().getFullYear(),
    is_active: true,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof AdmissionMethodFormData, string>>
  >({});

  const isEditing = !!admissionMethod;

  // Reset form when dialog opens/closes or admission method changes
  useEffect(() => {
    if (open) {
      if (admissionMethod) {
        setFormData({
          method_code: admissionMethod.method_code,
          name: admissionMethod.name,
          requirements: admissionMethod.requirements || "",
          notes: admissionMethod.notes || "",
          year: admissionMethod.year,
          is_active: admissionMethod.is_active,
        });
      } else {
        setFormData({
          method_code: "",
          name: "",
          requirements: "",
          notes: "",
          year: new Date().getFullYear(),
          is_active: true,
        });
      }
      setErrors({});
    }
  }, [open, admissionMethod]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AdmissionMethodFormData, string>> =
      {};

    if (!formData.method_code.trim()) {
      newErrors.method_code = "Mã phương thức là bắt buộc";
    } else if (formData.method_code.length > 10) {
      newErrors.method_code = "Mã phương thức không được quá 10 ký tự";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Tên phương thức là bắt buộc";
    } else if (formData.name.length > 255) {
      newErrors.name = "Tên phương thức không được quá 255 ký tự";
    }

    if (formData.year < 2020 || formData.year > 2030) {
      newErrors.year = "Năm phải từ 2020 đến 2030";
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
      console.error("Error saving admission method:", error);
    }
  };

  const handleInputChange = (
    field: keyof AdmissionMethodFormData,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Chỉnh Sửa Phương Thức Tuyển Sinh"
              : "Thêm Phương Thức Tuyển Sinh Mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin phương thức tuyển sinh."
              : "Tạo phương thức tuyển sinh mới. Các trường có dấu * là bắt buộc."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Method Code */}
            <div className="space-y-2">
              <Label htmlFor="method_code">
                Mã Phương Thức <span className="text-red-500">*</span>
              </Label>
              <Input
                id="method_code"
                value={formData.method_code}
                onChange={(e) =>
                  handleInputChange("method_code", e.target.value)
                }
                placeholder="VD: XETTUYEN"
                maxLength={10}
                className={errors.method_code ? "border-red-500" : ""}
              />
              {errors.method_code && (
                <div className="flex items-center space-x-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.method_code}</span>
                </div>
              )}
            </div>

            {/* Year */}
            <div className="space-y-2">
              <Label htmlFor="year">
                Năm <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.year.toString()}
                onValueChange={(value) =>
                  handleInputChange("year", parseInt(value))
                }
              >
                <SelectTrigger className={errors.year ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {errors.year && (
                <div className="flex items-center space-x-1 text-red-500 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.year}</span>
                </div>
              )}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên Phương Thức <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="VD: Xét tuyển thẳng"
              maxLength={255}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <div className="flex items-center space-x-1 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Requirements */}
          <div className="space-y-2">
            <Label htmlFor="requirements">Yêu Cầu</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) =>
                handleInputChange("requirements", e.target.value)
              }
              placeholder="Mô tả các yêu cầu đầu vào cho phương thức tuyển sinh này..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Ghi chú bổ sung..."
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Is Active (only show in edit mode) */}
          {isEditing && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
              />
              <Label htmlFor="is_active">Đang hoạt động</Label>
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
