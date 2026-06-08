"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  ChevronLeft,
  Download,
  RefreshCw,
  FolderOpen,
  Folder,
  HelpCircle,
  MessagesSquare,
  Plus,
  Trash2,
} from "lucide-react";
import {
  faqCollectionsService,
  faqTopicsService,
  faqSubTopicsService,
  faqQuestionsService,
  FaqCollectionDetail,
  FaqTopic,
  FaqSubTopic,
  FaqQuestion,
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
} from "@/lib/faq";
import { authService } from "@/lib/auth";
import { useYear } from "@/contexts/year-context";

function campusLabel(names: string[], appliesToAll: boolean) {
  if (appliesToAll || names.length === 0) return "Tất cả cơ sở";
  return names.join(", ");
}

function getCollectionQuestionIds(detail: FaqCollectionDetail): Set<string> {
  const ids = new Set<string>();
  for (const topic of detail.topics) {
    for (const st of topic.sub_topics) {
      for (const q of st.questions) {
        ids.add(q.id);
      }
    }
  }
  return ids;
}

export default function FaqCollectionDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id") ?? "";
  const { selectedYear } = useYear();

  const [detail, setDetail] = useState<FaqCollectionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  // Add question dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [topics, setTopics] = useState<FaqTopic[]>([]);
  const [subTopics, setSubTopics] = useState<FaqSubTopic[]>([]);
  const [addForm, setAddForm] = useState({ topic_id: "", sub_topic_id: "" });
  const [subTopicQuestions, setSubTopicQuestions] = useState<FaqQuestion[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [addingQuestionId, setAddingQuestionId] = useState<string | null>(null);
  const [removingQuestionId, setRemovingQuestionId] = useState<string | null>(null);

  const yearParams = useMemo(() => {
    const year = detail?.admission_year ?? selectedYear;
    return year != null ? { admission_year: year } : {};
  }, [detail?.admission_year, selectedYear]);

  const collectionQuestionIds = useMemo(
    () => (detail ? getCollectionQuestionIds(detail) : new Set<string>()),
    [detail]
  );

  const dialogSubTopics = addForm.topic_id
    ? subTopics.filter((st) => st.topic_id === addForm.topic_id)
    : [];

  const availableQuestions = subTopicQuestions.filter((q) => !collectionQuestionIds.has(q.id));

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    try {
      setError("");
      const res = await faqCollectionsService.getDetail(id);
      setDetail(res.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Không thể tải chi tiết bộ câu hỏi";
      setError(msg);
      setDetail(null);
      if (msg.includes("401")) {
        authService.logout();
        router.push("/login");
      }
    }
  }, [id, router]);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError("Thiếu mã bộ câu hỏi");
      return;
    }
    setIsLoading(true);
    fetchDetail().finally(() => setIsLoading(false));
  }, [id, fetchDetail]);

  useEffect(() => {
    if (!isAddDialogOpen) return;
    faqTopicsService.list({ limit: 100, ...yearParams }).then((r) => setTopics(r.data)).catch(() => {});
    faqSubTopicsService.list({ limit: 100, ...yearParams }).then((r) => setSubTopics(r.data)).catch(() => {});
  }, [isAddDialogOpen, yearParams]);

  useEffect(() => {
    if (!addForm.sub_topic_id) {
      setSubTopicQuestions([]);
      return;
    }
    setIsLoadingQuestions(true);
    faqQuestionsService
      .list({
        limit: 100,
        sub_topic_id: addForm.sub_topic_id,
        status: "approved",
        ...yearParams,
      })
      .then((r) => setSubTopicQuestions(r.data))
      .catch(() => setSubTopicQuestions([]))
      .finally(() => setIsLoadingQuestions(false));
  }, [addForm.sub_topic_id, yearParams]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDetail();
    setIsRefreshing(false);
  };

  const openAddDialog = () => {
    setAddForm({ topic_id: "", sub_topic_id: "" });
    setSubTopicQuestions([]);
    setIsAddDialogOpen(true);
  };

  const handleAddQuestion = async (question: FaqQuestion) => {
    if (!id) return;
    setAddingQuestionId(question.id);
    try {
      const res = await faqCollectionsService.addItem(id, question.id);
      if (res.inserted === 0) {
        toast.warning("Câu hỏi đã có trong bộ câu hỏi");
        return;
      }
      toast.success("Đã thêm câu hỏi vào bộ câu hỏi");
      await fetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thêm thất bại");
    } finally {
      setAddingQuestionId(null);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (!id) return;
    setRemovingQuestionId(questionId);
    try {
      await faqCollectionsService.removeItem(id, questionId);
      toast.success("Đã xóa câu hỏi khỏi bộ câu hỏi");
      await fetchDetail();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xóa thất bại");
    } finally {
      setRemovingQuestionId(null);
    }
  };

  const handleExport = async () => {
    if (!id) return;
    setIsExporting(true);
    try {
      const blob = await faqCollectionsService.exportCsv(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `faq-collection-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất file CSV");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Xuất file thất bại");
    } finally {
      setIsExporting(false);
    }
  };

  if (!id) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Thiếu mã bộ câu hỏi. Vui lòng mở từ danh sách bộ câu hỏi.</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/faq/collections">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>{error || "Không tìm thấy bộ câu hỏi"}</AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/faq/collections">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại
          </Link>
        </Button>
      </div>
    );
  }

  const totalQuestions = detail.topics.reduce(
    (sum, t) => sum + t.sub_topics.reduce((s, st) => s + st.questions.length, 0),
    0
  );

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2 -ml-2 text-gray-500">
            <Link href="/dashboard/faq/collections">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Danh sách bộ câu hỏi
            </Link>
          </Button>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <BookOpen className="h-7 w-7 text-blue-600" />
            {detail.name}
          </h1>
          {detail.description && (
            <p className="max-w-2xl text-sm text-gray-600">{detail.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Năm {detail.admission_year}</Badge>
            <Badge className={STATUS_BADGE_CLASS[detail.status] || "bg-gray-100 text-gray-700"}>
              {STATUS_LABELS[detail.status]}
            </Badge>
            <span className="text-xs text-gray-500">{totalQuestions} câu hỏi</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button size="sm" onClick={openAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm câu hỏi
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Đang xuất..." : "Xuất CSV"}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {detail.topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FolderOpen className="mb-3 h-10 w-10" />
            <p className="text-sm">Bộ câu hỏi chưa có nội dung.</p>
            <Button size="sm" className="mt-4" onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm câu hỏi
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {detail.topics.map((topic) => (
              <div key={topic.id} className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-mono text-xs text-gray-400">{topic.code}</span>
                  <h2 className="text-sm font-semibold text-gray-900">{topic.name}</h2>
                </div>

                {topic.sub_topics.length === 0 ? (
                  <p className="pl-6 text-xs text-gray-400">Chưa có chủ đề con</p>
                ) : (
                  <div className="space-y-4 pl-4">
                    {topic.sub_topics.map((st) => (
                      <div key={st.id}>
                        <div className="mb-2 flex items-center gap-2">
                          <Folder className="h-3.5 w-3.5 text-gray-500" />
                          <span className="font-mono text-[10px] text-gray-400">{st.code}</span>
                          <h3 className="text-sm font-medium text-gray-800">{st.name}</h3>
                        </div>

                        {st.questions.length === 0 ? (
                          <p className="pl-6 text-xs text-gray-400">Chưa có câu hỏi</p>
                        ) : (
                          <div className="space-y-3 pl-4">
                            {st.questions.map((q) => (
                              <div key={q.id} className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                                <div className="flex flex-wrap items-start gap-2">
                                  <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                      <span className="font-mono text-[10px] text-gray-400">{q.code}</span>
                                      <Badge className={`text-[10px] h-4 px-1.5 ${STATUS_BADGE_CLASS[q.status] || ""}`}>
                                        {STATUS_LABELS[q.status]}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-gray-800 leading-relaxed">{q.content}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                    title="Xóa khỏi bộ câu hỏi"
                                    disabled={removingQuestionId === q.id}
                                    onClick={() => handleRemoveQuestion(q.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>

                                {q.answers.length > 0 && (
                                  <div className="mt-2 space-y-2 border-t border-gray-100 pt-2 pl-5">
                                    {q.answers.map((a) => (
                                      <div key={a.id} className="flex gap-2">
                                        <MessagesSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                                        <div className="min-w-0 flex-1">
                                          <div className="mb-0.5 flex flex-wrap items-center gap-2">
                                            <Badge className={`text-[10px] h-4 px-1.5 ${STATUS_BADGE_CLASS[a.status] || ""}`}>
                                              {STATUS_LABELS[a.status]}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400">
                                              {campusLabel(a.campus_names, a.applies_to_all_campuses)}
                                            </span>
                                            {a.version > 0 && (
                                              <span className="text-[10px] font-mono text-gray-400">v{a.version}</span>
                                            )}
                                          </div>
                                          <p className="text-xs text-gray-700 leading-relaxed">{a.content}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {q.answers.length === 0 && (
                                  <p className="mt-2 pl-5 text-xs text-gray-400 italic">Chưa có câu trả lời</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="mt-4 last:hidden" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Question Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-4xl flex flex-col gap-0">
          <DialogHeader>
            <DialogTitle>Thêm Câu Hỏi Vào Bộ</DialogTitle>
            <DialogDescription>
              Chọn chủ đề chính, chủ đề con, rồi thêm câu hỏi đã duyệt vào bộ câu hỏi.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-6 py-4 items-start">
            {/* Cột trái: lọc chủ đề */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Chủ Đề Chính *</Label>
                <Select
                  value={addForm.topic_id || undefined}
                  onValueChange={(v) => setAddForm({ topic_id: v, sub_topic_id: "" })}
                >
                  <SelectTrigger><SelectValue placeholder="Chọn chủ đề chính" /></SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Chủ Đề Con *</Label>
                <Select
                  value={addForm.sub_topic_id || undefined}
                  onValueChange={(v) => setAddForm({ ...addForm, sub_topic_id: v })}
                  disabled={!addForm.topic_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={addForm.topic_id ? "Chọn chủ đề con" : "Chọn chủ đề chính trước"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dialogSubTopics.map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cột phải: danh sách câu hỏi */}
            <div className="flex flex-col min-h-0 min-w-0 border-l-0 sm:border-l sm:pl-6">
              <div className="mb-2 flex items-center justify-between gap-2">
                <Label>Câu Hỏi Đã Duyệt</Label>
                {addForm.sub_topic_id && !isLoadingQuestions && (
                  <span className="text-xs text-gray-400">{availableQuestions.length} khả dụng</span>
                )}
              </div>
              <div className="h-[400px] overflow-y-auto rounded-md border">
                {!addForm.sub_topic_id ? (
                  <p className="flex h-full items-center justify-center text-center text-sm text-gray-400 px-4">
                    Chọn chủ đề con để xem danh sách câu hỏi
                  </p>
                ) : isLoadingQuestions ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : availableQuestions.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-center text-sm text-gray-400 px-4">
                    {subTopicQuestions.length === 0
                      ? "Không có câu hỏi đã duyệt trong chủ đề con này"
                      : "Tất cả câu hỏi đã có trong bộ câu hỏi"}
                  </p>
                ) : (
                  <div className="divide-y">
                    {availableQuestions.map((q) => (
                      <div key={q.id} className="flex items-start gap-3 px-3 py-3.5 hover:bg-gray-50 min-h-[72px]">
                        <div className="min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-gray-400 break-all">{q.code}</span>
                          <p className="text-sm text-gray-800 leading-relaxed mt-0.5">{q.content}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 h-7 text-xs"
                          disabled={addingQuestionId === q.id}
                          onClick={() => handleAddQuestion(q)}
                        >
                          {addingQuestionId === q.id ? "Đang thêm..." : "+ Thêm"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
