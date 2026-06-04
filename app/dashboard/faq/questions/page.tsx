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
  HelpCircle,
  CheckSquare,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ArrowRightLeft,
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

const LIMIT = 10;

const QUESTION_STATUSES: QuestionStatus[] = [
  "new", "approved", "rejected", "published", "deleted",
];

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

export default function FaqQuestionsPage() {
  const router = useRouter();

  // ── Questions ─────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<FaqQuestion[]>([]);
  const [subTopics, setSubTopics] = useState<FaqSubTopic[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<FaqQuestion | null>(null);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [questionsError, setQuestionsError] = useState("");
  const [filterSubTopicId, setFilterSubTopicId] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsMeta, setQuestionsMeta] = useState({
    total: 0, limit: LIMIT, offset: 0, has_next: false, has_prev: false,
  });

  // Question form dialog
  const [isQDialogOpen, setIsQDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FaqQuestion | null>(null);
  const [qForm, setQForm] = useState({ sub_topic_id: "", content: "" });
  const [qSubmitting, setQSubmitting] = useState(false);

  // Question status dialog
  const [isQStatusDialogOpen, setIsQStatusDialogOpen] = useState(false);
  const [qStatusTarget, setQStatusTarget] = useState<FaqQuestion | null>(null);
  const [qNewStatus, setQNewStatus] = useState<QuestionStatus | "">("");
  const [qRejectionReason, setQRejectionReason] = useState("");

  // Question delete dialog
  const [isQDeleteOpen, setIsQDeleteOpen] = useState(false);
  const [deletingQuestion, setDeletingQuestion] = useState<FaqQuestion | null>(null);

  // ── Answers ───────────────────────────────────────────────────────────────
  const [answers, setAnswers] = useState<FaqAnswer[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [answersLoading, setAnswersLoading] = useState(false);

  // Answer form dialog
  const [isADialogOpen, setIsADialogOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState<FaqAnswer | null>(null);
  const [aForm, setAForm] = useState({
    content: "",
    admission_year: new Date().getFullYear(),
    tags: "",
    keywords: "",
    synonyms: "",
  });
  const [aSubmitting, setASubmitting] = useState(false);

  // Answer campus dialog
  const [isACampusOpen, setIsACampusOpen] = useState(false);
  const [campusAnswer, setCampusAnswer] = useState<FaqAnswer | null>(null);
  const [selectedCampusIds, setSelectedCampusIds] = useState<string[]>([]);
  const [campusSaving, setCampusSaving] = useState(false);

  // Answer status dialog
  const [isAStatusDialogOpen, setIsAStatusDialogOpen] = useState(false);
  const [aStatusTarget, setAStatusTarget] = useState<FaqAnswer | null>(null);
  const [aNewStatus, setANewStatus] = useState<AnswerStatus | "">("");
  const [aRejectionReason, setARejectionReason] = useState("");
  const [aStatusSubmitting, setAStatusSubmitting] = useState(false);

  // Answer delete dialog
  const [isADeleteOpen, setIsADeleteOpen] = useState(false);
  const [deletingAnswer, setDeletingAnswer] = useState<FaqAnswer | null>(null);
  const [aDeleteSubmitting, setADeleteSubmitting] = useState(false);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    faqSubTopicsService.list({ limit: 100 }).then((r) => setSubTopics(r.data)).catch(() => {});
    const token = authService.getToken();
    fetchAllCampuses(token).then(setCampuses);
  }, []);

  // ── Fetch questions ───────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async (page = 1) => {
    try {
      setQuestionsError("");
      const params: Parameters<typeof faqQuestionsService.list>[0] = {
        limit: LIMIT,
        offset: (page - 1) * LIMIT,
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

  // ── Fetch answers for selected question ───────────────────────────────────
  const fetchAnswers = useCallback(async () => {
    if (!selectedQuestion) { setAnswers([]); return; }
    setAnswersLoading(true);
    try {
      const res = await faqAnswersService.list({
        limit: 100,
        offset: 0,
        question_id: selectedQuestion.id,
      });
      setAnswers(res.data);
    } catch {
      setAnswers([]);
    } finally {
      setAnswersLoading(false);
    }
  }, [selectedQuestion]);

  useEffect(() => {
    fetchAnswers();
  }, [fetchAnswers]);

  // ── Question handlers ─────────────────────────────────────────────────────
  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setQForm({
      sub_topic_id: filterSubTopicId !== "all" ? filterSubTopicId : "",
      content: "",
    });
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
        if (selectedQuestion?.id === editingQuestion.id) {
          setSelectedQuestion({ ...selectedQuestion, ...qForm });
        }
      } else {
        await faqQuestionsService.create(qForm);
        toast.success("Tạo câu hỏi thành công");
      }
      setIsQDialogOpen(false);
      await fetchQuestions(questionsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    } finally {
      setQSubmitting(false);
    }
  };

  const openQStatus = (q: FaqQuestion, e: React.MouseEvent) => {
    e.stopPropagation();
    setQStatusTarget(q);
    setQNewStatus("");
    setQRejectionReason("");
    setIsQStatusDialogOpen(true);
  };

  const handleQStatusChange = async () => {
    if (!qStatusTarget || !qNewStatus) return;
    setQSubmitting(true);
    try {
      await faqQuestionsService.changeStatus(
        qStatusTarget.id,
        qNewStatus as QuestionStatus,
        qNewStatus === "rejected" ? qRejectionReason : undefined
      );
      toast.success(`Đã chuyển trạng thái sang "${STATUS_LABELS[qNewStatus]}"`);
      setIsQStatusDialogOpen(false);
      await fetchQuestions(questionsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally {
      setQSubmitting(false);
    }
  };

  const confirmDeleteQuestion = async () => {
    if (!deletingQuestion) return;
    setQSubmitting(true);
    try {
      await faqQuestionsService.remove(deletingQuestion.id);
      toast.success("Đã xóa câu hỏi");
      if (selectedQuestion?.id === deletingQuestion.id) setSelectedQuestion(null);
      setIsQDeleteOpen(false);
      await fetchQuestions(questionsPage);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setQSubmitting(false);
    }
  };

  // ── Answer handlers ───────────────────────────────────────────────────────
  const openCreateAnswer = () => {
    setEditingAnswer(null);
    setAForm({
      content: "",
      admission_year: new Date().getFullYear(),
      tags: "",
      keywords: "",
      synonyms: "",
    });
    setIsADialogOpen(true);
  };

  const openEditAnswer = (a: FaqAnswer) => {
    setEditingAnswer(a);
    setAForm({
      content: a.content,
      admission_year: a.admission_year,
      tags: (a.tags || []).join(", "),
      keywords: (a.keywords || []).join(", "),
      synonyms: (a.synonyms || []).join(", "),
    });
    setIsADialogOpen(true);
  };

  const splitTags = (s: string) => s.split(",").map((t) => t.trim()).filter(Boolean);

  const handleASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;
    setASubmitting(true);
    try {
      const payload = {
        question_id: selectedQuestion.id,
        content: aForm.content,
        admission_year: aForm.admission_year,
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
    } finally {
      setASubmitting(false);
    }
  };

  const openACampus = (a: FaqAnswer) => {
    setCampusAnswer(a);
    setSelectedCampusIds(a.campus_ids || []);
    setIsACampusOpen(true);
  };

  const toggleCampus = (id: string) => {
    setSelectedCampusIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

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
    } finally {
      setCampusSaving(false);
    }
  };

  const openAStatus = (a: FaqAnswer) => {
    setAStatusTarget(a);
    setANewStatus("");
    setARejectionReason("");
    setIsAStatusDialogOpen(true);
  };

  const handleAStatusChange = async () => {
    if (!aStatusTarget || !aNewStatus) return;
    setAStatusSubmitting(true);
    try {
      await faqAnswersService.changeStatus(
        aStatusTarget.id,
        aNewStatus as AnswerStatus,
        aNewStatus === "rejected" ? aRejectionReason : undefined
      );
      toast.success(`Đã chuyển trạng thái sang "${STATUS_LABELS[aNewStatus]}"`);
      setIsAStatusDialogOpen(false);
      await fetchAnswers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Đổi trạng thái thất bại");
    } finally {
      setAStatusSubmitting(false);
    }
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
    } finally {
      setADeleteSubmitting(false);
    }
  };

  const questionsTotalPages = Math.max(1, Math.ceil(questionsMeta.total / LIMIT));
  const qAllowedTransitions = qStatusTarget ? QUESTION_STATUS_TRANSITIONS[qStatusTarget.status] : [];
  const aAllowedTransitions = aStatusTarget ? ANSWER_STATUS_TRANSITIONS[aStatusTarget.status] : [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <HelpCircle className="h-8 w-8 mr-3 text-blue-600" />
              Quản Lý Câu Hỏi &amp; Câu Trả Lời
            </h1>
            <p className="text-gray-600 mt-1">Quản lý câu hỏi và câu trả lời cho FAQ</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setQuestionsLoading(true); fetchQuestions(questionsPage).finally(() => setQuestionsLoading(false)); }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm Mới
          </Button>
        </div>

        {questionsError && (
          <Alert variant="destructive">
            <AlertDescription>{questionsError}</AlertDescription>
          </Alert>
        )}

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6 items-start">
          {/* ── Left: Questions ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between mb-3">
                <CardTitle className="flex items-center text-lg">
                  <HelpCircle className="h-5 w-5 mr-2 text-blue-600" />
                  Câu Hỏi
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({questionsMeta.total})
                  </span>
                </CardTitle>
                <Button size="sm" onClick={openCreateQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <Select value={filterSubTopicId} onValueChange={setFilterSubTopicId}>
                  <SelectTrigger className="flex-1 min-w-[120px] h-8 text-sm">
                    <SelectValue placeholder="Chủ đề con" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả chủ đề con</SelectItem>
                    {subTopics.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1 min-w-[110px] h-8 text-sm">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    {QUESTION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {questionsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : questions.length === 0 ? (
                <p className="text-center py-10 text-gray-500 text-sm">Không có câu hỏi nào.</p>
              ) : (
                <div className="divide-y">
                  {questions.map((q) => {
                    const isSelected = selectedQuestion?.id === q.id;
                    const transitions = QUESTION_STATUS_TRANSITIONS[q.status];
                    return (
                      <div
                        key={q.id}
                        onClick={() => setSelectedQuestion(isSelected ? null : q)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-blue-50 border-l-4 border-l-blue-600"
                            : "hover:bg-gray-50 border-l-4 border-l-transparent"
                        }`}
                      >
                        {/* Content + sub-topic */}
                        <div className="flex items-start gap-2 mb-2">
                          <p
                            className={`text-sm flex-1 line-clamp-2 ${isSelected ? "font-medium text-blue-700" : "text-gray-900"}`}
                            title={q.content}
                          >
                            {q.content}
                          </p>
                        </div>

                        {/* Sub-topic + status badges + action buttons */}
                        <div className="flex items-center gap-1.5 flex-wrap" onClick={(e) => e.stopPropagation()}>
                          <Badge variant="outline" className="text-xs">
                            {q.sub_topic?.name ||
                              subTopics.find((st) => st.id === q.sub_topic_id)?.name ||
                              "—"}
                          </Badge>
                          <Badge className={`text-xs ${STATUS_BADGE_CLASS[q.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[q.status] || q.status}
                          </Badge>

                          <div className="ml-auto flex items-center gap-1">
                            {transitions.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={(e) => openQStatus(q, e)}
                                title="Đổi trạng thái"
                              >
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                Trạng thái
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => openEditQuestion(q, e)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => { e.stopPropagation(); setDeletingQuestion(q); setIsQDeleteOpen(true); }}
                              title="Xóa"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Questions pagination */}
              {questionsTotalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                  <span className="text-xs text-gray-500">
                    Trang {questionsPage} / {questionsTotalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => fetchQuestions(questionsPage - 1)}
                      disabled={!questionsMeta.has_prev}
                    >
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => fetchQuestions(questionsPage + 1)}
                      disabled={!questionsMeta.has_next}
                    >
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Right: Answers ── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center text-lg">
                  <CheckSquare className="h-5 w-5 mr-2 text-green-600" />
                  Câu Trả Lời
                  {answers.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({answers.length})
                    </span>
                  )}
                </CardTitle>
                <Button size="sm" onClick={openCreateAnswer} disabled={!selectedQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm
                </Button>
              </div>

              {selectedQuestion && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                  <span className="font-medium">Câu hỏi: </span>
                  {selectedQuestion.content}
                </p>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {!selectedQuestion ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <CheckSquare className="h-12 w-12 mb-3 opacity-30" />
                  <p className="text-sm">Chọn một câu hỏi để xem câu trả lời</p>
                </div>
              ) : answersLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
                </div>
              ) : answers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <p className="text-sm">Câu hỏi này chưa có câu trả lời.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={openCreateAnswer}>
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm câu trả lời đầu tiên
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {answers.map((a) => {
                    const aTransitions = ANSWER_STATUS_TRANSITIONS[a.status];
                    const campusNames = (a.campus_ids || [])
                      .map((id) => campuses.find((c) => c.id === id)?.name || id)
                      .slice(0, 3);
                    const extraCampuses = Math.max(0, (a.campus_ids || []).length - 3);

                    return (
                      <div key={a.id} className="px-4 py-4 hover:bg-gray-50/50">
                        {/* Header row: version, status, actions */}
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            v{a.version || 1}
                          </Badge>
                          <Badge className={`text-xs ${STATUS_BADGE_CLASS[a.status] || "bg-gray-100 text-gray-700"}`}>
                            {STATUS_LABELS[a.status] || a.status}
                          </Badge>
                          <span className="text-xs text-gray-400 ml-1">Năm {a.admission_year}</span>

                          <div className="ml-auto flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditAnswer(a)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => { setDeletingAnswer(a); setIsADeleteOpen(true); }}
                              title="Xóa"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-gray-800 line-clamp-3 mb-3">{a.content}</p>

                        {/* Campus row */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          {(a.campus_ids || []).length === 0 ? (
                            <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                              Tất cả cơ sở
                            </Badge>
                          ) : (
                            <>
                              {campusNames.map((name, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {name}
                                </Badge>
                              ))}
                              {extraCampuses > 0 && (
                                <Badge variant="secondary" className="text-xs text-gray-500">
                                  +{extraCampuses} cơ sở
                                </Badge>
                              )}
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                            onClick={() => openACampus(a)}
                          >
                            <MapPin className="h-3 w-3 mr-1" />
                            Sửa cơ sở
                          </Button>
                        </div>

                        {/* Status transition buttons */}
                        {aTransitions.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-gray-400">Chuyển:</span>
                            {aTransitions.map((s) => (
                              <Button
                                key={s}
                                variant="outline"
                                size="sm"
                                className={`h-6 px-2 text-xs ${
                                  s === "rejected"
                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                    : s === "published"
                                    ? "border-green-200 text-green-700 hover:bg-green-50"
                                    : ""
                                }`}
                                onClick={() => {
                                  setAStatusTarget(a);
                                  setANewStatus(s);
                                  if (s !== "rejected") {
                                    setARejectionReason("");
                                    setIsAStatusDialogOpen(true);
                                  } else {
                                    setIsAStatusDialogOpen(true);
                                  }
                                }}
                              >
                                {STATUS_LABELS[s]}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Question Create/Edit Dialog ── */}
        <Dialog open={isQDialogOpen} onOpenChange={setIsQDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi Mới"}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? "Cập nhật nội dung câu hỏi." : "Điền thông tin để tạo câu hỏi mới."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleQSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Chủ Đề Con *</Label>
                  <Select
                    value={qForm.sub_topic_id || undefined}
                    onValueChange={(v) => setQForm({ ...qForm, sub_topic_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chủ đề con" />
                    </SelectTrigger>
                    <SelectContent>
                      {subTopics.map((st) => (
                        <SelectItem key={st.id} value={st.id}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q_content">Nội Dung Câu Hỏi *</Label>
                  <Textarea
                    id="q_content"
                    value={qForm.content}
                    onChange={(e) => setQForm({ ...qForm, content: e.target.value })}
                    placeholder="Nhập nội dung câu hỏi..."
                    rows={4}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsQDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={qSubmitting}>
                  {qSubmitting ? "Đang lưu..." : editingQuestion ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Question Status Dialog ── */}
        <Dialog open={isQStatusDialogOpen} onOpenChange={setIsQStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thay Đổi Trạng Thái Câu Hỏi</DialogTitle>
              <DialogDescription>
                Trạng thái hiện tại:{" "}
                <Badge className={STATUS_BADGE_CLASS[qStatusTarget?.status || "new"]}>
                  {STATUS_LABELS[qStatusTarget?.status || ""]}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Chuyển sang trạng thái *</Label>
                <div className="flex flex-wrap gap-2">
                  {qAllowedTransitions.map((s) => (
                    <Button
                      key={s}
                      variant={qNewStatus === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQNewStatus(s)}
                    >
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
              {qNewStatus === "rejected" && (
                <div className="space-y-2">
                  <Label>Lý Do Từ Chối</Label>
                  <Textarea
                    value={qRejectionReason}
                    onChange={(e) => setQRejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsQStatusDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleQStatusChange} disabled={!qNewStatus || qSubmitting}>
                {qSubmitting ? "Đang xử lý..." : "Xác Nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Question Delete Dialog ── */}
        <AlertDialog open={isQDeleteOpen} onOpenChange={setIsQDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa câu hỏi này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={qSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteQuestion}
                disabled={qSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {qSubmitting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* ── Answer Create/Edit Dialog ── */}
        <Dialog open={isADialogOpen} onOpenChange={setIsADialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAnswer ? "Chỉnh Sửa Câu Trả Lời" : "Thêm Câu Trả Lời Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingAnswer
                  ? "Cập nhật nội dung câu trả lời."
                  : "Tạo câu trả lời cho câu hỏi đã chọn."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleASubmit}>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label htmlFor="a_year">Năm Tuyển Sinh *</Label>
                  <Input
                    id="a_year"
                    type="number"
                    value={aForm.admission_year}
                    onChange={(e) => setAForm({ ...aForm, admission_year: Number(e.target.value) })}
                    min={2020}
                    max={2035}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a_content">Nội Dung Trả Lời *</Label>
                  <Textarea
                    id="a_content"
                    value={aForm.content}
                    onChange={(e) => setAForm({ ...aForm, content: e.target.value })}
                    placeholder="Nhập nội dung câu trả lời..."
                    rows={5}
                    required
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      value={aForm.tags}
                      onChange={(e) => setAForm({ ...aForm, tags: e.target.value })}
                      placeholder="tag1, tag2, ..."
                    />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Từ Khóa</Label>
                    <Input
                      value={aForm.keywords}
                      onChange={(e) => setAForm({ ...aForm, keywords: e.target.value })}
                      placeholder="từ1, từ2, ..."
                    />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Từ Đồng Nghĩa</Label>
                    <Input
                      value={aForm.synonyms}
                      onChange={(e) => setAForm({ ...aForm, synonyms: e.target.value })}
                      placeholder="từ1, từ2, ..."
                    />
                    <p className="text-xs text-gray-400">Phân cách bằng dấu phẩy</p>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-2">
                <Button type="button" variant="outline" onClick={() => setIsADialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={aSubmitting}>
                  {aSubmitting ? "Đang lưu..." : editingAnswer ? "Cập Nhật" : "Tạo Mới"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── Answer Campus Dialog ── */}
        <Dialog open={isACampusOpen} onOpenChange={setIsACampusOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Phạm Vi Cơ Sở</DialogTitle>
              <DialogDescription>
                Để trống = áp dụng cho tất cả cơ sở. Chọn cụ thể để giới hạn phạm vi.
              </DialogDescription>
            </DialogHeader>
            <div className="py-3 space-y-1">
              {/* All campuses option */}
              <label className="flex items-center gap-3 cursor-pointer p-2.5 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedCampusIds.length === 0}
                  onChange={() => setSelectedCampusIds([])}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-blue-700">Tất cả cơ sở</span>
                <Badge variant="secondary" className="ml-auto text-xs">All</Badge>
              </label>

              <div className="border-t my-2" />

              <div className="max-h-52 overflow-y-auto space-y-1">
                {campuses.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-3 cursor-pointer p-2.5 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCampusIds.includes(c.id)}
                      onChange={() => toggleCampus(c.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm font-medium flex-1">{c.name}</span>
                    <Badge variant="outline" className="text-xs">{c.code}</Badge>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsACampusOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSaveCampuses} disabled={campusSaving}>
                {campusSaving ? "Đang lưu..." : "Lưu"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Answer Status Dialog ── */}
        <Dialog open={isAStatusDialogOpen} onOpenChange={setIsAStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Thay Đổi Trạng Thái Câu Trả Lời</DialogTitle>
              <DialogDescription>
                Trạng thái hiện tại:{" "}
                <Badge className={STATUS_BADGE_CLASS[aStatusTarget?.status || "new"]}>
                  {STATUS_LABELS[aStatusTarget?.status || ""]}
                </Badge>
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Chuyển sang trạng thái *</Label>
                <div className="flex flex-wrap gap-2">
                  {aAllowedTransitions.map((s) => (
                    <Button
                      key={s}
                      variant={aNewStatus === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setANewStatus(s)}
                    >
                      {STATUS_LABELS[s]}
                    </Button>
                  ))}
                </div>
              </div>
              {aNewStatus === "rejected" && (
                <div className="space-y-2">
                  <Label>Lý Do Từ Chối</Label>
                  <Textarea
                    value={aRejectionReason}
                    onChange={(e) => setARejectionReason(e.target.value)}
                    placeholder="Nhập lý do từ chối..."
                    rows={3}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAStatusDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleAStatusChange} disabled={!aNewStatus || aStatusSubmitting}>
                {aStatusSubmitting ? "Đang xử lý..." : "Xác Nhận"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Answer Delete Dialog ── */}
        <AlertDialog open={isADeleteOpen} onOpenChange={setIsADeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa câu trả lời</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa câu trả lời này? Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={aDeleteSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAnswer}
                disabled={aDeleteSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {aDeleteSubmitting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
