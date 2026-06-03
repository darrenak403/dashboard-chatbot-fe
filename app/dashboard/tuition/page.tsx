"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DollarSign, RefreshCw, Plus } from "lucide-react";

// Import tab components
import {
  TuitionFeesTab,
  TuitionComparisonTab,
  TuitionDialog,
} from "@/components/tuition";

import {
  authService,
  TuitionFee,
  TuitionResponse,
  TuitionComparison,
  Program,
  Campus,
} from "@/lib/auth";

export default function TuitionPage() {
  // Main data states
  const [tuitionFees, setTuitionFees] = useState<TuitionFee[]>([]);
  const [tuitionMeta, setTuitionMeta] = useState<
    TuitionResponse["meta"] | null
  >(null);
  const [comparisons, setComparisons] = useState<TuitionComparison[]>([]);

  // Dropdown data
  const [programs, setPrograms] = useState<Program[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramCode, setSelectedProgramCode] = useState("all");
  const [selectedCampusCode, setSelectedCampusCode] = useState("all");
  const [selectedYear, setSelectedYear] = useState(2025);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // UI states
  const [activeTab, setActiveTab] = useState("fees");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CRUD states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTuition, setEditingTuition] = useState<TuitionFee | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Utility functions - memoized for performance
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  }, []);

  // API functions - memoized to prevent unnecessary re-renders
  const fetchTuitionFees = useCallback(async () => {
    try {
      setError(null);
      const response = await authService.getTuitionFees({
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
        year: selectedYear,
        program_code:
          selectedProgramCode !== "all" ? selectedProgramCode : undefined,
        campus_code:
          selectedCampusCode !== "all" ? selectedCampusCode : undefined,
      });
      setTuitionFees(response.data);
      setTuitionMeta(response.meta);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Không thể tải dữ liệu học phí";
      setError(errorMessage);
      toast.error("Lỗi tải dữ liệu", { description: errorMessage });
    }
  }, [
    currentPage,
    pageSize,
    selectedYear,
    selectedProgramCode,
    selectedCampusCode,
  ]);

  const fetchDropdownData = useCallback(async () => {
    try {
      console.log("Fetching dropdown data from new APIs...");

      const [programsResponse, campusesResponse] = await Promise.all([
        fetch(
          "https://core-tuyensinh-production.up.railway.app/api/v1/programs?limit=100&offset=0"
        ),
        fetch(
          `https://core-tuyensinh-production.up.railway.app/api/v1/campuses?limit=100&offset=0&year=${selectedYear}`
        ),
      ]);

      if (!programsResponse.ok || !campusesResponse.ok) {
        throw new Error("API request failed");
      }

      const [programsData, campusesData] = await Promise.all([
        programsResponse.json(),
        campusesResponse.json(),
      ]);

      console.log("Programs API response:", programsData);
      console.log("Campuses API response:", campusesData);
      console.log("Raw campuses count:", campusesData.data?.length || 0);

      // Extract data for dropdowns
      const programsForDropdown = programsData.data.map((program: any) => ({
        id: program.id,
        code: program.code,
        name: program.name,
        name_en: program.name_en,
        department_id: program.department_id,
        duration_years: program.duration_years,
        department: program.department,
      }));

      const campusesForDropdown = campusesData.data.map((campus: any) => ({
        id: campus.id,
        code: campus.code,
        name: campus.name,
        city: campus.city,
        address: campus.address,
        phone: campus.phone,
        email: campus.email,
        discount_percentage: campus.discount_percentage,
        preparation_fees: campus.preparation_fees,
        available_programs: campus.available_programs || {
          count: 0,
          codes: [],
        },
      }));

      setPrograms(programsForDropdown);
      setCampuses(campusesForDropdown);

      console.log("Processed programs for dropdown:", programsForDropdown);
      console.log("Processed campuses for dropdown:", campusesForDropdown);
    } catch (error) {
      console.error("Dropdown data error:", error);

      // Fallback to minimal hardcoded data for dropdowns
      const fallbackPrograms = [
        {
          id: "1",
          code: "IA",
          name: "An toàn thông tin",
          name_en: "Information Assurance",
          department_id: "1",
          duration_years: 4,
          department: {
            id: "1",
            code: "IT",
            name: "Công nghệ thông tin",
            name_en: "Information Technology",
          },
        },
        {
          id: "2",
          code: "DT",
          name: "Công nghệ ô tô số",
          name_en: "Digital Automotive Technology",
          department_id: "1",
          duration_years: 4,
          department: {
            id: "1",
            code: "IT",
            name: "Công nghệ thông tin",
            name_en: "Information Technology",
          },
        },
        {
          id: "3",
          code: "FT",
          name: "Công nghệ tài chính",
          name_en: "Fintech",
          department_id: "2",
          duration_years: 4,
          department: {
            id: "2",
            code: "BUS",
            name: "Quản trị kinh doanh",
            name_en: "Business Administration",
          },
        },
      ];

      const fallbackCampuses = [
        {
          id: "1",
          code: "HN",
          name: "Hà Nội",
          city: "Hà Nội",
          address: "Hà Nội",
          phone: "",
          email: "",
          discount_percentage: 0,
          preparation_fees: {
            year: 2025,
            orientation: {
              fee: 0,
              is_mandatory: false,
              max_periods: 0,
              description: "",
            },
            english_prep: {
              fee: 0,
              is_mandatory: false,
              max_periods: 0,
              description: "",
            },
          },
          available_programs: { count: 2, codes: ["IA", "DT"] },
        },
        {
          id: "2",
          code: "HCM",
          name: "Hồ Chí Minh",
          city: "Hồ Chí Minh",
          address: "Hồ Chí Minh",
          phone: "",
          email: "",
          discount_percentage: 0,
          preparation_fees: {
            year: 2025,
            orientation: {
              fee: 0,
              is_mandatory: false,
              max_periods: 0,
              description: "",
            },
            english_prep: {
              fee: 0,
              is_mandatory: false,
              max_periods: 0,
              description: "",
            },
          },
          available_programs: { count: 2, codes: ["IA", "DT"] },
        },
      ];

      setPrograms(fallbackPrograms);
      setCampuses(fallbackCampuses);
    }
  }, [selectedYear]);

  const fetchComparison = useCallback(async () => {
    if (!selectedProgramCode || selectedProgramCode === "all") return;

    try {
      const response = await authService.getTuitionComparison({
        program_code: selectedProgramCode,
        year: selectedYear,
      });
      setComparisons(response.data);
    } catch (error) {
      console.error("Comparison API Error:", error);
      setComparisons([]);
    }
  }, [selectedProgramCode, selectedYear]);

  // CRUD functions - memoized for performance
  const handleCreateTuition = useCallback(
    async (data: {
      program_id: string;
      campus_id: string;
      year: number;
      semester_group_1_3_fee: number;
      semester_group_4_6_fee: number;
      semester_group_7_9_fee: number;
    }) => {
      setIsSubmitting(true);
      try {
        await authService.createTuitionRecord(data);
        toast.success("Tạo học phí thành công!", {
          description: "Bản ghi học phí đã được tạo.",
        });
        setIsCreateDialogOpen(false);
        fetchTuitionFees();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Không thể tạo học phí";
        toast.error("Lỗi tạo học phí", { description: errorMessage });
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTuitionFees]
  );

  const handleUpdateTuition = useCallback(
    async (
      id: string,
      data: {
        program_id?: string;
        campus_id?: string;
        year?: number;
        semester_group_1_3_fee?: number;
        semester_group_4_6_fee?: number;
        semester_group_7_9_fee?: number;
        is_active?: boolean;
      }
    ) => {
      setIsSubmitting(true);
      try {
        await authService.updateTuitionRecord(id, data);
        toast.success("Cập nhật học phí thành công!", {
          description: "Bản ghi học phí đã được cập nhật.",
        });
        setIsEditDialogOpen(false);
        setEditingTuition(null);
        fetchTuitionFees();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Không thể cập nhật học phí";
        toast.error("Lỗi cập nhật học phí", { description: errorMessage });
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchTuitionFees]
  );

  const handleDeleteTuition = useCallback(
    async (id: string, programName: string) => {
      if (
        !confirm(
          `Bạn có chắc chắn muốn xóa học phí cho chương trình "${programName}"?`
        )
      ) {
        return;
      }

      try {
        await authService.deleteTuitionRecord(id);
        toast.success("Xóa học phí thành công!", {
          description: "Bản ghi học phí đã được xóa.",
        });
        fetchTuitionFees();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Không thể xóa học phí";
        toast.error("Lỗi xóa học phí", { description: errorMessage });
      }
    },
    [fetchTuitionFees]
  );

  const handleEditTuition = useCallback((tuition: TuitionFee) => {
    setEditingTuition(tuition);
    setIsEditDialogOpen(true);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([fetchTuitionFees(), fetchDropdownData()]);
    setIsRefreshing(false);
  }, [fetchTuitionFees, fetchDropdownData]);

  // Memoized filtered data for better performance
  const filteredPrograms = useMemo(() => {
    if (!searchTerm) return programs;
    return programs.filter(
      (program) =>
        program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        program.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [programs, searchTerm]);

  const filteredCampusesForList = useMemo(() => {
    return campuses.filter(
      (campus) => campus.available_programs.codes.length > 0
    );
  }, [campuses]);

  const filteredCampusesForCreate = useMemo(() => {
    console.log("All campuses before filtering:", campuses);

    // Nếu không có available_programs hoặc codes rỗng, vẫn cho phép chọn
    // vì có thể cơ sở mới chưa có dữ liệu programs
    const filtered = campuses.filter((campus) => {
      const hasPrograms = campus.available_programs?.codes?.length > 0;
      console.log(
        `Campus ${campus.code}: hasPrograms = ${hasPrograms}`,
        campus.available_programs
      );
      return true; // Tạm thời cho phép tất cả campuses
    });

    console.log("Filtered campuses for create dialog:", filtered);
    return filtered;
  }, [campuses]);

  const filteredCampusesForEdit = useMemo(() => {
    // For edit dialog, include all campuses to allow editing existing tuition
    return campuses;
  }, [campuses]);

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await fetchDropdownData();
      setIsLoading(false);
    };
    loadData();
  }, [fetchDropdownData]);

  useEffect(() => {
    if (activeTab === "fees") {
      fetchTuitionFees();
    }
  }, [fetchTuitionFees, activeTab]);

  useEffect(() => {
    if (activeTab === "fees" && tuitionFees.length === 0) {
      fetchTuitionFees();
    }
  }, [fetchTuitionFees, activeTab, tuitionFees.length]);

  useEffect(() => {
    if (selectedProgramCode && selectedProgramCode !== "all") {
      fetchComparison();
    } else {
      setComparisons([]);
    }
  }, [fetchComparison, selectedProgramCode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Quản Lý Học Phí
              </h1>
              <p className="text-gray-600">
                Quản lý học phí các chương trình đào tạo tại các cơ sở
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
              Thêm học phí
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fees">Học Phí</TabsTrigger>
          <TabsTrigger value="comparison">So Sánh</TabsTrigger>
        </TabsList>

        <TabsContent value="fees">
          <TuitionFeesTab
            tuitionFees={tuitionFees}
            tuitionMeta={tuitionMeta}
            programs={filteredPrograms}
            campuses={filteredCampusesForList}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedProgramCode={selectedProgramCode}
            setSelectedProgramCode={setSelectedProgramCode}
            selectedCampusCode={selectedCampusCode}
            setSelectedCampusCode={setSelectedCampusCode}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            pageSize={pageSize}
            isRefreshing={isRefreshing}
            error={error}
            onRefresh={handleRefresh}
            onCreateTuition={() => setIsCreateDialogOpen(true)}
            onEditTuition={handleEditTuition}
            onDeleteTuition={handleDeleteTuition}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        <TabsContent value="comparison">
          <TuitionComparisonTab
            comparisons={comparisons}
            programs={filteredPrograms}
            selectedProgramCode={selectedProgramCode}
            setSelectedProgramCode={setSelectedProgramCode}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            formatCurrency={formatCurrency}
          />
        </TabsContent>
      </Tabs>

      {/* Create Tuition Dialog */}
      <TuitionDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateTuition}
        programs={filteredPrograms}
        campuses={filteredCampusesForCreate}
        isSubmitting={isSubmitting}
        title="Thêm Học Phí Mới"
        submitText="Tạo Học Phí"
      />

      {/* Edit Tuition Dialog */}
      <TuitionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSubmit={(data) =>
          editingTuition && handleUpdateTuition(editingTuition.id, data)
        }
        programs={filteredPrograms}
        campuses={filteredCampusesForEdit}
        isSubmitting={isSubmitting}
        title="Chỉnh Sửa Học Phí"
        submitText="Cập Nhật"
        initialData={editingTuition}
      />
    </div>
  );
}
