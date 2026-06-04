"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Folder,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import { faqSubTopicsService, faqTopicsService, FaqSubTopic, FaqTopic } from "@/lib/faq";
import { authService } from "@/lib/auth";

const LIMIT = 10;

export default function FaqSubTopicsPage() {
  const router = useRouter();
  const [subTopics, setSubTopics] = useState<FaqSubTopic[]>([]);
  const [topics, setTopics] = useState<FaqTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterTopicId, setFilterTopicId] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, limit: LIMIT, offset: 0, has_next: false, has_prev: false });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSubTopic, setEditingSubTopic] = useState<FaqSubTopic | null>(null);
  const [deletingSubTopic, setDeletingSubTopic] = useState<FaqSubTopic | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ topic_id: "", name: "", description: "", is_active: true });

  useEffect(() => {
    faqTopicsService.list({ limit: 100 }).then((res) => setTopics(res.data)).catch(() => {});
  }, []);

  const fetchSubTopics = useCallback(async (page: number = 1) => {
    try {
      setError("");
      const offset = (page - 1) * LIMIT;
      const params: Parameters<typeof faqSubTopicsService.list>[0] = { limit: LIMIT, offset };
      if (filterTopicId !== "all") params.topic_id = filterTopicId;
      const res = await faqSubTopicsService.list(params);
      setSubTopics(res.data);
      setMeta(res.meta);
      setCurrentPage(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách chủ đề con";
      setError(msg);
      if (msg.includes("401")) {
        authService.logout();
        router.push("/login");
      }
    }
  }, [filterTopicId, router]);

  useEffect(() => {
    setIsLoading(true);
    fetchSubTopics(1).finally(() => setIsLoading(false));
  }, [fetchSubTopics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSubTopics(currentPage);
    setIsRefreshing(false);
  };

  const openCreate = () => {
    setEditingSubTopic(null);
    setFormData({ topic_id: filterTopicId !== "all" ? filterTopicId : "", name: "", description: "", is_active: true });
    setIsDialogOpen(true);
  };

  const openEdit = (st: FaqSubTopic) => {
    setEditingSubTopic(st);
    setFormData({ topic_id: st.topic_id, name: st.name, description: st.description, is_active: st.is_active });
    setIsDialogOpen(true);
  };

  const openDelete = (st: FaqSubTopic) => {
    setDeletingSubTopic(st);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic_id) {
      setError("Vui lòng chọn chủ đề cha");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      if (editingSubTopic) {
        await faqSubTopicsService.update(editingSubTopic.id, formData);
        toast.success("Cập nhật chủ đề con thành công");
      } else {
        await faqSubTopicsService.create(formData);
        toast.success("Tạo chủ đề con thành công");
      }
      setIsDialogOpen(false);
      await fetchSubTopics(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingSubTopic) return;
    setIsSubmitting(true);
    try {
      await faqSubTopicsService.remove(deletingSubTopic.id);
      toast.success(`Đã xóa chủ đề con "${deletingSubTopic.name}"`);
      setIsDeleteDialogOpen(false);
      setDeletingSubTopic(null);
      await fetchSubTopics(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Xóa thất bại");
      toast.error("Xóa chủ đề con thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / LIMIT));

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
              <Folder className="h-8 w-8 mr-3 text-blue-600" />
              Chủ Đề Con FAQ
            </h1>
            <p className="text-gray-600 mt-1">Quản lý các chủ đề con trong FAQ</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Chủ Đề Con
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
              <CardTitle className="text-sm font-medium">Tổng Số Chủ Đề Con</CardTitle>
              <Folder className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meta.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trang Hiện Tại</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentPage} / {totalPages}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lọc Theo Chủ Đề</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filterTopicId} onValueChange={setFilterTopicId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chủ đề</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Chủ Đề Con</CardTitle>
            <CardDescription>{meta.total} chủ đề con</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên Chủ Đề Con</TableHead>
                    <TableHead>Chủ Đề Cha</TableHead>
                    <TableHead>Mô Tả</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subTopics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Không có chủ đề con nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subTopics.map((st) => (
                      <TableRow key={st.id}>
                        <TableCell className="font-medium">{st.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {st.topic?.name || topics.find((t) => t.id === st.topic_id)?.name || "—"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-gray-600">
                          {st.description || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={st.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                            {st.is_active ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(st)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openDelete(st)}
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
                  <Button variant="outline" size="sm" onClick={() => fetchSubTopics(currentPage - 1)} disabled={!meta.has_prev}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                  </Button>
                  <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => fetchSubTopics(currentPage + 1)} disabled={!meta.has_next}>
                    Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSubTopic ? "Chỉnh Sửa Chủ Đề Con" : "Thêm Chủ Đề Con Mới"}</DialogTitle>
              <DialogDescription>
                {editingSubTopic ? "Cập nhật thông tin chủ đề con." : "Điền thông tin để tạo chủ đề con mới."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="topic_id">Chủ Đề Cha *</Label>
                  <Select
                    value={formData.topic_id}
                    onValueChange={(v) => setFormData({ ...formData, topic_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chủ đề cha" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="st_name">Tên Chủ Đề Con *</Label>
                  <Input
                    id="st_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên chủ đề con"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="st_desc">Mô Tả</Label>
                  <Textarea
                    id="st_desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả về chủ đề con"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="st_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="st_active">Đang hoạt động</Label>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : editingSubTopic ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa chủ đề con</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa chủ đề con <strong>{deletingSubTopic?.name}</strong>? Hành động này không thể hoàn tác.
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
