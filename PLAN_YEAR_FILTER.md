# Plan: Sidebar theo năm tuyển sinh — FE

## Luồng UX mới

```
Sidebar (mặc định — chưa chọn năm)     Sidebar (đã chọn năm 2025)
────────────────────────────────        ──────────────────────────────────────
TỔNG QUAN                               ← Đổi năm  [badge "2025"]
  • Dashboard                           ──────────────────────────────────────
  • Người Dùng                          TỔNG QUAN
                                          • Dashboard
NĂM HỌC                                   • Người Dùng
  • Quản lý năm học  →  /dashboard/years
                                        QUẢN LÝ DỮ LIỆU
                                          • Khoa
                                          • Chương Trình
                                          • Cơ Sở
                                          • Học Phí
                                          • Học Bổng
                                          • Phương Thức Tuyển Sinh

                                        CÂU HỎI FAQ
                                          • Chủ Đề & Chủ Đề Con
                                          • Câu Hỏi & Câu Trả Lời
                                          • Bộ Câu Hỏi
```

**Trang `/dashboard/years`:**
- Bảng danh sách năm (năm, nhãn, trạng thái, ngày tạo)
- Nút "Tạo năm" → dialog
- Mỗi row: nút "Chọn", "Sửa", "Xóa"
- Bấm "Chọn" → set `selectedYear` vào context → điều hướng về `/dashboard`
- Xóa: kiểm tra dữ liệu liên quan, hiện confirm với số lượng record

---

## Danh sách file cần tạo / sửa

### Tạo mới

| File | Mô tả |
|------|-------|
| `contexts/year-context.tsx` | Context lưu `selectedYear`, persist localStorage |
| `lib/admission-years.ts` | Service CRUD cho admission-years API |
| `app/dashboard/years/page.tsx` | Màn hình CRUD quản lý năm tuyển sinh |

### Sửa

| File | Thay đổi |
|------|----------|
| `lib/constants.ts` | Thêm endpoint `ADMISSION_YEARS` |
| `lib/faq.ts` | Thêm `admission_year?` vào params của 4 service |
| `lib/auth.ts` | Đổi `getDepartments`/`getPrograms`/`getCampuses` sang object params, thêm `admission_year` |
| `app/dashboard/layout.tsx` | Wrap `<YearProvider>` |
| `components/dashboard/sidebar.tsx` | Tái cấu trúc nav theo `selectedYear` |
| `app/dashboard/departments/page.tsx` | Bind `selectedYear` từ context vào fetch |
| `app/dashboard/programs/page.tsx` | Bind `selectedYear` từ context vào fetch |
| `app/dashboard/campuses/page.tsx` | Bind `selectedYear` từ context vào fetch |
| `app/dashboard/tuition/page.tsx` | Bỏ local `selectedYear = 2025`, bind từ context |
| `app/dashboard/scholarships/page.tsx` | Bỏ local `selectedYear`, bind từ context |
| `app/dashboard/admission-methods/page.tsx` | Bỏ local `selectedYear`, bind từ context |
| `app/dashboard/faq/topics/page.tsx` | Thêm `admission_year` từ context |
| `app/dashboard/faq/questions/page.tsx` | Thêm `admission_year` từ context |
| `app/dashboard/faq/answers/page.tsx` | Thêm `admission_year` từ context |
| `app/dashboard/faq/collections/page.tsx` | Bỏ local `filterYear`, bind từ context |

---

## Chi tiết từng file

---

### 1. `contexts/year-context.tsx` _(mới)_

Context đơn giản, không cần load `availableYears` (để page `/dashboard/years` tự fetch).

```tsx
"use client";
import { createContext, useContext, useState } from "react";

interface YearContextValue {
  selectedYear: number | null;
  setSelectedYear: (year: number | null) => void;
}

const YearContext = createContext<YearContextValue>({
  selectedYear: null,
  setSelectedYear: () => {},
});

export function YearProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYearState] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selected_admission_year");
      return stored ? Number(stored) : null;
    }
    return null;
  });

  const setSelectedYear = (year: number | null) => {
    setSelectedYearState(year);
    if (year === null) localStorage.removeItem("selected_admission_year");
    else localStorage.setItem("selected_admission_year", String(year));
  };

  return (
    <YearContext.Provider value={{ selectedYear, setSelectedYear }}>
      {children}
    </YearContext.Provider>
  );
}

export const useYear = () => useContext(YearContext);
```

