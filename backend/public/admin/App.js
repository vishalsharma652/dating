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
  const [userGender, setUserGender] = useState('');
  const [userOnline, setUserOnline] = useState('');
  const [userKyc, setUserKyc] = useState('');
  const [userSort, setUserSort] = useState('newest');

  // Wallet Pagination & Filter States
  const [walletPage, setWalletPage] = useState(1);
  const [walletTotal, setWalletTotal] = useState(0);
  const [walletGender, setWalletGender] = useState('');
  const [walletSearch, setWalletSearch] = useState('');
  const [walletDate, setWalletDate] = useState('');
  const [walletStats, setWalletStats] = useState({ totalCount: 0, totalCredited: 0, totalDeducted: 0, netCoins: 0 });

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
      const res = await apiRequest(`/admin/users?page=${usersPage}&limit=10&search=${encodeURIComponent(userSearch)}&status=${userStatus}&gender=${userGender}&online_status=${userOnline}&kyc_status=${userKyc}&sort=${userSort}`);
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
  }, [token, usersPage, userSearch, userStatus, userGender, userOnline, userKyc, userSort]);

  const loadWalletTransactions = async () => {
    try {
      const res = await apiRequest(`/admin/wallet/transactions?page=${walletPage}&limit=10&gender=${walletGender}&search=${encodeURIComponent(walletSearch)}&date=${walletDate}`);
      setWalletTransactions(res.data.transactions || []);
      setWalletTotal(res.data.total || 0);
      setWalletStats(res.data.stats || { totalCount: 0, totalCredited: 0, totalDeducted: 0, netCoins: 0 });
    } catch (err) {
      showNotice(err.message, 'error');
    }
  };

  useEffect(() => {
    if (token) {
      loadWalletTransactions();
    }
  }, [token, walletPage, walletGender, walletSearch, walletDate]);

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
    const currentStatus = (user?.status || 'active').toLowerCase();
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const isDeactivating = newStatus === 'inactive';
    confirmAction(
      isDeactivating ? 'Deactivate User Account?' : 'Activate User Account?',
      isDeactivating
        ? `Are you sure you want to deactivate ${user ? user.name : 'this user'}? Their active session will be logged out immediately and they will not be able to Sign In until reactivated.`
        : `Are you sure you want to activate ${user ? user.name : 'this user'}? They will be allowed to Sign In and access their dashboard normally.`,
      isDeactivating ? 'Deactivate User' : 'Activate User',
      async () => {
        await apiRequest(`/admin/users/${id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        showNotice(`User account marked as ${newStatus}.`);
        await loadUsersList();
      },
      isDeactivating
    );
  };

  const deleteUser = (id) => {
    const user = usersList.find((u) => u.id === id);
    confirmAction(
      'Delete User?',
      `Are you sure you want to delete ${user ? user.name : 'this user'}? This will permanently delete them and all their data.`,
      'Delete User',
      async () => {
        await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
        setUsersList((prev) => prev.filter((u) => u.id !== id));
        setUsersTotal((prev) => Math.max(0, prev - 1));
        showNotice('User deleted successfully.');
        await loadUsersList();
        await loadAllData();
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
        await loadAllData();
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
            <p className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>
              <strong>Unique ID: #{user.id}</strong> &bull; Joined: {dateStr(user.created_at)}
            </p>
          </div>
        </div>

        <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', display: 'grid', gap: '16px' }}>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Account & Identity</p>
            <p style={{ margin: '6px 0 0' }}><strong>Unique User ID:</strong> #{user.id}</p>
            {user.unique_id && (
              <p style={{ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>ID:</strong>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#10b981', fontSize: '14px', letterSpacing: '2px', background: 'rgba(16,185,129,0.1)', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.25)' }}>
                  {user.unique_id}
                </span>
              </p>
            )}
            <p style={{ margin: '4px 0 0' }}><strong>Full Name:</strong> {user.name}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Role:</strong> {user.role || 'user'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Account Status:</strong> {statusBadge(user.status)}</p>
          </div>

          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Contact Details</p>
            <p style={{ margin: '6px 0 0' }}><strong>Email Address:</strong> {user.email || 'N/A'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Email Verified:</strong> {user.email_verified ? 'Yes' : 'Yes'}</p>
          </div>
        </div>

        <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', display: 'grid', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Verification & Activity</p>
            <p style={{ margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}><strong>KYC Status:</strong> {statusBadge(user.kyc_status)}</p>
            {user.unique_id && (
              <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Saathika ID:</strong>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.08)', padding: '1px 8px', borderRadius: '12px', fontSize: '12px', letterSpacing: '1px' }}>{user.unique_id}</span>
              </p>
            )}
            <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong>Activity Status:</strong>
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
            <p style={{ margin: '4px 0 0' }}><strong>Last Active:</strong> {dateStr(user.last_seen_at || user.updated_at)}</p>
          </div>

          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Wallet & Earnings</p>
            <p style={{ margin: '6px 0 0' }}><strong>Coins Balance:</strong> {user.coins || 0} Coins</p>
            <p style={{ margin: '4px 0 0' }}><strong>Earnings Balance:</strong> {rupees(user.earnings || 0)}</p>
          </div>
        </div>

        <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', display: 'grid', gap: '16px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Personal & Demographics</p>
            <p style={{ margin: '6px 0 0' }}><strong>Gender:</strong> {user.gender || 'N/A'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Date of Birth:</strong> {dateStr(user.dob)}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Age:</strong> {user.age || 'N/A'}</p>
          </div>

          <div>
            <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary)' }}>Location & About</p>
            <p style={{ margin: '6px 0 0' }}><strong>City / Location:</strong> {user.city || 'N/A'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Occupation:</strong> {user.occupation || 'N/A'}</p>
            <p style={{ margin: '4px 0 0' }}><strong>Bio:</strong> {user.bio || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
    setDetailModal({ show: true, title: `User Details (ID #${user.id}): ${user.name}`, body: html });
  };

  const openKycVerification = (user) => {
    let livePhoto = user.kyc_document_url || user.selfieUrl || (user.photos && user.photos[0]) || '/avatar-priya.jpg';
    if (livePhoto && !livePhoto.startsWith('http') && !livePhoto.startsWith('/')) {
      livePhoto = '/' + livePhoto;
    }

    const displayUniqueId = String(user.unique_id || user.id || '').replace(/^STK-/i, '').padStart(6, '0');

    const html = (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{user.name}</h4>
            <p className="muted" style={{ fontSize: '12px', marginTop: '4px' }}>User ID: #{user.id} &bull; Email: {user.email || 'N/A'}</p>
          </div>
          {user.unique_id ? (
            <span className="badge green" style={{ fontSize: '12px', fontWeight: 800 }}>{displayUniqueId}</span>
          ) : (
            <span className="badge yellow" style={{ fontSize: '11px' }}>Pending Unique ID Assignment</span>
          )}
        </div>
        <div>
          <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '10px' }}>📸 Submitted Live Selfie Photo</p>
          <div style={{ border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
              <img
                src={livePhoto}
                alt="Uploaded Live Selfie"
                style={{
                  maxHeight: '300px',
                  width: 'auto',
                  maxWidth: '100%',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid rgba(236,72,153,0.4)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                }}
              />
              <div style={{ marginTop: '10px' }}>
                <a
                  href={livePhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-action btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 14px' }}
                >
                  🔍 View Full Size Image
                </a>
              </div>
            </div>
          </div>
        </div>
        <div style={{ backgroundColor: 'rgba(45,226,230,0.08)', borderRadius: '10px', padding: '12px', border: '1px solid rgba(45,226,230,0.2)' }}>
          <p style={{ margin: 0, fontSize: '12px', color: '#2de2e6' }}>
            <strong>Note:</strong> Approving this KYC request will verify the user profile and automatically assign a Unique ID (e.g. <code>000123</code>).
          </p>
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
        return <window.Dashboard data={dashboardData} users={usersList} onViewProfile={openUserProfile} onTabChange={setActiveTab} rupees={rupees} />;
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
            gender={userGender}
            onGenderChange={setUserGender}
            online={userOnline}
            onOnlineChange={setUserOnline}
            kyc={userKyc}
            onKycChange={setUserKyc}
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
            transactions={walletTransactions}
            total={walletTotal}
            stats={walletStats}
            page={walletPage}
            onPageChange={setWalletPage}
            gender={walletGender}
            onGenderChange={setWalletGender}
            search={walletSearch}
            onSearchChange={setWalletSearch}
            date={walletDate}
            onDateChange={setWalletDate}
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
        return <window.Dashboard data={dashboardData} users={usersList} onViewProfile={openUserProfile} onTabChange={setActiveTab} rupees={rupees} />;
    }
  };

  if (!token) {
    return (
      <section className="login-page">
        <form className="login-card" onSubmit={handleLogin}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
            <img src="./logo.jpg" alt="Saathika Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
            <div>
              <p className="eyebrow" style={{ margin: 0 }}>Saathika</p>
              <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text)' }}>Admin Panel</h2>
            </div>
          </div>
          <h1>Sign in</h1>
          <p className="muted" style={{ marginTop: '8px' }}>Manage users, KYC verification, wallets, chats, withdrawals, and reports.</p>

          <label className="field" style={{ marginTop: '20px' }}>
            <span>Email or Phone</span>
            <input className="input" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter admin email or phone" required />
          </label>
          <label className="field">
            <span>Password</span>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="./logo.jpg" alt="Saathika Logo" style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'cover' }} />
            <div>
              <strong style={{ fontSize: '16px', fontWeight: '800', letterSpacing: '0.05em', background: 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block', lineHeight: 1.2 }}>SAATHIKA</strong>
              <span className="muted" style={{ fontSize: '11px', fontWeight: '500', display: 'block', marginTop: '1px' }}>Admin Panel</span>
            </div>
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
        {/* Bottom Banner Card */}
        <div style={{ padding: '16px', borderTop: '1px solid var(--border)', flexShrink: 0 }} className="sidebar-footer">
          <div style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.08) 0%, rgba(99, 102, 241, 0.02) 100%)', border: '1px solid rgba(129, 140, 248, 0.15)', borderRadius: '16px', padding: '16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', zIndex: 2, position: 'relative' }}>
              <span style={{ background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', width: '30px', height: '30px', borderRadius: '8px', display: 'grid', placeItems: 'center' }}>
                <window.Icon name="shield" size={14} />
              </span>
              <div>
                <strong style={{ fontSize: '12px', display: 'block', color: 'white' }}>Saathika Platform</strong>
                <span className="muted" style={{ fontSize: '9px', display: 'block' }}>Secure. Simple. Smart.</span>
              </div>
            </div>
            {/* SVG shield illustration */}
            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 12px', zIndex: 1, position: 'relative' }}>
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 8px rgba(129, 140, 248, 0.4))' }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
              <div style={{ width: '70%', height: '100%', background: 'var(--primary-gradient)', boxShadow: '0 0 8px rgba(129, 140, 248, 0.5)' }}></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main viewport */}
      <main className="main">
        <header className="topbar" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px 24px', borderBottom: '1px solid var(--border)', alignItems: 'stretch' }}>
          {/* Row 1: Title/Hamburger (Left) & Search/Bell/Avatar (Right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button className="btn secondary hamburger" onClick={() => setSidebarOpen(true)} type="button">
                ☰
              </button>
              {activeTab === 'dashboard' ? (
                <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'white', margin: 0 }}>
                  Dashboard
                </h2>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '800', letterSpacing: '0.05em', color: '#818cf8', textTransform: 'uppercase', lineHeight: 1 }}>
                    {currentTabDetails?.group}
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em', color: 'white', margin: 0, lineHeight: 1.1 }}>
                    {currentTabDetails?.label}
                  </h2>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {/* Search Input */}
              <div style={{ position: 'relative', width: '100%', maxWidth: '240px' }} className="desktop-search">
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <window.Icon name="search" size={14} />
                </span>
                <input
                  className="input"
                  placeholder="Search users, IDs, emails..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    if (activeTab !== 'users') setActiveTab('users');
                  }}
                  style={{ height: '36px', paddingLeft: '32px', paddingRight: '48px', fontSize: '13px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>
                  ⌘K
                </span>
              </div>

              {/* Notification Bell */}
              <button 
                type="button"
                onClick={() => {
                  if (kycRequests.length > 0) {
                    setActiveTab('kyc');
                    showNotice(`${kycRequests.length} pending KYC requests.`);
                  } else if (withdrawalsList.filter(w => w.status === 'pending').length > 0) {
                    setActiveTab('withdrawals');
                    showNotice('Pending withdrawal requests found.');
                  } else {
                    showNotice('No new pending notifications.');
                  }
                }}
                title="Notifications"
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  padding: 0, 
                  borderRadius: '50%', 
                  position: 'relative', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid var(--border)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  color: '#cbd5e1',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'var(--border-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <window.Icon name="bell" size={16} />
                {(kycRequests.length + withdrawalsList.filter(w => w.status === 'pending').length) > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#6366f1', color: 'white', fontSize: '9px', fontWeight: '800', width: '16px', height: '16px', borderRadius: '50%', display: 'grid', placeItems: 'center', border: '2px solid #030306' }}>
                    {kycRequests.length + withdrawalsList.filter(w => w.status === 'pending').length}
                  </span>
                )}
              </button>

              {/* Admin Avatar Wrapper with Green Dot */}
              <div 
                onClick={() => setActiveTab('settings')}
                title="Admin Profile & Settings"
                style={{ position: 'relative', width: '36px', height: '36px', cursor: 'pointer' }}
              >
                <img
                  src="./avatar.jpg"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'grid';
                  }}
                  alt="Admin Avatar"
                  style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid rgba(129, 140, 248, 0.4)', objectFit: 'cover' }}
                />
                <span style={{ 
                  display: 'none',
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0.05) 100%)', 
                  color: '#818cf8', 
                  placeItems: 'center',
                  border: '1.5px solid rgba(129, 140, 248, 0.3)',
                  fontSize: '13px',
                  fontWeight: 'bold'
                }}>
                  AD
                </span>
                <span style={{ 
                  position: 'absolute', 
                  bottom: '-1px', 
                  right: '-1px', 
                  width: '10px', 
                  height: '10px', 
                  background: '#10b981', 
                  border: '2px solid #030306', 
                  borderRadius: '50%',
                  boxShadow: '0 0 6px #10b981'
                }}></span>
              </div>
            </div>
          </div>

          {/* Row 2: Welcome message (Left) & Actions (Right) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {activeTab === 'dashboard' ? (
              <p className="muted welcome-msg" style={{ fontSize: '13px', margin: 0, display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '0' }}>
                Welcome back, Admin <span style={{ fontSize: '14px' }}>👋</span>
              </p>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', gap: '8px' }} className="actions">
              <button className="btn secondary" style={{ height: '32px', padding: '0 10px', fontSize: '11px', borderRadius: '6px' }} onClick={loadAllData} type="button" disabled={loading}>
                <window.Icon name="refresh-cw" size={11} className={loading ? 'animate-spin' : ''} />
                <span style={{ marginLeft: '4px' }}>Refresh</span>
              </button>
              <button className="btn secondary" style={{ height: '32px', padding: '0 10px', fontSize: '11px', borderRadius: '6px' }} onClick={logout} type="button">
                <window.Icon name="log-out" size={11} />
                <span style={{ marginLeft: '4px' }}>Logout</span>
              </button>
            </div>
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
