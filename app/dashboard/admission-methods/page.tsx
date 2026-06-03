"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  ClipboardList,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle,
  XCircle,
  FileText,
  Trash2,
} from "lucide-react";

import {
  authService,
  AdmissionMethod,
  AdmissionMethodResponse,
} from "@/lib/auth";
import { useRouter } from "next/navigation";
import AdmissionMethodDialog, {
  AdmissionMethodFormData,
} from "@/components/admission-methods/admission-method-dialog";
import DeleteConfirmDialog from "@/components/admission-methods/delete-confirm-dialog";

export default function AdmissionMethodsPage() {
  const router = useRouter();

  // State management
  const [admissionMethods, setAdmissionMethods] = useState<AdmissionMethod[]>(
    []
  );
  const [admissionMethodMeta, setAdmissionMethodMeta] = useState<
    AdmissionMethodResponse["meta"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdmissionMethod, setSelectedAdmissionMethod] =
    useState<AdmissionMethod | null>(null);

  // CRUD loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle authentication errors
  const handleAuthError = (error: Error) => {
    if (error.message.includes("Phiên đăng nhập đã hết hạn")) {
      // Clear any stored auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to login
      router.push("/login");
      return;
    }
    // For other errors, just set the error message
    setError(error.message);
  };

  // Fetch admission methods
  const fetchAdmissionMethods = useCallback(async () => {
    try {
      setError(null);

      // Build params object for API call
      const params: any = {};

      if (pageSize > 0) params.limit = pageSize;
      if (currentPage > 1) params.offset = (currentPage - 1) * pageSize;
      if (selectedYear > 0) params.year = selectedYear;

      console.log("Fetching admission methods with params:", params);

      const response = await authService.getAdmissionMethods(
        Object.keys(params).length > 0 ? params : undefined
      );
      setAdmissionMethods(response.data);
      setAdmissionMethodMeta(response.meta);
    } catch (error) {
      console.error("Error fetching admission methods:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể tải danh sách phương thức tuyển sinh");
      }
      setAdmissionMethods([]);
      setAdmissionMethodMeta(null);
    }
  }, [currentPage, pageSize, selectedYear]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchAdmissionMethods();
    setIsRefreshing(false);
  }, [fetchAdmissionMethods]);

  // Filter admission methods by search term and active status
  const filteredAdmissionMethods = useMemo(() => {
    // First filter out inactive admission methods
    const activeAdmissionMethods = admissionMethods.filter(
      (method) => method.is_active
    );

    // Then apply search filter
    if (!searchTerm) return activeAdmissionMethods;

    return activeAdmissionMethods.filter(
      (method) =>
        method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        method.method_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [admissionMethods, searchTerm]);

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchAdmissionMethods();
      setIsLoading(false);
    };

    loadData();
  }, [fetchAdmissionMethods]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, searchTerm]);

  // CRUD Handlers
  const handleCreate = async (data: AdmissionMethodFormData) => {
    setIsCreating(true);
    try {
      await authService.createAdmissionMethod({
        method_code: data.method_code,
        name: data.name,
        requirements: data.requirements || undefined,
        notes: data.notes || undefined,
        year: data.year,
      });
      await fetchAdmissionMethods();
      setError(null);
    } catch (error) {
      console.error("Error creating admission method:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể tạo phương thức tuyển sinh mới");
      }
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (admissionMethod: AdmissionMethod) => {
    setSelectedAdmissionMethod(admissionMethod);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: AdmissionMethodFormData) => {
    if (!selectedAdmissionMethod) return;

    setIsUpdating(true);
    try {
      await authService.updateAdmissionMethod(selectedAdmissionMethod.id, {
        method_code: data.method_code,
        name: data.name,
        requirements: data.requirements || undefined,
        notes: data.notes || undefined,
        year: data.year,
        is_active: data.is_active,
      });
      await fetchAdmissionMethods();
      setError(null);
    } catch (error) {
      console.error("Error updating admission method:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể cập nhật phương thức tuyển sinh");
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (admissionMethod: AdmissionMethod) => {
    setSelectedAdmissionMethod(admissionMethod);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAdmissionMethod) return;

    setIsDeleting(true);
    try {
      await authService.deleteAdmissionMethod(selectedAdmissionMethod.id);
      await fetchAdmissionMethods();
      setError(null);
    } catch (error) {
      console.error("Error deleting admission method:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể xóa phương thức tuyển sinh");
      }
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Đang tải danh sách phương thức tuyển sinh...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản Lý Phương Thức Tuyển Sinh
              </h1>
              <p className="text-gray-600">
                Quản lý các phương thức tuyển sinh và yêu cầu đầu vào
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="hover:bg-blue-50"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              variant="default"
              size="sm"
              className="bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm phương thức
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Phương Thức
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admissionMethodMeta?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang Hoạt Động
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {admissionMethods.filter((m) => m.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Năm Hiện Tại</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedYear}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiển Thị</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAdmissionMethods.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tìm Kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, mã phương thức..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Năm</label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 11 }, (_, i) => 2020 + i).map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Admission Methods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Phương Thức Tuyển Sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên Phương Thức</TableHead>
                  <TableHead>Yêu Cầu</TableHead>
                  <TableHead>Năm</TableHead>
                  <TableHead>Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAdmissionMethods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <ClipboardList className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">
                          Không có phương thức tuyển sinh nào
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAdmissionMethods.map((method) => (
                    <TableRow key={method.id}>
                      <TableCell className="font-medium">
                        {method.method_code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          {method.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {method.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-[300px] truncate"
                          title={method.requirements}
                        >
                          {method.requirements || "Chưa có yêu cầu"}
                        </div>
                      </TableCell>
                      <TableCell>{method.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            title="Chỉnh sửa"
                            onClick={() => handleEdit(method)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Sửa</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Xóa"
                            onClick={() => handleDeleteClick(method)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Xóa</span>
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
          {admissionMethodMeta && admissionMethodMeta.total > pageSize && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Hiển thị {admissionMethodMeta.offset + 1} đến{" "}
                {Math.min(
                  admissionMethodMeta.offset + admissionMethodMeta.limit,
                  admissionMethodMeta.total
                )}{" "}
                trong {admissionMethodMeta.total} kết quả
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!admissionMethodMeta.has_prev}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Trước</span>
                </Button>
                <span className="text-sm px-2">
                  {currentPage} /{" "}
                  {Math.ceil(admissionMethodMeta.total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!admissionMethodMeta.has_next}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <span className="hidden sm:inline mr-2">Sau</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <AdmissionMethodDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreate}
        isLoading={isCreating}
      />

      {/* Edit Dialog */}
      <AdmissionMethodDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        admissionMethod={selectedAdmissionMethod}
        onSave={handleUpdate}
        isLoading={isUpdating}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        admissionMethod={selectedAdmissionMethod}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