---

### 2. `lib/admission-years.ts` _(mới)_

```ts
import { API_ENDPOINTS } from './constants';
import { authService } from './auth';

export interface AdmissionYear {
  year: number;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeleteYearResult {
  message: string;
  deleted_counts?: Record<string, number>;
}

export interface YearHasDataError {
  code: 'YEAR_HAS_DATA';
  message: string;
  details: Record<string, number>;
  hint: string;
}

function getAuthHeaders() {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const admissionYearsService = {
  async list(): Promise<{ data: AdmissionYear[] }> {
    const res = await fetch(API_ENDPOINTS.ADMISSION_YEARS, { headers: getAuthHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return data;
  },

  async create(body: { year: number; label?: string; is_active?: boolean }): Promise<{ data: AdmissionYear }> {
    const res = await fetch(API_ENDPOINTS.ADMISSION_YEARS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return data;
  },

  async update(year: number, body: { label?: string; is_active?: boolean }): Promise<{ data: AdmissionYear }> {
    const res = await fetch(`${API_ENDPOINTS.ADMISSION_YEARS}/${year}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return data;
  },

  async remove(year: number, cascade = false): Promise<DeleteYearResult> {
    const res = await fetch(`${API_ENDPOINTS.ADMISSION_YEARS}/${year}?cascade=${cascade}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    // 409 = có dữ liệu liên quan, trả về để UI xử lý riêng
    if (res.status === 409) {
      const err: any = new Error(data?.error?.message || 'Năm có dữ liệu liên quan');
      err.code = 'YEAR_HAS_DATA';
      err.details = data?.error?.details;
      err.hint = data?.error?.hint;
      throw err;
    }
    if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
    return data;
  },
};
```

---

### 3. `app/dashboard/years/page.tsx` _(mới)_

**Màn hình CRUD quản lý năm.** Layout giống các page hiện có (Card + Table + Dialog).

**State:**
```ts
const [years, setYears] = useState<AdmissionYear[]>([]);
const [isLoading, setIsLoading] = useState(true);

// Create/Edit dialog
const [isDialogOpen, setIsDialogOpen] = useState(false);
const [editingYear, setEditingYear] = useState<AdmissionYear | null>(null);
const [formData, setFormData] = useState({ year: new Date().getFullYear() + 1, label: "", is_active: true });

// Delete dialog — 2 bước: confirm thường → nếu có data → confirm cascade
const [deleteTarget, setDeleteTarget] = useState<AdmissionYear | null>(null);
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [linkedDataCounts, setLinkedDataCounts] = useState<Record<string, number> | null>(null);
const [isCascadeConfirmOpen, setIsCascadeConfirmOpen] = useState(false);

const { selectedYear, setSelectedYear } = useYear();
const router = useRouter();
```

**Luồng xóa (2 bước):**
1. Bấm "Xóa" → mở `isDeleteDialogOpen` confirm thường
2. Gọi `admissionYearsService.remove(year, false)`
   - Nếu thành công → refresh list
   - Nếu lỗi `YEAR_HAS_DATA` → đóng dialog thường, set `linkedDataCounts`, mở `isCascadeConfirmOpen`
3. Trong `isCascadeConfirmOpen`: hiện bảng đếm record từng entity, nút "Xóa tất cả" → gọi `remove(year, true)`

**Bấm "Chọn năm":**
```ts
const handleSelectYear = (year: number) => {
  setSelectedYear(year);
  router.push('/dashboard');
};
```

**Bảng columns:**
| Năm | Nhãn | Trạng thái | Ngày tạo | Hành động |
|-----|------|-----------|---------|----------|
| 2025 | Năm tuyển sinh 2025 | ● Hoạt động | ... | [Chọn] [Sửa] [Xóa] |

Nút "Chọn" highlight xanh nếu `year === selectedYear` (đang được chọn).

---

### 4. `lib/constants.ts`

```ts
ADMISSION_YEARS: `${API_V1_URL}/admission-years`,
```

Thêm route mới vào `ROUTES`:
```ts
YEARS: '/dashboard/years',
```

---

### 5. `lib/faq.ts`

Thêm `admission_year?: number` vào params của 4 hàm `list` và thêm dòng `q.set` tương ứng:

```ts
faqTopicsService.list:    params?: { ...; admission_year?: number }
faqSubTopicsService.list: params?: { ...; admission_year?: number }
faqQuestionsService.list: params?: { ...; admission_year?: number }
faqAnswersService.list:   params?: { ...; admission_year?: number }

// Trong mỗi hàm:
if (params?.admission_year != null) q.set('admission_year', String(params.admission_year));
```

---

### 6. `lib/auth.ts`

**Vấn đề:** `getDepartments(limit, offset)` và `getPrograms(limit, offset, departmentCode?)` và `getCampuses(limit, offset, year)` đang dùng positional params — không thể thêm `admission_year` mà không làm hỏng tất cả callers.

**Giải pháp:** Đổi sang object params (giống pattern của `getScholarships`, `getAdmissionMethods`):

```ts
// TRƯỚC
async getDepartments(limit: number = 100, offset: number = 0)
// SAU
async getDepartments(params?: { limit?: number; offset?: number; admission_year?: number })

// TRƯỚC
async getPrograms(limit: number = 100, offset: number = 0, departmentCode?: string)
// SAU
async getPrograms(params?: { limit?: number; offset?: number; department_code?: string; admission_year?: number })

// TRƯỚC
async getCampuses(limit: number = 100, offset: number = 0, year: number = 2025)
// SAU
async getCampuses(params?: { limit?: number; offset?: number; admission_year?: number })
```

Cập nhật body từng hàm dùng `URLSearchParams` dạng object thay vì positional.

---

### 7. `app/dashboard/layout.tsx`

```tsx
import { YearProvider } from "@/contexts/year-context";

return (
  <YearProvider>
    <div className="flex h-screen overflow-hidden ...">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main ...>{children}</main>
      </div>
    </div>
  </YearProvider>
);
```

---

### 8. `components/dashboard/sidebar.tsx`

Bỏ `navigationGroups` array cũ. Tách thành 3 const:

```ts
const overviewItems = [
  { name: "Dashboard",    href: "/dashboard",       icon: Home  },
  { name: "Người Dùng",  href: "/dashboard/users",  icon: Users },
];

const yearItems = [
  { name: "Quản Lý Năm Học", href: "/dashboard/years", icon: Calendar },
];

const dataManagementItems = [
  { name: "Khoa",                  href: "/dashboard/departments",      icon: Building2    },
  { name: "Chương Trình",          href: "/dashboard/programs",         icon: GraduationCap},
  { name: "Cơ Sở",                 href: "/dashboard/campuses",         icon: MapPin       },
  { name: "Học Phí",               href: "/dashboard/tuition",          icon: DollarSign   },
  { name: "Học Bổng",              href: "/dashboard/scholarships",     icon: Award        },
  { name: "Phương Thức Tuyển Sinh",href: "/dashboard/admission-methods",icon: FileText     },
];

const faqItems = [
  { name: "Chủ Đề & Chủ Đề Con",   href: "/dashboard/faq/topics",      icon: FolderOpen   },
  { name: "Câu Hỏi & Câu Trả Lời", href: "/dashboard/faq/questions",   icon: HelpCircle   },
  { name: "Bộ Câu Hỏi",            href: "/dashboard/faq/collections", icon: BookOpen     },
];
```

```ts
const { selectedYear, setSelectedYear } = useYear();
```

**Render `<nav>`:**
```tsx
{/* Tổng Quan — luôn hiện */}
<NavSection label="Tổng Quan" items={overviewItems} />

{selectedYear === null ? (
  /* Chưa chọn năm */
  <NavSection label="Năm Học" items={yearItems} />
) : (
  /* Đã chọn năm */
  <>
    {/* Nút back — thay thế section "Năm Học" */}
    <YearBadgeButton
      year={selectedYear}
      onBack={() => setSelectedYear(null)}
      isCollapsed={isCollapsed}
    />
    <NavSection label="Quản Lý Dữ Liệu" items={dataManagementItems} />
    <NavSection label="Câu Hỏi FAQ" items={faqItems} />
  </>
)}
```

**`<YearBadgeButton />`** (component nội bộ):
- Khi collapsed: icon `ChevronLeft`
- Khi mở: `← Năm 2025` + sub-text nhỏ "Bấm để đổi năm", style `bg-blue-50 border border-blue-200 text-blue-700`

---

### 9–11. `departments`, `programs`, `campuses` pages

**Cập nhật callers** sau khi `lib/auth.ts` đổi sang object params:

```ts
// departments/page.tsx — fetchDepartments
// TRƯỚC: authService.getDepartments(limit, offset)
// SAU:
authService.getDepartments({
  limit,
  offset,
  ...(selectedYear != null && { admission_year: selectedYear }),
})

// programs/page.tsx — fetchPrograms
// TRƯỚC: authService.getPrograms(limit, offset, departmentCode)
// SAU:
authService.getPrograms({
  limit,
  offset,
  ...(filterDepartment !== "all" && { department_code: filterDepartment }),
  ...(selectedYear != null && { admission_year: selectedYear }),
})

// campuses/page.tsx — fetchCampuses
// TRƯỚC: authService.getCampuses(limit, offset)
// SAU:
authService.getCampuses({
  limit,
  offset,
  ...(selectedYear != null && { admission_year: selectedYear }),
})
```

Thêm `const { selectedYear } = useYear()` và badge năm vào header của mỗi page.

---

### 12–14. `tuition`, `scholarships`, `admission-methods` pages

Ba page này đã có local `selectedYear` state — **xóa local state, bind từ context**:

```ts
// Xóa:
const [selectedYear, setSelectedYear] = useState(2025);            // tuition
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // scholarships/admission-methods

// Thêm:
const { selectedYear } = useYear();
```

Giữ nguyên key `year:` khi truyền vào API (BE đang dùng `year`, chưa đổi sang `admission_year`):
```ts
...(selectedYear != null && { year: selectedYear }),
```

---

### 15–17. `faq/topics`, `faq/questions`, `faq/answers` pages

```ts
const { selectedYear } = useYear();

// Thêm vào params khi gọi list:
...(selectedYear != null && { admission_year: selectedYear }),
```

---

### 18. `faq/collections/page.tsx`

```ts
// Xóa:
const [filterYear, setFilterYear] = useState("");

// Thêm:
const { selectedYear } = useYear();

// Trong fetchCollections — sửa:
// từ: if (filterYear) params.admission_year = Number(filterYear);
// sang:
if (selectedYear != null) params.admission_year = selectedYear;
```

Xóa luôn UI input/select chọn năm trong trang collections.

---

## Thứ tự thực hiện

```
1. lib/constants.ts            — thêm ADMISSION_YEARS endpoint
2. lib/admission-years.ts      — tạo service
3. lib/faq.ts                  — thêm admission_year params
4. lib/auth.ts                 — đổi getDepartments/getPrograms/getCampuses sang object params
5. contexts/year-context.tsx   — tạo context
6. app/dashboard/layout.tsx    — wrap YearProvider
7. components/dashboard/sidebar.tsx — tái cấu trúc nav
8. app/dashboard/years/page.tsx — tạo CRUD page
9. Pages — cập nhật callers (song song):
   - departments, programs, campuses
   - tuition, scholarships, admission-methods
   - faq/topics, questions, answers, collections
```

---

## Lưu ý

- **`useYear()` dùng trong Client Component** — tất cả pages đã là `"use client"` ✓
- **`selectedYear === null`** → không truyền `admission_year` vào API → BE trả về tất cả (backward-compat)
- **Tuition/Scholarships/AdmissionMethods** dùng key `year:` (chưa phải `admission_year`) — sẽ đổi khi BE cập nhật
- **Khi đổi `getDepartments/getPrograms/getCampuses` sang object params** → phải kiểm tra tất cả callers khác trong codebase (ví dụ: trong programs/page.tsx có `fetchDepartments` gọi với `(100, 0)` — cần sửa sang `{ limit: 100, offset: 0 }`)
- **`/dashboard/years`** cần thêm vào `isActive` check trong sidebar nếu muốn highlight đúng
