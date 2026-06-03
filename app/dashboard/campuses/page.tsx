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
  MapPin,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  DollarSign,
  GraduationCap,
} from "lucide-react";
import {
  authService,
  Campus,
  CreateCampusRequest,
  UpdateCampusRequest,
} from "@/lib/auth";

export default function CampusesPage() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
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
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [deletingCampus, setDeletingCampus] = useState<Campus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    discount_percentage: 0,
  });

  const router = useRouter();

  const fetchCampuses = async (page: number = 1, limit: number = 10) => {
    try {
      setError("");
      const offset = (page - 1) * limit;
      const response = await authService.getCampuses(limit, offset);

      setCampuses(response.data);
      setMeta(response.meta);
      setTotalPages(Math.ceil(response.meta.total / limit));
      setCurrentPage(page);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Không thể tải danh sách cơ sở"
      );
      if (error instanceof Error && error.message.includes("Authentication")) {
        authService.logout();
        router.push("/login");
      }
    }
  };

  useEffect(() => {
    const loadCampuses = async () => {
      setIsLoading(true);
      await fetchCampuses();
      setIsLoading(false);
    };

    loadCampuses();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCampuses(currentPage, meta.limit);
    setIsRefreshing(false);
  };

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setIsLoading(true);
      await fetchCampuses(page, meta.limit);
      setIsLoading(false);
    }
  };

  // Form handlers
  const handleAddCampus = () => {
    setEditingCampus(null);
    setFormData({
      code: "",
      name: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      discount_percentage: 0,
    });
    setIsDialogOpen(true);
  };

  const handleEditCampus = (campus: Campus) => {
    setEditingCampus(campus);
    setFormData({
      code: campus.code,
      name: campus.name,
      city: campus.city,
      address: campus.address,
      phone: campus.phone,
      email: campus.email,
      discount_percentage: campus.discount_percentage,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteCampus = (campus: Campus) => {
    setDeletingCampus(campus);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      if (editingCampus) {
        // Update existing campus
        await authService.updateCampus(editingCampus.id, formData);
      } else {
        // Create new campus
        await authService.createCampus(formData);
      }

      setIsDialogOpen(false);
      await fetchCampuses(currentPage, meta.limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Thao tác thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCampus) return;

    setIsSubmitting(true);
    setError("");

    try {
      await authService.deleteCampus(deletingCampus.id);
      setIsDeleteDialogOpen(false);
      setDeletingCampus(null);
      await fetchCampuses(currentPage, meta.limit);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Xóa thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCampuses = campuses.filter(
    (campus) =>
      campus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campus.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campus.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campus.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (isLoading && campuses.length === 0) {
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
              <MapPin className="h-8 w-8 mr-3 text-purple-600" />
              Cơ Sở
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý các địa điểm cơ sở và phí dự bị
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
            <Button size="sm" onClick={handleAddCampus}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm Cơ Sở
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng Số Cơ Sở
              </CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
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
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Tìm Kiếm Cơ Sở</CardTitle>
            <CardDescription>
              Tìm kiếm theo tên cơ sở, mã, thành phố hoặc địa chỉ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm cơ sở..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Campuses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCampuses.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchTerm
                ? "Không tìm thấy cơ sở nào phù hợp với tìm kiếm của bạn."
                : "Không có cơ sở nào."}
            </div>
          ) : (
            filteredCampuses.map((campus) => (
              <Card
                key={campus.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <CardTitle className="text-lg">{campus.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="font-mono">
                      {campus.code}
                    </Badge>
                  </div>
                  <CardDescription>{campus.city}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {/* Contact Information */}
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{campus.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{campus.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{campus.email}</span>
                      </div>
                    </div>

                    {/* Discount */}
                    {campus.discount_percentage > 0 && (
                      <div className="flex items-center space-x-2 bg-green-50 p-2 rounded">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 font-medium">
                          Giảm giá {campus.discount_percentage}%
                        </span>
                      </div>
                    )}

                    {/* Foundation Fees */}
                    {campus.preparation_fees && (
                      <div className="border-t pt-3">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Phí Dự Bị ({campus.preparation_fees.year})
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Định hướng:</span>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(
                                  campus.preparation_fees.orientation.fee
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {campus.preparation_fees.orientation
                                  .is_mandatory
                                  ? "Bắt buộc"
                                  : "Tùy chọn"}
                                • Tối đa{" "}
                                {
                                  campus.preparation_fees.orientation
                                    .max_periods
                                }{" "}
                                kỳ
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">
                              Dự bị tiếng Anh:
                            </span>
                            <div className="text-right">
                              <div className="font-medium">
                                {formatCurrency(
                                  campus.preparation_fees.english_prep.fee
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {campus.preparation_fees.english_prep
                                  .is_mandatory
                                  ? "Bắt buộc"
                                  : "Tùy chọn"}
                                • Tối đa{" "}
                                {
                                  campus.preparation_fees.english_prep
                                    .max_periods
                                }{" "}
                                kỳ
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Available Programs */}
                    {campus.available_programs && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">
                            Chương Trình Có Sẵn
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            <GraduationCap className="h-3 w-3 mr-1" />
                            {campus.available_programs.count}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {campus.available_programs.codes
                            .slice(0, 3)
                            .map((code) => (
                              <Badge
                                key={code}
                                variant="outline"
                                className="text-xs"
                              >
                                {code}
                              </Badge>
                            ))}
                          {campus.available_programs.codes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{campus.available_programs.codes.length - 3} khác
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCampus(campus)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteCampus(campus)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
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
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Campus Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingCampus ? "Chỉnh Sửa Cơ Sở" : "Thêm Cơ Sở Mới"}
              </DialogTitle>
              <DialogDescription>
                {editingCampus
                  ? "Cập nhật thông tin cơ sở bên dưới."
                  : "Điền thông tin chi tiết để tạo cơ sở mới."}
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
                    placeholder="ví dụ: HCM, HN"
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
                    placeholder="Tên cơ sở"
                    maxLength={255}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="city" className="text-right">
                    Thành Phố *
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Tên thành phố"
                    maxLength={100}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Địa Chỉ
                  </Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Địa chỉ đầy đủ"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Điện Thoại
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Số điện thoại"
                    maxLength={20}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Địa chỉ email"
                    maxLength={100}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="discount_percentage" className="text-right">
                    Giảm Giá (%)
                  </Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_percentage: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="col-span-3"
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? "Đang lưu..."
                    : editingCampus
                    ? "Cập nhật"
                    : "Tạo"}{" "}
                  Cơ Sở
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
                Hành động này sẽ xóa cơ sở "{deletingCampus?.name}". Hành động
                này không thể hoàn tác.
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
