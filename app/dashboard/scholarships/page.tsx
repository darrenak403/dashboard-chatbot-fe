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
  Award,
  Search,
  RefreshCw,
  Plus,
  Edit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Percent,
  CheckCircle,
  XCircle,
  Trash2,
} from "lucide-react";

import { authService, Scholarship, ScholarshipResponse } from "@/lib/auth";
import { ScholarshipDialog } from "@/components/scholarships";
import { useRouter } from "next/navigation";

export default function ScholarshipsPage() {
  const router = useRouter();

  // State management
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [scholarshipMeta, setScholarshipMeta] = useState<
    ScholarshipResponse["meta"] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingScholarship, setEditingScholarship] =
    useState<Scholarship | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch scholarships
  const fetchScholarships = useCallback(async () => {
    try {
      setError(null);
      const params = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        year: selectedYear,
        ...(selectedType !== "all" && { type: selectedType }),
      };

      const response = await authService.getScholarships(params);
      setScholarships(response.data);
      setScholarshipMeta(response.meta);
    } catch (error) {
      console.error("Error fetching scholarships:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể tải danh sách học bổng");
      }
      setScholarships([]);
      setScholarshipMeta(null);
    }
  }, [currentPage, pageSize, selectedYear, selectedType]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchScholarships();
    setIsRefreshing(false);
  }, [fetchScholarships]);

  // Filter scholarships by search term and active status
  const filteredScholarships = useMemo(() => {
    // First filter out inactive scholarships
    const activeScholarships = scholarships.filter(
      (scholarship) => scholarship.is_active
    );

    // Then apply search filter
    if (!searchTerm) return activeScholarships;

    return activeScholarships.filter(
      (scholarship) =>
        scholarship.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scholarship.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scholarship.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [scholarships, searchTerm]);

  // Get unique scholarship types for filter (only from active scholarships)
  const scholarshipTypes = useMemo(() => {
    const activeScholarships = scholarships.filter(
      (scholarship) => scholarship.is_active
    );
    const typeSet = new Set(activeScholarships.map((s) => s.type));
    const types = Array.from(typeSet);
    return types.filter(Boolean);
  }, [scholarships]);

  // Format percentage
  const formatPercentage = (percentage: number | null) => {
    if (percentage === null) return "N/A";
    return `${percentage}%`;
  };

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

  // CRUD handlers
  const handleCreateScholarship = useCallback(
    async (data: {
      code: string;
      name: string;
      type: string;
      recipients: number;
      percentage: number | null;
      requirements: string;
      year: number;
      notes: string;
    }) => {
      try {
        setIsSubmitting(true);
        await authService.createScholarship(data);
        setIsCreateDialogOpen(false);
        await fetchScholarships();
      } catch (error) {
        console.error("Error creating scholarship:", error);
        if (error instanceof Error) {
          handleAuthError(error);
        } else {
          setError("Không thể tạo học bổng");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchScholarships]
  );

  const handleEditScholarship = useCallback((scholarship: Scholarship) => {
    setEditingScholarship(scholarship);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateScholarship = useCallback(
    async (data: {
      code: string;
      name: string;
      type: string;
      recipients: number;
      percentage: number | null;
      requirements: string;
      year: number;
      notes: string;
      is_active?: boolean;
    }) => {
      if (!editingScholarship) return;

      try {
        setIsSubmitting(true);
        await authService.updateScholarship(editingScholarship.id, data);
        setIsEditDialogOpen(false);
        setEditingScholarship(null);
        await fetchScholarships();
      } catch (error) {
        console.error("Error updating scholarship:", error);
        if (error instanceof Error) {
          handleAuthError(error);
        } else {
          setError("Không thể cập nhật học bổng");
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingScholarship, fetchScholarships]
  );

  const handleDeleteScholarship = useCallback(
    async (id: string, name: string) => {
      if (!confirm(`Bạn có chắc chắn muốn xóa học bổng "${name}"?`)) {
        return;
      }

      try {
        await authService.deleteScholarship(id);
        await fetchScholarships();
      } catch (error) {
        console.error("Error deleting scholarship:", error);
        if (error instanceof Error) {
          handleAuthError(error);
        } else {
          setError("Không thể xóa học bổng");
        }
      }
    },
    [fetchScholarships]
  );

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchScholarships();
      setIsLoading(false);
    };

    loadData();
  }, [fetchScholarships]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedType, selectedYear, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Đang tải danh sách học bổng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản Lý Học Bổng
              </h1>
              <p className="text-gray-600">
                Quản lý thông tin học bổng và chương trình hỗ trợ sinh viên
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
              Thêm học bổng
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Học Bổng</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scholarshipMeta?.total || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Học Bổng Hoạt Động
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scholarships.filter((s) => s.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Suất</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {scholarships.reduce((sum, s) => sum + s.recipients, 0)}
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
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tìm Kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm theo tên, mã, loại..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Loại Học Bổng
              </label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {scholarshipTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Scholarships Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Học Bổng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên Học Bổng</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Suất</TableHead>
                  <TableHead>Tỷ Lệ</TableHead>
                  <TableHead>Năm</TableHead>
                  <TableHead>Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScholarships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Award className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">Không có học bổng nào</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScholarships.map((scholarship) => (
                    <TableRow key={scholarship.id}>
                      <TableCell className="font-medium">
                        {scholarship.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{scholarship.name}</div>
                          {scholarship.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">
                              {scholarship.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{scholarship.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{scholarship.recipients}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Percent className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatPercentage(scholarship.percentage)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{scholarship.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditScholarship(scholarship)}
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                            title="Chỉnh sửa"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="hidden sm:inline ml-2">Sửa</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleDeleteScholarship(
                                scholarship.id,
                                scholarship.name
                              )
                            }
                            className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3 text-red-600 hover:text-red-700"
                            title="Xóa"
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
          {scholarshipMeta && scholarshipMeta.total > pageSize && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Hiển thị {scholarshipMeta.offset + 1} đến{" "}
                {Math.min(
                  scholarshipMeta.offset + scholarshipMeta.limit,
                  scholarshipMeta.total
                )}{" "}
                trong {scholarshipMeta.total} kết quả
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!scholarshipMeta.has_prev}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Trước</span>
                </Button>
                <span className="text-sm px-2">
                  {currentPage} / {Math.ceil(scholarshipMeta.total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!scholarshipMeta.has_next}
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

      {/* Create Scholarship Dialog */}
      <ScholarshipDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateScholarship}
        isSubmitting={isSubmitting}
        title="Thêm Học Bổng Mới"
        submitText="Tạo Học Bổng"
      />

      {/* Edit Scholarship Dialog */}
      <ScholarshipDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={handleUpdateScholarship}
        isSubmitting={isSubmitting}
        title="Chỉnh Sửa Học Bổng"
        submitText="Cập Nhật"
        initialData={editingScholarship}
      />
    </div>
  );
}
