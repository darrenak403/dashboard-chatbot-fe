"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  HelpCircle,
  MessagesSquare,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  MoveRight,
  MoreHorizontal,
} from "lucide-react";
import {
  faqQuestionsService,
  faqSubTopicsService,
  faqAnswersService,
  FaqQuestion,
  FaqSubTopic,
  FaqAnswer,
  QuestionStatus,
  AnswerStatus,
  QUESTION_STATUS_TRANSITIONS,
  ANSWER_STATUS_TRANSITIONS,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
} from "@/lib/faq";
import { authService, Campus } from "@/lib/auth";
import { API_ENDPOINTS } from "@/lib/constants";

const STATUS_ICONS: Record<string, React.ElementType> = {
  approved: CheckCircle2,
  rejected: XCircle,
  deleted:  Trash2,
  new:      RotateCcw,
};

const LIMIT = 10;
const QUESTION_STATUSES: QuestionStatus[] = ["new", "approved", "rejected", "deleted"];

async function fetchAllCampuses(token: string | null): Promise<Campus[]> {
  try {
    const res = await fetch(`${API_ENDPOINTS.CAMPUSES}?limit=100`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch {
    return [];
  }
}

function FaqQuestionsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  // Shared
  const [subTopics, setSubTopics] = useState<FaqSubTopic[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  // List state
  const [questions, setQuestions] = useState<FaqQuestion[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [filterSubTopicId, setFilterSubTopicId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsMeta, setQuestionsMeta] = useState({
    total: 0, limit: LIMIT, offset: 0, has_next: false, has_prev: false,
  });
  const [answerCounts, setAnswerCounts] = useState<Record<string, number>>({});

  // Question form
  const [isQDialogOpen, setIsQDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FaqQuestion | null>(null);
  const [qForm, setQForm] = useState({ sub_topic_id: "", content: "" });
  const [qSubmitting, setQSubmitting] = useState(false);
  const [isQDeleteOpen, setIsQDeleteOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<FaqQuestion | null>(null);

  // Detail state
  const [selectedQuestion, setSelectedQuestion] = useState<FaqQuestion | null>(null);
  const [questionDetailLoading, setQuestionDetailLoading] = useState(false);
  const [answers, setAnswers] = useState<FaqAnswer[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);
  const [filterCampusId, setFilterCampusId] = useState("all");

  // Answer form
  const [isADialogOpen, setIsADialogOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<FaqAnswer | null>(null);
  const [aForm, setAForm] = useState({
    content: "", tags: "", keywords: "", synonyms: "",
  });
  const [aSubmitting, setASubmitting] = useState(false);

  // Campus dialog
  const [isACampusOpen, setIsACampusOpen] = useState(false);
  const [campusAnswer, setCampusAnswer] = useState<FaqAnswer | null>(null);
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [campusSaving, setCampusSaving] = useState(false);

  // Answer delete
  const [isADeleteOpen, setIsADeleteOpen] = useState(false);
  const [deletingAnswer, setDeletingAnswer] = useState<FaqAnswer | null>(null);
  const [aDeleteSubmitting, setADeleteSubmitting] = useState(false);

  // ── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    faqSubTopicsService.list({ limit: 100 }).then((r) => setSubTopics(r.data)).catch(() => {});
    fetchAllCampuses(authService.getToken()).then(setCampuses);
  }, []);

  // ── Fetch questions ──────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async (page = 1) => {
    try {
      setQuestionsError("");
      const params: Parameters<typeof faqQuestionsService.list>[0] = {
        limit: LIMIT, offset: (page - 1) * LIMIT,
      };
      if (filterSubTopicId !== "all") params.sub_topic_id = filterSubTopicId;
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await faqQuestionsService.list(params);
      setQuestions(res.data);
      setQuestionsMeta(res.meta);
      setQuestionsPage(page);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi tải câu hỏi";
      setQuestionsError(msg);
      if (msg.includes("401")) { authService.logout(); router.push("/login"); }
    }
  }, [filterSubTopicId, filterStatus, router]);

  useEffect(() => {
    setQuestionsLoading(true);
    fetchQuestions(1).finally(() => setQuestionsLoading(false));
  }, [fetchQuestions]);

  useEffect(() => {
    if (questions.length === 0) return;
    Promise.allSettled(
      questions.map((q) =>
        faqAnswersService.list({ limit: 1, offset: 0, question_id: q.id })
          .then((r) => ({ id: q.id, total: r.meta.total }))
      )
    ).then((results) => {
      const counts: Record<string, number> = {};
      results.forEach((r) => { if (r.status === "fulfilled") counts[r.value.id] = r.value.total; });
      setAnswerCounts((prev) => ({ ...prev, ...counts }));
    });
  }, [questions]);

  // ── Load selected question ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedId) { setSelectedQuestion(null); setAnswers([]); return; }
    const fromList = questions.find((q) => q.id === selectedId);
    if (fromList) {
      setSelectedQuestion(fromList);
    } else {
      setQuestionDetailLoading(true);
      faqQuestionsService.get(selectedId)
        .then((res) => setSelectedQuestion(res.data))
        .catch(() => setSelectedQuestion(null))
        .finally(() => setQuestionDetailLoading(false));
    }
  }, [selectedId, questions]);

  // ── Fetch answers ────────────────────────────────────────────────────────────
  const fetchAnswers = useCallback(async () => {
    if (!selectedId) { setAnswers([]); return; }
    setAnswersLoading(true);
    try {
      const params: Parameters<typeof faqAnswersService.list>[0] = {
        limit: 100, offset: 0, question_id: selectedId,
      };
      if (filterCampusId !== "all") params.campus_id = filterCampusId;
      const res = await faqAnswersService.list(params);
      setAnswers(res.data);
    } catch { setAnswers([]); }
    finally { setAnswersLoading(false); }
  }, [selectedId, filterCampusId]);

  useEffect(() => { fetchAnswers(); }, [fetchAnswers]);

  const goToDetail = (q: FaqQuestion) => router.push(`/dashboard/faq/questions?id=${q.id}`);
  const goToList = () => router.push("/dashboard/faq/questions");

  // ── Question handlers ────────────────────────────────────────────────────────
  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQForm({ sub_topic_id: filterSubTopicId !== "all" ? filterSubTopicId : "", content: "" });
    setIsQDialogOpen(true);
  };

  const openEditQuestion = (q: FaqQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingQuestion(q);
    setQForm({ sub_topic_id: q.sub_topic_id, content: q.content });
    setIsQDialogOpen(true);
  };

  const handleQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qForm.sub_topic_id) { toast.error("Vui lòng chọn chủ đề con"); return; }
    setQSubmitting(true);
    try {
      if (editingQuestion) {
        await faqQuestionsService.update(editingQuestion.id, qForm);
        toast.success("Cập nhật câu hỏi thành công");
        if (selectedQuestion?.id === editingQuestion.id)
          setSelectedQuestion({ ...selectedQuestion, ...qForm });
      } else {
        await faqQuestionsService.create(qForm);
        toast.success("Tạo câu hỏi thành công");
      }
      setIsQDialogOpen(false);
      await fetchQuestions(questionsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally { setQSubmitting(false); }
  };

  const changeQuestionStatus = async (q: FaqQuestion, newStatus: QuestionStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingKey(`q-${q.id}-${newStatus}`);
    try {
      await faqQuestionsService.changeStatus(q.id, newStatus);
      toast.success(`Đã chuyển sang "${STATUS_LABELS[newStatus]}"`);
      await fetchQuestions(questionsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally { setProcessingKey(null); }
  };

  const confirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    setQSubmitting(true);
    try {
      await faqQuestionsService.remove(deletingQuestion.id);
      toast.success("Đã xóa câu hỏi");
      setIsQDeleteOpen(false);
      if (selectedId === deletingQuestion.id) goToList();
      await fetchQuestions(questionsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally { setQSubmitting(false); }
  };

  // ── Answer handlers ──────────────────────────────────────────────────────────
  const openCreateAnswer = () => {
    setEditingAnswer(null);
    setAForm({ content: "", tags: "", keywords: "", synonyms: "" });
    setIsADialogOpen(true);
  };

  const openEditAnswer = (a: FaqAnswer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAnswer(a);
    setAForm({
      content: a.content,
      tags: (a.tags || []).join(", "),
      keywords: (a.keywords || []).join(", "),
      synonyms: (a.synonyms || []).join(", "),
    });
    setIsADialogOpen(true);
  };

  const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);

  const handleASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setASubmitting(true);
    try {
      const payload = {
        question_id: selectedId,
        content: aForm.content,
        tags: splitTags(aForm.tags),
        keywords: splitTags(aForm.keywords),
        synonyms: splitTags(aForm.synonyms),
      };
      if (editingAnswer) {
        await faqAnswersService.update(editingAnswer.id, payload);
        toast.success("Cập nhật câu trả lời thành công");
      } else {
        await faqAnswersService.create(payload);
        toast.success("Tạo câu trả lời thành công");
      }
      setIsADialogOpen(false);
      await fetchAnswers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally { setASubmitting(false); }
  };

  const openACampus = (a: FaqAnswer, e: React.MouseEvent) => {
    e.stopPropagation();
    setCampusAnswer(a);
    setSelectedCampusIds(a.campus_ids || []);
    setIsACampusOpen(true);
  };

  const toggleCampus = (id: string) =>
    setSelectedCampusIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const handleSaveCampuses = async () => {
    if (!campusAnswer) return;
    setCampusSaving(true);
    try {
      await faqAnswersService.setCampuses(campusAnswer.id, selectedCampusIds);
      toast.success("Cập nhật cơ sở thành công");
      setIsACampusOpen(false);
      await fetchAnswers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cập nhật thất bại");
    } finally { setCampusSaving(false); }
  };

  const changeAnswerStatus = async (a: FaqAnswer, newStatus: AnswerStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingKey(`a-${a.id}-${newStatus}`);
    try {
      await faqAnswersService.changeStatus(a.id, newStatus);
      toast.success(`Đã chuyển sang "${STATUS_LABELS[newStatus]}"`);
      await fetchAnswers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally { setProcessingKey(null); }
  };

  const confirmDeleteAnswer = async () => {
    if (!deletingAnswer) return;
    setADeleteSubmitting(true);
    try {
      await faqAnswersService.remove(deletingAnswer.id);
      toast.success("Đã xóa câu trả lời");
      setIsADeleteOpen(false);
      await fetchAnswers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally { setADeleteSubmitting(false); }
  };

  const questionsTotalPages = Math.max(1, Math.ceil(questionsMeta.total / LIMIT));

  // Shared dialogs (dùng cho cả 2 view)
  const sharedDialogs = (
    <>
      {/* Question Create/Edit */}
      <Dialog open={isQDialogOpen} onOpenChange={setIsQDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi Mới"}</DialogTitle>
            <DialogDescription>{editingQuestion ? "Cập nhật nội dung câu hỏi." : "Điền thông tin để tạo câu hỏi mới."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleQSubmit}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Chủ Đề Con *</Label>
                <Select value={qForm.sub_topic_id || undefined} onValueChange={(v) => setQForm({ ...qForm, sub_topic_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Chọn chủ đề con" /></SelectTrigger>
                  <SelectContent>
                    {subTopics.map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="q_content">Nội Dung Câu Hỏi *</Label>
                <Textarea id="q_content" value={qForm.content} onChange={(e) => setQForm({ ...qForm, content: e.target.value })}
                  placeholder="Nhập nội dung câu hỏi..." rows={4} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsQDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={qSubmitting}>{qSubmitting ? "Đang lưu..." : editingQuestion ? "Cập Nhật" : "Tạo Mới"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Question Delete */}
      <AlertDialog open={isQDeleteOpen} onOpenChange={setIsQDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa câu hỏi này? Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={qSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteQuestion} disabled={qSubmitting} className="bg-red-600 hover:bg-red-700">
              {qSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Answer Create/Edit */}
      <Dialog open={isADialogOpen} onOpenChange={setIsADialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingAnswer ? "Chỉnh Sửa Câu Trả Lời" : "Thêm Câu Trả Lời Mới"}</DialogTitle>
            <DialogDescription>{editingAnswer ? "Cập nhật nội dung câu trả lời." : "Tạo câu trả lời cho câu hỏi đã chọn."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleASubmit}>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
              <div className="space-y-2">
                <Label htmlFor="a_content">Nội Dung Trả Lời *</Label>
                <Textarea id="a_content" value={aForm.content}
                  onChange={(e) => setAForm({ ...aForm, content: e.target.value })}
                  placeholder="Nhập nội dung câu trả lời..." rows={5} required />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(["tags", "keywords", "synonyms"] as const).map((field, i) => (
                  <div key={field} className="space-y-2">
                    <Label>{["Tags", "Từ Khóa", "Từ Đồng Nghĩa"][i]}</Label>
                    <Input value={aForm[field]} onChange={(e) => setAForm({ ...aForm, [field]: e.target.value })} placeholder="từ1, từ2, ..." />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => setIsADialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={aSubmitting}>{aSubmitting ? "Đang lưu..." : editingAnswer ? "Cập Nhật" : "Tạo Mới"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Campus Dialog */}
      <Dialog open={isACampusOpen} onOpenChange={setIsACampusOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Phạm Vi Cơ Sở</DialogTitle>
            <DialogDescription>Để trống = áp dụng cho tất cả cơ sở.</DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-1">
            <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
              <input type="checkbox" checked={selectedCampusIds.length === 0} onChange={() => setSelectedCampusIds([])} className="h-4 w-4 rounded border-gray-300" />
              <span className="text-sm font-medium text-blue-700">Tất cả cơ sở</span>
              <Badge variant="secondary" className="ml-auto text-xs">All</Badge>
            </label>
            <div className="border-t my-2" />
            <div className="max-h-52 overflow-y-auto space-y-1">
              {campuses.map((c) => (
                <label key={c.id} className="flex items-center gap-3 cursor-pointer p-2.5 rounded-md hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={selectedCampusIds.includes(c.id)} onChange={() => toggleCampus(c.id)} className="h-4 w-4 rounded border-gray-300" />
                  <span className="text-sm font-medium flex-1">{c.name}</span>
                  <Badge variant="outline" className="text-xs">{c.code}</Badge>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsACampusOpen(false)}>Hủy</Button>
            <Button onClick={handleSaveCampuses} disabled={campusSaving}>{campusSaving ? "Đang lưu..." : "Lưu"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Answer Delete */}
      <AlertDialog open={isADeleteOpen} onOpenChange={setIsADeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu trả lời</AlertDialogTitle>
            <AlertDialogDescription>Bạn có chắc muốn xóa câu trả lời này? Hành động này không thể hoàn tác.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={aDeleteSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnswer} disabled={aDeleteSubmitting} className="bg-red-600 hover:bg-red-700">
              {aDeleteSubmitting ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // DETAIL VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (selectedId) {
    return (
        <div className="flex flex-col gap-5 p-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0 text-gray-500 hover:text-gray-800" onClick={goToList}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {questionDetailLoading ? (
              <div className="h-7 w-2/3 bg-gray-100 rounded animate-pulse" />
            ) : (
              <h1 className="text-xl font-semibold text-gray-900 leading-snug">{selectedQuestion?.content ?? "Đang tải..."}</h1>
            )}
          </div>

          <Separator />

          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterCampusId("all")}
              className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                filterCampusId === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả
            </button>
            {campuses.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilterCampusId(c.id)}
                className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
                  filterCampusId === c.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {c.name}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={fetchAnswers}>
                <RefreshCw className="h-3.5 w-3.5" />Làm mới
              </Button>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openCreateAnswer}>
                <Plus className="h-3.5 w-3.5" />Thêm câu trả lời
              </Button>
            </div>
          </div>

          {/* Answers table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="w-10 text-center text-xs font-semibold text-gray-500">#</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500">Nội dung trả lời</TableHead>
                  <TableHead className="w-[80px] text-xs font-semibold text-gray-500">Phiên bản</TableHead>
                  <TableHead className="w-[200px] text-xs font-semibold text-gray-500">Cơ sở</TableHead>
                  <TableHead className="w-[120px] text-xs font-semibold text-gray-500">Trạng thái</TableHead>
                  <TableHead className="w-[60px] text-xs font-semibold text-gray-500 text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {answersLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 w-5 bg-gray-100 rounded animate-pulse mx-auto" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 w-8 bg-gray-100 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell><div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : answers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center justify-center py-14 gap-2">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                          <MessagesSquare className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Chưa có câu trả lời</p>
                        <p className="text-xs text-gray-400">Câu hỏi này chưa được cung cấp câu trả lời</p>
                        <Button size="sm" variant="outline" className="mt-2 gap-1.5 text-xs" onClick={openCreateAnswer}>
                          <Plus className="h-3.5 w-3.5" />Thêm câu trả lời đầu tiên
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  answers.map((a, idx) => {
                    const aTransitions = ANSWER_STATUS_TRANSITIONS[a.status];
                    return (
                      <TableRow key={a.id} className="group hover:bg-slate-50 align-top">
                        <TableCell className="text-center text-xs text-gray-400 font-mono pt-3">{idx + 1}</TableCell>
                        <TableCell className="max-w-0">
                          <p className="text-sm text-gray-800 leading-relaxed break-words">{a.content}</p>
                          {(a.tags?.length > 0 || a.keywords?.length > 0) && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {a.tags?.slice(0, 3).map((t) => <span key={t} className="text-xs bg-blue-50 text-blue-600 rounded px-1.5 py-0.5">{t}</span>)}
                              {a.keywords?.slice(0, 2).map((k) => <span key={k} className="text-xs bg-purple-50 text-purple-600 rounded px-1.5 py-0.5">{k}</span>)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="pt-3">
                          <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5">v{a.version || 1}</span>
                        </TableCell>
                        <TableCell className="pt-3">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                            {(a.campus_ids || []).length === 0 ? (
                              <button
                                type="button"
                                className="text-xs text-blue-700 underline underline-offset-2 hover:text-blue-900 cursor-pointer"
                                onClick={(e) => openACampus(a, e)}
                              >
                                Tất cả
                              </button>
                            ) : (
                              (a.campus_ids || []).map((id) => {
                                const name = campuses.find((c) => c.id === id)?.name || id;
                                return (
                                  <button
                                    key={id}
                                    type="button"
                                    className="text-xs text-gray-700 underline underline-offset-2 hover:text-blue-700 cursor-pointer whitespace-nowrap"
                                    onClick={(e) => openACampus(a, e)}
                                  >
                                    {name}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pt-3">
                          <Badge className={`text-xs h-5 px-1.5 py-0 whitespace-nowrap ${STATUS_BADGE_CLASS[a.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[a.status] || a.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="pt-2">
                          <div className="flex items-center justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Thao tác</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                {aTransitions.map((s) => {
                                  const Icon = STATUS_ICONS[s] ?? CheckCircle2;
                                  const key = `a-${a.id}-${s}`;
                                  return (
                                    <DropdownMenuItem
                                      key={s}
                                      disabled={processingKey === key}
                                      onClick={(e) => changeAnswerStatus(a, s, e)}
                                      className="gap-2"
                                    >
                                      {processingKey === key
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Icon className="h-3.5 w-3.5" />}
                                      {STATUS_LABELS[s]}
                                    </DropdownMenuItem>
                                  );
                                })}
                                {aTransitions.length > 0 && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={(e) => openEditAnswer(a, e)} className="gap-2">
                                  <Edit className="h-3.5 w-3.5" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => { e.stopPropagation(); setDeletingAnswer(a); setIsADeleteOpen(true); }}
                                  className="gap-2 text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Xóa
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            {!answersLoading && answers.length > 0 && (
              <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/50">
                <span className="text-xs text-gray-400">{answers.length} câu trả lời</span>
              </div>
            )}
          </div>

          {sharedDialogs}
        </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // LIST VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
      <div className="flex flex-col gap-5 p-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-sm">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 leading-tight">Câu Hỏi</h1>
              <p className="text-sm text-gray-500">Nhấn vào câu hỏi để xem và quản lý câu trả lời</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"
              onClick={() => { setQuestionsLoading(true); fetchQuestions(questionsPage).finally(() => setQuestionsLoading(false)); }}>
              <RefreshCw className="h-3.5 w-3.5" />Làm mới
            </Button>
            <Button size="sm" className="gap-1.5" onClick={openCreateQuestion}>
              <Plus className="h-3.5 w-3.5" />Thêm câu hỏi
            </Button>
          </div>
        </div>

        {questionsError && <Alert variant="destructive"><AlertDescription>{questionsError}</AlertDescription></Alert>}

        <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
          <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 font-medium">Lọc:</span>
          <Select value={filterSubTopicId} onValueChange={setFilterSubTopicId}>
            <SelectTrigger className="w-[200px] h-8 text-sm bg-white"><SelectValue placeholder="Tất cả chủ đề con" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chủ đề con</SelectItem>
              {subTopics.map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px] h-8 text-sm bg-white"><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {QUESTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          {(filterSubTopicId !== "all" || filterStatus !== "all") && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => { setFilterSubTopicId("all"); setFilterStatus("all"); }}>
              Xóa bộ lọc
            </Button>
          )}
          <span className="ml-auto text-xs text-gray-400">{questionsMeta.total} câu hỏi</span>
        </div>

        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="w-10 text-center text-xs font-semibold text-gray-500">#</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">Nội dung câu hỏi</TableHead>
                <TableHead className="w-[160px] text-xs font-semibold text-gray-500">Chủ đề con</TableHead>
                <TableHead className="w-[110px] text-xs font-semibold text-gray-500">Trạng thái</TableHead>
                <TableHead className="w-[100px] text-xs font-semibold text-gray-500">Câu trả lời</TableHead>
                <TableHead className="w-[80px] text-xs font-semibold text-gray-500 text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questionsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><div className="h-4 w-5 bg-gray-100 rounded animate-pulse mx-auto" /></TableCell>
                    <TableCell><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-16 bg-gray-100 rounded-full animate-pulse" /></TableCell>
                    <TableCell><div className="h-5 w-12 bg-gray-100 rounded animate-pulse" /></TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-14 gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <HelpCircle className="h-6 w-6 text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium">Không tìm thấy câu hỏi nào</p>
                      <p className="text-xs text-gray-400">Thử thay đổi bộ lọc hoặc tạo câu hỏi mới</p>
                      <Button size="sm" variant="outline" className="mt-2 gap-1.5 text-xs" onClick={openCreateQuestion}>
                        <Plus className="h-3.5 w-3.5" />Tạo câu hỏi đầu tiên
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q, idx) => {
                  const rowNum = (questionsPage - 1) * LIMIT + idx + 1;
                  const subTopicName = q.sub_topic?.name || subTopics.find((st) => st.id === q.sub_topic_id)?.name || "—";
                  const transitions = QUESTION_STATUS_TRANSITIONS[q.status];
                  const count = answerCounts[q.id];
                  return (
                    <TableRow key={q.id} className="group hover:bg-slate-50 cursor-pointer" onClick={() => goToDetail(q)}>
                      <TableCell className="text-center text-xs text-gray-400 font-mono">{rowNum}</TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-800 line-clamp-2 group-hover:text-blue-700 transition-colors">{q.content}</p>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center text-xs bg-gray-100 text-gray-600 rounded-md px-2 py-0.5 max-w-[148px] truncate">{subTopicName}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs h-5 px-1.5 py-0 whitespace-nowrap ${STATUS_BADGE_CLASS[q.status] || "bg-gray-100 text-gray-700"}`}>
                          {STATUS_LABELS[q.status] || q.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MessagesSquare className="h-3.5 w-3.5 text-gray-400" />
                          {count !== undefined ? <span>{count}</span> : <span className="inline-block w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Thao tác</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {transitions.map((s) => {
                                const Icon = STATUS_ICONS[s] ?? CheckCircle2;
                                const key = `q-${q.id}-${s}`;
                                return (
                                  <DropdownMenuItem
                                    key={s}
                                    disabled={processingKey === key}
                                    onClick={(e) => changeQuestionStatus(q, s, e)}
                                    className="gap-2"
                                  >
                                    {processingKey === key
                                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      : <Icon className="h-3.5 w-3.5" />}
                                    {STATUS_LABELS[s]}
                                  </DropdownMenuItem>
                                );
                              })}
                              {transitions.length > 0 && <DropdownMenuSeparator />}
                              <DropdownMenuItem onClick={(e) => openEditQuestion(q, e)} className="gap-2">
                                <Edit className="h-3.5 w-3.5" />
                                Chỉnh sửa
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => { e.stopPropagation(); setDeletingQuestion(q); setIsQDeleteOpen(true); }}
                                className="gap-2 text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Xóa
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <MoveRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-400 transition-colors" />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          {questionsTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
              <span className="text-xs text-gray-500">Trang {questionsPage} / {questionsTotalPages} · {questionsMeta.total} câu hỏi</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => fetchQuestions(questionsPage - 1)} disabled={!questionsMeta.has_prev}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => fetchQuestions(questionsPage + 1)} disabled={!questionsMeta.has_next}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {sharedDialogs}
      </div>
  );
}

export default function FaqQuestionsPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="h-8 w-48 bg-gray-100 rounded animate-pulse" /></div>}>
      <FaqQuestionsInner />
    </Suspense>
  );
}
