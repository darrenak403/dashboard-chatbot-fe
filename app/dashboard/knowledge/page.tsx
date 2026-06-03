"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
  BookOpen,
  Upload,
  RefreshCw,
  Trash2,
  FileText,
  Search,
  AlertCircle,
} from "lucide-react";
import { authService, KnowledgeDocument } from "@/lib/auth";

export default function KnowledgePage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Upload states
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingDocument, setDeletingDocument] =
    useState<KnowledgeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setError("");

      const documentsResponse = await authService.getDocuments();

      // Đảm bảo documentsResponse là array
      setDocuments(Array.isArray(documentsResponse) ? documentsResponse : []);
    } catch (error) {
      console.error("Knowledge API Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Không thể tải dữ liệu";
      setError(errorMessage);
      toast.error("Lỗi tải dữ liệu", {
        description: errorMessage,
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchData();
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
      toast.success("Làm mới thành công!", {
        description: "Dữ liệu đã được cập nhật.",
      });
    } catch (error) {
      // Error already handled in fetchData
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [".md", ".pdf", ".docx", ".txt", ".json"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowedTypes.includes(fileExtension)) {
        const errorMessage = `Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(
          ", "
        )}`;
        setError(errorMessage);
        toast.error("File không hợp lệ", {
          description: errorMessage,
        });
        return;
      }

      // Check file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        const errorMessage = "File quá lớn. Kích thước tối đa là 50MB.";
        setError(errorMessage);
        toast.error("File quá lớn", {
          description: errorMessage,
        });
        return;
      }

      setSelectedFile(file);
      setError("");
      toast.success("File hợp lệ", {
        description: `Đã chọn file: ${file.name}`,
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError("");

    try {
      await authService.uploadDocument(selectedFile);

      // Success notification
      toast.success("Tải lên thành công!", {
        description: `Tài liệu "${selectedFile.name}" đã được tải lên thành công.`,
      });

      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Tải lên thất bại";
      setError(errorMessage);
      toast.error("Lỗi tải lên", {
        description: errorMessage,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = (document: KnowledgeDocument) => {
    setDeletingDocument(document);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingDocument || !deletingDocument.path) return;

    setIsDeleting(true);
    setError("");

    try {
      await authService.deleteDocument(deletingDocument.path);

      // Success notification
      toast.success("Xóa thành công!", {
        description: `Tài liệu "${deletingDocument.path}" đã được xóa thành công.`,
      });

      setIsDeleteDialogOpen(false);
      setDeletingDocument(null);
      await fetchData();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Xóa thất bại";
      setError(errorMessage);
      toast.error("Lỗi xóa tài liệu", {
        description: errorMessage,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredDocuments = useMemo(() => {
    if (!Array.isArray(documents)) return [];

    if (!searchTerm.trim()) return documents;

    return documents.filter(
      (doc) =>
        doc.path &&
        typeof doc.path === "string" &&
        doc.path.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [documents, searchTerm]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-600" />;
      case "docx":
        return <FileText className="h-4 w-4 text-blue-600" />;
      case "md":
        return <FileText className="h-4 w-4 text-green-600" />;
      case "txt":
        return <FileText className="h-4 w-4 text-gray-600" />;
      case "json":
        return <FileText className="h-4 w-4 text-yellow-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-8 w-8 mr-3 text-blue-600" />
              Quản Lý Tài liệu
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý tài liệu và cơ sở kiến thức của trường
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Làm Mới
            </Button>

            <Button size="sm" onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Tải Lên Tài Liệu
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng Số Tài Liệu
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Array.isArray(documents) ? documents.length : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm Kiếm Tài Liệu</CardTitle>
            <CardDescription>Tìm kiếm theo tên file</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Tài Liệu</CardTitle>
            <CardDescription>
              Quản lý các tài liệu trong cơ sở kiến thức
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên File</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Kích Thước</TableHead>
                    <TableHead>Trạng Thái</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    // Loading skeleton
                    Array.from({ length: 3 }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </TableCell>
                        <TableCell>
                          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse ml-auto"></div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : filteredDocuments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm
                          ? "Không tìm thấy tài liệu nào phù hợp với tìm kiếm của bạn."
                          : "Chưa có tài liệu nào được tải lên."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocuments.map((document, index) => (
                      <TableRow key={document.path || `doc-${index}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {getFileIcon(document.path || "")}
                            <span>{document.path || "Không xác định"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {document.path?.split(".").pop()?.toUpperCase() ||
                              "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(document.size)}</TableCell>
                        <TableCell>
                          {document.exists ? "Có sẵn" : "Không có"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDocument(document)}
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
          </CardContent>
        </Card>

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tải Lên Tài Liệu</DialogTitle>
              <DialogDescription>
                Chọn file để tải lên cơ sở kiến thức. Hỗ trợ: .md, .pdf, .docx,
                .txt, .json
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="file" className="text-right">
                  File *
                </Label>
                <div className="col-span-3">
                  <Input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept=".md,.pdf,.docx,.txt,.json"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                  />
                  {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Đã chọn: {selectedFile.name} (
                      {formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Hủy
              </Button>
              <Button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? "Đang tải lên..." : "Tải Lên"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này sẽ xóa tài liệu "
                {deletingDocument?.path || "Không xác định"}". Hành động này
                không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
