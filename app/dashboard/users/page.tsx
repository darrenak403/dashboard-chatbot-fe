"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Search,
  Users,
  UserCheck,
  UserX,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authService, User, UserResponse } from "@/lib/auth";
import UserDialog, { UserFormData } from "@/components/users/user-dialog";
import DeleteUserDialog from "@/components/users/delete-user-dialog";

interface UserMeta {
  total: number;
  limit: number;
  offset: number;
  has_next: boolean;
  has_prev: boolean;
}

export default function UsersPage() {
  const router = useRouter();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [userMeta, setUserMeta] = useState<UserMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // CRUD loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle authentication errors
  const handleAuthError = (error: Error) => {
    if (error.message.includes("Phiên đăng nhập đã hết hạn")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }
    setError(error.message);
  };

  // Fetch users
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);

      const params: any = {};

      if (pageSize > 0) params.limit = pageSize;
      if (currentPage > 1) params.offset = (currentPage - 1) * pageSize;
      if (selectedRole !== "all") params.role = selectedRole;
      if (selectedStatus !== "all")
        params.is_active = selectedStatus === "active";

      const response = await authService.getUsers(
        Object.keys(params).length > 0 ? params : undefined
      );
      setUsers(response.data);
      setUserMeta(response.meta);
    } catch (error) {
      console.error("Error fetching users:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể tải danh sách người dùng");
      }
      setUsers([]);
      setUserMeta(null);
    }
  }, [currentPage, pageSize, selectedRole, selectedStatus]);

  // Refresh data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchUsers();
    setIsRefreshing(false);
  }, [fetchUsers]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    return users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchUsers();
      setIsLoading(false);
    };

    loadData();
  }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole, selectedStatus, searchTerm]);

  // CRUD Handlers
  const handleCreate = async (data: UserFormData) => {
    setIsCreating(true);
    try {
      await authService.createUser({
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      await fetchUsers();
      setError(null);
    } catch (error) {
      console.error("Error creating user:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể tạo người dùng mới");
      }
      throw error;
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async (data: UserFormData) => {
    if (!selectedUser) return;

    setIsUpdating(true);
    try {
      const updateData: any = {
        username: data.username,
        email: data.email,
        role: data.role,
        is_active: data.is_active,
      };

      if (data.password.trim()) {
        updateData.password = data.password;
      }

      await authService.updateUser(selectedUser.id, updateData);
      await fetchUsers();
      setError(null);
    } catch (error) {
      console.error("Error updating user:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể cập nhật người dùng");
      }
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      await authService.deleteUser(selectedUser.id);
      await fetchUsers();
      setError(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      if (error instanceof Error) {
        handleAuthError(error);
      } else {
        setError("Không thể xóa người dùng");
      }
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  // View user details
  const handleViewUser = (user: User) => {
    console.log("View user:", user);
    // TODO: Implement user details modal or page
  };

  // Role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "admin":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "staff":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "student":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin";
      case "admin":
        return "Admin";
      case "staff":
        return "Nhân viên";
      case "student":
        return "Sinh viên";
      default:
        return role;
    }
  };

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Chưa có";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản Lý Người Dùng
              </h1>
              <p className="text-gray-600">
                Quản lý thông tin người dùng trong hệ thống
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
              Thêm người dùng
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span className="font-medium">Lỗi:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Người Dùng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userMeta?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang Hoạt Động
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => u.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Không Hoạt Động
            </CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter((u) => !u.is_active).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hiển Thị</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredUsers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên đăng nhập hoặc email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Role Filter */}
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="student">Sinh viên</SelectItem>
                  <SelectItem value="staff">Nhân viên</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedRole("all");
                  setSelectedStatus("all");
                }}
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Người Dùng</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ||
                selectedRole !== "all" ||
                selectedStatus !== "all"
                  ? "Không tìm thấy người dùng nào phù hợp với bộ lọc"
                  : "Chưa có người dùng nào"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đăng nhập</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Đăng nhập cuối</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.username}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getRoleBadgeColor(user.role)}
                          >
                            {getRoleDisplayName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.is_active ? "default" : "secondary"}
                          >
                            {user.is_active ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(user.last_login_at)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewUser(user)}
                              title="Xem chi tiết"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              title="Chỉnh sửa"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                              title="Xóa"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {userMeta && userMeta.total > pageSize && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị {(currentPage - 1) * pageSize + 1} đến{" "}
                    {Math.min(currentPage * pageSize, userMeta.total)} trong{" "}
                    {userMeta.total} người dùng
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!userMeta.has_prev}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <span className="text-sm">Trang {currentPage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!userMeta.has_next}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <UserDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSave={handleCreate}
        isLoading={isCreating}
      />

      {/* Edit User Dialog */}
      <UserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        onSave={handleUpdate}
        isLoading={isUpdating}
      />

      {/* Delete User Dialog */}
      <DeleteUserDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        user={selectedUser}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
