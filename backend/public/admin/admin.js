const modules = [
  ['dashboard', 'Dashboard', 'Overview'],
  ['users', 'Users', 'Operations'],
  ['kyc', 'KYC Verification', 'Operations'],
  ['wallet', 'Wallets', 'Operations'],
  ['chats', 'Chat Monitor', 'Operations'],
  ['withdrawals', 'Withdrawals', 'Operations'],
  ['categories', 'Categories', 'Catalog'],
  ['products', 'Products', 'Catalog'],
  ['orders', 'Orders', 'Commerce'],
  ['reports', 'Reports', 'Insights'],
  ['settings', 'Settings', 'System'],
];

const state = {
  active: 'dashboard',
  dashboard: null,
  users: [],
  categories: [],
  products: [],
  orders: [],
  kyc: [],
  walletTransactions: [],
  chats: [],
  withdrawals: [],
  reports: null,
  settings: {},
  confirm: null,
};

const tokenKey = 'adminToken';
const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  $('loginForm').addEventListener('submit', login);
  if (localStorage.getItem(tokenKey)) showApp();
});

function showApp() {
  $('loginPage').style.display = 'none';
  $('app').style.display = 'block';
  loadAll();
}

function logout() {
  localStorage.removeItem(tokenKey);
  location.reload();
}

async function login(event) {
  event.preventDefault();
  $('loginError').className = 'notice';
  $('loginButton').disabled = true;
  $('loginButton').textContent = 'Signing in...';
  try {
    const res = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email: $('email').value, password: $('password').value }),
    }, false);
    localStorage.setItem(tokenKey, res.data.token);
    showApp();
  } catch (error) {
    $('loginError').textContent = error.message;
    $('loginError').className = 'notice error';
  } finally {
    $('loginButton').disabled = false;
    $('loginButton').textContent = 'Sign In';
  }
}

