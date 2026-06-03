"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
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
import { Scholarship } from "@/lib/auth";

interface ScholarshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    code: string;
    name: string;
    type: string;
    recipients: number;
    percentage: number | null;
    requirements: string;
    year: number;
    notes: string;
    is_active?: boolean;
  }) => void;
  isSubmitting: boolean;
  title: string;
  submitText: string;
  initialData?: Scholarship | null;
}

const ScholarshipDialog = React.memo(function ScholarshipDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
  title,
  submitText,
  initialData,
}: ScholarshipDialogProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "",
    recipients: 1,
    percentage: null as number | null,
    requirements: "",
    year: new Date().getFullYear(),
    notes: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code,
        name: initialData.name,
        type: initialData.type,
        recipients: initialData.recipients,
        percentage: initialData.percentage,
        requirements: initialData.requirements,
        year: initialData.year,
        notes: initialData.notes,
        is_active: initialData.is_active,
      });
    } else {
      setFormData({
        code: "",
        name: "",
        type: "",
        recipients: 1,
        percentage: null,
        requirements: "",
        year: new Date().getFullYear(),
        notes: "",
        is_active: true,
      });
    }
    setErrors({});
  }, [initialData, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Mã học bổng là bắt buộc";
    } else if (formData.code.length > 50) {
      newErrors.code = "Mã học bổng không được quá 50 ký tự";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Tên học bổng là bắt buộc";
    } else if (formData.name.length > 255) {
      newErrors.name = "Tên học bổng không được quá 255 ký tự";
    }

    if (!formData.type.trim()) {
      newErrors.type = "Loại học bổng là bắt buộc";
    } else if (formData.type.length > 50) {
      newErrors.type = "Loại học bổng không được quá 50 ký tự";
    }

    if (formData.recipients <= 0) {
      newErrors.recipients = "Số suất phải lớn hơn 0";
    }

    if (formData.percentage !== null && (formData.percentage < 0 || formData.percentage > 100)) {
      newErrors.percentage = "Tỷ lệ phải từ 0 đến 100%";
    }

    if (formData.year < 2020 || formData.year > 2030) {
      newErrors.year = "Năm phải từ 2020 đến 2030";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const scholarshipTypes = [
    "Học bổng học tập",
    "Học bổng khuyến khích học tập",
    "Học bổng tài trợ",
    "Học bổng doanh nghiệp",
    "Học bổng chính phủ",
    "Học bổng quốc tế",
    "Học bổng nghiên cứu",
    "Học bổng thể thao",
    "Học bổng nghệ thuật",
    "Học bổng xã hội",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Mã Học Bổng *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder="VD: HB2025001"
                className={errors.code ? "border-red-500" : ""}
              />
              {errors.code && (
                <p className="text-sm text-red-500 mt-1">{errors.code}</p>
              )}
            </div>

            <div>
              <Label htmlFor="year">Năm *</Label>
              <Input
                id="year"
                type="number"
                min={2020}
                max={2030}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                className={errors.year ? "border-red-500" : ""}
              />
              {errors.year && (
                <p className="text-sm text-red-500 mt-1">{errors.year}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="name">Tên Học Bổng *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="VD: Học bổng khuyến khích học tập xuất sắc"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Loại Học Bổng *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger className={errors.type ? "border-red-500" : ""}>
                  <SelectValue placeholder="Chọn loại học bổng" />
                </SelectTrigger>
                <SelectContent>
                  {scholarshipTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500 mt-1">{errors.type}</p>
              )}
            </div>

            <div>
              <Label htmlFor="recipients">Số Suất *</Label>
              <Input
                id="recipients"
                type="number"
                min={1}
                value={formData.recipients}
                onChange={(e) =>
                  setFormData({ ...formData, recipients: parseInt(e.target.value) || 1 })
                }
                className={errors.recipients ? "border-red-500" : ""}
              />
              {errors.recipients && (
                <p className="text-sm text-red-500 mt-1">{errors.recipients}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="percentage">Tỷ Lệ Hỗ Trợ (%)</Label>
            <Input
              id="percentage"
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={formData.percentage || ""}
              onChange={(e) =>
                setFormData({ 
                  ...formData, 
                  percentage: e.target.value ? parseFloat(e.target.value) : null 
                })
              }
              placeholder="VD: 50 (cho 50%)"
              className={errors.percentage ? "border-red-500" : ""}
            />
            {errors.percentage && (
              <p className="text-sm text-red-500 mt-1">{errors.percentage}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Để trống nếu không áp dụng tỷ lệ phần trăm
            </p>
          </div>

          <div>
            <Label htmlFor="requirements">Yêu Cầu</Label>
            <Textarea
              id="requirements"
              value={formData.requirements}
              onChange={(e) =>
                setFormData({ ...formData, requirements: e.target.value })
              }
              placeholder="Mô tả các yêu cầu để nhận học bổng..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="notes">Ghi Chú</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Thông tin bổ sung về học bổng..."
              rows={2}
            />
          </div>

          {initialData && (
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
              <Label htmlFor="is_active">Học bổng đang hoạt động</Label>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang xử lý..." : submitText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default ScholarshipDialog;
