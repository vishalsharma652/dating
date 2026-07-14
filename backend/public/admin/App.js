const { useState, useEffect } = React;

const API_BASE_URL = '/api';

window.Icon = function Icon({ name, size = 18, className = '' }) {
  React.useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [name]);
  return <i data-lucide={name} style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} className={className}></i>;
};

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('adminToken') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ message: '', type: '' });
  const [saving, setSaving] = useState(false);

  // Dynamic Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [dropdownUsers, setDropdownUsers] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [chatsList, setChatsList] = useState([]);
  const [withdrawalsList, setWithdrawalsList] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [settingsData, setSettingsData] = useState({});

  // Pagination & Filters States
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [userOnline, setUserOnline] = useState('');
  const [userKyc, setUserKyc] = useState('');
  const [userRole, setUserRole] = useState('');
  const [userSort, setUserSort] = useState('newest');

  // Wallet Pagination States
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotal, setWalletTotal] = useState(0);

  // Modals States
  const [detailModal, setDetailModal] = useState({
    show: false,
    title: '',
    body: null,
    approveCallback: null,
    rejectCallback: null,
    approveLabel: 'Approve',
    rejectLabel: 'Reject'
  });

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: '',
    description: '',
    label: '',
    callback: null,
    danger: false
  });

  useEffect(() => {
    if (token) {
      loadAllData();
    }
  }, [token]);

  const showNotice = (message, type = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice({ message: '', type: '' }), 4000);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setToken('');
  };

  const apiRequest = async (path, options = {}) => {
    const headers = new Headers(options.headers || {});
    headers.set('Content-Type', 'application/json');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
    const payload = await res.json().catch(() => ({ success: false, message: 'Unexpected server response' }));
    if (!res.ok || !payload.success) {
      if (res.status === 401) {
        logout();
      }
      throw new Error(payload.message || 'Request failed');
    }
    return payload;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotice({ message: '', type: '' });
    try {
      const res = await apiRequest('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('adminToken', res.data.token);
      setToken(res.data.token);
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsersList = async () => {
    try {
      const res = await apiRequest(`/admin/users?page=${usersPage}&limit=10&search=${encodeURIComponent(userSearch)}&status=${userStatus}&online_status=${userOnline}&kyc_status=${userKyc}&role=${userRole}`);
      setUsersList(res.data.users || []);
      setUsersTotal(res.data.total || 0);
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  useEffect(() => {
    if (token) {
      loadUsersList();
    }
  }, [token, usersPage, userSearch, userStatus, userOnline, userKyc, userRole]);

  const loadWalletTransactions = async () => {
    try {
      const res = await apiRequest(`/admin/wallet/transactions?page=${walletPage}&limit=10`);
      setWalletTransactions(res.data.transactions || []);
      setWalletTotal(res.data.total || 0);
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  useEffect(() => {
    if (token) {
      loadWalletTransactions();
    }
  }, [token, walletPage]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [db, ky, ch, wd, rp, st, usDropdown] = await Promise.all([
        apiRequest('/admin/dashboard'),
        apiRequest('/admin/kyc'),
        apiRequest('/admin/chats'),
        apiRequest('/admin/withdrawals'),
        apiRequest('/admin/reports'),
        apiRequest('/admin/settings'),
        apiRequest('/admin/users?limit=200')
      ]);

      setDashboardData(db.data.dashboard || {});
      setKycRequests(ky.data.requests || []);
      // walletTransactions fetched separately via loadWalletTransactions()
      setChatsList(ch.data.chats || []);
      setWithdrawalsList(wd.data.withdrawals || []);
      setReportsData(rp.data.reports || {});
      setSettingsData(st.data.settings || {});
      setDropdownUsers(usDropdown.data.users || []);
      await loadUsersList();
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };


  const triggerAction = async (callback) => {
    setSaving(true);
    try {
      await callback();
      await loadAllData();
      await loadWalletTransactions();
    } catch (err) {
      showNotice(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmAction = (title, description, label, callback, danger = false) => {
    setConfirmModal({
      show: true,
      title,
      description,
      label,
      callback: () => triggerAction(callback),
      danger
    });
  };

  // User actions
  const changeUserStatus = (id) => {
    const user = usersList.find((u) => u.id === id);
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    confirmAction(
      'Update User Status?',
      `${user.name} status will be set to ${newStatus}.`,
      'Update Status',
      async () => {
        await apiRequest(`/admin/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        showNotice('User status updated successfully.');
      }
    );
  };

  const deleteUser = (id) => {
    const user = usersList.find((u) => u.id === id);
    confirmAction(
      'Delete User?',
      `Are you sure you want to delete ${user.name}? This will remove them from active views.`,
      'Delete User',
      async () => {
        await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
        showNotice('User deleted successfully.');
      },
      true
    );
  };

  const approveKyc = (id) => {
    const user = usersList.find((u) => u.id === id);
    confirmAction(
      'Approve KYC?',
      `Mark KYC request for ${user?.name || `User #${id}`} as Approved.`,
      'Approve',
      async () => {
        await apiRequest(`/admin/kyc/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'approved' })
        });
        showNotice('KYC approved.');
      }
    );
  };

  const rejectKyc = (id) => {
    const user = usersList.find((u) => u.id === id);
    confirmAction(
      'Reject KYC?',
      `Mark KYC request for ${user?.name || `User #${id}`} as Rejected.`,
      'Reject',
      async () => {
        await apiRequest(`/admin/kyc/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'rejected' })
        });
        showNotice('KYC rejected.');
      },
      true
    );
  };

  const processWithdrawal = (id, status) => {
    confirmAction(
      'Process Withdrawal?',
      `Withdrawal request #${id} will be marked as ${status}.`,
      'Update Payout',
      async () => {
        await apiRequest(`/admin/withdrawals/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        showNotice(`Withdrawal marked as ${status}.`);
      },
      status === 'rejected'
    );
  };

  const handleAdjustWallet = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd);
    data.userId = Number(data.userId);
    data.coins = Number(data.coins);
    const mode = e.nativeEvent.submitter.value;
    data.mode = mode;
    
    confirmAction(
      'Adjust Wallet Balance?',
      `This will ${mode === 'deduct' ? 'deduct' : 'add'} ${data.coins} coins for the selected user.`,
      'Adjust Coins',
      async () => {
        await apiRequest('/admin/wallet/adjust', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        showNotice('Wallet balance adjusted.');
        e.target.reset();
      },
      mode === 'deduct'
    );
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.require_kyc_before_chat = e.target.require_kyc_before_chat.checked ? 'true' : 'false';

    triggerAction(async () => {
      for (const [key, value] of Object.entries(data)) {
        await apiRequest('/admin/settings', {
          method: 'PUT',
          body: JSON.stringify({ key, value })
        });
      }
      showNotice('Settings saved.');
    });
  };

  // Helper formats
  const rupees = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;
  const dateStr = (val) => (val ? new Date(val).toLocaleDateString('en-IN') : '-');
  
  const statusBadge = (val) => {
    const colorClass = ['active', 'paid', 'verified', 'approved', 'completed'].includes(val)
      ? 'green'
      : ['pending', 'inactive'].includes(val)
      ? 'yellow'
      : 'red';
    return <span className={`badge ${colorClass}`}>{val || '-'}</span>;
  };

  // Modal Views
  const openUserProfile = (user) => {
    const html = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #475569)', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 'bold', color: 'white' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{user.name}</h4>
            <p className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>User ID: {user.id} &bull; Joined: {dateStr(user.created_at)}</p>
          </div>
        </div>
        <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', display: 'grid', gap: '16px' }}>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Contact Details</p>
            <p style={{ margin: '6px 0 0' }}><strong>Email:</strong> {user.email || 'N/A'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Phone:</strong> {user.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Verification & Activity</p>
            <p style={{ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}><strong>KYC:</strong> {statusBadge(user.kyc_status)}</p>
            <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Status:</strong>
              {user.online_status ? (
                <>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }}></span>
                  Online
                </>
              ) : (
                <>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#71717a' }}></span>
                  Offline
                </>
              )}
            </p>
          </div>
        </div>
        <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', display: 'grid', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Wallet Status</p>
            <p style={{ margin: '6px 0 0' }}><strong>Coins Balance:</strong> {user.coins || 0}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Earning Balance:</strong> {rupees(user.earnings || 0)}</p>
          </div>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Profile Info</p>
            <p style={{ margin: '6px 0 0' }}><strong>Gender:</strong> {user.gender || 'N/A'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Date of Birth:</strong> {dateStr(user.dob)}</p>
          </div>
        </div>
      </div>
    );
    setDetailModal({ show: true, title: `User Profile: ${user.name}`, body: html });
  };

  const openKycVerification = (user) => {
    const html = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{user.name}</h4>
          <p className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>User ID: {user.id} &bull; Phone: {user.phone || 'N/A'}</p>
        </div>
        <div>
          <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '8px' }}>Uploaded ID Documents (Aadhaar / Passport)</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
            <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '12px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#a1a1aa' }}>ID Document Front</p>
              <div style={{ height: '140px', borderRadius: '8px', background: 'linear-gradient(135deg, #131326, #2d183d)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', position: 'relative', overflow: 'hidden' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>Aadhaar Front Side</span>
                <span style={{ fontSize: '10px', marginTop: '4px' }}>KYC_FRONT.jpg</span>
                <div style={{ position: 'absolute', bottom: '8px', left: '8px', width: '30px', height: '20px', backgroundColor: '#fbbf24', opacity: 0.8, borderRadius: '3px' }}></div>
              </div>
            </div>
            <div style={{ border: '1px dashed var(--border)', borderRadius: '12px', padding: '12px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <p style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: '#a1a1aa' }}>ID Document Back</p>
              <div style={{ height: '140px', borderRadius: '8px', background: 'linear-gradient(135deg, #131326, #2d183d)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '12px', position: 'relative', overflow: 'hidden' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>Aadhaar Back Side</span>
                <span style={{ fontSize: '10px', marginTop: '4px' }}>KYC_BACK.jpg</span>
                <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '50px', height: '6px', backgroundColor: '#6b7280', opacity: 0.6, borderRadius: '2px' }}></div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', backgroundColor: 'rgba(255,179,0,0.05)', borderRadius: '8px', padding: '12px', border: '1px solid rgba(255,179,0,0.15)' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#fef08a' }}><strong>Verification Notice:</strong> Ensure the user name matching the card detail matches with registered user profile name.</p>
        </div>
      </div>
    );
    setDetailModal({
      show: true,
      title: `KYC Verification: ${user.name}`,
      body: html,
      approveCallback: () => approveKyc(user.id),
      rejectCallback: () => rejectKyc(user.id),
      approveLabel: 'Approve KYC',
      rejectLabel: 'Reject KYC'
    });
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return <window.Dashboard data={dashboardData} users={usersList} onViewProfile={openUserProfile} rupees={rupees} />;
      case 'users':
        return (
          <window.Users
            users={usersList}
            total={usersTotal}
            page={usersPage}
            onPageChange={setUsersPage}
            search={userSearch}
            onSearchChange={setUserSearch}
            status={userStatus}
            onStatusChange={setUserStatus}
            online={userOnline}
            onOnlineChange={setUserOnline}
            kyc={userKyc}
            onKycChange={setUserKyc}
            role={userRole}
            onRoleChange={setUserRole}
            sort={userSort}
            onSortChange={setUserSort}
            onViewProfile={openUserProfile}
            onChangeStatus={changeUserStatus}
            onDeleteUser={deleteUser}
            dateStr={dateStr}
            loading={loading}
          />
        );
      case 'kyc':
        return (
          <window.Kyc
            requests={kycRequests}
            onViewRecord={openKycVerification}
            onApprove={approveKyc}
            onReject={rejectKyc}
            dateStr={dateStr}
          />
        );
      case 'wallet':
        return (
          <window.Wallet
            users={dropdownUsers}
            transactions={walletTransactions}
            total={walletTotal}
            page={walletPage}
            onPageChange={setWalletPage}
            onAdjust={handleAdjustWallet}
            dateStr={dateStr}
          />
        );
      case 'chats':
        return <window.Chats chats={chatsList} dateStr={dateStr} />;
      case 'withdrawals':
        return (
          <window.Withdrawals
            withdrawals={withdrawalsList}
            onProcess={processWithdrawal}
            rupees={rupees}
            dateStr={dateStr}
          />
        );
      case 'reports':
        return <window.Reports data={reportsData} rupees={rupees} />;
      case 'settings':
        return <window.Settings data={settingsData} onSave={handleSaveSettings} />;
      default:
        return <window.Dashboard data={dashboardData} users={usersList} onViewProfile={openUserProfile} rupees={rupees} />;
    }
  };

  if (!token) {
    return (
      <section className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <p className="eyebrow">Saathika Admin</p>
          <h1>Sign in</h1>
          <p className="muted" style={{ marginTop: '8px' }}>Manage users, KYC verification, wallets, chats, withdrawals, and reports.</p>
          
          <label className="field">
            <span>Email</span>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>

          {notice.message && notice.type === 'error' && (
            <div className="notice error" style={{ marginTop: '16px' }}>{notice.message}</div>
          )}

          <button className="btn block" type="submit" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </section>
    );
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', group: 'Overview', icon: 'layout-dashboard' },
    { id: 'users', label: 'Users', group: 'Operations', icon: 'users' },
    { id: 'kyc', label: 'KYC Verification', group: 'Operations', icon: 'shield-check' },
    { id: 'wallet', label: 'Wallets', group: 'Operations', icon: 'wallet' },
    { id: 'chats', label: 'Chat Monitor', group: 'Operations', icon: 'message-square' },
    { id: 'withdrawals', label: 'Withdrawals', group: 'Operations', icon: 'arrow-up-right' },
    { id: 'reports', label: 'Reports', group: 'Insights', icon: 'bar-chart-3' },
    { id: 'settings', label: 'Settings', group: 'System', icon: 'settings' }
  ];

  const currentTabDetails = menuItems.find((item) => item.id === activeTab);

  return (
    <section className="app">
      {/* Sidebar navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-head">
          <div>
            <p className="eyebrow">Saathika</p>
            <strong>Admin Panel</strong>
          </div>
          <button className="btn secondary mobile-close" onClick={() => setSidebarOpen(false)} type="button">
            ✕
          </button>
        </div>
        <nav className="nav">
          {['Overview', 'Operations', 'Insights', 'System'].map((group) => (
            <div key={group}>
              <div className="nav-group">{group}</div>
              {menuItems.filter((item) => item.group === group).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-btn ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8, background: 'rgba(255,255,255,0.06)', width: '28px', height: '28px', borderRadius: '8px', marginRight: '6px' }}>
                    <window.Icon name={item.icon} size={14} />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main viewport */}
      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="btn secondary hamburger" onClick={() => setSidebarOpen(true)} type="button">
              ☰
            </button>
            <div>
              <p className="eyebrow">{currentTabDetails?.group || 'Overview'}</p>
              <h2>{currentTabDetails?.label || 'Dashboard'}</h2>
            </div>
          </div>
          <div className="actions">
            <button className="btn secondary" onClick={loadAllData} type="button" disabled={loading}>
              <window.Icon name="refresh-cw" size={14} className={loading ? 'animate-spin' : ''} />
              <span style={{ marginLeft: '4px' }}>Refresh</span>
            </button>
            <button className="btn secondary" onClick={logout} type="button">
              <window.Icon name="log-out" size={14} />
              <span style={{ marginLeft: '4px' }}>Logout</span>
            </button>
          </div>
        </header>

        <div className="content">
          {notice.message && (
            <div className={`notice ${notice.type === 'error' ? 'error' : 'success'}`}>
              {notice.message}
            </div>
          )}

          {loading && !dashboardData ? (
            <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f1a', backdropFilter: 'blur(8px)' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ position: 'absolute', inset: '-24px', borderRadius: '50%', backgroundColor: 'rgba(108,92,231,0.08)', filter: 'blur(16px)' }}></div>
                <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Saathika Admin</span>
                  <span className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>Loading control panel...</span>
                </div>
              </div>
            </div>
          ) : (
            renderActiveModule()
          )}
        </div>
      </main>

      {/* Saving Overlay */}
      {saving && (
        <div className="saving-toast">
          <div className="spinner"></div>
          <span>Updating data...</span>
        </div>
      )}

      {/* Detail Modal */}
      {detailModal.show && (
        <div className="modal-backdrop" onClick={() => setDetailModal({ ...detailModal, show: false })}>
          <div className="modal" style={{ maxWidth: '600px', borderRadius: '16px', padding: '24px', background: 'var(--panel)' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
              {detailModal.title}
            </h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px', fontSize: '14px', lineHeight: 1.6 }}>
              {detailModal.body}
            </div>
            <div className="modal-actions" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {detailModal.approveCallback && (
                <button
                  className="btn success"
                  type="button"
                  onClick={async () => {
                    await detailModal.approveCallback();
                    setDetailModal({ ...detailModal, show: false });
                  }}
                >
                  {detailModal.approveLabel}
                </button>
              )}
              {detailModal.rejectCallback && (
                <button
                  className="btn danger"
                  type="button"
                  onClick={async () => {
                    await detailModal.rejectCallback();
                    setDetailModal({ ...detailModal, show: false });
                  }}
                >
                  {detailModal.rejectLabel}
                </button>
              )}
              <button className="btn secondary" onClick={() => setDetailModal({ ...detailModal, show: false })} type="button">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>{confirmModal.title}</h3>
            <p className="muted" style={{ marginTop: '10px', lineHeight: 1.6 }}>
              {confirmModal.description}
            </p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setConfirmModal({ ...confirmModal, show: false })} type="button">
                Cancel
              </button>
              <button
                className={`btn ${confirmModal.danger ? 'danger' : 'success'}`}
                type="button"
                onClick={() => {
                  confirmModal.callback();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
              >
                {confirmModal.label}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// Render app
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
