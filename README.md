# ⚡ Digital Store Admin Panel

**A modern, feature-rich SPA admin panel for digital products stores.** Built with vanilla JavaScript, featuring real-time charts, CRUD operations, order flow visualization, and a sleek dark blue theme with golden accents.

---

## ✨ Features

- **📊 Interactive Dashboard** — Sales charts (line, bar, doughnut), animated stat counters, order flow diagram, and recent orders table
- **📦 Product Management** — Full CRUD with search, pagination, and status management
- **📁 Category Management** — Visual category cards with product counts
- **🛒 Order Management** — Status filtering and detailed order view
- **👥 User Management** — Role badges, status toggle (active/suspended)
- **📈 Reports** — Monthly sales bar chart, revenue polar area chart, key metrics
- **🎨 Modern UI** — Dark blue theme, golden accent, glassmorphism, smooth animations
- **🌐 RTL Support** — Full Persian/Farsi language support with Vazirmatn font
- **📱 Responsive** — Mobile-friendly sidebar, adaptive grid layouts

---

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| **Core** | Vanilla JavaScript, HTML5, CSS3 |
| **Charts** | Chart.js 4.x |
| **Icons** | Emoji / Unicode |
| **Font** | Vazirmatn (Persian), Segoe UI |
| **Styling** | CSS Custom Properties, Flexbox, Grid |
| **Architecture** | SPA (Hash-based Router) |
| **Data** | Local JSON file |

---

## 📸 Screenshots

> Screenshots coming soon!  
> *Check the `/screenshots` directory for future previews.*

---

## 🚀 Installation

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge)
- Python 3 or Node.js (for local server)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Karan-Safaie-Qadi/admin-panel.git
cd admin-panel

# Option 1: Python HTTP Server
python -m http.server 8000

# Option 2: Node.js Serve
npx serve .

# Option 3: Docker
docker-compose up
```

Then open `http://localhost:8000` (or the shown port) in your browser.

> **Note:** No build step required. This is pure HTML/CSS/JS.

---

## 📖 Usage

Navigate through the sidebar to access different sections:

| Page | Description |
|------|-------------|
| **Dashboard** | Overview with stats, charts, and recent orders |
| **Products** | Manage product catalog (add/edit/delete) |
| **Categories** | Organize products by category |
| **Orders** | Track and filter customer orders |
| **Users** | Manage user accounts and permissions |
| **Reports** | Sales analytics and revenue insights |

---

## 📁 Project Structure

```
admin-panel/
├── index.html         # SPA entry point (all page templates)
├── css/
│   └── style.css      # Full stylesheet (dark theme, animations, RTL)
├── js/
│   └── app.js         # Application logic (router, CRUD, charts)
├── data/
│   └── data.json      # Test data (products, categories, orders, users)
├── docs/              # Documentation files
├── .github/           # GitHub templates and workflows
├── screenshots/       # Preview images
├── tests/             # Test files
├── examples/          # Usage examples
├── Dockerfile         # Container deployment
├── docker-compose.yml # Docker orchestration
├── package.json       # Dev scripts
└── README.md          # This file
```

---

## 🤝 Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) guide.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

---

# ⚡ پنل مدیریت فروشگاه دیجیتال

**یک پنل مدیریت SPA مدرن و کامل برای فروشگاه‌های محصولات دیجیتال.** ساخته شده با JavaScript خالص، همراه با نمودارهای实时، عملیات CRUD، فلوچارت سفارشات و طراحی شیک آبی تیره با تم طلایی.

---

## ✨ ویژگی‌ها

- **📊 داشبورد تعاملی** — نمودارهای فروش (خطی، میله‌ای، حلقوی)، شمارنده‌های متحرک، فلوچارت وضعیت سفارشات و جدول آخرین سفارشات
- **📦 مدیریت محصولات** — CRUD کامل با جستجو، صفحه‌بندی و مدیریت وضعیت
- **📁 مدیریت دسته‌بندی‌ها** — کارت‌های گرافیکی دسته‌بندی با نمایش تعداد محصولات
- **🛒 مدیریت سفارشات** — فیلتر بر اساس وضعیت و نمایش جزئیات سفارش
- **👥 مدیریت کاربران** — نشان نقش، فعال/غیرفعال کردن حساب
- **📈 گزارشات** — نمودار فروش ماهانه، نمودار قطبی درآمد، آمار کلیدی
- **🎨 طراحی مدرن** — تم آبی تیره، اکسنت طلایی، افکت شیشه‌ای، انیمیشن‌های نرم
- **🌐 پشتیبانی از RTL** — زبان فارسی با فونت وزیرمتن
- **📱 واکنش‌گرا** — سایدبار موبایل پسند، گریدهای تطبیقی

---

## 🛠 تکنولوژی‌های استفاده شده

| دسته | تکنولوژی |
|------|----------|
| **هسته** | JavaScript خالص، HTML5، CSS3 |
| **نمودار** | Chart.js 4.x |
| **آیکون** | Emoji / یونیکد |
| **فونت** | وزیرمتن (فارسی)، Segoe UI |
| **ظاهر** | CSS Custom Properties، Flexbox، Grid |
| **معماری** | SPA (مسیریاب مبتنی بر Hash) |
| **داده** | فایل JSON محلی |

---

## 📸 پیش‌نمایش

> به زودی تصاویر اضافه می‌شوند.  
> *برای پیش‌نمایش‌های آینده به پوشه `/screenshots` مراجعه کنید.*
