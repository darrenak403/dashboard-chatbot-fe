"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TuitionComparison, Program } from "@/lib/auth";

interface TuitionComparisonTabProps {
  comparisons: TuitionComparison[];
  programs: Program[];
  selectedProgramCode: string;
  setSelectedProgramCode: (code: string) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  formatCurrency: (amount: number) => string;
}

const TuitionComparisonTab = React.memo(function TuitionComparisonTab({
  comparisons,
  programs,
  selectedProgramCode,
  setSelectedProgramCode,
  selectedYear,
  setSelectedYear,
  formatCurrency,
}: TuitionComparisonTabProps) {
  const availableYears = [2024, 2025, 2026];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ Lọc So Sánh</CardTitle>
          <CardDescription>
            Chọn chương trình để so sánh học phí giữa các cơ sở
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="program">Chương trình</Label>
              <Select
                value={selectedProgramCode}
                onValueChange={setSelectedProgramCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn chương trình" />
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

      {/* Comparison Results */}
      {comparisons.length > 0 ? (
        <div className="space-y-4">
          {comparisons.map((comparison, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {comparison.program_code} - {comparison.program_name}
                </CardTitle>
                <CardDescription>
                  Khoa: {comparison.department_name} | Năm: {comparison.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparison.campus_fees.map((campus) => (
                    <Card
                      key={campus.campus_code}
                      className="border-l-4 border-l-blue-500"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {campus.campus_code} - {campus.campus_name}
                        </CardTitle>
                        <CardDescription>
                          {campus.city}
                          {campus.discount_percentage &&
                            campus.discount_percentage > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                Giảm {campus.discount_percentage}%
                              </Badge>
                            )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Kỳ 1-3:</span>
                          <span className="font-mono">
                            {formatCurrency(campus.semester_1_3_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Kỳ 4-6:</span>
                          <span className="font-mono">
                            {formatCurrency(campus.semester_4_6_fee)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Kỳ 7-9:</span>
                          <span className="font-mono">
                            {formatCurrency(campus.semester_7_9_fee)}
                          </span>
                        </div>
                        <div className="border-t pt-2">
                          <div className="flex justify-between font-semibold">
                            <span>Tổng phí:</span>
                            <span className="font-mono text-green-600">
                              {formatCurrency(campus.total_program_fee)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Summary Statistics */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Học phí thấp nhất
                    </div>
                    <div className="text-lg font-bold text-blue-600">
                      {formatCurrency(comparison.min_semester_fee)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Học phí cao nhất
                    </div>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(comparison.max_semester_fee)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Tổng phí thấp nhất
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(comparison.min_total_fee)}
                    </div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      Tổng phí cao nhất
                    </div>
                    <div className="text-lg font-bold text-orange-600">
                      {formatCurrency(comparison.max_total_fee)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-gray-500">
              {selectedProgramCode === "all"
                ? "Vui lòng chọn một chương trình để xem so sánh học phí."
                : "Không có dữ liệu so sánh cho chương trình đã chọn."}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

export default TuitionComparisonTab;
