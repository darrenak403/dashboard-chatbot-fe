# BE API Spec — Year Filter

## Tổng quan

Thêm khái niệm **năm tuyển sinh (`admission_year`)** vào toàn bộ hệ thống để FE có thể filter dữ liệu theo từng năm. Năm tuyển sinh được quản lý độc lập qua bảng `admission_years`.

---

## 1. Bảng `admission_years` (mới)

Tạo bảng riêng để quản lý danh sách năm. Dùng làm nguồn tham chiếu duy nhất thay vì union query.

```sql
CREATE TABLE admission_years (
  year        INTEGER PRIMARY KEY,
  label       VARCHAR(50),          -- Ví dụ: "Năm tuyển sinh 2025"
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**Ràng buộc DB:**
- `year`: primary key, không trùng, không null
- Các bảng khác (`departments`, `programs`, …) nên có foreign key tham chiếu đến `admission_years.year` (optional, có thể là soft reference để tránh cascade phức tạp)

---

## 2. CRUD API cho `admission-years`

### 2.1. `GET /api/v1/admission-years`

Trả về danh sách năm tuyển sinh, sắp xếp giảm dần.

**Auth:** Bearer token (admin)

**Response `200`:**
```json
{
  "data": [
    { "year": 2026, "label": "Năm tuyển sinh 2026", "is_active": true, "created_at": "..." },
    { "year": 2025, "label": "Năm tuyển sinh 2025", "is_active": true, "created_at": "..." },
    { "year": 2024, "label": "Năm tuyển sinh 2024", "is_active": false, "created_at": "..." }
  ]
}
```

---

### 2.2. `POST /api/v1/admission-years`

Tạo mới một năm tuyển sinh.

**Auth:** Bearer token (super_admin)

**Request body:**
```json
{
  "year": 2027,
  "label": "Năm tuyển sinh 2027",   // optional, nếu không có thì tự generate
  "is_active": true                  // optional, default: true
}
```

**Validation:**

| Field | Rule | Error |
|-------|------|-------|
| `year` | Bắt buộc | `"year là bắt buộc"` |
| `year` | Phải là số nguyên | `"year phải là số nguyên"` |
| `year` | Phải đúng 4 chữ số (1000–9999) | `"year phải là số có 4 chữ số"` |
| `year` | Trong khoảng `current_year - 10` đến `current_year + 5` | `"year nằm ngoài khoảng cho phép (YYYY–YYYY)"` |
| `year` | Chưa tồn tại trong DB | `"Năm {year} đã tồn tại"` |
| `label` | Nếu có: tối đa 100 ký tự | `"label không được vượt quá 100 ký tự"` |
| `is_active` | Nếu có: phải là boolean | `"is_active phải là true hoặc false"` |

**Response `201`:**
```json
{
  "data": {
    "year": 2027,
    "label": "Năm tuyển sinh 2027",
    "is_active": true,
    "created_at": "2026-06-06T10:00:00Z",
    "updated_at": "2026-06-06T10:00:00Z"
  }
}
```

**Response lỗi `409` — năm đã tồn tại:**
```json
{
  "error": {
    "code": "YEAR_ALREADY_EXISTS",
    "message": "Năm 2027 đã tồn tại"
  }
}
```

**Response lỗi `422` — validation:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": [
      { "field": "year", "message": "year nằm ngoài khoảng cho phép (2016–2031)" }
    ]
  }
}
```

---

### 2.3. `PUT /api/v1/admission-years/:year`

Cập nhật thông tin năm (chỉ `label` và `is_active` — **không cho phép đổi `year`**).

**Auth:** Bearer token (super_admin)

**Request body:**
```json
{
  "label": "Tuyển sinh đại học 2025",
  "is_active": false
}
```

**Validation:**

| Field | Rule | Error |
|-------|------|-------|
| `:year` (param) | Phải tồn tại trong DB | `404 - "Năm {year} không tồn tại"` |
| `label` | Nếu có: tối đa 100 ký tự | `"label không được vượt quá 100 ký tự"` |
| `is_active` | Nếu có: phải là boolean | `"is_active phải là true hoặc false"` |
| Body | Ít nhất một field phải được truyền | `"Không có field nào được cập nhật"` |

**Response `200`:**
```json
{
  "data": {
    "year": 2025,
    "label": "Tuyển sinh đại học 2025",
    "is_active": false,
    "created_at": "...",
    "updated_at": "2026-06-06T10:30:00Z"
  }
}
```

---

### 2.4. `DELETE /api/v1/admission-years/:year`

Xóa một năm tuyển sinh.

**Auth:** Bearer token (super_admin)

**Query params:**

| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `cascade` | boolean | `false` | Nếu `true`: xóa luôn toàn bộ dữ liệu thuộc năm này |

#### Hành vi mặc định (`cascade=false`)

Kiểm tra toàn bộ các bảng có dữ liệu thuộc năm này. Nếu **có dữ liệu liên quan** → từ chối xóa, trả về `409` kèm thống kê:

```json
{
  "error": {
    "code": "YEAR_HAS_DATA",
    "message": "Không thể xóa năm 2025 vì còn dữ liệu liên quan",
    "details": {
      "departments":       12,
      "programs":          45,
      "scholarships":       8,
      "admission_methods":  6,
      "faq_topics":        10,
      "faq_sub_topics":    30,
      "faq_questions":    200,
      "faq_collections":    3,
      "tuition":           20
    },
    "hint": "Truyền ?cascade=true để xóa toàn bộ dữ liệu của năm này (không thể hoàn tác)"
  }
}
```

#### Hành vi khi `cascade=true`

Xóa theo thứ tự để tránh vi phạm foreign key:

```
faq_collection_items → faq_collections
faq_answers → faq_questions → faq_sub_topics → faq_topics
admission_methods
scholarships
tuition
programs → departments
(campuses nếu có admission_year)
admission_years
```

**Validation trước khi xóa (cả hai mode):**

| Kiểm tra | Điều kiện | Error |
|----------|-----------|-------|
| Năm tồn tại | `:year` phải có trong DB | `404 - "Năm {year} không tồn tại"` |
| `:year` là số nguyên hợp lệ | parse từ URL param | `400 - "year không hợp lệ"` |
| `cascade` là boolean | nếu có trong query | `400 - "cascade phải là true hoặc false"` |

**Response `200` — xóa thành công:**
```json
{
  "message": "Đã xóa năm 2024 thành công",
  "deleted_counts": {
    "departments": 5,
    "programs": 12,
    "scholarships": 3,
    "admission_methods": 2,
    "faq_topics": 4,
    "faq_sub_topics": 10,
    "faq_questions": 50,
    "faq_collections": 1,
    "tuition": 8
  }
}
```

**Response `200` — không có dữ liệu liên quan (xóa trực tiếp):**
```json
{
  "message": "Đã xóa năm 2027 thành công",
  "deleted_counts": {}
}
```

---

## 3. Migration DB

### 3.1. Tạo bảng mới

```sql
CREATE TABLE admission_years (
  year        INTEGER PRIMARY KEY,
  label       VARCHAR(100),
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Seed dữ liệu hiện tại nếu đã có
INSERT INTO admission_years (year, label) VALUES
  (2025, 'Năm tuyển sinh 2025'),
  (2024, 'Năm tuyển sinh 2024');
```

### 3.2. Thêm cột `admission_year` vào các bảng

Cột **nullable** để không phá dữ liệu hiện tại.

```sql
ALTER TABLE departments       ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
ALTER TABLE programs          ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
ALTER TABLE scholarships      ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
ALTER TABLE admission_methods ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
ALTER TABLE faq_topics        ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
ALTER TABLE faq_sub_topics    ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
ALTER TABLE faq_questions     ADD COLUMN admission_year INTEGER REFERENCES admission_years(year);
```

> **Campuses:** Xác nhận với team — nếu campus là master data toàn cục thì **không cần** thêm `admission_year`.
>
> **Tuition:** Bảng `tuition` đã có cột `year` — giữ nguyên hoặc đổi tên và thêm FK tham chiếu `admission_years(year)`.
>
> **faq_answers:** Không cần thêm cột — filter qua join `answers → questions.admission_year`.

---

## 4. Validation chung cho `admission_year` trên tất cả POST/PUT

Áp dụng cho tất cả các endpoint nhận `admission_year` trong body (departments, programs, scholarships, admission-methods, faq/topics, faq/sub-topics, faq/questions).

| Rule | Điều kiện | Error |
|------|-----------|-------|
| Type | Phải là số nguyên | `"admission_year phải là số nguyên"` |
| Range | Trong khoảng 4 chữ số hợp lệ | `"admission_year phải là số có 4 chữ số"` |
| Tồn tại | Phải tồn tại trong bảng `admission_years` | `"Năm {year} không tồn tại trong hệ thống. Vui lòng tạo năm trước."` |
| is_active | Năm được tham chiếu phải `is_active = true` | `"Năm {year} đã bị vô hiệu hóa, không thể thêm dữ liệu"` |

---

## 5. API sửa — thêm filter `?admission_year`

Tất cả các endpoint list dưới đây nhận thêm query param `admission_year` (integer, optional).

**Hành vi khi không truyền `admission_year`:** trả về **tất cả** records.

