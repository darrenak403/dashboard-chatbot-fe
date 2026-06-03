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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TuitionFee, Program, Campus } from "@/lib/auth";

interface TuitionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    program_id: string;
    campus_id: string;
    year: number;
    semester_group_1_3_fee: number;
    semester_group_4_6_fee: number;
    semester_group_7_9_fee: number;
  }) => void;
  programs: Program[];
  campuses: Campus[];
  isSubmitting: boolean;
  title: string;
  submitText: string;
  initialData?: TuitionFee | null;
}

const TuitionDialog = React.memo(function TuitionDialog({
  open,
  onOpenChange,
  onSubmit,
  programs,
  campuses,
  isSubmitting,
  title,
  submitText,
  initialData,
}: TuitionDialogProps) {
  const [formData, setFormData] = useState({
    program_id: "",
    campus_id: "",
    year: new Date().getFullYear(),
    semester_group_1_3_fee: 0,
    semester_group_4_6_fee: 0,
    semester_group_7_9_fee: 0,
  });

  useEffect(() => {
    console.log("TuitionDialog - Received campuses:", campuses);
    console.log("TuitionDialog - Received programs:", programs);

    if (initialData) {
      setFormData({
        program_id: initialData.program_id,
        campus_id: initialData.campus_id,
        year: initialData.year,
        semester_group_1_3_fee: initialData.semester_group_1_3_fee,
        semester_group_4_6_fee: initialData.semester_group_4_6_fee,
        semester_group_7_9_fee: initialData.semester_group_7_9_fee,
      });
    } else {
      setFormData({
        program_id: "",
        campus_id: "",
        year: new Date().getFullYear(),
        semester_group_1_3_fee: 0,
        semester_group_4_6_fee: 0,
        semester_group_7_9_fee: 0,
      });
    }
  }, [initialData, open, campuses, programs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="program">Chương Trình</Label>
            <Select
              value={formData.program_id}
              onValueChange={(value) =>
                setFormData({ ...formData, program_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chương trình" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id}>
                    {program.code} - {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="campus">Cơ Sở</Label>
            <Select
              value={formData.campus_id}
              onValueChange={(value) =>
                setFormData({ ...formData, campus_id: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn cơ sở" />
              </SelectTrigger>
              <SelectContent>
                {campuses.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.code} - {campus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Năm</Label>
            <Input
              id="year"
              type="number"
              min={2020}
              max={2030}
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: parseInt(e.target.value) })
              }
            />
          </div>

          <div>
            <Label htmlFor="fee1">Học Phí Kỳ 1-3</Label>
            <Input
              id="fee1"
              type="number"
              min={0}
              value={formData.semester_group_1_3_fee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  semester_group_1_3_fee: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="fee2">Học Phí Kỳ 4-6</Label>
            <Input
              id="fee2"
              type="number"
              min={0}
              value={formData.semester_group_4_6_fee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  semester_group_4_6_fee: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="fee3">Học Phí Kỳ 7-9</Label>
            <Input
              id="fee3"
              type="number"
              min={0}
              value={formData.semester_group_7_9_fee}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  semester_group_7_9_fee: parseFloat(e.target.value),
                })
              }
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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

export default TuitionDialog;
