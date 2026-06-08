"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  ArrowRightLeft,
  Eye,
  Download,
  FileText,
} from "lucide-react";
import {
  faqCollectionsService,
  downloadFaqCollectionExcel,
  downloadFaqCollectionFile,
  FaqCollection,
  CollectionStatus,
  COLLECTION_STATUS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
} from "@/lib/faq";
import { authService, Campus } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";
import { useYear } from "@/contexts/year-context";

const LIMIT = 10;


export default function FaqCollectionsPage() {
  const router = useRouter();
  const { selectedYear } = useYear();
  const [collections, setCollections] = useState<FaqCollection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, limit: LIMIT, offset: 0, has_next: false, has_prev: false });

  // Form dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<FaqCollection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    admission_year: new Date().getFullYear(),
  });

  // Status dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusCollection, setStatusCollection] = useState<FaqCollection | null>(null);
  const [newStatus, setNewStatus] = useState<CollectionStatus | "">("");

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<FaqCollection | null>(null);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const fetchCollections = useCallback(async (page: number = 1) => {
    try {
      setError("");
      const offset = (page - 1) * LIMIT;
      const params: Parameters<typeof faqCollectionsService.list>[0] = { limit: LIMIT, offset };
      if (filterStatus !== "all") params.status = filterStatus;
      if (selectedYear != null) params.admission_year = selectedYear;
      const res = await faqCollectionsService.list(params);
      setCollections(res.data);
      setMeta(res.meta);
      setCurrentPage(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải bộ câu hỏi";
      setError(msg);
      if (msg.includes("401")) { authService.logout(); router.push("/login"); }
    }
  }, [filterStatus, selectedYear, router]);

  useEffect(() => {
    setIsLoading(true);
    fetchCollections(1).finally(() => setIsLoading(false));
  }, [fetchCollections]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCollections(currentPage);
    setIsRefreshing(false);
  };

  const openCreate = () => {
    setEditingCollection(null);
    setFormData({ name: "", description: "", admission_year: selectedYear ?? new Date().getFullYear() });
    setIsDialogOpen(true);
  };

  const openEdit = (c: FaqCollection) => {
    setEditingCollection(c);
    setFormData({
      name: c.name,
      description: c.description,
      admission_year: c.admission_year,
    });
    setIsDialogOpen(true);
  };

  const openStatus = (c: FaqCollection) => {
    setStatusCollection(c);
    setNewStatus("");
    setIsStatusDialogOpen(true);
  };

  const openDelete = (c: FaqCollection) => {
    setDeletingCollection(c);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        admission_year: formData.admission_year,
      };
      if (editingCollection) {
        await faqCollectionsService.update(editingCollection.id, payload);
        toast.success("Cập nhật bộ câu hỏi thành công");
      } else {
        await faqCollectionsService.create(payload);
        toast.success("Tạo bộ câu hỏi thành công");
      }
      setIsDialogOpen(false);
      await fetchCollections(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusCollection || !newStatus) return;
    setIsSubmitting(true);
    try {
      await faqCollectionsService.changeStatus(statusCollection.id, newStatus as CollectionStatus);
      toast.success(`Đã chuyển trạng thái sang "${STATUS_LABELS[newStatus]}"`);
      setIsStatusDialogOpen(false);
      await fetchCollections(currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportExcel = async (c: FaqCollection) => {
    const key = `${c.id}:xls`;
    setExportingKey(key);
    try {
      await downloadFaqCollectionExcel(c.id);
      toast.success('Đã xuất file Excel');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Không thể xuất file Excel. Vui lòng thử lại.'
      );
    } finally {
      setExportingKey(null);
    }
  };

  const handleExportMarkdown = async (c: FaqCollection) => {
    const key = `${c.id}:md`;
    setExportingKey(key);
    try {
      const result = await faqCollectionsService.exportMd(c.id);
      downloadFaqCollectionFile(result.blob, result.filename);
      toast.success('Đã xuất file Markdown');
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Không thể xuất file Markdown. Vui lòng thử lại.'
      );
    } finally {
      setExportingKey(null);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCollection) return;
    setIsSubmitting(true);
    try {
      await faqCollectionsService.remove(deletingCollection.id);
      toast.success(`Đã xóa bộ câu hỏi "${deletingCollection.name}"`);
      setIsDeleteDialogOpen(false);
      setDeletingCollection(null);
      await fetchCollections(currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / LIMIT));
  const allowedTransitions = statusCollection ? COLLECTION_STATUS_TRANSITIONS[statusCollection.status] : [];
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
              Bộ Câu Hỏi FAQ
            </h1>
            <p className="text-gray-600 mt-1">Quản lý bộ câu hỏi theo năm tuyển sinh để xuất bản</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Bộ Câu Hỏi
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng Số Bộ Câu Hỏi</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{meta.total}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trang Hiện Tại</CardTitle>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{currentPage} / {totalPages}</div></CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader><CardTitle>Lọc Bộ Câu Hỏi</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="draft">{STATUS_LABELS.draft}</SelectItem>
                  <SelectItem value="published">{STATUS_LABELS.published}</SelectItem>
                  <SelectItem value="archived">{STATUS_LABELS.archived}</SelectItem>
                </SelectContent>
              </Select>
              {selectedYear != null && (
                <Badge variant="outline">Năm {selectedYear}</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Bộ Câu Hỏi</CardTitle>
            <CardDescription>{meta.total} bộ câu hỏi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Tên / Mô Tả</TableHead>
                    <TableHead>Năm</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        Không có bộ câu hỏi nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    collections.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            {c.description && (
                              <p className="text-xs text-gray-500 truncate max-w-xs" title={c.description}>
                                {c.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{c.admission_year}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_CLASS[c.status] || "bg-gray-100 text-gray-700"}>
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button variant="ghost" size="sm" asChild title="Xem chi tiết">
                              <Link href={`/dashboard/faq/collections/detail?id=${c.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportExcel(c)}
                              title="Xuất Excel"
                              disabled={exportingKey === `${c.id}:xls`}
                            >
                              <Download className={`h-4 w-4 ${exportingKey === `${c.id}:xls` ? "animate-pulse" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExportMarkdown(c)}
                              title="Xuất Markdown"
                              disabled={exportingKey === `${c.id}:md`}
                            >
                              <FileText className={`h-4 w-4 ${exportingKey === `${c.id}:md` ? "animate-pulse" : ""}`} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Chỉnh sửa">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStatus(c)}
                              title="Đổi trạng thái"
                              disabled={COLLECTION_STATUS_TRANSITIONS[c.status].length === 0}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openDelete(c)}
                              title="Xóa"
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
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {meta.offset + 1}–{Math.min(meta.offset + LIMIT, meta.total)} trong {meta.total} kết quả
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => fetchCollections(currentPage - 1)} disabled={!meta.has_prev}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                  </Button>
                  <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => fetchCollections(currentPage + 1)} disabled={!meta.has_next}>
                    Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingCollection ? "Chỉnh Sửa Bộ Câu Hỏi" : "Tạo Bộ Câu Hỏi Mới"}</DialogTitle>
              <DialogDescription>
                {editingCollection ? "Cập nhật thông tin bộ câu hỏi." : "Tạo bộ câu hỏi mới để nhóm các câu hỏi FAQ."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="col_name">Tên Bộ Câu Hỏi *</Label>
                  <Input
                    id="col_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên bộ câu hỏi"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col_desc">Mô Tả</Label>
                  <Textarea
                    id="col_desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả về bộ câu hỏi..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col_year">Năm Tuyển Sinh *</Label>
                  {selectedYear != null && !editingCollection ? (
                    <Input id="col_year" value={selectedYear} readOnly disabled className="bg-gray-50" />
                  ) : (
                    <Input
                      id="col_year"
                      type="number"
                      value={formData.admission_year}
                      onChange={(e) => setFormData({ ...formData, admission_year: Number(e.target.value) })}
                      min={2020}
                      max={2030}
                      required
                    />
                  )}
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : editingCollection ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thay Đổi Trạng Thái</DialogTitle>
              <DialogDescription>
                Trạng thái hiện tại:{" "}
                <Badge className={STATUS_BADGE_CLASS[statusCollection?.status || "draft"]}>
                  {STATUS_LABELS[statusCollection?.status || ""]}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
              <Label>Chuyển sang trạng thái *</Label>
              <div className="flex flex-wrap gap-2">
                {allowedTransitions.map((s) => (
                  <Button
                    key={s}
                    variant={newStatus === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewStatus(s)}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleStatusChange} disabled={!newStatus || isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Xác Nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa bộ câu hỏi</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa bộ câu hỏi <strong>{deletingCollection?.name}</strong>? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                {isSubmitting ? "Đang xóa..." : "Xác nhận xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
