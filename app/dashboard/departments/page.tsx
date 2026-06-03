"use client";

import { useState, useEffect } from "react";
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
  Building2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";
import {
  authService,
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
} from "@/lib/auth";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [meta, setMeta] = useState({
    total: 0,
    limit: 10,
    offset: 0,
    has_next: false,
    has_prev: false,
  });

  // Form states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null
  );
  const [deletingDepartment, setDeletingDepartment] =
    useState<Department | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_en: "",
    description: "",
  });

  const router = useRouter();

  const fetchDepartments = async (page: number = 1, limit: number = 10) => {
    try {
      setError("");
      const offset = (page - 1) * limit;
      const response = await authService.getDepartments(limit, offset);

      setDepartments(response.data);
      setMeta(response.meta);
      setTotalPages(Math.ceil(response.meta.total / limit));
      setCurrentPage(page);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải danh sách khoa"
      );
      if (error instanceof Error && error.message.includes("Authentication")) {
        authService.logout();
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    const loadDepartments = async () => {
      setIsLoading(true);
      await fetchDepartments();
      setIsLoading(false);
    };

    loadDepartments();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDepartments(currentPage, meta.limit);
    setIsRefreshing(false);
  };

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setIsLoading(true);
      await fetchDepartments(page, meta.limit);
      setIsLoading(false);
    }
  };

  // Form handlers
  const handleAddDepartment = () => {
    setEditingDepartment(null);
    setFormData({
      code: "",
      name: "",
      name_en: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
      name_en: department.name_en,
      description: department.description,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteDepartment = (department: Department) => {
    setDeletingDepartment(department);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingDepartment) {
        // Update existing department
        await authService.updateDepartment(editingDepartment.id, formData);
      } else {
        // Create new department
        await authService.createDepartment(formData);
      }

      setIsDialogOpen(false);
      await fetchDepartments(currentPage, meta.limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDepartment) return;

    setIsSubmitting(true);
    setError("");

    try {
      // First check if department has any programs
      const programsResponse = await fetch(
        `https://core-tuyensinh-production.up.railway.app/api/v1/programs?department_code=${deletingDepartment.code}&limit=1&offset=0`
      );

      if (programsResponse.ok) {
        const programsData = await programsResponse.json();

        if (programsData.data && programsData.data.length > 0) {
          // Department has programs, show error
          const programCount =
            programsData.meta?.total || programsData.data.length;
          const errorMessage = `Không thể xóa khoa "${deletingDepartment.name}" vì đang có ${programCount} chương trình thuộc khoa này. Vui lòng xóa hoặc chuyển các chương trình sang khoa khác trước khi xóa khoa.`;

          setError(errorMessage);
          toast.error("Không thể xóa khoa", {
            description: `Khoa "${deletingDepartment.name}" đang được sử dụng bởi ${programCount} chương trình.`,
            duration: 6000,
          });
          setIsSubmitting(false);
          return;
        }
      }

      // If no programs found, proceed with deletion
      await authService.deleteDepartment(deletingDepartment.id);
      setIsDeleteDialogOpen(false);
      setDeletingDepartment(null);
      await fetchDepartments(currentPage, meta.limit);

      // Show success message
      setError("");
      toast.success("Xóa khoa thành công", {
        description: `Khoa "${deletingDepartment.name}" đã được xóa khỏi hệ thống.`,
        duration: 3000,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Xóa thất bại";

      // Check if error is related to foreign key constraint
      if (
        errorMessage.includes("foreign key") ||
        errorMessage.includes("constraint") ||
        errorMessage.includes("referenced")
      ) {
        const constraintError = `Không thể xóa khoa "${deletingDepartment.name}" vì đang được sử dụng bởi các chương trình khác. Vui lòng xóa hoặc chuyển các chương trình sang khoa khác trước khi xóa khoa.`;
        setError(constraintError);
        toast.error("Lỗi ràng buộc dữ liệu", {
          description: `Khoa "${deletingDepartment.name}" đang được tham chiếu bởi dữ liệu khác.`,
          duration: 6000,
        });
      } else {
        setError(errorMessage);
        toast.error("Lỗi xóa khoa", {
          description: errorMessage,
          duration: 4000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.name_en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && departments.length === 0) {
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
              <Building2 className="h-8 w-8 mr-3 text-blue-600" />
              Khoa
            </h1>
            <p className="text-gray-600 mt-1">Quản lý các khoa học thuật</p>
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
            <Button size="sm" onClick={handleAddDepartment}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Khoa
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng Số Khoa
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{meta.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Trang Hiện Tại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentPage}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng Số Trang
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPages}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm Kiếm Khoa</CardTitle>
            <CardDescription>
              Tìm kiếm theo tên khoa, mã khoa hoặc tên tiếng Anh
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm khoa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Departments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Khoa</CardTitle>
            <CardDescription>
              {filteredDepartments.length} trong số {departments.length} khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Tên Tiếng Anh</TableHead>
                    <TableHead>Mô Tả</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepartments.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm
                          ? "Không tìm thấy khoa nào phù hợp với tìm kiếm của bạn."
                          : "Không có khoa nào."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDepartments.map((department) => (
                      <TableRow key={department.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {department.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {department.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {department.name_en}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {department.description}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditDepartment(department)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDepartment(department)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Hiển thị {meta.offset + 1} đến{" "}
                  {Math.min(meta.offset + meta.limit, meta.total)} trong{" "}
                  {meta.total} kết quả
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!meta.has_prev || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          disabled={isLoading}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!meta.has_next || isLoading}
                  >
                    Tiếp
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Department Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? "Chỉnh Sửa Khoa" : "Thêm Khoa Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? "Cập nhật thông tin khoa bên dưới."
                  : "Điền thông tin chi tiết để tạo khoa mới."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="code" className="text-right">
                    Mã *
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="ví dụ: CS, ENG"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Tên *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Tên khoa"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name_en" className="text-right">
                    Tên Tiếng Anh
                  </Label>
                  <Input
                    id="name_en"
                    value={formData.name_en}
                    onChange={(e) =>
                      setFormData({ ...formData, name_en: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Tên tiếng Anh"
                    maxLength={100}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Mô Tả
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Mô tả khoa"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingDepartment
                    ? "Cập nhật"
                    : "Tạo"}{" "}
                  Khoa
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center space-x-2">
                <span className="text-red-600">⚠️</span>
                <span>Xác nhận xóa khoa</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Bạn có chắc chắn muốn xóa khoa{" "}
                  <strong>"{deletingDepartment?.name}"</strong>?
                </p>
                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>Lưu ý:</strong> Hệ thống sẽ kiểm tra xem khoa này có
                    đang được sử dụng bởi các chương trình hay không. Nếu có,
                    việc xóa sẽ bị từ chối.
                  </p>
                </div>
                <p className="text-gray-600 text-sm">
                  Hành động này không thể hoàn tác sau khi thực hiện.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang kiểm tra...</span>
                  </div>
                ) : (
                  "Xác nhận xóa"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
