"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Plus, RefreshCw, Edit, Trash2, Check } from "lucide-react";
import { admissionYearsService, AdmissionYear } from "@/lib/admission-years";
import { useYear } from "@/contexts/year-context";
import { authService } from "@/lib/auth";

export default function YearsPage() {
  const router = useRouter();
  const { selectedYear, setSelectedYear } = useYear();
  const [years, setYears] = useState<AdmissionYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AdmissionYear | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear() + 1,
    label: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdmissionYear | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const fetchYears = useCallback(async () => {
    try {
      setError("");
      const res = await admissionYearsService.list();
      setYears(res.data.sort((a, b) => b.year - a.year));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách năm";
      setError(msg);
      if (msg.includes("401")) {
        authService.logout();
        router.push("/login");
      }
    }
  }, [router]);

  useEffect(() => {
    setIsLoading(true);
    fetchYears().finally(() => setIsLoading(false));
  }, [fetchYears]);

  const openCreate = () => {
    setEditingYear(null);
    setFormData({ year: new Date().getFullYear() + 1, label: "", is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (y: AdmissionYear) => {
    setEditingYear(y);
    setFormData({ year: y.year, label: y.label, is_active: y.is_active });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingYear) {
        await admissionYearsService.update(editingYear.year, {
          label: formData.label || undefined,
          is_active: formData.is_active,
        });
        toast.success("Cập nhật năm thành công");
      } else {
        await admissionYearsService.create({
          year: formData.year,
          label: formData.label || undefined,
          is_active: formData.is_active,
        });
        toast.success("Tạo năm thành công");
      }
      setIsDialogOpen(false);
      await fetchYears();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    router.push("/dashboard");
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await admissionYearsService.remove(deleteTarget.year);
      toast.success(`Đã xóa năm ${deleteTarget.year}`);
      if (selectedYear === deleteTarget.year) setSelectedYear(null);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await fetchYears();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center text-3xl font-bold text-gray-900">
            <Calendar className="mr-3 h-8 w-8 text-blue-600" />
            Quản Lý Năm Học
          </h1>
          <p className="mt-1 text-gray-600">Chọn năm tuyển sinh để quản lý dữ liệu theo năm</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchYears()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo năm
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Năm Tuyển Sinh</CardTitle>
          <CardDescription>{years.length} năm trong hệ thống</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Năm</TableHead>
                <TableHead>Nhãn</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-gray-500">
                    Chưa có năm tuyển sinh nào. Tạo năm đầu tiên để bắt đầu.
                  </TableCell>
                </TableRow>
              ) : (
                years.map((y) => (
                  <TableRow key={y.year}>
                    <TableCell className="font-semibold">{y.year}</TableCell>
                    <TableCell>{y.label}</TableCell>
                    <TableCell>
                      <Badge className={y.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                        {y.is_active ? "Hoạt động" : "Vô hiệu"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{formatDate(y.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant={selectedYear === y.year ? "default" : "outline"}
                          className="h-8 gap-1 text-xs"
                          onClick={() => handleSelectYear(y.year)}
                        >
                          {selectedYear === y.year && <Check className="h-3.5 w-3.5" />}
                          Chọn
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(y)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => { setDeleteTarget(y); setIsDeleteOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingYear ? "Chỉnh Sửa Năm" : "Tạo Năm Mới"}</DialogTitle>
            <DialogDescription>
              {editingYear ? "Cập nhật nhãn và trạng thái năm tuyển sinh." : "Thêm năm tuyển sinh mới vào hệ thống."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {!editingYear && (
                <div className="space-y-2">
                  <Label htmlFor="year">Năm *</Label>
                  <Input
                    id="year"
                    type="number"
                    min={2020}
                    max={2040}
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="label">Nhãn</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder={`Năm tuyển sinh ${formData.year}`}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm">Đang hoạt động</span>
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editingYear ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa năm {deleteTarget?.year}</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa năm tuyển sinh này? Nếu năm đang có dữ liệu liên quan, thao tác sẽ bị từ chối.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
