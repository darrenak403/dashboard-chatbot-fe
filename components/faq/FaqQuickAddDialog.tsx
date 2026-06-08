"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  faqQuestionsService,
  FaqTopic,
  FaqSubTopic,
  FaqQuickAddQuestionInput,
  FAQ_QUICK_ADD_ERROR,
  parseQuickAddRawText,
  buildQuickAddStructuredPayload,
  splitQuickAddCsvField,
} from "@/lib/faq";
import { Campus } from "@/lib/auth";

interface FaqQuickAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topics: FaqTopic[];
  subTopics: FaqSubTopic[];
  campuses: Campus[];
  onSuccess: () => void;
  defaultTopicId?: string;
  defaultSubTopicId?: string;
}

const EMPTY_FORM = {
  topic_id: "",
  sub_topic_id: "",
  raw_text: "",
  apply_all_campuses: true,
};

export default function FaqQuickAddDialog({
  open,
  onOpenChange,
  topics,
  subTopics,
  campuses,
  onSuccess,
  defaultTopicId = "",
  defaultSubTopicId = "",
}: FaqQuickAddDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [defaultCampusIds, setDefaultCampusIds] = useState<string[]>([]);
  const [preview, setPreview] = useState<FaqQuickAddQuestionInput[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogSubTopics = form.topic_id
    ? subTopics.filter((st) => st.topic_id === form.topic_id)
    : [];

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY_FORM,
      topic_id: defaultTopicId,
      sub_topic_id: defaultSubTopicId,
    });
    setDefaultCampusIds([]);
    setPreview(null);
  }, [open, defaultTopicId, defaultSubTopicId]);

  const previewStats = useMemo(() => {
    if (!preview) return null;
    return {
      questions: preview.length,
      answers: preview.reduce((sum, q) => sum + q.answers.length, 0),
    };
  }, [preview]);

  const toggleDefaultCampus = (campusId: string) => {
    setDefaultCampusIds((prev) =>
      prev.includes(campusId) ? prev.filter((id) => id !== campusId) : [...prev, campusId]
    );
  };

  const toggleAnswerCampus = (qIdx: number, aIdx: number, campusId: string) => {
    if (!preview) return;
    setPreview((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const answer = next[qIdx].answers[aIdx];
      const ids = answer.campus_ids ?? [];
      answer.campus_ids = ids.includes(campusId)
        ? ids.filter((id) => id !== campusId)
        : [...ids, campusId];
      return next;
    });
  };

  const updatePreviewAnswerField = (
    qIdx: number,
    aIdx: number,
    field: "content" | "tags" | "keywords" | "synonyms",
    value: string
  ) => {
    if (!preview) return;
    setPreview((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      const answer = next[qIdx].answers[aIdx];
      if (field === "content") {
        answer.content = value;
      } else {
        answer[field] = splitQuickAddCsvField(value);
      }
      return next;
    });
  };

  const handlePreview = () => {
    if (!form.raw_text.trim()) {
      toast.error("Vui lòng nhập nội dung câu hỏi và câu trả lời");
      return;
    }
    const parsed = parseQuickAddRawText(form.raw_text);
    if (parsed.length === 0) {
      toast.warning("Không nhận diện được cấu trúc. Bạn vẫn có thể tạo bằng raw text.");
      setPreview(null);
      return;
    }
    setPreview(parsed);
  };

  const handleSubmit = async () => {
    if (!form.topic_id) {
      toast.error("Vui lòng chọn chủ đề chính");
      return;
    }
    if (!form.sub_topic_id) {
      toast.error("Vui lòng chọn chủ đề con");
      return;
    }
    if (!form.raw_text.trim()) {
      toast.error("Vui lòng nhập nội dung");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = preview?.length
        ? buildQuickAddStructuredPayload(
            form.topic_id,
            form.sub_topic_id,
            form.apply_all_campuses,
            defaultCampusIds,
            preview
          )
        : {
            topic_id: form.topic_id,
            sub_topic_id: form.sub_topic_id,
            apply_all_campuses: form.apply_all_campuses,
            raw_text: form.raw_text,
          };

      const res = await faqQuestionsService.quickAdd(payload);
      toast.success(
        `Đã tạo ${res.meta.question_count} câu hỏi và ${res.meta.answer_count} câu trả lời`
      );
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error(FAQ_QUICK_ADD_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col gap-0">
        <DialogHeader>
          <DialogTitle>Add Nhanh Câu Hỏi & Câu Trả Lời</DialogTitle>
          <DialogDescription>
            Chọn chủ đề, paste nhiều câu hỏi/câu trả lời theo định dạng Câu 1:, Trả lời 1:.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4 overflow-y-auto flex-1 min-h-0 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chủ Đề Chính *</Label>
              <Select
                value={form.topic_id || undefined}
                onValueChange={(v) => setForm({ ...form, topic_id: v, sub_topic_id: "" })}
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
                value={form.sub_topic_id || undefined}
                onValueChange={(v) => setForm({ ...form, sub_topic_id: v })}
                disabled={!form.topic_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder={form.topic_id ? "Chọn chủ đề con" : "Chọn chủ đề chính trước"} />
                </SelectTrigger>
                <SelectContent>
                  {dialogSubTopics.map((st) => <SelectItem key={st.id} value={st.id}>{st.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.apply_all_campuses}
                onChange={(e) => {
                  setForm({ ...form, apply_all_campuses: e.target.checked });
                  if (e.target.checked) setDefaultCampusIds([]);
                }}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium">Áp dụng tất cả cơ sở cho tất cả câu trả lời</span>
            </label>
          </div>

          {!form.apply_all_campuses && (
            <div className="space-y-2">
              <Label>Cơ Sở Mặc Định</Label>
              <p className="text-xs text-gray-400">Áp dụng cho câu trả lời không chỉnh cơ sở riêng.</p>
              <div className="rounded-md border p-2 max-h-36 overflow-y-auto space-y-1">
                {campuses.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={defaultCampusIds.includes(c.id)}
                      onChange={() => toggleDefaultCampus(c.id)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm flex-1">{c.name}</span>
                    <Badge variant="outline" className="text-xs">{c.code}</Badge>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Nội Dung Paste *</Label>
            <Textarea
              value={form.raw_text}
              onChange={(e) => {
                setForm({ ...form, raw_text: e.target.value });
                setPreview(null);
              }}
              placeholder={`Câu 1: Điều kiện nhận học bổng là gì?\nTrả lời 1: Thí sinh cần đạt điểm...\nTrả lời 2: Ngoài ra cần có chứng chỉ...`}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={handlePreview}>
                Xem trước
              </Button>
            </div>
          </div>

          {preview && previewStats && (
            <div className="space-y-3 rounded-lg border bg-gray-50/50 p-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Xem trước</span>
                <Badge variant="secondary">{previewStats.questions} câu hỏi</Badge>
                <Badge variant="secondary">{previewStats.answers} câu trả lời</Badge>
              </div>
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {preview.map((q, qIdx) => (
                  <div key={qIdx} className="rounded-md border bg-white p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-500">Câu hỏi {qIdx + 1}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{q.content}</p>
                    {q.answers.map((a, aIdx) => (
                      <div key={aIdx} className="ml-2 border-l-2 border-blue-100 pl-3 space-y-2">
                        <Label className="text-xs text-gray-500">Trả lời {aIdx + 1}</Label>
                        <Textarea
                          value={a.content}
                          onChange={(e) => updatePreviewAnswerField(qIdx, aIdx, "content", e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={(a.tags || []).join(", ")}
                            onChange={(e) => updatePreviewAnswerField(qIdx, aIdx, "tags", e.target.value)}
                            placeholder="Tags"
                            className="h-8 text-xs"
                          />
                          <Input
                            value={(a.keywords || []).join(", ")}
                            onChange={(e) => updatePreviewAnswerField(qIdx, aIdx, "keywords", e.target.value)}
                            placeholder="Từ khóa"
                            className="h-8 text-xs"
                          />
                          <Input
                            value={(a.synonyms || []).join(", ")}
                            onChange={(e) => updatePreviewAnswerField(qIdx, aIdx, "synonyms", e.target.value)}
                            placeholder="Từ đồng nghĩa"
                            className="h-8 text-xs"
                          />
                        </div>
                        {!form.apply_all_campuses && (
                          <div className="flex flex-wrap gap-2">
                            {campuses.map((c) => (
                              <label key={c.id} className="inline-flex items-center gap-1 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={(a.campus_ids ?? []).includes(c.id)}
                                  onChange={() => toggleAnswerCampus(qIdx, aIdx, c.id)}
                                  className="h-3.5 w-3.5 rounded border-gray-300"
                                />
                                {c.code}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang tạo..." : "Tạo nhanh"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
