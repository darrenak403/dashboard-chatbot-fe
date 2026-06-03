"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  GraduationCap,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Clock,
  Building2,
  Filter,
} from "lucide-react";
import {
  authService,
  Program,
  Department,
  CreateProgramRequest,
  UpdateProgramRequest,
} from "@/lib/auth";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
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
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [deletingProgram, setDeletingProgram] = useState<Program | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    name_en: "",
    department_id: "",
    duration_years: 1,
  });

  const router = useRouter();

  const fetchPrograms = async (
    page: number = 1,
    limit: number = 10,
    departmentCode?: string
  ) => {
    try {
      setError("");
      const offset = (page - 1) * limit;
      const response = await authService.getPrograms(
        limit,
        offset,
        departmentCode
      );

      setPrograms(response.data);
      setMeta(response.meta);
      setTotalPages(Math.ceil(response.meta.total / limit));
      setCurrentPage(page);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Không thể tải danh sách chương trình"
      );
      if (error instanceof Error && error.message.includes("Authentication")) {
        authService.logout();
        router.push("/login");
      }
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await authService.getDepartments(100, 0);
      setDepartments(response.data);
    } catch (error) {
      console.error("Không thể tải danh sách khoa:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchPrograms(), fetchDepartments()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const departmentCode =
      filterDepartment !== "all" ? filterDepartment : undefined;
    await fetchPrograms(currentPage, meta.limit, departmentCode);
    setIsRefreshing(false);
  };

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setIsLoading(true);
      const departmentCode =
        filterDepartment !== "all" ? filterDepartment : undefined;
      await fetchPrograms(page, meta.limit, departmentCode);
      setIsLoading(false);
    }
  };

  const handleDepartmentFilter = async (value: string) => {
    setFilterDepartment(value);
    setCurrentPage(1);
    setIsLoading(true);
    const departmentCode = value !== "all" ? value : undefined;
    await fetchPrograms(1, meta.limit, departmentCode);
    setIsLoading(false);
  };

  // Form handlers
  const handleAddProgram = () => {
    setEditingProgram(null);
    setFormData({
      code: "",
      name: "",
      name_en: "",
      department_id: "",
      duration_years: 1,
    });
    setIsDialogOpen(true);
  };

  const handleEditProgram = (program: Program) => {
    setEditingProgram(program);
    setFormData({
      code: program.code,
      name: program.name,
      name_en: program.name_en,
      department_id: program.department_id,
      duration_years: program.duration_years,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteProgram = (program: Program) => {
    setDeletingProgram(program);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingProgram) {
        // Update existing program
        await authService.updateProgram(editingProgram.id, formData);
      } else {
        // Create new program
        await authService.createProgram(formData);
      }

      setIsDialogOpen(false);
      const departmentCode =
        filterDepartment !== "all" ? filterDepartment : undefined;
      await fetchPrograms(currentPage, meta.limit, departmentCode);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProgram) return;

    setIsSubmitting(true);
    setError("");

    try {
      await authService.deleteProgram(deletingProgram.id);
      setIsDeleteDialogOpen(false);
      setDeletingProgram(null);
      const departmentCode =
        filterDepartment !== "all" ? filterDepartment : undefined;
      await fetchPrograms(currentPage, meta.limit, departmentCode);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Xóa thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPrograms = programs.filter(
    (program) =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.department.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && programs.length === 0) {
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
              <GraduationCap className="h-8 w-8 mr-3 text-green-600" />
              Chương Trình
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý các chương trình học thuật
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
            <Button size="sm" onClick={handleAddProgram}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Chương Trình
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
                Tổng Số Chương Trình
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle>Tìm Kiếm và Lọc Chương Trình</CardTitle>
            <CardDescription>
              Tìm kiếm theo tên chương trình, mã hoặc khoa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm chương trình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select
                  value={filterDepartment}
                  onValueChange={handleDepartmentFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất Cả Chương Trình</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.code} value={dept.code}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Programs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh Sách Chương Trình</CardTitle>
            <CardDescription>
              {filteredPrograms.length} trong số {programs.length} chương trình
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
                    <TableHead>Khoa</TableHead>
                    <TableHead>Thời Gian</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrograms.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-gray-500"
                      >
                        {searchTerm
                          ? "Không tìm thấy chương trình nào phù hợp với tìm kiếm của bạn."
                          : "Không có chương trình nào."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPrograms.map((program) => (
                      <TableRow key={program.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {program.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {program.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {program.name_en}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            <span>{program.department.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {program.department.code}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{program.duration_years} năm</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProgram(program)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteProgram(program)}
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

        {/* Add/Edit Program Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingProgram
                  ? "Chỉnh Sửa Chương Trình"
                  : "Thêm Chương Trình Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingProgram
                  ? "Cập nhật thông tin chương trình bên dưới."
                  : "Điền thông tin chi tiết để tạo chương trình mới."}
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
                    placeholder="ví dụ: CS101, MBA"
                    maxLength={20}
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
                    placeholder="Tên chương trình"
                    maxLength={255}
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
                    maxLength={255}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department_id" className="text-right">
                    Khoa *
                  </Label>
                  <Select
                    value={formData.department_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, department_id: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Chọn khoa" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} ({dept.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="duration_years" className="text-right">
                    Thời Gian (Năm) *
                  </Label>
                  <Input
                    id="duration_years"
                    type="number"
                    min="1"
                    max="6"
                    value={formData.duration_years}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration_years: parseInt(e.target.value),
                      })
                    }
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingProgram
                    ? "Cập nhật"
                    : "Tạo"}{" "}
                  Chương Trình
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
              <AlertDialogTitle>Bạn có chắc chắn?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này sẽ xóa chương trình "{deletingProgram?.name}".
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isSubmitting ? "Đang xóa..." : "Xóa"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
