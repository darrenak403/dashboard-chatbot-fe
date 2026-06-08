"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FolderOpen,
  Folder,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { faqTopicsService, faqSubTopicsService, FaqTopic, FaqSubTopic } from "@/lib/faq";
import { authService } from "@/lib/auth";
import { useYear } from "@/contexts/year-context";

const LIMIT = 10;
const SUBLIMIT = 20;

export default function FaqTopicsPage() {
  const router = useRouter();
  const { selectedYear } = useYear();
  const yearParams = selectedYear != null ? { admission_year: selectedYear } : {};

  // ── Topics ──────────────────────────────────────────────────────────────────
  const [topics, setTopics] = useState<FaqTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<FaqTopic | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [topicsPage, setTopicsPage] = useState(1);
  const [topicsMeta, setTopicsMeta] = useState({
    total: 0, limit: LIMIT, offset: 0, has_next: false, has_prev: false,
  });

  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [isTopicDeleteOpen, setIsTopicDeleteOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<FaqTopic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<FaqTopic | null>(null);
  const [topicForm, setTopicForm] = useState({ code: "", name: "", description: "", is_active: true });
  const [topicSubmitting, setTopicSubmitting] = useState(false);

  // ── Sub-topics ──────────────────────────────────────────────────────────────
  const [subTopics, setSubTopics] = useState<FaqSubTopic[]>([]);
  const [subTopicsLoading, setSubTopicsLoading] = useState(false);
  const [subTopicsPage, setSubTopicsPage] = useState(1);
  const [subTopicsMeta, setSubTopicsMeta] = useState({
    total: 0, limit: SUBLIMIT, offset: 0, has_next: false, has_prev: false,
  });

  const [isSubTopicDialogOpen, setIsSubTopicDialogOpen] = useState(false);
  const [isSubTopicDeleteOpen, setIsSubTopicDeleteOpen] = useState(false);
  const [editingSubTopic, setEditingSubTopic] = useState<FaqSubTopic | null>(null);
  const [deletingSubTopic, setDeletingSubTopic] = useState<FaqSubTopic | null>(null);
  const [subTopicForm, setSubTopicForm] = useState({ code: "", name: "", description: "", is_active: true });
  const [subTopicSubmitting, setSubTopicSubmitting] = useState(false);

  // ── Fetch topics ────────────────────────────────────────────────────────────
  const fetchTopics = useCallback(async (page = 1) => {
    try {
      setTopicsError("");
      const params: Record<string, unknown> = { limit: LIMIT, offset: (page - 1) * LIMIT, ...yearParams };
      if (searchTerm) params.search = searchTerm;
      if (filterActive !== "all") params.is_active = filterActive === "true";
      const res = await faqTopicsService.list(params as Parameters<typeof faqTopicsService.list>[0]);
      setTopics(res.data);
      setTopicsMeta(res.meta);
      setTopicsPage(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi tải chủ đề";
      setTopicsError(msg);
      if (msg.includes("401")) { authService.logout(); router.push("/login"); }
    }
  }, [searchTerm, filterActive, router, selectedYear]);

  useEffect(() => {
    setTopicsLoading(true);
    fetchTopics(1).finally(() => setTopicsLoading(false));
  }, [fetchTopics]);

  // ── Fetch sub-topics ────────────────────────────────────────────────────────
  const fetchSubTopics = useCallback(async (page = 1) => {
    if (!selectedTopic) { setSubTopics([]); setSubTopicsMeta({ total: 0, limit: SUBLIMIT, offset: 0, has_next: false, has_prev: false }); return; }
    setSubTopicsLoading(true);
    try {
      const res = await faqSubTopicsService.listByTopic(selectedTopic.id, {
        limit: SUBLIMIT,
        offset: (page - 1) * SUBLIMIT,
        ...yearParams,
      });
      setSubTopics(res.data);
      setSubTopicsMeta(res.meta);
      setSubTopicsPage(page);
    } catch {
      // ignore
    } finally {
      setSubTopicsLoading(false);
    }
  }, [selectedTopic, selectedYear]);

  useEffect(() => {
    fetchSubTopics(1);
  }, [fetchSubTopics]);

  // ── Topic handlers ──────────────────────────────────────────────────────────
  const openCreateTopic = () => {
    setEditingTopic(null);
    setTopicForm({ code: "", name: "", description: "", is_active: true });
    setIsTopicDialogOpen(true);
  };

  const openEditTopic = (t: FaqTopic, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTopic(t);
    setTopicForm({ code: t.code, name: t.name, description: t.description, is_active: t.is_active });
    setIsTopicDialogOpen(true);
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopicSubmitting(true);
    try {
      if (editingTopic) {
        await faqTopicsService.update(editingTopic.id, topicForm);
        toast.success("Cập nhật chủ đề thành công");
        if (selectedTopic?.id === editingTopic.id) setSelectedTopic({ ...selectedTopic, ...topicForm });
      } else {
        const { is_active: _ia, ...createPayload } = topicForm;
        await faqTopicsService.create(createPayload);
        toast.success("Tạo chủ đề thành công");
      }
      setIsTopicDialogOpen(false);
      await fetchTopics(topicsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setTopicSubmitting(false);
    }
  };

  const confirmDeleteTopic = async () => {
    if (!deletingTopic) return;
    setTopicSubmitting(true);
    try {
      await faqTopicsService.remove(deletingTopic.id);
      toast.success(`Đã xóa chủ đề "${deletingTopic.name}"`);
      if (selectedTopic?.id === deletingTopic.id) setSelectedTopic(null);
      setIsTopicDeleteOpen(false);
      await fetchTopics(topicsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setTopicSubmitting(false);
    }
  };

  // ── Sub-topic handlers ──────────────────────────────────────────────────────
  const openCreateSubTopic = () => {
    if (!selectedTopic) return;
    setEditingSubTopic(null);
    setSubTopicForm({ code: "", name: "", description: "", is_active: true });
    setIsSubTopicDialogOpen(true);
  };

  const openEditSubTopic = (st: FaqSubTopic) => {
    setEditingSubTopic(st);
    setSubTopicForm({ code: st.code, name: st.name, description: st.description, is_active: st.is_active });
    setIsSubTopicDialogOpen(true);
  };

  const handleSubTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) return;
    setSubTopicSubmitting(true);
    try {
      if (editingSubTopic) {
        await faqSubTopicsService.update(editingSubTopic.id, { topic_id: selectedTopic.id, ...subTopicForm });
        toast.success("Cập nhật chủ đề con thành công");
      } else {
        await faqSubTopicsService.create({ topic_id: selectedTopic.id, ...subTopicForm });
        toast.success("Tạo chủ đề con thành công");
      }
      setIsSubTopicDialogOpen(false);
      await fetchSubTopics(subTopicsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setSubTopicSubmitting(false);
    }
  };

  const confirmDeleteSubTopic = async () => {
    if (!deletingSubTopic) return;
    setSubTopicSubmitting(true);
    try {
      await faqSubTopicsService.remove(deletingSubTopic.id);
      toast.success(`Đã xóa chủ đề con "${deletingSubTopic.name}"`);
      setIsSubTopicDeleteOpen(false);
      await fetchSubTopics(subTopicsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setSubTopicSubmitting(false);
    }
  };

  const topicsTotalPages = Math.max(1, Math.ceil(topicsMeta.total / LIMIT));
  const subTopicsTotalPages = Math.max(1, Math.ceil(subTopicsMeta.total / SUBLIMIT));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FolderOpen className="h-8 w-8 mr-3 text-blue-600" />
              Quản Lý Chủ Đề FAQ
            </h1>
            <p className="text-gray-600 mt-1">Quản lý chủ đề và chủ đề con</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setTopicsLoading(true); fetchTopics(topicsPage).finally(() => setTopicsLoading(false)); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm Mới
          </Button>
        </div>

        {topicsError && (
          <Alert variant="destructive">
            <AlertDescription>{topicsError}</AlertDescription>
          </Alert>
        )}

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* ── Left: Topics ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="flex items-center text-lg">
                  <FolderOpen className="h-5 w-5 mr-2 text-blue-600" />
                  Chủ Đề
                  <span className="ml-2 text-sm font-normal text-gray-500">({topicsMeta.total})</span>
                </CardTitle>
                <Button size="sm" onClick={openCreateTopic}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm Chủ Đề
                </Button>
              </div>

              {/* Search & filter */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Tìm kiếm chủ đề..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-8 text-sm"
                  />
                </div>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="true">Hoạt động</SelectItem>
                    <SelectItem value="false">Không hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {topicsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : topics.length === 0 ? (
                <p className="text-center py-10 text-gray-500 text-sm">Không có chủ đề nào.</p>
              ) : (
                <div className="divide-y">
                  {topics.map((topic) => {
                    const isSelected = selectedTopic?.id === topic.id;
                    return (
                      <div
                        key={topic.id}
                        onClick={() => setSelectedTopic(isSelected ? null : topic)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-l-4 border-l-blue-600"
                            : "hover:bg-gray-50 border-l-4 border-l-transparent"
                        }`}
                      >
                        <ChevronDown
                          className={`h-4 w-4 flex-shrink-0 transition-transform text-gray-400 ${isSelected ? "rotate-0 text-blue-600" : "-rotate-90"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium text-sm truncate ${isSelected ? "text-blue-700" : "text-gray-900"}`}>
                              {topic.name}
                            </p>
                            <Badge variant="outline" className="text-xs flex-shrink-0 font-mono">
                              {topic.code}
                            </Badge>
                          </div>
                          {topic.description && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">{topic.description}</p>
                          )}
                        </div>
                        <Badge
                          className={`text-xs flex-shrink-0 ${topic.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                        >
                          {topic.is_active ? "Hoạt động" : "Tắt"}
                        </Badge>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={(e) => openEditTopic(topic, e)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingTopic(topic);
                              setIsTopicDeleteOpen(true);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Topics pagination */}
              {topicsTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <span className="text-xs text-gray-500">
                    Trang {topicsPage} / {topicsTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => fetchTopics(topicsPage - 1)}
                      disabled={!topicsMeta.has_prev}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => fetchTopics(topicsPage + 1)}
                      disabled={!topicsMeta.has_next}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Right: Sub-topics ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <Folder className="h-5 w-5 mr-2 text-purple-600" />
                  Chủ Đề Con
                  {selectedTopic && (
                    <span className="ml-2 text-sm font-normal text-gray-500 truncate max-w-[160px]">
                      — {selectedTopic.name}
                    </span>
                  )}
                  {subTopicsMeta.total > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({subTopicsMeta.total})
                    </span>
                  )}
                </CardTitle>
                <Button size="sm" onClick={openCreateSubTopic} disabled={!selectedTopic}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {!selectedTopic ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Folder className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Chọn một chủ đề bên trái để xem chủ đề con</p>
                </div>
              ) : subTopicsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                </div>
              ) : subTopics.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <p className="text-sm">Chủ đề này chưa có chủ đề con.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={openCreateSubTopic}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm chủ đề con đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {subTopics.map((st) => (
                    <div key={st.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {st.code && <span className="text-gray-400 font-mono text-xs mr-2">{st.code}</span>}
                          {st.name}
                        </p>
                        {st.description && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{st.description}</p>
                        )}
                      </div>
                      <Badge
                        className={`text-xs flex-shrink-0 ${st.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {st.is_active ? "Hoạt động" : "Tắt"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => openEditSubTopic(st)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeletingSubTopic(st); setIsSubTopicDeleteOpen(true); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-topics pagination */}
              {subTopicsTotalPages > 1 && selectedTopic && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <span className="text-xs text-gray-500">
                    Trang {subTopicsPage} / {subTopicsTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => fetchSubTopics(subTopicsPage - 1)}
                      disabled={!subTopicsMeta.has_prev}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => fetchSubTopics(subTopicsPage + 1)}
                      disabled={!subTopicsMeta.has_next}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Topic Create/Edit Dialog ── */}
        <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Chỉnh Sửa Chủ Đề" : "Thêm Chủ Đề Mới"}</DialogTitle>
              <DialogDescription>
                {editingTopic ? "Cập nhật thông tin chủ đề." : "Điền thông tin để tạo chủ đề mới."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTopicSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Mã Chủ Đề *</Label>
                  <Input
                    value={topicForm.code}
                    onChange={(e) => setTopicForm({ ...topicForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: TUYEN_SINH, HOC_PHI"
                    maxLength={20}
                    required
                  />
                  <p className="text-xs text-gray-400">Tối đa 20 ký tự, không dấu</p>
                </div>
                <div className="space-y-2">
                  <Label>Tên Chủ Đề *</Label>
                  <Input
                    value={topicForm.name}
                    onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                    placeholder="Nhập tên chủ đề"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô Tả</Label>
                  <Textarea
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                    placeholder="Mô tả về chủ đề"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="t_active"
                    checked={topicForm.is_active}
                    onChange={(e) => setTopicForm({ ...topicForm, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="t_active">Đang hoạt động</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTopicDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={topicSubmitting}>
                  {topicSubmitting ? "Đang lưu..." : editingTopic ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Topic Delete Dialog ── */}
        <AlertDialog open={isTopicDeleteOpen} onOpenChange={setIsTopicDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa chủ đề</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa chủ đề <strong>{deletingTopic?.name}</strong>? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={topicSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTopic}
                disabled={topicSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {topicSubmitting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── SubTopic Create/Edit Dialog ── */}
        <Dialog open={isSubTopicDialogOpen} onOpenChange={setIsSubTopicDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSubTopic ? "Chỉnh Sửa Chủ Đề Con" : "Thêm Chủ Đề Con Mới"}
              </DialogTitle>
              <DialogDescription>
                Chủ đề cha: <strong>{selectedTopic?.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubTopicSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Mã Chủ Đề Con *</Label>
                  <Input
                    value={subTopicForm.code}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, code: e.target.value.toUpperCase() })}
                    placeholder="VD: PHUONG_THUC_XET_TUYEN"
                    maxLength={50}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tên Chủ Đề Con *</Label>
                  <Input
                    value={subTopicForm.name}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, name: e.target.value })}
                    placeholder="Nhập tên chủ đề con"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mô Tả</Label>
                  <Textarea
                    value={subTopicForm.description}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, description: e.target.value })}
                    placeholder="Mô tả về chủ đề con"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="st_active"
                    checked={subTopicForm.is_active}
                    onChange={(e) => setSubTopicForm({ ...subTopicForm, is_active: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="st_active">Đang hoạt động</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubTopicDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={subTopicSubmitting}>
                  {subTopicSubmitting ? "Đang lưu..." : editingSubTopic ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── SubTopic Delete Dialog ── */}
        <AlertDialog open={isSubTopicDeleteOpen} onOpenChange={setIsSubTopicDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa chủ đề con</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa chủ đề con <strong>{deletingSubTopic?.name}</strong>? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={subTopicSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteSubTopic}
                disabled={subTopicSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {subTopicSubmitting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