async function api(path, options = {}, auth = true) {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (auth) headers.set('Authorization', `Bearer ${localStorage.getItem(tokenKey) || ''}`);

  const response = await fetch(path, { ...options, headers });
  const payload = await response.json().catch(() => ({ success: false, message: 'Unexpected server response' }));
  if (!response.ok || !payload.success) {
    if (response.status === 401) logout();
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}

function renderNav() {
  const groups = [...new Set(modules.map((item) => item[2]))];
  $('nav').innerHTML = groups.map((group) => `
    <div class="nav-group">${group}</div>
    ${modules.filter((item) => item[2] === group).map(([id, label]) => `
      <button type="button" class="nav-btn ${state.active === id ? 'active' : ''}" onclick="setModule('${id}')">
        <span>${iconFor(id)}</span><span>${label}</span>
      </button>
    `).join('')}
  `).join('');
}

function setModule(id) {
  state.active = id;
  const mod = modules.find((item) => item[0] === id);
  $('moduleTitle').textContent = mod[1];
  $('moduleGroup').textContent = mod[2];
  toggleSidebar(false);
  renderNav();
  renderView();
}

function toggleSidebar(open) {
  $('sidebar').classList.toggle('open', open);
}

async function loadAll() {
  showLoading(true);
  try {
    const [dashboard, users, categories, products, orders, kyc, wallet, chats, withdrawals, reports, settings] = await Promise.all([
      api('/api/admin/dashboard'),
      api('/api/admin/users?page=1&limit=20'),
      api('/api/admin/categories'),
      api('/api/admin/products'),
      api('/api/admin/orders'),
      api('/api/admin/kyc'),
      api('/api/admin/wallet/transactions'),
      api('/api/admin/chats'),
      api('/api/admin/withdrawals'),
      api('/api/admin/reports'),
      api('/api/admin/settings'),
    ]);

    state.dashboard = dashboard.data.dashboard || {};
    state.users = users.data.users || [];
    state.categories = categories.data.categories || [];
    state.products = products.data.products || [];
    state.orders = orders.data.orders || [];
    state.kyc = kyc.data.requests || [];
    state.walletTransactions = wallet.data.transactions || [];
    state.chats = chats.data.chats || [];
    state.withdrawals = withdrawals.data.withdrawals || [];
    state.reports = reports.data.reports || {};
    state.settings = settings.data.settings || {};
    renderView();
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function renderView() {
  if (state.active === 'dashboard') return renderDashboard();
  if (state.active === 'users') return renderUsers();
  if (state.active === 'categories') return renderCategories();
  if (state.active === 'products') return renderProducts();
  if (state.active === 'orders') return renderOrders();
  if (state.active === 'kyc') return renderKyc();
  if (state.active === 'wallet') return renderWallet();
  if (state.active === 'chats') return renderChats();
  if (state.active === 'withdrawals') return renderWithdrawals();
  if (state.active === 'reports') return renderReports();
  return renderSettings();
}

function renderDashboard() {
  const d = state.dashboard || {};
  $('view').innerHTML = `
    <div class="grid metrics">
      ${metric('Total Users', d.totalUsers || 0, 'US')}
      ${metric('Revenue', rupees(d.revenue || 0), 'INR')}
      ${metric('Orders', d.totalOrders || 0, 'OR')}
      ${metric('Products', d.totalProducts || 0, 'PR')}
      ${metric('Pending KYC', d.pendingKyc || 0, 'KY')}
      ${metric('Withdrawals', d.pendingWithdrawals || 0, 'WD')}
      ${metric('Active Chats', d.activeChats || 0, 'CH')}
      ${metric('Coins Sold', d.coinsSold || 0, 'CO')}
    </div>
    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-top: 14px;">
      ${panel('Revenue Chart', chart([32, 46, 40, 64, 58, 78, 88]))}
      ${panel('User Growth', chart([18, 26, 36, 44, 56, 72, 82]))}
    </div>
    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); margin-top: 14px;">
      ${panel('Recent Users', simpleList(state.users, ['name', 'email', 'status']))}
      ${panel('Recent Orders', simpleList(state.orders, ['id', 'status', 'total_amount']))}
    </div>
  `;
}

function renderUsers() {
  $('view').innerHTML = panel('Users', `
    <div class="toolbar">
      <input id="userSearch" class="input" placeholder="Search users" oninput="filterUsers()" />
      <select id="userStatus" class="select" onchange="filterUsers()">
        <option value="">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="blocked">Blocked</option>
        <option value="deleted">Deleted</option>
      </select>
    </div>
    <div id="usersTable">${usersTable(state.users)}</div>
  `);
}

function filterUsers() {
  const term = $('userSearch').value.toLowerCase();
  const status = $('userStatus').value;
  const rows = state.users.filter((u) => {
    const matchesSearch = [u.name, u.email, u.phone].join(' ').toLowerCase().includes(term);
    const matchesStatus = !status || u.status === status;
    return matchesSearch && matchesStatus;
  });
  $('usersTable').innerHTML = usersTable(rows);
}

function usersTable(users) {
  if (!users.length) return empty('No users found', 'No Data Found. Try another search or filter.');
  return table(['Name', 'Email', 'Mobile', 'Role', 'Status', 'Actions'], users.map((u) => [
    `<strong>${escapeHtml(u.name)}</strong><br><span class="muted">ID ${u.id}</span>`,
    escapeHtml(u.email || '-'),
    escapeHtml(u.phone || '-'),
    escapeHtml(u.role || '-'),
    statusBadge(u.status),
    `<div class="actions">
      <button class="btn secondary" onclick="confirmUserStatus(${u.id})">${u.status === 'active' ? 'Deactivate' : 'Activate'}</button>
      <button class="btn danger" onclick="confirmDeleteUser(${u.id})">Delete</button>
    </div>`,
  ]));
}

function renderCategories() {
  $('view').innerHTML = `
    <div class="grid catalog-layout">
      ${panel('Create Category', categoryForm())}
      ${panel('Category List', state.categories.length ? table(['Name', 'Slug', 'Active', 'Actions'], state.categories.map((c) => [
        escapeHtml(c.name), escapeHtml(c.slug), statusBadge(c.active ? 'active' : 'inactive'),
        `<div class="actions"><button class="btn secondary" onclick="editCategory(${c.id})">Edit</button><button class="btn danger" onclick="confirmDeleteCategory(${c.id})">Delete</button></div>`
      ])) : empty('No categories yet', 'No Data Found. Create your first category.'))}
    </div>
  `;
}

function categoryForm(category = {}) {
  return `
    <form class="form-grid" onsubmit="saveCategory(event, ${category.id || 'null'})">
      <label class="field"><span>Name</span><input class="input" name="name" value="${escapeAttr(category.name || '')}" required /></label>
      <label class="field"><span>Slug</span><input class="input" name="slug" value="${escapeAttr(category.slug || '')}" required /></label>
      <label class="field"><span>Description</span><textarea class="input" name="description">${escapeHtml(category.description || '')}</textarea></label>
      <label class="field"><span>Image URL</span><input class="input" name="imageUrl" value="${escapeAttr(category.image_url || category.imageUrl || '')}" /></label>
      <label><input type="checkbox" name="active" ${category.active === false ? '' : 'checked'} /> Active</label>
      <button class="btn" type="submit">${category.id ? 'Update' : 'Create'} Category</button>
    </form>
  `;
}

async function saveCategory(event, id) {
  event.preventDefault();
  const data = formData(event.target);
  data.active = event.target.active.checked;
  await save(async () => {
    if (id) await api(`/api/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    else await api('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) });
    showNotice('Category saved.', 'success');
    await loadAll();
  });
}

function editCategory(id) {
  const category = state.categories.find((item) => item.id === id);
  $('view').querySelector('.panel-body').innerHTML = categoryForm(category);
}

function renderProducts() {
  $('view').innerHTML = `
    <div class="grid catalog-layout">
      ${panel('Create Product', productForm())}
      ${panel('Product List', state.products.length ? table(['Name', 'Price', 'Coins', 'Active', 'Actions'], state.products.map((p) => [
        escapeHtml(p.name), rupees(p.price || 0), p.coins || 0, statusBadge(p.active ? 'active' : 'inactive'),
        `<div class="actions"><button class="btn secondary" onclick="editProduct(${p.id})">Edit</button><button class="btn danger" onclick="confirmDeleteProduct(${p.id})">Delete</button></div>`
      ])) : empty('No products yet', 'No Data Found. Create products or coin packages.'))}
    </div>
  `;
}

function productForm(product = {}) {
  return `
    <form class="form-grid" onsubmit="saveProduct(event, ${product.id || 'null'})">
      <label class="field"><span>Category</span><select class="select" name="categoryId">
        <option value="">No category</option>
        ${state.categories.map((c) => `<option value="${c.id}" ${String(product.category_id || product.categoryId || '') === String(c.id) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
      </select></label>
      <label class="field"><span>Name</span><input class="input" name="name" value="${escapeAttr(product.name || '')}" required /></label>
      <label class="field"><span>Slug</span><input class="input" name="slug" value="${escapeAttr(product.slug || '')}" required /></label>
      <label class="field"><span>Description</span><textarea class="input" name="description">${escapeHtml(product.description || '')}</textarea></label>
      <div class="grid two-col">
        <label class="field"><span>Price</span><input class="input" type="number" name="price" value="${escapeAttr(product.price || '')}" /></label>
        <label class="field"><span>Coins</span><input class="input" type="number" name="coins" value="${escapeAttr(product.coins || '')}" /></label>
      </div>
      <label class="field"><span>Image URL</span><input class="input" name="imageUrl" value="${escapeAttr(product.image_url || product.imageUrl || '')}" /></label>
      <label><input type="checkbox" name="active" ${product.active === false ? '' : 'checked'} /> Active</label>
      <button class="btn" type="submit">${product.id ? 'Update' : 'Create'} Product</button>
    </form>
  `;
}

async function saveProduct(event, id) {
  event.preventDefault();
  const data = formData(event.target);
  data.categoryId = data.categoryId ? Number(data.categoryId) : null;
  data.price = Number(data.price || 0);
  data.coins = Number(data.coins || 0);
  data.active = event.target.active.checked;
  await save(async () => {
    if (id) await api(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    else await api('/api/admin/products', { method: 'POST', body: JSON.stringify(data) });
    showNotice('Product saved.', 'success');
    await loadAll();
  });
}

function editProduct(id) {
  const product = state.products.find((item) => item.id === id);
  $('view').querySelector('.panel-body').innerHTML = productForm(product);
}

function renderOrders() {
  $('view').innerHTML = panel('Orders', state.orders.length ? table(['Order', 'User', 'Total', 'Status', 'Created', 'Actions'], state.orders.map((o) => [
    `#${o.id}`,
    o.user_id || '-',
    rupees(o.total_amount || 0),
    `<select class="select" onchange="confirmOrderStatus(${o.id}, this.value)"><option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option><option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Paid</option><option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Cancelled</option><option value="refunded" ${o.status === 'refunded' ? 'selected' : ''}>Refunded</option></select>`,
    date(o.created_at),
    `<button class="btn danger" onclick="confirmDeleteOrder(${o.id})">Delete</button>`,
  ])) : empty('No orders yet', 'No Data Found. Orders will appear after purchases.'));
}

function renderKyc() {
  $('view').innerHTML = panel('KYC Verification', state.kyc.length ? table(['User', 'Mobile', 'Status', 'Submitted', 'Actions'], state.kyc.map((u) => [
    escapeHtml(u.name),
    escapeHtml(u.phone || '-'),
    statusBadge(u.kyc_status || 'pending'),
    date(u.created_at),
    `<div class="actions"><button class="btn success" onclick="confirmKyc(${u.id}, 'approved')">Approve</button><button class="btn danger" onclick="confirmKyc(${u.id}, 'rejected')">Reject</button></div>`,
  ])) : empty('No pending KYC', 'No Data Found. KYC requests will appear here.'));
}

function renderWallet() {
  $('view').innerHTML = panel('Wallet Management', `
    <form class="toolbar" onsubmit="adjustWallet(event)">
      <select class="select" name="userId" required>
        <option value="">Select user</option>
        ${state.users.filter((user) => user.role === 'user').map((user) => `<option value="${user.id}">${escapeHtml(user.name)} (${escapeHtml(user.phone || '-')})</option>`).join('')}
      </select>
      <input class="input" name="coins" type="number" min="1" placeholder="Coin amount" required />
      <input class="input" name="reason" placeholder="Admin reason" />
      <button class="btn success" name="mode" value="add" type="submit">Add Coins</button>
      <button class="btn danger" name="mode" value="deduct" type="submit">Deduct</button>
    </form>
    ${state.walletTransactions.length ? table(['User', 'Type', 'Description', 'Coins', 'Status', 'Date'], state.walletTransactions.map((tx) => [
      escapeHtml(tx.user_name || `User #${tx.user_id}`),
      escapeHtml(tx.type || '-'),
      escapeHtml(tx.description || tx.title || '-'),
      tx.coins || 0,
      statusBadge(tx.status || '-'),
      date(tx.created_at),
    ])) : empty('No wallet records', 'No Data Found. Wallet logs will appear here.')}
  `);
}

function renderChats() {
  $('view').innerHTML = panel('Chat Monitoring', `
    <div class="grid metrics">
      ${metric('Active Chats', state.chats.length, 'CH')}
      ${metric('Coins Spent', state.chats.reduce((sum, chat) => sum + Number(chat.duration_minutes || 0) * 10, 0), 'CO')}
      ${metric('Avg Duration', averageDuration(state.chats), 'TM')}
    </div>
    <div style="margin-top: 14px;">
      ${state.chats.length ? table(['Chat', 'Users', 'Duration', 'Messages', 'Coins', 'Updated'], state.chats.map((chat) => [
        `#${chat.id}`,
        `${escapeHtml(chat.user_one_name || '-')} / ${escapeHtml(chat.user_two_name || '-')}`,
        `${chat.duration_minutes || 0} min`,
        chat.message_count || 0,
        Number(chat.duration_minutes || 0) * 10,
        date(chat.updated_at),
      ])) : empty('No active chats', 'No Data Found. Live chat sessions will appear here.')}
    </div>
  `);
}

function renderWithdrawals() {
  $('view').innerHTML = panel('Withdrawal Management', state.withdrawals.length ? table(['User', 'Amount', 'Method', 'Bank / UPI', 'Status', 'Requested', 'Actions'], state.withdrawals.map((w) => [
    escapeHtml(w.user_name || `User #${w.user_id}`),
    rupees(w.amount || 0),
    escapeHtml(w.method || '-'),
    `${escapeHtml(w.bank_name || '-')}${w.account_number ? `<br><span class="muted">${escapeHtml(w.account_number)}</span>` : ''}`,
    statusBadge(w.status || '-'),
    date(w.created_at),
    `<div class="actions"><button class="btn success" onclick="confirmWithdrawal(${w.id}, 'completed')">Approve</button><button class="btn danger" onclick="confirmWithdrawal(${w.id}, 'rejected')">Reject</button></div>`,
  ])) : empty('No withdrawal requests', 'No Data Found. Withdrawal requests will appear here.'));
}

function renderReports() {
  const reports = state.reports || {};
  $('view').innerHTML = `
    <div class="grid metrics">
      ${metric('Revenue', rupees(reports.revenue || 0), 'INR')}
      ${metric('Users', reports.users || 0, 'US')}
      ${metric('Orders', reports.orders || 0, 'OR')}
      ${metric('Coins', reports.coins || 0, 'CO')}
      ${metric('Chats', reports.chats || 0, 'CH')}
    </div>
    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); margin-top: 14px;">
      ${panel('Revenue', chart([22, 34, 46, 55, 69, 78, 88]))}
      ${panel('User Growth', chart([18, 30, 42, 50, 58, 70, 84]))}
      ${panel('Chat Activity', chart([40, 34, 58, 62, 51, 74, 90]))}
    </div>
  `;
}

function renderSettings() {
  $('view').innerHTML = panel('Settings', `
    <form class="form-grid" onsubmit="saveSettings(event)">
      <label class="field"><span>Coin deduction rate</span><input class="input" name="coin_deduction_rate" value="${escapeAttr(state.settings.coin_deduction_rate || '10')}" /></label>
      <label class="field"><span>Minimum withdrawal</span><input class="input" name="minimum_withdrawal" type="number" value="${escapeAttr(state.settings.minimum_withdrawal || '500')}" /></label>
      <label><input type="checkbox" name="require_kyc_before_chat" ${state.settings.require_kyc_before_chat === 'false' ? '' : 'checked'} /> Require KYC before chat</label>
      <button class="btn">Save Settings</button>
    </form>
  `);
}

function confirmKyc(id, status) {
  confirmAction('Update KYC status?', `This KYC request will be marked as ${status}.`, 'Update', async () => {
    await api(`/api/admin/kyc/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    showNotice('KYC status updated.', 'success');
    await loadAll();
  }, status === 'rejected');
}

async function adjustWallet(event) {
  event.preventDefault();
  const data = formData(event.target);
  data.userId = Number(data.userId);
  data.coins = Number(data.coins);
  data.mode = event.submitter && event.submitter.value === 'deduct' ? 'deduct' : 'add';
  confirmAction('Adjust wallet?', `${data.mode === 'deduct' ? 'Deduct' : 'Add'} ${data.coins} coins for selected user.`, 'Confirm', async () => {
    await api('/api/admin/wallet/adjust', { method: 'POST', body: JSON.stringify(data) });
    showNotice('Wallet adjusted.', 'success');
    await loadAll();
  }, data.mode === 'deduct');
}

function confirmWithdrawal(id, status) {
  confirmAction('Update withdrawal?', `Withdrawal will be marked as ${status}.`, 'Update', async () => {
    await api(`/api/admin/withdrawals/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    showNotice('Withdrawal updated.', 'success');
    await loadAll();
  }, status === 'rejected');
}

async function saveSettings(event) {
  event.preventDefault();
  const data = formData(event.target);
  data.require_kyc_before_chat = event.target.require_kyc_before_chat.checked ? 'true' : 'false';
  await save(async () => {
    for (const [key, value] of Object.entries(data)) {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ key, value }) });
    }
    showNotice('Settings saved.', 'success');
    await loadAll();
  });
}

