"use client";

import React from "react";
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
  Search,
  BarChart3,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { TuitionFee, TuitionResponse, Program, Campus } from "@/lib/auth";

interface TuitionFeesTabProps {
  tuitionFees: TuitionFee[];
  tuitionMeta: TuitionResponse["meta"] | null;
  programs: Program[];
  campuses: Campus[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedProgramCode: string;
  setSelectedProgramCode: (code: string) => void;
  selectedCampusCode: string;
  setSelectedCampusCode: (code: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  pageSize: number;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onCreateTuition: () => void;
  onEditTuition: (tuition: TuitionFee) => void;
  onDeleteTuition: (id: string, programName: string) => void;
  formatCurrency: (amount: number) => string;
}

const TuitionFeesTab = React.memo(function TuitionFeesTab({
  tuitionFees,
  tuitionMeta,
  programs,
  campuses,
  searchTerm,
  setSearchTerm,
  selectedProgramCode,
  setSelectedProgramCode,
  selectedCampusCode,
  setSelectedCampusCode,
  selectedYear,
  setSelectedYear,
  currentPage,
  setCurrentPage,
  pageSize,
  isRefreshing,
  error,
  onRefresh,
  onCreateTuition,
  onEditTuition,
  onDeleteTuition,
  formatCurrency,
}: TuitionFeesTabProps) {
  const filteredTuitionFees = tuitionFees.filter(
    (fee) =>
      fee.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.program_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.department_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availableYears = [2024, 2025, 2026];

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Bản Ghi</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tuitionMeta?.total || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chương Trình</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{programs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cơ Sở</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campuses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Năm Hiện Tại</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedYear}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc và Tìm Kiếm</CardTitle>
          <CardDescription>
            Lọc học phí theo chương trình, cơ sở và năm học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tìm kiếm chương trình..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="program">Chương trình</Label>
              <Select
                value={selectedProgramCode}
                onValueChange={setSelectedProgramCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả chương trình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chương trình</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.id} value={program.code}>
                      {program.code} - {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="campus">Cơ sở</Label>
              <Select
                value={selectedCampusCode}
                onValueChange={setSelectedCampusCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả cơ sở" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả cơ sở</SelectItem>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.code}>
                      {campus.code} - {campus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Năm học</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tuition Fees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Học Phí</CardTitle>
          <CardDescription>
            Danh sách học phí các chương trình theo cơ sở
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Chương Trình</TableHead>
                  <TableHead>Cơ Sở</TableHead>
                  <TableHead>Khoa</TableHead>
                  <TableHead>Kỳ 1-3</TableHead>
                  <TableHead>Kỳ 4-6</TableHead>
                  <TableHead>Kỳ 7-9</TableHead>
                  <TableHead>Tổng Phí</TableHead>
                  <TableHead>Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTuitionFees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-gray-500"
                    >
                      {searchTerm
                        ? "Không tìm thấy chương trình nào phù hợp với tìm kiếm của bạn."
                        : "Chưa có dữ liệu học phí."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTuitionFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">
                            {fee.program_code}
                          </div>
                          <div className="text-sm text-gray-600">
                            {fee.program_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{fee.campus_code}</div>
                          <div className="text-sm text-gray-600">
                            {fee.campus_city}
                          </div>
                          {fee.campus_discount && fee.campus_discount > 0 && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Giảm {fee.campus_discount}%
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">
                            {fee.department_code}
                          </div>
                          <div className="text-sm text-gray-600">
                            {fee.department_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(fee.semester_group_1_3_fee)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(fee.semester_group_4_6_fee)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(fee.semester_group_7_9_fee)}
                      </TableCell>
                      <TableCell className="font-mono font-bold">
                        {formatCurrency(fee.total_program_fee)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditTuition(fee)}
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
                              onDeleteTuition(fee.id, fee.program_name)
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
          {tuitionMeta && tuitionMeta.total > pageSize && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Hiển thị {tuitionMeta.offset + 1} đến{" "}
                {Math.min(
                  tuitionMeta.offset + tuitionMeta.limit,
                  tuitionMeta.total
                )}{" "}
                trong {tuitionMeta.total} kết quả
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!tuitionMeta.has_prev}
                  className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-2">Trước</span>
                </Button>
                <span className="text-sm px-2">
                  {currentPage} / {Math.ceil(tuitionMeta.total / pageSize)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!tuitionMeta.has_next}
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
    </div>
  );
});

export default TuitionFeesTab;