**Validation query param `admission_year`:** nếu truyền vào mà không phải số nguyên hợp lệ → `400 - "admission_year phải là số nguyên"`.

---

### 5.1. `GET /api/v1/departments`

**Query params thêm:** `?admission_year=2025`

**Response — thêm field `admission_year`** vào mỗi object.

**POST/PUT** nhận thêm `admission_year` (áp dụng validation mục 4).

---

### 5.2. `GET /api/v1/programs`

**Query params thêm:** `?admission_year=2025`

**Response — thêm field `admission_year`** vào mỗi object.

**POST/PUT** nhận thêm `admission_year`.

---

### 5.3. `GET /api/v1/campuses`

*(Xác nhận với team. Nếu cần thêm, làm tương tự departments.)*

---

### 5.4. `GET /api/v1/tuition`

Đã có `?year=`. Cần thống nhất:
- Giữ `year` → FE map từ context.
- Hoặc thêm alias `admission_year` nhận cùng giá trị.

Thêm validation: nếu `year` truyền vào không phải số nguyên → `400`.

---

### 5.5. `GET /api/v1/scholarships`

**Query params thêm:** `?admission_year=2025`

**Response — thêm field `admission_year`**.  **POST/PUT** nhận thêm `admission_year`.

---

### 5.6. `GET /api/v1/admission-methods`

**Query params thêm:** `?admission_year=2025`

**Response — thêm field `admission_year`**.  **POST/PUT** nhận thêm `admission_year`.

---

### 5.7. `GET /api/v1/faq/topics`

**Query params thêm:** `?admission_year=2025`

**Response — thêm field `admission_year`**.  **POST/PUT** nhận thêm `admission_year`.

---

### 5.8. `GET /api/v1/faq/sub-topics`

**Query params thêm:** `?admission_year=2025`

Filter trực tiếp trên `faq_sub_topics.admission_year`.

**Response — thêm field `admission_year`**.  **POST/PUT** nhận thêm `admission_year`.

---

### 5.9. `GET /api/v1/faq/questions`

**Query params thêm:** `?admission_year=2025`

**Response — thêm field `admission_year`**.  **POST/PUT** nhận thêm `admission_year`.

---

### 5.10. `GET /api/v1/faq/answers`

**Query params thêm:** `?admission_year=2025`

Filter qua join: `answers JOIN questions ON answers.question_id = questions.id WHERE questions.admission_year = ?`

Không thêm cột vào `faq_answers`. Response schema không thay đổi.

---

### 5.11. `GET /api/v1/faq/collections`

**Đã có** `?admission_year=`. Không cần thay đổi.

---

## 6. Tóm tắt checklist cho BE

| # | Việc | Chi tiết |
|---|------|---------|
| 1 | Migration: tạo bảng mới | `admission_years` + seed data |
| 2 | Migration: thêm cột FK | 7 bảng (departments, programs, scholarships, admission_methods, faq_topics, faq_sub_topics, faq_questions) |
| 3 | API mới | `GET /api/v1/admission-years` |
| 4 | API mới | `POST /api/v1/admission-years` + validation |
| 5 | API mới | `PUT /api/v1/admission-years/:year` + validation |
| 6 | API mới | `DELETE /api/v1/admission-years/:year` + kiểm tra dữ liệu liên quan + cascade |
| 7 | Thêm filter + field | `GET/POST/PUT /api/v1/departments` |
| 8 | Thêm filter + field | `GET/POST/PUT /api/v1/programs` |
| 9 | Xác nhận + thêm nếu cần | `GET /api/v1/campuses` |
| 10 | Xác nhận tên param | `GET /api/v1/tuition` (`year` vs `admission_year`) |
| 11 | Thêm filter + field | `GET/POST/PUT /api/v1/scholarships` |
| 12 | Thêm filter + field | `GET/POST/PUT /api/v1/admission-methods` |
| 13 | Thêm filter + field | `GET/POST/PUT /api/v1/faq/topics` |
| 14 | Thêm filter + field | `GET/POST/PUT /api/v1/faq/sub-topics` |
| 15 | Thêm filter + field | `GET/POST/PUT /api/v1/faq/questions` |
| 16 | Thêm filter (join, không thêm cột) | `GET /api/v1/faq/answers` |
| 17 | Đã có ✓ | `GET /api/v1/faq/collections` |

---

## 7. Câu hỏi cần confirm trước khi làm

1. **Campuses** — có phân theo năm không?
2. **Tuition** — giữ tên param `year` hay đổi sang `admission_year`?
3. **FK constraint** — có muốn thêm `REFERENCES admission_years(year)` thật sự không, hay chỉ validate ở tầng application?
4. **Cascade delete** — có muốn bật không? Hay chỉ cần hard block khi có dữ liệu?
