# SPEC.md — Hệ thống QR Review thông minh

## 1. Concept & Vision

**Tên hệ thống:** QRReview — Hệ thống đánh giá qua mã QR thông minh

Một nền tảng SaaS cho phép các doanh nghiệp tạo mã QR để thu thập đánh giá từ khách hàng. Khi quét mã QR, khách hàng nhận được một mẫu đánh giá (có thể là pre-generated hoặc AI-generated) duy nhất, đảm bảo mỗi đánh giá chỉ được sử dụng một lần. Hệ thống tự động điều hướng đánh giá đến Google Reviews hoặc lưu trữ nội bộ.

**Guiding principle:** Đơn giản, nhanh, rẻ, hiệu quả. Không over-engineering.

---

## 2. Design Language

### Color Palette
- **Primary:** `#6366F1` (Indigo — tạo cảm giác chuyên nghiệp, công nghệ)
- **Primary Dark:** `#4F46E5`
- **Secondary:** `#10B981` (Emerald — thành công, tích cực)
- **Accent:** `#F59E0B` (Amber — nhấn mạnh, cảnh báo)
- **Background:** `#F8FAFC`
- **Surface:** `#FFFFFF`
- **Text Primary:** `#1E293B`
- **Text Secondary:** `#64748B`
- **Border:** `#E2E8F0`
- **Error:** `#EF4444`
- **Success:** `#22C55E`

### Typography
- **Font Family:** `Inter` (Google Fonts) — clean, modern, readable in Vietnamese
- **Headings:** 600–700 weight
- **Body:** 400–500 weight
- **Vietnamese special:** Ensure `font-display: swap` for fast loading

### Spacing System
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64
- Border radius: 8px (cards), 6px (inputs), 12px (modals)

### Motion Philosophy
- Subtle transitions: 150–200ms ease
- Loading states: skeleton shimmer
- Page transitions: fade 200ms
- No heavy animations (mobile-first priority)

---

## 3. Architecture Overview

### Next.js Fullstack Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Dashboard│  │   QR     │  │  Review Scanner  │  │
│  │ (Admin)  │  │ Manager  │  │   (Public Page)  │  │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │
│       │            │                  │             │
│  ┌────▼────────────▼──────────────────▼─────────┐  │
│  │           Server Actions + Route Handlers      │  │
│  └────────────────────┬─────────────────────────┘  │
└───────────────────────┼─────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                    BACKEND                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │  Prisma  │  │ OpenAI   │  │   Cloudinary     │  │
│  │   ORM    │  │ (Review) │  │   (Logos/SVG)   │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Data Flow: QR Scan

```
[User scans QR] → [GET /api/scan/:code]
                    → [Find QR code + company]
                    → [Get 1 unused pre-generated review OR generate AI review]
                    → [Mark review as used]
                    → [Return review form]
                    → [User submits]
                    → [Save review → redirect to Google (if configured)]
```

---

## 4. Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String
  role          Role      @default(USER)
  companies     Company[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  ADMIN
  USER
}