function confirmUserStatus(id) {
  const user = state.users.find((u) => u.id === id);
  const status = user.status === 'active' ? 'inactive' : 'active';
  confirmAction('Update user status?', `${user.name} will be marked as ${status}.`, 'Update', async () => {
    await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    showNotice('User status updated.', 'success');
    await loadAll();
  });
}

function confirmDeleteUser(id) {
  const user = state.users.find((u) => u.id === id);
  confirmAction('Delete user?', `${user.name} will be removed from active admin views.`, 'Delete', async () => {
    await api(`/api/admin/users/${id}`, { method: 'DELETE' });
    showNotice('User deleted.', 'success');
    await loadAll();
  }, true);
}

function confirmDeleteCategory(id) {
  confirmAction('Delete category?', 'This category will be deleted.', 'Delete', async () => {
    await api(`/api/admin/categories/${id}`, { method: 'DELETE' });
    showNotice('Category deleted.', 'success');
    await loadAll();
  }, true);
}

function confirmDeleteProduct(id) {
  confirmAction('Delete product?', 'This product will be deleted.', 'Delete', async () => {
    await api(`/api/admin/products/${id}`, { method: 'DELETE' });
    showNotice('Product deleted.', 'success');
    await loadAll();
  }, true);
}

function confirmOrderStatus(id, status) {
  confirmAction('Update order status?', `Order #${id} will move to ${status}.`, 'Update', async () => {
    await api(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    showNotice('Order updated.', 'success');
    await loadAll();
  });
}

function confirmDeleteOrder(id) {
  confirmAction('Delete order?', `Order #${id} will be deleted.`, 'Delete', async () => {
    await api(`/api/admin/orders/${id}`, { method: 'DELETE' });
    showNotice('Order deleted.', 'success');
    await loadAll();
  }, true);
}

function confirmAction(title, description, label, callback, danger = false) {
  state.confirm = callback;
  $('confirmTitle').textContent = title;
  $('confirmDescription').textContent = description;
  $('confirmButton').textContent = label;
  $('confirmButton').className = `btn ${danger ? 'danger' : ''}`;
  $('confirmButton').onclick = runConfirm;
  $('confirmModal').style.display = 'flex';
}

function closeConfirm() {
  $('confirmModal').style.display = 'none';
  state.confirm = null;
}

async function runConfirm() {
  if (!state.confirm) return;
  await save(async () => {
    await state.confirm();
    closeConfirm();
  });
}

async function save(callback) {
  $('savingToast').style.display = 'flex';
  try {
    await callback();
  } catch (error) {
    showNotice(error.message, 'error');
  } finally {
    $('savingToast').style.display = 'none';
  }
}

function showLoading(show) {
  $('loader').style.display = show ? 'flex' : 'none';
  $('view').style.display = show ? 'none' : 'block';
}

function showNotice(message, type) {
  $('notice').textContent = message;
  $('notice').className = `notice ${type}`;
}

function metric(label, value, icon) {
  return `<div class="metric"><div><p class="muted">${label}</p><p class="metric-value">${value}</p></div><div class="metric-icon">${icon}</div></div>`;
}

function panel(title, body) {
  return `<section class="panel"><div class="panel-head"><div><h3>${title}</h3></div></div><div class="panel-body">${body}</div></section>`;
}

function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function simpleList(rows, columns) {
  if (!rows.length) return empty('No records found', 'No Data Found.');
  return `<div class="grid">${rows.slice(0, 5).map((row) => `<div class="metric">${columns.map((c) => `<span>${escapeHtml(String(row[c] ?? '-'))}</span>`).join('')}</div>`).join('')}</div>`;
}

function empty(title, description) {
  return `<div class="empty"><div><div class="metric-icon" style="margin: 0 auto;">--</div><p class="empty-title">No Data Found</p><h3 style="margin-top: 8px;">${title}</h3><p class="muted" style="margin-top: 8px;">${description}</p></div></div>`;
}

function chart(values) {
  return `<div style="height: 230px; display: flex; align-items: end; gap: 10px; background: rgba(255,255,255,0.03); border-radius: 10px; padding: 14px;">${values.map((v) => `<div style="flex: 1; height: ${v}%; background: var(--primary); border-radius: 8px 8px 0 0;"></div>`).join('')}</div>`;
}

function statusBadge(value) {
  const cls = ['active', 'paid', 'verified', 'approved', 'completed'].includes(value) ? 'green' : ['pending', 'inactive'].includes(value) ? 'yellow' : 'red';
  return `<span class="badge ${cls}">${escapeHtml(String(value || '-'))}</span>`;
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`;
}

function date(value) {
  return value ? new Date(value).toLocaleDateString('en-IN') : '-';
}

function iconFor(id) {
  return {
    dashboard: 'DB',
    users: 'US',
    kyc: 'KY',
    wallet: 'WL',
    chats: 'CH',
    withdrawals: 'WD',
    categories: 'CT',
    products: 'PR',
    orders: 'OR',
    reports: 'RP',
    settings: 'ST',
  }[id] || '--';
}

function averageDuration(chats) {
  if (!chats.length) return '0m';
  const total = chats.reduce((sum, chat) => sum + Number(chat.duration_minutes || 0), 0);
  return `${Math.round(total / chats.length)}m`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}
