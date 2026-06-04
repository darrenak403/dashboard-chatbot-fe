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
import { Separator } from "@/components/ui/separator";
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
  ListOrdered,
  X,
} from "lucide-react";
import {
  faqCollectionsService,
  faqAnswersService,
  FaqCollection,
  FaqCollectionItem,
  FaqAnswer,
  CollectionStatus,
  COLLECTION_STATUS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
} from "@/lib/faq";
import { authService, Campus } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";

const LIMIT = 10;

async function fetchAllCampuses(token: string | null): Promise<Campus[]> {
  const res = await fetch(`${API_ENDPOINTS.CAMPUSES}?limit=100`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default function FaqCollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<FaqCollection[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterYear, setFilterYear] = useState("");
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
    campus_id: "",
  });

  // Items dialog
  const [isItemsDialogOpen, setIsItemsDialogOpen] = useState(false);
  const [itemsCollection, setItemsCollection] = useState<FaqCollection | null>(null);
  const [collectionItems, setCollectionItems] = useState<FaqCollectionItem[]>([]);
  const [availableAnswers, setAvailableAnswers] = useState<FaqAnswer[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(false);

  // Status dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusCollection, setStatusCollection] = useState<FaqCollection | null>(null);
  const [newStatus, setNewStatus] = useState<CollectionStatus | "">("");

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingCollection, setDeletingCollection] = useState<FaqCollection | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    fetchAllCampuses(token).then(setCampuses).catch(() => {});
  }, []);

  const fetchCollections = useCallback(async (page: number = 1) => {
    try {
      setError("");
      const offset = (page - 1) * LIMIT;
      const params: Parameters<typeof faqCollectionsService.list>[0] = { limit: LIMIT, offset };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterYear) params.admission_year = Number(filterYear);
      const res = await faqCollectionsService.list(params);
      setCollections(res.data);
      setMeta(res.meta);
      setCurrentPage(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải bộ sưu tập";
      setError(msg);
      if (msg.includes("401")) { authService.logout(); router.push("/login"); }
    }
  }, [filterStatus, filterYear, router]);

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
    setFormData({ name: "", description: "", admission_year: new Date().getFullYear(), campus_id: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (c: FaqCollection) => {
    setEditingCollection(c);
    setFormData({
      name: c.name,
      description: c.description,
      admission_year: c.admission_year,
      campus_id: c.campus_id || "",
    });
    setIsDialogOpen(true);
  };

  const openItems = async (c: FaqCollection) => {
    setItemsCollection(c);
    setIsLoadingItems(true);
    setIsItemsDialogOpen(true);
    try {
      const [detail, answersRes] = await Promise.all([
        faqCollectionsService.get(c.id),
        faqAnswersService.list({ limit: 100, status: "published" }),
      ]);
      setCollectionItems(detail.data.items || []);
      setAvailableAnswers(answersRes.data);
    } catch {
      toast.error("Không thể tải nội dung bộ sưu tập");
    } finally {
      setIsLoadingItems(false);
    }
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
        ...(formData.campus_id ? { campus_id: formData.campus_id } : {}),
      };
      if (editingCollection) {
        await faqCollectionsService.update(editingCollection.id, payload);
        toast.success("Cập nhật bộ sưu tập thành công");
      } else {
        await faqCollectionsService.create(payload);
        toast.success("Tạo bộ sưu tập thành công");
      }
      setIsDialogOpen(false);
      await fetchCollections(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddItem = async (answer: FaqAnswer) => {
    if (!itemsCollection) return;
    try {
      await faqCollectionsService.addItem(itemsCollection.id, answer.id);
      // Optimistically add to list using answer_id
      const newItem: FaqCollectionItem = {
        id: crypto.randomUUID(),
        collection_id: itemsCollection.id,
        answer_id: answer.id,
        order_index: collectionItems.length,
        answer,
      };
      setCollectionItems((prev) => [...prev, newItem]);
      toast.success("Đã thêm câu trả lời vào bộ sưu tập");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm thất bại");
    }
  };

  const handleRemoveItem = async (item: FaqCollectionItem) => {
    if (!itemsCollection) return;
    try {
      // Backend URL: DELETE /collections/{id}/items/{answerId}
      await faqCollectionsService.removeItem(itemsCollection.id, item.answer_id);
      setCollectionItems((prev) => prev.filter((i) => i.answer_id !== item.answer_id));
      toast.success("Đã xóa câu trả lời khỏi bộ sưu tập");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
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

  const confirmDelete = async () => {
    if (!deletingCollection) return;
    setIsSubmitting(true);
    try {
      await faqCollectionsService.remove(deletingCollection.id);
      toast.success(`Đã xóa bộ sưu tập "${deletingCollection.name}"`);
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
  const itemAnswerIds = new Set(collectionItems.map((i) => i.answer_id));

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
              Bộ Sưu Tập FAQ
            </h1>
            <p className="text-gray-600 mt-1">Quản lý bộ sưu tập câu hỏi - câu trả lời để xuất bản</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo Bộ Sưu Tập
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
              <CardTitle className="text-sm font-medium">Tổng Số Bộ Sưu Tập</CardTitle>
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
          <CardHeader><CardTitle>Lọc Bộ Sưu Tập</CardTitle></CardHeader>
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
              <Input
                type="number"
                placeholder="Năm tuyển sinh"
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-40"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Bộ Sưu Tập</CardTitle>
            <CardDescription>{meta.total} bộ sưu tập</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Tên / Mô Tả</TableHead>
                    <TableHead>Năm</TableHead>
                    <TableHead>Cơ Sở</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collections.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Không có bộ sưu tập nào.
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
                          {c.campus ? (
                            <Badge variant="outline">{c.campus.name}</Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">Tất cả</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_CLASS[c.status] || "bg-gray-100 text-gray-700"}>
                            {STATUS_LABELS[c.status] || c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(c)} title="Chỉnh sửa">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openItems(c)} title="Quản lý nội dung">
                              <ListOrdered className="h-4 w-4" />
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
              <DialogTitle>{editingCollection ? "Chỉnh Sửa Bộ Sưu Tập" : "Tạo Bộ Sưu Tập Mới"}</DialogTitle>
              <DialogDescription>
                {editingCollection ? "Cập nhật thông tin bộ sưu tập." : "Tạo bộ sưu tập mới để nhóm các câu trả lời FAQ."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="col_name">Tên Bộ Sưu Tập *</Label>
                  <Input
                    id="col_name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nhập tên bộ sưu tập"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="col_desc">Mô Tả</Label>
                  <Textarea
                    id="col_desc"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả về bộ sưu tập..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="col_year">Năm Tuyển Sinh *</Label>
                    <Input
                      id="col_year"
                      type="number"
                      value={formData.admission_year}
                      onChange={(e) => setFormData({ ...formData, admission_year: Number(e.target.value) })}
                      min={2020}
                      max={2030}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cơ Sở (tùy chọn)</Label>
                    <Select
                      value={formData.campus_id || "none"}
                      onValueChange={(v) => setFormData({ ...formData, campus_id: v === "none" ? "" : v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tất cả cơ sở" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tất cả cơ sở</SelectItem>
                        {campuses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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

        {/* Items Dialog */}
        <Dialog open={isItemsDialogOpen} onOpenChange={setIsItemsDialogOpen}>
          <DialogContent className="sm:max-w-4xl">
            <DialogHeader>
              <DialogTitle>Quản Lý Nội Dung: {itemsCollection?.name}</DialogTitle>
              <DialogDescription>
                Thêm hoặc xóa câu trả lời khỏi bộ sưu tập này.
              </DialogDescription>
            </DialogHeader>
            {isLoadingItems ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 py-4" style={{ maxHeight: "60vh", overflow: "hidden" }}>
                {/* Current items */}
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">
                    Câu trả lời trong bộ sưu tập ({collectionItems.length})
                  </h4>
                  <Separator className="mb-2" />
                  <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                    {collectionItems.length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">Chưa có câu trả lời nào</p>
                    ) : (
                      collectionItems.map((item) => (
                        <div key={item.id} className="flex items-start justify-between p-2 rounded border bg-gray-50 gap-2">
                          <p className="text-sm flex-1 line-clamp-2">
                            {item.answer?.content || availableAnswers.find((a) => a.id === item.answer_id)?.content || item.answer_id}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 flex-shrink-0 h-6 w-6 p-0"
                            onClick={() => handleRemoveItem(item)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Available answers */}
                <div className="flex flex-col">
                  <h4 className="font-semibold text-sm mb-2 text-gray-700">
                    Câu trả lời đã xuất bản ({availableAnswers.filter((a) => !itemAnswerIds.has(a.id)).length} khả dụng)
                  </h4>
                  <Separator className="mb-2" />
                  <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                    {availableAnswers.filter((a) => !itemAnswerIds.has(a.id)).length === 0 ? (
                      <p className="text-sm text-gray-400 py-4 text-center">Không có câu trả lời khả dụng</p>
                    ) : (
                      availableAnswers
                        .filter((a) => !itemAnswerIds.has(a.id))
                        .map((answer) => (
                          <div key={answer.id} className="flex items-start justify-between p-2 rounded border hover:bg-blue-50 gap-2">
                            <p className="text-sm flex-1 line-clamp-2">{answer.content}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-800 flex-shrink-0 h-6 px-2 text-xs"
                              onClick={() => handleAddItem(answer)}
                            >
                              + Thêm
                            </Button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsItemsDialogOpen(false)}>Đóng</Button>
            </DialogFooter>
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
              <AlertDialogTitle>Xác nhận xóa bộ sưu tập</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa bộ sưu tập <strong>{deletingCollection?.name}</strong>? Hành động này không thể hoàn tác.
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
