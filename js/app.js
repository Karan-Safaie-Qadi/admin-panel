const App = (() => {
  let data = null;
  let currentRoute = 'dashboard';
  let charts = {};
  let toastTimer = null;

  const formatPrice = (num) => {
    return num.toLocaleString('fa-IR') + ' تومان';
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const map = {
      active: 'badge-success', delivered: 'badge-success',
      processing: 'badge-info', pending: 'badge-warning',
      cancelled: 'badge-danger', suspended: 'badge-danger',
      shipped: 'badge-accent', inactive: 'badge-danger',
    };
    const labels = {
      active: 'فعال', inactive: 'غیرفعال',
      pending: 'در انتظار', processing: 'در حال پردازش',
      shipped: 'ارسال شده', delivered: 'تحویل شده',
      cancelled: 'لغو شده', suspended: 'مسدود',
      admin: 'مدیر', editor: 'ویرایشگر', user: 'کاربر',
    };
    return `<span class="badge ${map[status] || 'badge-info'}">${labels[status] || status}</span>`;
  };

  /* ─────────── DATA LOADING ─────────── */
  const loadData = async () => {
    try {
      const res = await fetch('data/data.json');
      data = await res.json();
    } catch (e) {
      console.error('Failed to load data:', e);
    }
  };

  /* ─────────── ROUTER ─────────── */
  const navigate = (route) => {
    currentRoute = route;
    window.location.hash = route;
    renderPage(route);
    updateSidebar(route);
    updateNavBadges();
  };

  const updateSidebar = (route) => {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  };

  const renderPage = (route) => {
    document.querySelectorAll('.page-content').forEach(el => {
      el.classList.add('page-hidden');
    });
    const page = document.getElementById(`page-${route}`);
    if (page) {
      page.classList.remove('page-hidden');
      page.style.animation = 'none';
      void page.offsetHeight;
      page.style.animation = 'fadeInPage 0.5s ease';
    }
    const titles = {
      dashboard: 'داشبورد', products: 'مدیریت محصولات',
      categories: 'دسته‌بندی‌ها', orders: 'سفارشات',
      users: 'کاربران', reports: 'گزارشات'
    };
    const titleEl = document.querySelector('.page-title');
    if (titleEl) {
      titleEl.innerHTML = `${titles[route] || 'داشبورد'} <span>| پنل مدیریت</span>`;
    }
    const dispatch = {
      dashboard: () => { renderDashboard(); },
      products: () => { renderProducts(); },
      categories: () => { renderCategories(); },
      orders: () => { renderOrders(); },
      users: () => { renderUsers(); },
      reports: () => { renderReports(); },
    };
    if (dispatch[route]) dispatch[route]();
  };

  /* ─────────── TOAST ─────────── */
  const showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => toast.remove(), 400);
    }, 3000);
  };

  /* ─────────── MODAL ─────────── */
  const showModal = (html) => {
    let overlay = document.querySelector('.modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) hideModal();
      });
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="modal">${html}</div>`;
    overlay.classList.add('show');
  };

  const hideModal = () => {
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) overlay.classList.remove('show');
  };

  /* ─────────── DASHBOARD ─────────── */
  const renderDashboard = () => {
    if (!data) return;
    const totalProducts = data.products.length;
    const totalOrders = data.orders.length;
    const totalRevenue = data.orders.reduce((sum, o) => sum + o.total, 0);
    const totalUsers = data.users.length;

    document.querySelector('#stat-products .stat-value').textContent = totalProducts;
    document.querySelector('#stat-orders .stat-value').textContent = totalOrders;
    document.querySelector('#stat-revenue .stat-value').textContent = totalRevenue.toLocaleString('fa-IR') + ' ت';
    document.querySelector('#stat-users .stat-value').textContent = totalUsers;

    animateCounters();

    renderRecentOrders();
    initCharts();
    initFlowchart();
  };

  const animateCounters = () => {
    document.querySelectorAll('.stat-value').forEach(el => {
      const text = el.textContent;
      const num = parseInt(text.replace(/[^0-9]/g, ''));
      if (isNaN(num)) return;
      el.textContent = '0';
      let current = 0;
      const step = Math.max(1, Math.floor(num / 40));
      const interval = setInterval(() => {
        current += step;
        if (current >= num) {
          current = num;
          clearInterval(interval);
        }
        el.textContent = current.toLocaleString('fa-IR') + (text.includes('ت') ? ' تومان' : '');
      }, 30);
    });
  };

  const renderRecentOrders = () => {
    const tbody = document.querySelector('#recent-orders-table tbody');
    if (!tbody) return;
    const recent = [...data.orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    tbody.innerHTML = recent.map((o, i) => `
      <tr style="animation-delay: ${i * 0.1}s">
        <td>#${o.id}</td>
        <td>${o.customer}</td>
        <td>${o.items.join(', ')}</td>
        <td>${formatPrice(o.total)}</td>
        <td>${getStatusBadge(o.status)}</td>
        <td>${formatDate(o.date)}</td>
      </tr>
    `).join('');
  };

  /* ─────────── CHARTS ─────────── */
  const initCharts = () => {
    if (typeof Chart === 'undefined') return;

    if (charts.sales) charts.sales.destroy();
    if (charts.categories) charts.categories.destroy();
    if (charts.products) charts.products.destroy();

    const monthlyData = [45, 78, 62, 95, 120, 145, 132, 168, 190, 175, 210, 245];
    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
      charts.sales = new Chart(salesCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'فروش (میلیون)',
            data: monthlyData,
            borderColor: '#f5c842',
            backgroundColor: 'rgba(245, 200, 66, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#f5c842',
            pointBorderColor: '#f5c842',
            pointHoverRadius: 8,
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8899bb', font: { family: 'Vazirmatn, sans-serif' } } }
          },
          scales: {
            x: { grid: { color: 'rgba(30, 58, 95, 0.3)' }, ticks: { color: '#8899bb' } },
            y: { grid: { color: 'rgba(30, 58, 95, 0.3)' }, ticks: { color: '#8899bb' } }
          }
        }
      });
    }

    const catCtx = document.getElementById('categoryChart');
    if (catCtx && data) {
      const catData = data.categories.map(c => c.count);
      const catLabels = data.categories.map(c => c.name);
      const catColors = data.categories.map(c => c.color);
      charts.categories = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: catLabels,
          datasets: [{
            data: catData,
            backgroundColor: catColors,
            borderColor: '#0b1622',
            borderWidth: 3,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#8899bb', padding: 16, font: { family: 'Vazirmatn, sans-serif' } }
            }
          },
          cutout: '65%',
        }
      });
    }

    const prodCtx = document.getElementById('productChart');
    if (prodCtx && data) {
      const top = [...data.products].sort((a, b) => b.sales - a.sales).slice(0, 7);
      charts.products = new Chart(prodCtx, {
        type: 'bar',
        data: {
          labels: top.map(p => p.name),
          datasets: [{
            label: 'تعداد فروش',
            data: top.map(p => p.sales),
            backgroundColor: top.map(() => {
              const colors = ['#f5c842', '#4f46e5', '#10b981', '#ef4444', '#f59e0b', '#2196f3', '#ec4899'];
              return colors[Math.floor(Math.random() * colors.length)];
            }),
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: 'rgba(30, 58, 95, 0.3)' }, ticks: { color: '#8899bb' } },
            y: { grid: { display: false }, ticks: { color: '#8899bb', font: { size: 11 } } }
          }
        }
      });
    }
  };

  /* ─────────── FLOWCHART ─────────── */
  const initFlowchart = () => {
    const steps = document.querySelectorAll('.flow-step');
    const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
    const latestOrder = data.orders.reduce((latest, o) => {
      return new Date(o.date) > new Date(latest.date) ? o : latest;
    }, data.orders[0]);
    const currentIdx = statusOrder.indexOf(latestOrder.status);
    steps.forEach((step, i) => {
      step.classList.remove('active', 'completed');
      if (i < currentIdx) step.classList.add('completed');
      else if (i === currentIdx) step.classList.add('active');
    });
  };

  /* ─────────── PRODUCTS ─────────── */
  let productFilter = '';
  let productPage = 1;
  const PER_PAGE = 8;

  const renderProducts = () => {
    const tbody = document.querySelector('#products-table tbody');
    if (!tbody) return;
    let filtered = data.products;
    if (productFilter) {
      filtered = filtered.filter(p =>
        p.name.includes(productFilter) || p.category.includes(productFilter)
      );
    }
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    if (productPage > totalPages) productPage = Math.max(1, totalPages);
    const start = (productPage - 1) * PER_PAGE;
    const pageItems = filtered.slice(start, start + PER_PAGE);

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-table"><div class="empty-icon">📭</div><p>محصولی یافت نشد</p></div></td></tr>`;
    } else {
      tbody.innerHTML = pageItems.map((p, i) => `
        <tr style="animation-delay: ${i * 0.05}s">
          <td><span style="font-size:24px">${p.image}</span></td>
          <td><strong>${p.name}</strong><br><small style="color:var(--text-muted)">${p.description.slice(0, 40)}...</small></td>
          <td><span class="badge badge-accent">${p.category}</span></td>
          <td>${formatPrice(p.price)}</td>
          <td>${p.sales.toLocaleString('fa-IR')}</td>
          <td>${'⭐'.repeat(Math.floor(p.rating))} ${p.rating}</td>
          <td>${getStatusBadge(p.status)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-sm btn-secondary btn-icon" onclick="App.editProduct(${p.id})" title="ویرایش">✏️</button>
              <button class="btn btn-sm btn-danger btn-icon" onclick="App.deleteProduct(${p.id})" title="حذف">🗑️</button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    renderPagination(totalPages);
  };

  const renderPagination = (totalPages) => {
    const container = document.getElementById('products-pagination');
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }
    let html = '';
    if (productPage > 1) {
      html += `<button class="page-btn" onclick="App.setProductPage(${productPage - 1})">‹</button>`;
    }
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="page-btn ${i === productPage ? 'active' : ''}" onclick="App.setProductPage(${i})">${i}</button>`;
    }
    if (productPage < totalPages) {
      html += `<button class="page-btn" onclick="App.setProductPage(${productPage + 1})">›</button>`;
    }
    container.innerHTML = html;
  };

  const setProductPage = (page) => {
    productPage = page;
    renderProducts();
  };

  const filterProducts = (query) => {
    productFilter = query;
    productPage = 1;
    renderProducts();
  };

  const showAddProductModal = () => {
    const cats = data.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    showModal(`
      <div class="modal-header">
        <h3>➕ افزودن محصول جدید</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>نام محصول</label>
          <input class="form-control" id="prod-name" placeholder="نام محصول را وارد کنید">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>دسته‌بندی</label>
            <select class="form-control" id="prod-category">${cats}</select>
          </div>
          <div class="form-group">
            <label>قیمت (تومان)</label>
            <input class="form-control" id="prod-price" type="number" placeholder="قیمت">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>تعداد فروش</label>
            <input class="form-control" id="prod-sales" type="number" value="0">
          </div>
          <div class="form-group">
            <label>امتیاز</label>
            <input class="form-control" id="prod-rating" type="number" step="0.1" max="5" value="4.5">
          </div>
        </div>
        <div class="form-group">
          <label>توضیحات</label>
          <textarea class="form-control" id="prod-desc" placeholder="توضیحات محصول"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-primary" onclick="App.saveProduct()">💾 ذخیره محصول</button>
      </div>
    `);
  };

  const saveProduct = () => {
    const name = document.getElementById('prod-name')?.value.trim();
    const category = document.getElementById('prod-category')?.value;
    const price = parseInt(document.getElementById('prod-price')?.value);
    const sales = parseInt(document.getElementById('prod-sales')?.value) || 0;
    const rating = parseFloat(document.getElementById('prod-rating')?.value) || 4.5;
    const desc = document.getElementById('prod-desc')?.value.trim() || '';

    if (!name || !price) {
      showToast('لطفا نام و قیمت را وارد کنید', 'error');
      return;
    }

    const newId = Math.max(...data.products.map(p => p.id)) + 1;
    data.products.push({
      id: newId, name, category, price, sales, rating, stock: 999,
      status: 'active', createdAt: new Date().toISOString().split('T')[0],
      description: desc, image: '🆕'
    });

    const cat = data.categories.find(c => c.name === category);
    if (cat) cat.count++;

    hideModal();
    renderProducts();
    renderDashboard();
    showToast(`محصول "${name}" با موفقیت اضافه شد`, 'success');
  };

  const editProduct = (id) => {
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    const cats = data.categories.map(c =>
      `<option value="${c.name}" ${c.name === p.category ? 'selected' : ''}>${c.name}</option>`
    ).join('');
    showModal(`
      <div class="modal-header">
        <h3>✏️ ویرایش محصول</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>نام محصول</label>
          <input class="form-control" id="prod-name" value="${p.name}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>دسته‌بندی</label>
            <select class="form-control" id="prod-category">${cats}</select>
          </div>
          <div class="form-group">
            <label>قیمت (تومان)</label>
            <input class="form-control" id="prod-price" type="number" value="${p.price}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>تعداد فروش</label>
            <input class="form-control" id="prod-sales" type="number" value="${p.sales}">
          </div>
          <div class="form-group">
            <label>امتیاز</label>
            <input class="form-control" id="prod-rating" type="number" step="0.1" max="5" value="${p.rating}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>وضعیت</label>
            <select class="form-control" id="prod-status">
              <option value="active" ${p.status === 'active' ? 'selected' : ''}>فعال</option>
              <option value="inactive" ${p.status === 'inactive' ? 'selected' : ''}>غیرفعال</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>توضیحات</label>
          <textarea class="form-control" id="prod-desc">${p.description}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-primary" onclick="App.updateProduct(${id})">💾 بروزرسانی</button>
      </div>
    `);
  };

  const updateProduct = (id) => {
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    const name = document.getElementById('prod-name')?.value.trim();
    const category = document.getElementById('prod-category')?.value;
    const price = parseInt(document.getElementById('prod-price')?.value);
    const sales = parseInt(document.getElementById('prod-sales')?.value) || 0;
    const rating = parseFloat(document.getElementById('prod-rating')?.value) || 4.5;
    const status = document.getElementById('prod-status')?.value || 'active';
    const desc = document.getElementById('prod-desc')?.value.trim() || '';
    if (!name || !price) { showToast('لطفا نام و قیمت را وارد کنید', 'error'); return; }

    const oldCat = p.category;
    p.name = name; p.category = category; p.price = price;
    p.sales = sales; p.rating = rating; p.status = status; p.description = desc;

    if (oldCat !== category) {
      const old = data.categories.find(c => c.name === oldCat);
      if (old && old.count > 0) old.count--;
      const nu = data.categories.find(c => c.name === category);
      if (nu) nu.count++;
    }

    hideModal();
    renderProducts();
    showToast(`محصول "${name}" بروزرسانی شد`, 'success');
  };

  const deleteProduct = (id) => {
    const p = data.products.find(x => x.id === id);
    if (!p) return;
    showModal(`
      <div class="modal-header">
        <h3>⚠️ حذف محصول</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p>آیا از حذف محصول "<strong>${p.name}</strong>" اطمینان دارید؟</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-danger" onclick="App.confirmDelete(${id})">🗑️ حذف شود</button>
      </div>
    `);
  };

  const confirmDelete = (id) => {
    const idx = data.products.findIndex(x => x.id === id);
    if (idx === -1) return;
    const p = data.products[idx];
    const cat = data.categories.find(c => c.name === p.category);
    if (cat && cat.count > 0) cat.count--;
    data.products.splice(idx, 1);
    hideModal();
    renderProducts();
    renderDashboard();
    showToast(`محصول "${p.name}" حذف شد`, 'warning');
  };

  /* ─────────── CATEGORIES ─────────── */
  const renderCategories = () => {
    const grid = document.querySelector('#categories-grid');
    if (!grid) return;
    grid.innerHTML = data.categories.map((c, i) => `
      <div class="category-card animate-scale stagger-${(i % 4) + 1}" style="animation-delay: ${i * 0.1}s">
        <div class="cat-icon" style="background: ${c.color}20; color: ${c.color}">${c.icon}</div>
        <div class="cat-name">${c.name}</div>
        <div class="cat-count">${c.count} محصول</div>
        <div class="cat-actions">
          <button class="btn btn-sm btn-secondary btn-icon" onclick="App.editCategory(${c.id})">✏️</button>
          <button class="btn btn-sm btn-danger btn-icon" onclick="App.deleteCategory(${c.id})">🗑️</button>
        </div>
      </div>
    `).join('');
  };

  const showAddCategoryModal = () => {
    showModal(`
      <div class="modal-header">
        <h3>➕ دسته‌بندی جدید</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>نام دسته‌بندی</label>
          <input class="form-control" id="cat-name" placeholder="مثال: افزونه">
        </div>
        <div class="form-group">
          <label>آیکون (emoji)</label>
          <input class="form-control" id="cat-icon" placeholder="📦" value="📦">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-primary" onclick="App.saveCategory()">💾 ذخیره</button>
      </div>
    `);
  };

  const saveCategory = () => {
    const name = document.getElementById('cat-name')?.value.trim();
    const icon = document.getElementById('cat-icon')?.value.trim() || '📦';
    if (!name) { showToast('لطفا نام دسته‌بندی را وارد کنید', 'error'); return; }
    if (data.categories.find(c => c.name === name)) {
      showToast('این دسته‌بندی قبلا ثبت شده', 'error'); return;
    }
    const colors = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#2196f3', '#ec4899'];
    const newId = Math.max(...data.categories.map(c => c.id)) + 1;
    data.categories.push({
      id: newId, name, icon, count: 0,
      color: colors[newId % colors.length]
    });
    hideModal();
    renderCategories();
    showToast(`دسته‌بندی "${name}" اضافه شد`, 'success');
  };

  const editCategory = (id) => {
    const c = data.categories.find(x => x.id === id);
    if (!c) return;
    showModal(`
      <div class="modal-header">
        <h3>✏️ ویرایش دسته‌بندی</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>نام دسته‌بندی</label>
          <input class="form-control" id="cat-name" value="${c.name}">
        </div>
        <div class="form-group">
          <label>آیکون (emoji)</label>
          <input class="form-control" id="cat-icon" value="${c.icon}">
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-primary" onclick="App.updateCategory(${id})">💾 بروزرسانی</button>
      </div>
    `);
  };

  const updateCategory = (id) => {
    const c = data.categories.find(x => x.id === id);
    if (!c) return;
    const name = document.getElementById('cat-name')?.value.trim();
    const icon = document.getElementById('cat-icon')?.value.trim() || '📦';
    if (!name) { showToast('لطفا نام دسته‌بندی را وارد کنید', 'error'); return; }
    c.name = name; c.icon = icon;
    hideModal();
    renderCategories();
    showToast(`دسته‌بندی "${name}" بروزرسانی شد`, 'success');
  };

  const deleteCategory = (id) => {
    const c = data.categories.find(x => x.id === id);
    if (!c) return;
    if (c.count > 0) {
      showToast('این دسته‌بندی دارای محصول است و قابل حذف نیست', 'error');
      return;
    }
    showModal(`
      <div class="modal-header">
        <h3>⚠️ حذف دسته‌بندی</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p>آیا از حذف دسته‌بندی "<strong>${c.name}</strong>" اطمینان دارید؟</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-danger" onclick="App.confirmDeleteCategory(${id})">🗑️ حذف شود</button>
      </div>
    `);
  };

  const confirmDeleteCategory = (id) => {
    const idx = data.categories.findIndex(x => x.id === id);
    if (idx === -1) return;
    data.categories.splice(idx, 1);
    hideModal();
    renderCategories();
    showToast('دسته‌بندی حذف شد', 'warning');
  };

  /* ─────────── ORDERS ─────────── */
  let orderFilter = 'all';

  const renderOrders = () => {
    const tbody = document.querySelector('#orders-table tbody');
    if (!tbody) return;
    let filtered = orderFilter === 'all' ? data.orders : data.orders.filter(o => o.status === orderFilter);
    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-table"><div class="empty-icon">📭</div><p>سفارشی یافت نشد</p></div></td></tr>`;
      return;
    }
    tbody.innerHTML = filtered.map((o, i) => `
      <tr style="animation-delay: ${i * 0.05}s">
        <td>#${o.id}</td>
        <td>
          <div class="user-cell">
            <div class="user-avatar" style="background:var(--accent-light);color:var(--accent-dark)">👤</div>
            <div>
              <div class="user-name">${o.customer}</div>
              <div class="user-email">${o.email}</div>
            </div>
          </div>
        </td>
        <td>${o.items.join(', ')}</td>
        <td>${formatPrice(o.total)}</td>
        <td>${getStatusBadge(o.status)}</td>
        <td>${formatDate(o.date)}</td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="App.showOrderDetail(${o.id})">📋 جزئیات</button>
        </td>
      </tr>
    `).join('');
  };

  const filterOrders = (status) => {
    orderFilter = status;
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('btn-primary', b.dataset.status === status);
      b.classList.toggle('btn-secondary', b.dataset.status !== status);
    });
    renderOrders();
  };

  const showOrderDetail = (id) => {
    const o = data.orders.find(x => x.id === id);
    if (!o) return;
    showModal(`
      <div class="modal-header">
        <h3>📋 جزئیات سفارش #${o.id}</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>مشتری</label>
            <div style="padding:8px 0;font-weight:600">${o.customer}</div>
          </div>
          <div class="form-group">
            <label>ایمیل</label>
            <div style="padding:8px 0">${o.email}</div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>تاریخ ثبت</label>
            <div style="padding:8px 0">${formatDate(o.date)}</div>
          </div>
          <div class="form-group">
            <label>وضعیت</label>
            <div style="padding:8px 0">${getStatusBadge(o.status)}</div>
          </div>
        </div>
        <div class="form-group">
          <label>محصولات</label>
          <ul style="padding:8px 20px">
            ${o.items.map(item => `<li style="margin-bottom:4px">${item}</li>`).join('')}
          </ul>
        </div>
        <div class="form-group">
          <label>روش پرداخت</label>
          <div style="padding:8px 0">${o.payment === 'card' ? '💳 کارت بانکی' : '💰 کیف پول'}</div>
        </div>
        <div class="form-group">
          <label>مبلغ کل</label>
          <div style="padding:8px 0;font-size:20px;font-weight:800;color:var(--accent)">${formatPrice(o.total)}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">بستن</button>
      </div>
    `);
  };

  /* ─────────── USERS ─────────── */
  const renderUsers = () => {
    const tbody = document.querySelector('#users-table tbody');
    if (!tbody) return;
    tbody.innerHTML = data.users.map((u, i) => `
      <tr style="animation-delay: ${i * 0.05}s">
        <td>
          <div class="user-cell">
            <div class="user-avatar" style="background:rgba(245,200,66,0.15)">${u.avatar}</div>
            <div>
              <div class="user-name">${u.name}</div>
              <div class="user-email">${u.email}</div>
            </div>
          </div>
        </td>
        <td>${getStatusBadge(u.role)}</td>
        <td>${getStatusBadge(u.status)}</td>
        <td>${formatDate(u.joined)}</td>
        <td>
          <button class="toggle ${u.status === 'active' ? 'active' : ''}" onclick="App.toggleUserStatus(${u.id})"></button>
        </td>
        <td>
          <button class="btn btn-sm btn-danger btn-icon" onclick="App.deleteUser(${u.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  };

  const toggleUserStatus = (id) => {
    const u = data.users.find(x => x.id === id);
    if (!u) return;
    u.status = u.status === 'active' ? 'suspended' : 'active';
    renderUsers();
    showToast(`کاربر "${u.name}" ${u.status === 'active' ? 'فعال' : 'مسدود'} شد`, 'info');
  };

  const deleteUser = (id) => {
    const u = data.users.find(x => x.id === id);
    if (!u) return;
    if (u.role === 'admin') { showToast('مدیر سیستم قابل حذف نیست', 'error'); return; }
    showModal(`
      <div class="modal-header">
        <h3>⚠️ حذف کاربر</h3>
        <button class="modal-close" onclick="App.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p>آیا از حذف کاربر "<strong>${u.name}</strong>" اطمینان دارید؟</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="App.hideModal()">انصراف</button>
        <button class="btn btn-danger" onclick="App.confirmDeleteUser(${id})">🗑️ حذف شود</button>
      </div>
    `);
  };

  const confirmDeleteUser = (id) => {
    const idx = data.users.findIndex(x => x.id === id);
    if (idx === -1) return;
    data.users.splice(idx, 1);
    hideModal();
    renderUsers();
    showToast('کاربر حذف شد', 'warning');
  };

  /* ─────────── REPORTS ─────────── */
  const renderReports = () => {
    if (!data || typeof Chart === 'undefined') return;
    if (charts.reportSales) charts.reportSales.destroy();
    if (charts.reportCategory) charts.reportCategory.destroy();

    const monthlyData = [45, 78, 62, 95, 120, 145, 132, 168, 190, 175, 210, 245];
    const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

    const ctx1 = document.getElementById('reportSalesChart');
    if (ctx1) {
      charts.reportSales = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: months,
          datasets: [{
            label: 'فروش ماهانه (میلیون تومان)',
            data: monthlyData,
            backgroundColor: monthlyData.map(v =>
              v > 150 ? '#f5c842' : v > 100 ? '#4f46e5' : '#10b981'
            ),
            borderRadius: 8,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: '#8899bb', font: { family: 'Vazirmatn, sans-serif' } } }
          },
          scales: {
            x: { grid: { color: 'rgba(30, 58, 95, 0.3)' }, ticks: { color: '#8899bb' } },
            y: { grid: { color: 'rgba(30, 58, 95, 0.3)' }, ticks: { color: '#8899bb' } }
          }
        }
      });
    }

    const ctx2 = document.getElementById('reportCategoryChart');
    if (ctx2) {
      const revByCat = {};
      data.products.forEach(p => {
        revByCat[p.category] = (revByCat[p.category] || 0) + p.sales * p.price;
      });
      const labels = Object.keys(revByCat);
      const values = Object.values(revByCat);
      const colors = ['#f5c842', '#4f46e5', '#10b981', '#ef4444', '#f59e0b'];
      charts.reportCategory = new Chart(ctx2, {
        type: 'polarArea',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length).map(c => c + '99'),
            borderColor: colors.slice(0, labels.length),
            borderWidth: 2,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#8899bb', padding: 16, font: { family: 'Vazirmatn, sans-serif' } }
            }
          },
          scales: {
            r: {
              grid: { color: 'rgba(30, 58, 95, 0.3)' },
              ticks: { display: false }
            }
          }
        }
      });
    }

    document.querySelectorAll('.report-stat').forEach(el => {
      const key = el.dataset.key;
      if (key === 'avg-order') {
        const avg = data.orders.reduce((s, o) => s + o.total, 0) / data.orders.length;
        el.textContent = formatPrice(Math.round(avg));
      } else if (key === 'top-product') {
        const top = [...data.products].sort((a, b) => b.sales - a.sales)[0];
        el.textContent = top ? top.name : '—';
      } else if (key === 'total-revenue') {
        const rev = data.orders.reduce((s, o) => s + o.total, 0);
        el.textContent = formatPrice(rev);
      } else if (key === 'total-orders') {
        el.textContent = data.orders.length.toLocaleString('fa-IR');
      }
    });
  };

  /* ─────────── SIDEBAR TOGGLE ─────────── */
  const toggleSidebar = () => {
    document.querySelector('.sidebar').classList.toggle('open');
  };

  /* ─────────── INIT ─────────── */
  const updateNavBadges = () => {
    const prodCount = document.getElementById('nav-product-count');
    const orderCount = document.getElementById('nav-order-count');
    if (prodCount) prodCount.textContent = data?.products?.length || 0;
    if (orderCount) orderCount.textContent = data?.orders?.length || 0;
  };

  const init = async () => {
    await loadData();
    updateNavBadges();

    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(item.dataset.route);
        if (window.innerWidth <= 768) toggleSidebar();
      });
    });

    window.addEventListener('hashchange', () => {
      const route = window.location.hash.slice(1) || 'dashboard';
      navigate(route);
    });

    document.querySelector('.hamburger')?.addEventListener('click', toggleSidebar);

    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) document.querySelector('.sidebar')?.classList.remove('open');
    });

    const initialRoute = window.location.hash.slice(1) || 'dashboard';
    navigate(initialRoute);
  };

  window.addEventListener('DOMContentLoaded', init);

  return {
    navigate, hideModal, showToast,
    setProductPage, filterProducts, showAddProductModal, saveProduct, editProduct, updateProduct, deleteProduct, confirmDelete,
    showAddCategoryModal, saveCategory, editCategory, updateCategory, deleteCategory, confirmDeleteCategory,
    filterOrders, showOrderDetail,
    toggleUserStatus, deleteUser, confirmDeleteUser,
    renderDashboard, renderProducts, renderOrders, renderCategories, renderUsers, renderReports,
    toggleSidebar,
  };
})();

window.App = App;
