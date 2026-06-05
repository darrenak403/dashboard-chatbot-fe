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
  CheckSquare,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  ArrowRightLeft,
  MapPin,
} from "lucide-react";
import {
  faqAnswersService,
  faqQuestionsService,
  FaqAnswer,
  FaqQuestion,
  AnswerStatus,
  ANSWER_STATUS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
} from "@/lib/faq";
import { authService, Campus } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";

const LIMIT = 10;

const ANSWER_STATUSES: AnswerStatus[] = ["new", "approved", "rejected", "deleted"];

async function fetchAllCampuses(token: string | null): Promise<Campus[]> {
  const res = await fetch(`${API_ENDPOINTS.CAMPUSES}?limit=100`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export default function FaqAnswersPage() {
  const router = useRouter();
  const [answers, setAnswers] = useState<FaqAnswer[]>([]);
  const [questions, setQuestions] = useState<FaqQuestion[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCampusId, setFilterCampusId] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, limit: LIMIT, offset: 0, has_next: false, has_prev: false });

  // Form dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<FaqAnswer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question_id: "",
    content: "",
    tags: "",
    keywords: "",
    synonyms: "",
  });

  // Campus dialog
  const [isCampusDialogOpen, setIsCampusDialogOpen] = useState(false);
  const [campusAnswer, setCampusAnswer] = useState<FaqAnswer | null>(null);
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);

  // Status dialog
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusAnswer, setStatusAnswer] = useState<FaqAnswer | null>(null);
  const [newStatus, setNewStatus] = useState<AnswerStatus | "">("");
  const [rejectionReason, setRejectionReason] = useState("");

  // Delete dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingAnswer, setDeletingAnswer] = useState<FaqAnswer | null>(null);

  useEffect(() => {
    const token = authService.getToken();
    faqQuestionsService.list({ limit: 100, status: "approved" }).then((r) => setQuestions(r.data)).catch(() => {});
    fetchAllCampuses(token).then(setCampuses).catch(() => {});
  }, []);

  const fetchAnswers = useCallback(async (page: number = 1) => {
    try {
      setError("");
      const offset = (page - 1) * LIMIT;
      const params: Parameters<typeof faqAnswersService.list>[0] = { limit: LIMIT, offset };
      if (filterStatus !== "all") params.status = filterStatus;
      if (filterCampusId !== "all") params.campus_id = filterCampusId;
      const res = await faqAnswersService.list(params);
      setAnswers(res.data);
      setMeta(res.meta);
      setCurrentPage(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải câu trả lời";
      setError(msg);
      if (msg.includes("401")) { authService.logout(); router.push("/login"); }
    }
  }, [filterStatus, filterCampusId, router]);

  useEffect(() => {
    setIsLoading(true);
    fetchAnswers(1).finally(() => setIsLoading(false));
  }, [fetchAnswers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAnswers(currentPage);
    setIsRefreshing(false);
  };

  const openCreate = () => {
    setEditingAnswer(null);
    setFormData({ question_id: "", content: "", tags: "", keywords: "", synonyms: "" });
    setIsDialogOpen(true);
  };

  const openEdit = (a: FaqAnswer) => {
    setEditingAnswer(a);
    setFormData({
      question_id: a.question_id,
      content: a.content,
      tags: (a.tags || []).join(", "),
      keywords: (a.keywords || []).join(", "),
      synonyms: (a.synonyms || []).join(", "),
    });
    setIsDialogOpen(true);
  };

  const openCampus = (a: FaqAnswer) => {
    setCampusAnswer(a);
    setSelectedCampusIds(a.campus_ids || []);
    setIsCampusDialogOpen(true);
  };

  const openStatus = (a: FaqAnswer) => {
    setStatusAnswer(a);
    setNewStatus("");
    setRejectionReason("");
    setIsStatusDialogOpen(true);
  };

  const openDelete = (a: FaqAnswer) => {
    setDeletingAnswer(a);
    setIsDeleteDialogOpen(true);
  };

  const splitTags = (s: string) =>
    s.split(",").map((t) => t.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question_id) { setError("Vui lòng chọn câu hỏi"); return; }
    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        question_id: formData.question_id,
        content: formData.content,
        tags: splitTags(formData.tags),
        keywords: splitTags(formData.keywords),
        synonyms: splitTags(formData.synonyms),
      };
      if (editingAnswer) {
        await faqAnswersService.update(editingAnswer.id, payload);
        toast.success("Cập nhật câu trả lời thành công");
      } else {
        await faqAnswersService.create(payload);
        toast.success("Tạo câu trả lời thành công");
      }
      setIsDialogOpen(false);
      await fetchAnswers(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveCampuses = async () => {
    if (!campusAnswer) return;
    setIsSubmitting(true);
    try {
      await faqAnswersService.setCampuses(campusAnswer.id, selectedCampusIds);
      toast.success("Cập nhật phạm vi cơ sở thành công");
      setIsCampusDialogOpen(false);
      await fetchAnswers(currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusAnswer || !newStatus) return;
    setIsSubmitting(true);
    try {
      await faqAnswersService.changeStatus(
        statusAnswer.id,
        newStatus as AnswerStatus,
        newStatus === "rejected" ? rejectionReason : undefined
      );
      toast.success(`Đã chuyển trạng thái sang "${STATUS_LABELS[newStatus]}"`);
      setIsStatusDialogOpen(false);
      await fetchAnswers(currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAnswer) return;
    setIsSubmitting(true);
    try {
      await faqAnswersService.remove(deletingAnswer.id);
      toast.success("Đã xóa câu trả lời");
      setIsDeleteDialogOpen(false);
      await fetchAnswers(currentPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCampus = (id: string) => {
    setSelectedCampusIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const totalPages = Math.max(1, Math.ceil(meta.total / LIMIT));
  const allowedTransitions = statusAnswer ? ANSWER_STATUS_TRANSITIONS[statusAnswer.status] : [];

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
              <CheckSquare className="h-8 w-8 mr-3 text-blue-600" />
              Câu Trả Lời FAQ
            </h1>
            <p className="text-gray-600 mt-1">Quản lý câu trả lời cho các câu hỏi thường gặp</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Làm Mới
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Câu Trả Lời
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
              <CardTitle className="text-sm font-medium">Tổng Số Câu Trả Lời</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
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
          <CardHeader><CardTitle>Lọc Câu Trả Lời</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {ANSWER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterCampusId} onValueChange={setFilterCampusId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Cơ sở" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cơ sở</SelectItem>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Câu Trả Lời</CardTitle>
            <CardDescription>{meta.total} câu trả lời</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Nội Dung</TableHead>
                    <TableHead>Cơ Sở</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead>Phiên Bản</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {answers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Không có câu trả lời nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    answers.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="max-w-xs">
                          <p className="truncate" title={a.content}>{a.content}</p>
                        </TableCell>
                        <TableCell>
                          {(a.campus_ids || []).length === 0 ? (
                            <span className="text-gray-400 text-xs">Tất cả</span>
                          ) : (
                            <span className="text-xs">{(a.campus_ids || []).length} cơ sở</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_BADGE_CLASS[a.status] || "bg-gray-100 text-gray-700"}>
                            {STATUS_LABELS[a.status] || a.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{a.version || 1}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(a)} title="Chỉnh sửa">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openCampus(a)} title="Phạm vi cơ sở">
                              <MapPin className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openStatus(a)}
                              title="Đổi trạng thái"
                              disabled={ANSWER_STATUS_TRANSITIONS[a.status].length === 0}
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => openDelete(a)}
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
                  <Button variant="outline" size="sm" onClick={() => fetchAnswers(currentPage - 1)} disabled={!meta.has_prev}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                  </Button>
                  <span className="text-sm font-medium px-2">{currentPage} / {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => fetchAnswers(currentPage + 1)} disabled={!meta.has_next}>
                    Tiếp <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAnswer ? "Chỉnh Sửa Câu Trả Lời" : "Thêm Câu Trả Lời Mới"}</DialogTitle>
              <DialogDescription>
                {editingAnswer ? "Cập nhật nội dung câu trả lời." : "Tạo câu trả lời cho câu hỏi đã được duyệt."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label>Câu Hỏi *</Label>
                  <Select
                    value={formData.question_id}
                    onValueChange={(v) => setFormData({ ...formData, question_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn câu hỏi đã được duyệt" />
                    </SelectTrigger>
                    <SelectContent>
                      {questions.map((q) => (
                        <SelectItem key={q.id} value={q.id}>
                          <span className="truncate block max-w-xs">{q.content}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a_content">Nội Dung Trả Lời *</Label>
                  <Textarea
                    id="a_content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Nhập nội dung câu trả lời..."
                    rows={5}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="a_tags">Tags</Label>
                    <Input
                      id="a_tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="tag1, tag2, ..."
                    />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a_keywords">Từ Khóa</Label>
                    <Input
                      id="a_keywords"
                      value={formData.keywords}
                      onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                      placeholder="từ1, từ2, ..."
                    />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="a_synonyms">Từ Đồng Nghĩa</Label>
                    <Input
                      id="a_synonyms"
                      value={formData.synonyms}
                      onChange={(e) => setFormData({ ...formData, synonyms: e.target.value })}
                      placeholder="từ1, từ2, ..."
                    />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Đang lưu..." : editingAnswer ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Campus Dialog */}
        <Dialog open={isCampusDialogOpen} onOpenChange={setIsCampusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Phạm Vi Cơ Sở</DialogTitle>
              <DialogDescription>
                Để trống = áp dụng cho tất cả cơ sở. Chọn cụ thể để giới hạn phạm vi.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2 max-h-64 overflow-y-auto">
              {campuses.map((c) => (
                <label key={c.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedCampusIds.includes(c.id)}
                    onChange={() => toggleCampus(c.id)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge variant="outline" className="text-xs">{c.code}</Badge>
                </label>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCampusDialogOpen(false)}>Hủy</Button>
              <Button onClick={handleSaveCampuses} disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : "Lưu"}
              </Button>
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
                <Badge className={STATUS_BADGE_CLASS[statusAnswer?.status || "new"]}>
                  {STATUS_LABELS[statusAnswer?.status || ""]}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
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
              {newStatus === "rejected" && (
                <div className="space-y-2">
                  <Label>Lý Do Từ Chối</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={3}
                  />
                </div>
              )}
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
              <AlertDialogTitle>Xác nhận xóa câu trả lời</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa câu trả lời này? Hành động này không thể hoàn tác.
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