model Company {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  name          String
  address       String
  category      String
  googleMapsUrl String?
  googleReviewUrl String?
  hashtags      String?
  placeId       String?
  logoUrl       String?
  qrCodes       QrCode[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([userId])
  @@index([name, address, category])
}

model QrCode {
  id          String    @id @default(cuid())
  companyId   String
  company     Company   @relation(fields: [companyId], references: [id])
  code        String    @unique  // short unique code e.g. "ABC123"
  socialLinks Json?     // { facebook?: string, tiktok?: string }
  isActive    Boolean   @default(true)
  reviews     Review[]
  createdAt   DateTime  @default(now())

  @@index([companyId])
  @@index([code])
}

model Review {
  id           String      @id @default(cuid())
  qrCodeId     String
  qrCode       QrCode      @relation(fields: [qrCodeId], references: [id])
  content      String
  rating       Int         // 1-5 stars
  customerName String?
  customerPhone String?
  status       ReviewStatus @default(PENDING)
  isAiGenerated Boolean    @default(false)
  usedAt       DateTime?
  createdAt    DateTime    @default(now())

  @@index([qrCodeId])
  @@index([status])
}

enum ReviewStatus {
  PENDING      // Giữ chỗ, chưa dùng
  USED         // Đã scan, đang nhập đánh giá
  SUBMITTED    // Đã gửi đánh giá
  EXPIRED      // Hết hạn (optional)
}

model PreGeneratedReview {
  id          String   @id @default(cuid())
  companyId   String
  content     String
  isUsed      Boolean  @default(false)
  createdAt   DateTime @default(now())

  @@index([companyId])
  @@index([isUsed])
}
```

---

## 5. Folder Structure

```
review-ai/
├── app/
│   ├── (auth)/                    # Auth group
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/               # Protected dashboard group
│   │   ├── layout.tsx
│   │   ├── companies/
│   │   │   ├── page.tsx           # List companies
│   │   │   ├── new/page.tsx       # Create company (Google Places)
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Company detail
│   │   │       ├── edit/page.tsx
│   │   │       └── qr-codes/
│   │   │           └── page.tsx   # Manage QR codes
│   │   ├── reviews/
│   │   │   └── page.tsx           # All reviews
│   │   ├── settings/page.tsx
│   │   └── page.tsx               # Dashboard home
│   ├── scan/[code]/               # Public QR scan page
│   │   ├── page.tsx               # Review form
│   │   └── submitted/page.tsx      # Thank you page
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── companies/route.ts
│   │   ├── qr-codes/route.ts
│   │   ├── scan/[code]/route.ts   # QR scan API
│   │   ├── reviews/route.ts
│   │   └── places/route.ts         # Google Places proxy
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                   # Landing / redirect
├── components/
│   ├── ui/                        # Reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   └── Skeleton.tsx
│   ├── dashboard/                 # Dashboard components
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   ├── CompanyForm.tsx
│   │   └── QrCodeCard.tsx
│   ├── scan/                      # Public scan components
│   │   ├── ReviewForm.tsx
│   │   └── QrPreview.tsx
│   └── qr/                        # QR generation
│       ├── QrGenerator.tsx
│       └── QrWithLogo.tsx
├── lib/
│   ├── prisma.ts                  # Prisma singleton
│   ├── auth.ts                    # Auth config
│   ├── google-places.ts           # Google Places API helper
│   ├── openai.ts                  # OpenAI client
│   ├── qr.ts                      # QR code generation
│   ├── utils.ts                   # Utilities
│   └── validators.ts              # Zod schemas
├── actions/
│   ├── auth.ts                    # Login, register actions
│   ├── company.ts                 # Company CRUD actions
│   ├── qr-code.ts                 # QR code actions
│   └── review.ts                  # Review actions
├── types/
│   └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── logo-placeholder.svg
├── .env.local
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

---

## 6. API Routes Design

### Server Actions (for mutations)

| Action | Type | Purpose |
|--------|------|---------|
| `createCompany(data)` | Server Action | Tạo khách hàng mới |
| `updateCompany(id, data)` | Server Action | Cập nhật khách hàng |
| `deleteCompany(id)` | Server Action | Xóa khách hàng |
| `createQrCode(companyId)` | Server Action | Tạo mã QR |
| `deleteQrCode(id)` | Server Action | Xóa mã QR |
| `submitReview(data)` | Server Action | Gửi đánh giá |
| `login(email, password)` | Server Action | Đăng nhập |
| `register(data)` | Server Action | Đăng ký |

### Route Handlers (for reads/GET)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/scan/[code]` | GET | Quét QR → lấy review |
| `/api/places/search` | GET | Tìm kiếm Google Places |
| `/api/places/autocomplete` | GET | Google Places autocomplete |
| `/api/qr-codes/[id]/svg` | GET | Generate QR SVG với logo |

### Review Lifecycle

```
1. [Create Company] → Pre-generate N reviews (e.g. 100)
   └── Stored in PreGeneratedReview table, isUsed=false

2. [User scans QR] → /api/scan/[code]
   ├── Find QR code → get companyId
   ├── Try: Get 1 PreGeneratedReview where isUsed=false
   │   └── If found → mark isUsed=true, use it
   ├── If none available → Generate via OpenAI
   └── Create Review with status=PENDING
   └── Return review content + form

3. [User submits form] → submitReview action
   ├── Update Review: status=SUBMITTED, usedAt=now
   ├── If company has googleReviewUrl → redirect user
   └── Show thank you page

4. [Admin views] → Dashboard shows reviews with status filter
```

---

## 7. AI Integration Strategy

### When AI is triggered
- When scanning a QR code and no pre-generated reviews are available
- Or when pre-generated reviews are exhausted

### How it works
1. On QR scan, query `PreGeneratedReview` for `isUsed=false`
2. If count < threshold (e.g., <10 remaining), trigger background AI generation
3. If none found, call OpenAI API in real-time

### Prompt engineering

**System prompt:**
```
Bạn là chuyên gia viết đánh giá cho nhà hàng/doanh nghiệp.
Viết 5 đánh giá ngắn, tự nhiên, đa dạng (50-100 từ mỗi đánh giá).
Mỗi đánh giá có:
- Ưu điểm cụ thể
- Giọng điệu khác nhau (có người vui, có người bình thường)
- Rating 4-5 sao
- KHÔNG có tên người cụ thể

Format output: JSON array
[
  {"content": "...", "rating": 5},
  {"content": "...", "rating": 4}
]
```

### Cost optimization
- Pre-generate 100 reviews per company at creation time
- AI generation only as backup/fallback
- Cache AI responses (same company, similar prompts)

---

## 8. Google Places Integration

### Autocomplete flow
```
[User types in search box]
  → Debounce 300ms
  → Call /api/places/autocomplete?q=...
  → Show dropdown with results
  → User selects a place
  → Call /api/places/details?placeId=...
  → Auto-fill form fields
```

### API Design
- Server-side proxy to protect API key
- Rate limiting: 10 requests/minute per user
- Cache autocomplete results for 5 minutes

---

## 9. RBAC Implementation

### Role-based access

```typescript
// Middleware-like check in Server Actions
async function checkAccess(userId: string, resourceId: string, action: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.role === 'ADMIN') return true; // Admin has full access

  // User can only access their own companies
  const company = await prisma.company.findUnique({ where: { id: resourceId } });
  return company.userId === userId;
}
```

### Middleware (Next.js)
```typescript
// middleware.ts - protect dashboard routes
// - Allow /login, /register, /scan/[code] publicly
// - Redirect unauthenticated users to /login
// - For /dashboard/*: check role in session
```

---

## 10. QR Code Generation (with logo overlay)

### Strategy: SVG + Canvas hybrid

1. Generate QR code as SVG using `qrcode` library
2. Overlay logo (SVG or PNG) in center using Canvas
3. Upload combined image to Cloudinary for CDN delivery
4. Store Cloudinary URL in database

### For dynamic generation (scan page)
- Generate QR SVG on-the-fly at `/api/qr-codes/[id]/svg`
- Include brand logo as inline SVG data URI
- Return SVG response with proper headers

---

## 11. Performance Optimization

### Caching Strategy
- **Static pages:** ISR with 1-hour revalidation (dashboard pages)
- **Dynamic pages:** On-demand revalidation with tags
- **API responses:** Cache-Control headers for scan API
- **Database:** Indexed fields for all filter operations

### Edge Deployment (Vercel)
- API routes at edge runtime for scan endpoints
- Static generation for landing pages
- ISR for dashboard with frequent data

### Database Optimization
- Connection pooling via Prisma
- Batch inserts for pre-generated reviews
- Pagination for review lists (cursor-based)

---

## 12. Deployment Strategy (Vercel)

### Environment Variables
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
OPENAI_API_KEY=...
GOOGLE_PLACES_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Deployment flow
1. Push to GitHub
2. Vercel auto-deploys
3. Prisma migrate runs on deployment (via CI/CD hook)
4. Seed data for initial admin user

---

## 13. UI Components & States

### Required Components

**Dashboard Sidebar**
- Logo + app name
- Navigation links: Dashboard, Companies, Reviews, Settings
- User profile section at bottom
- Active state highlighting

**Company List**
- Search/filter bar (name, address, category)
- Sortable table with columns: Name, Address, Category, QR Codes, Reviews, Actions
- Pagination (20 items/page)
- Empty state: "Chưa có khách hàng nào"

**Company Form**
- Google Places autocomplete input
- Name, Address, Category (auto-filled from Places)
- Google Maps URL, Google Review URL
- Hashtags input
- Logo upload
- Save / Cancel buttons

**QR Code Card**
- QR code preview (small)
- Unique code display
- Social links toggle
- Download button (PNG/SVG)
- Delete button
- Active/Inactive badge

**Review Form (public scan page)**
- Company name header
- Star rating selector (1-5)
- Review content textarea (with AI-generated content pre-filled)
- Customer name + phone (optional)
- Submit button
- Google Reviews redirect option

**Review List (dashboard)**
- Filter by status, rating, date range
- Table: Date, QR Code, Content, Rating, Customer, Status
- Export to CSV

---

## 14. Error Handling

| Scenario | Response |
|----------|----------|
| Invalid QR code | 404 page with "Mã QR không hợp lệ" |
| QR code inactive | 404 page with "Mã QR đã bị vô hiệu hóa" |
| Review already used | Warning with "Đánh giá này đã được sử dụng" |
| AI API failure | Fallback to manual review form (no pre-filled content) |
| Google Places API failure | Show manual input form |
| Database error | Generic 500 error page |
| Auth failure | Redirect to login with message |

---

## 15. Vietnamese UI Text

All UI elements use Vietnamese:

```
Đăng nhập / Đăng ký / Đăng xuất
Quản lý khách hàng / Thêm khách hàng mới / Chỉnh sửa
Mã QR / Tạo mã QR / Tải xuống
Đánh giá / Xem đánh giá / Gửi đánh giá
Tìm kiếm / Lọc / Sắp xếp
Đang tải... / Không có dữ liệu / Lỗi
Chọn địa điểm từ Google Maps
Nhập đánh giá của bạn
Gửi đánh giá → Đang gửi...
Cảm ơn bạn đã đánh giá!
```