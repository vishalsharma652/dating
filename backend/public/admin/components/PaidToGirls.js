const { useState, useMemo, useRef } = React;

window.PaidToGirls = function PaidToGirls({ withdrawals = [], onProcess, onRefresh, onTabChange, showNotice, rupees, dateStr }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  // Modal states
  const [modalItem, setModalItem] = useState(null);
  const [modalStatus, setModalStatus] = useState('completed');
  const [modalNote, setModalNote] = useState('');
  const [modalFile, setModalFile] = useState(null);
  const [modalPreview, setModalPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const cleanVal = (val) => (!val || String(val).toLowerCase() === 'null' || String(val).trim() === '') ? null : String(val).trim();

  // Lightbox preview state
  const [lightboxImage, setLightboxImage] = useState(null);

  const PAGE_SIZE = 10;

  // ── Statistics Overview ──────────────────────────────────────────
  const stats = useMemo(() => {
    const getCoins = (w) => Number(w.coins || 0) > 0 ? Number(w.coins) : Math.round(Number(w.amount || 0) * 4);

    const totalCount = withdrawals.length;
    const totalAmount = withdrawals.reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const totalCoins = withdrawals.reduce((acc, w) => acc + getCoins(w), 0);

    const pendingList = withdrawals.filter((w) => w.status === 'pending');
    const completedList = withdrawals.filter((w) => w.status === 'completed');
    const rejectedList = withdrawals.filter((w) => w.status === 'rejected');

    const pendingAmount = pendingList.reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const pendingCoins = pendingList.reduce((acc, w) => acc + getCoins(w), 0);

    const completedAmount = completedList.reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const completedCoins = completedList.reduce((acc, w) => acc + getCoins(w), 0);

    return {
      totalCount,
      totalAmount,
      totalCoins,
      pendingCount: pendingList.length,
      pendingAmount,
      pendingCoins,
      completedCount: completedList.length,
      completedAmount,
      completedCoins,
      rejectedCount: rejectedList.length,
    };
  }, [withdrawals]);

  // ── Filtering & Search ───────────────────────────────────────────
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      if (statusFilter !== 'all' && (w.status || '').toLowerCase() !== statusFilter) {
        return false;
      }
      if (methodFilter !== 'all' && (w.method || '').toLowerCase() !== methodFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const nameMatch = (w.user_name || '').toLowerCase().includes(q);
        const emailMatch = (w.user_email || '').toLowerCase().includes(q);
        const walletIdMatch = (w.wallet_id || '').toLowerCase().includes(q);
        const accountMatch = (w.account_number || '').toLowerCase().includes(q);
        const bankMatch = (w.bank_name || '').toLowerCase().includes(q);
        const amountMatch = String(w.amount || '').includes(q);
        if (!nameMatch && !emailMatch && !walletIdMatch && !accountMatch && !bankMatch && !amountMatch) {
          return false;
        }
      }
      return true;
    });
  }, [withdrawals, statusFilter, methodFilter, search]);

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / PAGE_SIZE) || 1;
  const paginatedWithdrawals = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredWithdrawals.slice(start, start + PAGE_SIZE);
  }, [filteredWithdrawals, page]);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatAmount = (amt) => (rupees ? rupees(amt) : `₹${amt}`);
  const getCoinsCount = (w) => Number(w.coins || 0) > 0 ? Number(w.coins) : Math.round(Number(w.amount || 0) * 4);

  // Open Modal Handler
  const openProcessModal = (item, defaultStatus = 'completed') => {
    setModalItem(item);
    setModalStatus(defaultStatus || item.status || 'completed');
    setModalNote(item.admin_note || item.adminNote || '');
    setModalFile(null);
    setModalPreview(item.screenshot_url || item.screenshotUrl || null);
    setIsSubmitting(false);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalItem(null);
    setModalFile(null);
    setModalPreview(null);
    setModalNote('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, JPEG, WEBP)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('Image file size should be under 10MB');
        return;
      }
      setModalFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setModalPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setModalFile(null);
    setModalPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitModal = async (e) => {
    e?.preventDefault();
    if (!modalItem) return;
    const submittedStatus = modalStatus;
    setIsSubmitting(true);
    try {
      if (onProcess) {
        await onProcess(modalItem.id, {
          status: modalStatus,
          screenshotFile: modalFile,
          screenshotUrl: modalFile ? null : modalPreview,
          adminNote: modalNote.trim()
        });
      }
      closeModal();
      if (onRefresh) await onRefresh();
      if (submittedStatus === 'completed' && onTabChange) {
        onTabChange('withdrawals');
      }
    } catch (err) {
      console.error('Failed to update payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* ── Top Back Button Toolbar ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <button
          type="button"
          onClick={() => onTabChange && onTabChange('dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#f8fafc',
            padding: '10px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
          }}
        >
          <span style={{ fontSize: '16px' }}>←</span>
          <span>Back to Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange && onTabChange('withdrawals')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <span>View All Withdrawals &rarr;</span>
        </button>
      </div>

      {/* ── Page Header Banner ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(124, 58, 237, 0.1) 100%)',
        border: '1px solid rgba(236, 72, 153, 0.3)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(236, 72, 153, 0.1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '26px' }}>💖</span>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              Paid to Female (Female User Payouts)
            </h2>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#cbd5e1', maxWidth: '650px' }}>
            Dedicated management page for female users' earnings payout requests. Verify UPI IDs, Bank Account details, upload payment proof screenshots, and approve payouts.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div
            onClick={() => { setStatusFilter('completed'); setPage(1); }}
            style={{
              background: statusFilter === 'completed' ? 'rgba(236, 72, 153, 0.35)' : 'rgba(236, 72, 153, 0.2)',
              border: `1px solid ${statusFilter === 'completed' ? '#ec4899' : 'rgba(236, 72, 153, 0.4)'}`,
              borderRadius: '12px',
              padding: '8px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '11px', color: '#f472b6', fontWeight: 700, display: 'block' }}>✓ TOTAL PAID</span>
            <span style={{ fontSize: '18px', color: '#fff', fontWeight: 900 }}>{formatAmount(stats.completedAmount)}</span>
          </div>
          <div
            onClick={() => { setStatusFilter('pending'); setPage(1); }}
            style={{
              background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.2)',
              border: `1px solid ${statusFilter === 'pending' ? '#fbbf24' : 'rgba(245, 158, 11, 0.4)'}`,
              borderRadius: '12px',
              padding: '8px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, display: 'block' }}>⏳ PENDING PAYOUTS</span>
            <span style={{ fontSize: '18px', color: '#fff', fontWeight: 900 }}>{formatAmount(stats.pendingAmount)}</span>
          </div>
        </div>
      </div>

      {/* ── Stats Overview Cards (CLICKABLE) ───────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '16px',
        width: '100%'
      }}>
        {/* Total Requested */}
        <div
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          style={{
            background: statusFilter === 'all' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${statusFilter === 'all' ? '#ec4899' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '16px',
            padding: '16px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL REQUESTED
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f8fafc', marginTop: '4px' }}>
              {formatAmount(stats.totalAmount)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {stats.totalCount} total requests ({stats.totalCoins} 🪙)
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(99, 102, 241, 0.15)',
            color: '#818cf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            📊
          </div>
        </div>

        {/* Completed Payouts */}
        <div
          onClick={() => { setStatusFilter('completed'); setPage(1); }}
          style={{
            background: statusFilter === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.04)',
            border: `2px solid ${statusFilter === 'completed' ? '#10b981' : 'rgba(16, 185, 129, 0.2)'}`,
            borderRadius: '16px',
            padding: '16px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: statusFilter === 'completed' ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✓ COMPLETED (PAID)
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#34d399', marginTop: '4px' }}>
              {formatAmount(stats.completedAmount)}
            </div>
            <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '2px' }}>
              {stats.completedCount} approved ({stats.completedCoins} 🪙)
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.2)',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            ✓
          </div>
        </div>

        {/* Pending Requests */}
        <div
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          style={{
            background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.04)',
            border: `2px solid ${statusFilter === 'pending' ? '#fbbf24' : 'rgba(245, 158, 11, 0.2)'}`,
            borderRadius: '16px',
            padding: '16px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: statusFilter === 'pending' ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ⏳ PENDING APPROVAL
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#fbbf24', marginTop: '4px' }}>
              {formatAmount(stats.pendingAmount)}
            </div>
            <div style={{ fontSize: '11px', color: '#fde68a', marginTop: '2px' }}>
              {stats.pendingCount} waiting ({stats.pendingCoins} 🪙)
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.2)',
            color: '#fbbf24',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            ⏳
          </div>
        </div>

        {/* Rejected Requests */}
        <div
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          style={{
            background: statusFilter === 'rejected' ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.04)',
            border: `2px solid ${statusFilter === 'rejected' ? '#f87171' : 'rgba(244, 63, 94, 0.2)'}`,
            borderRadius: '16px',
            padding: '16px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ✕ REJECTED PAYOUTS
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#f87171', marginTop: '4px' }}>
              {stats.rejectedCount}
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
              Coins refunded to female user
            </div>
          </div>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.2)',
            color: '#f87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
          }}>
            ✕
          </div>
        </div>
      </div>

      {/* ── Quick Status Filter Tabs ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: `1px solid ${statusFilter === 'all' ? '#ec4899' : 'rgba(255, 255, 255, 0.1)'}`,
            background: statusFilter === 'all' ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            color: statusFilter === 'all' ? '#fff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>🔘 All Requests</span>
          <span style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '6px', fontSize: '11px' }}>
            {stats.totalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('completed'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: `1px solid ${statusFilter === 'completed' ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
            background: statusFilter === 'completed' ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3))' : 'rgba(16, 185, 129, 0.08)',
            color: statusFilter === 'completed' ? '#fff' : '#34d399',
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: statusFilter === 'completed' ? '0 0 12px rgba(16, 185, 129, 0.3)' : 'none'
          }}
        >
          <span>✓ Completed / Paid Record</span>
          <span style={{ background: 'rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', color: '#fff' }}>
            {stats.completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: `1px solid ${statusFilter === 'pending' ? '#fbbf24' : 'rgba(245, 158, 11, 0.3)'}`,
            background: statusFilter === 'pending' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.08)',
            color: statusFilter === 'pending' ? '#fff' : '#fbbf24',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>⏳ Pending Requests</span>
          <span style={{ background: 'rgba(245, 158, 11, 0.3)', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', color: '#fff' }}>
            {stats.pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: `1px solid ${statusFilter === 'rejected' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
            background: statusFilter === 'rejected' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.08)',
            color: statusFilter === 'rejected' ? '#fff' : '#f87171',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>✕ Rejected</span>
          <span style={{ background: 'rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '6px', fontSize: '11px', color: '#fff' }}>
            {stats.rejectedCount}
          </span>
        </button>
      </div>

      {/* ── Filters & Search Toolbar ───────────────────────────────── */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 280px', maxWidth: '400px', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by Female Name, Email, Wallet ID, UPI..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 14px 10px 38px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#f8fafc',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '14px' }}>
            🔍
          </span>
        </div>

        {/* Method Filter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Payment Method:</span>
          <select
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: '#131326',
              color: '#f8fafc',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all">All Methods</option>
            <option value="upi">UPI ID Only ⚡</option>
            <option value="bank_transfer">Bank Transfer Only 🏦</option>
          </select>
        </div>
      </div>

      {/* ── Main Data Table ─────────────────────────────────────────── */}
      <div style={{
        background: 'rgba(18, 18, 33, 0.65)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>WALLET ID</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>FEMALE DETAILS</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AMOUNT (₹)</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>COINS</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>METHOD</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PAYOUT ACCOUNT / UPI</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>PAYMENT PROOF</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                      {statusFilter === 'completed' ? '✓' : '💖'}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', color: '#f8fafc' }}>
                      {statusFilter === 'completed' ? 'No Completed Payouts Found' : 'No Female Payout Requests Found'}
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '6px', color: '#94a3b8' }}>
                      {statusFilter === 'completed'
                        ? 'Approve pending withdrawals and upload payment proof to view completed records here.'
                        : search || methodFilter !== 'all'
                        ? 'No withdrawal requests match your search or filter criteria.'
                        : 'No female payout requests have been submitted yet.'}
                    </div>
                    {statusFilter === 'completed' && stats.pendingCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('pending')}
                        style={{
                          marginTop: '16px',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12px',
                          border: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        View {stats.pendingCount} Pending Requests &rarr;
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedWithdrawals.map((w) => {
                  const isUpi = String(w.method || '').toLowerCase() === 'upi';
                  const upiValue = w.account_number || w.upi_id || w.bank_name || '';
                  const coinsCount = getCoinsCount(w);
                  const proofUrl = w.screenshot_url || w.screenshotUrl || null;

                  return (
                    <tr
                      key={w.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.2s',
                        background: w.status === 'completed' ? 'rgba(16, 185, 129, 0.02)' : 'transparent'
                      }}
                    >
                      {/* Wallet ID */}
                      <td style={{ padding: '16px', fontFamily: 'monospace', fontWeight: 800, color: '#ec4899', fontSize: '13px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        #{w.wallet_id || String(w.user_id).padStart(6, '0')}
                      </td>

                      {/* Girl Details */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: w.status === 'completed'
                              ? 'linear-gradient(135deg, #10b981, #ec4899)'
                              : 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            color: '#fff',
                            fontSize: '14px',
                            flexShrink: 0
                          }}>
                            {(w.user_name || 'G')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{w.user_name || 'Female User'}</span>
                              {w.status === 'completed' && <span style={{ color: '#10b981', fontSize: '12px' }}>✓</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{w.user_phone || w.user_email || `ID: ${w.user_id}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Amount in ₹ */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontWeight: 900, color: '#10b981', fontSize: '16px', letterSpacing: '-0.01em' }}>
                          {formatAmount(w.amount)}
                        </span>
                      </td>

                      {/* Coins */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#fbbf24',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          🪙 {coinsCount} Coins
                        </span>
                      </td>

                      {/* Payout Method */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap',
                          background: isUpi ? 'rgba(59, 130, 246, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          color: isUpi ? '#60a5fa' : '#c084fc',
                          border: `1px solid ${isUpi ? 'rgba(59, 130, 246, 0.3)' : 'rgba(168, 85, 247, 0.3)'}`
                        }}>
                          {isUpi ? '⚡ UPI ID' : '🏦 BANK TRANSFER'}
                        </span>
                      </td>

                      {/* Payout Account / Details */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {isUpi ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#f8fafc', background: 'rgba(255, 255, 255, 0.06)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '13px', whiteSpace: 'nowrap' }}>
                              {upiValue}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(upiValue, `upi-${w.id}`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: copiedId === `upi-${w.id}` ? '#10b981' : '#94a3b8',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {copiedId === `upi-${w.id}` ? '✓ Copied' : '📋 Copy'}
                            </button>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                            <div><strong>A/C Name:</strong> {cleanVal(w.account_holder_name) || cleanVal(w.accountHolderName) || cleanVal(w.user_name) || 'N/A'}</div>
                            <div><strong>Bank:</strong> {cleanVal(w.bank_name) || 'N/A'}</div>
                            <div><strong>A/C No:</strong> <span style={{ fontFamily: 'monospace' }}>{cleanVal(w.account_number) || 'N/A'}</span></div>
                            <div><strong>IFSC:</strong> <span style={{ fontFamily: 'monospace' }}>{cleanVal(w.ifsc_code) || cleanVal(w.ifscCode) || 'N/A'}</span></div>
                          </div>
                        )}
                      </td>

                      {/* Payment Proof Column */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {proofUrl ? (
                          <button
                            type="button"
                            onClick={() => setLightboxImage({ url: proofUrl, title: `Payout Proof #${w.id} • ${w.user_name || 'User'} (₹${w.amount})` })}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'rgba(16, 185, 129, 0.15)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#34d399',
                              fontWeight: 700,
                              fontSize: '11px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                            title="Click to view payment proof screenshot"
                          >
                            <img
                              src={proofUrl}
                              alt="Proof"
                              style={{ width: '20px', height: '20px', borderRadius: '4px', objectFit: 'cover' }}
                            />
                            <span>View Proof 📷</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>No Screenshot</span>
                        )}
                      </td>

                      {/* Status & Date */}
                      <td style={{ padding: '16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 14px',
                            borderRadius: '999px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            whiteSpace: 'nowrap',
                            width: 'fit-content',
                            background: w.status === 'completed'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : w.status === 'pending'
                              ? 'rgba(245, 158, 11, 0.15)'
                              : 'rgba(244, 63, 94, 0.15)',
                            color: w.status === 'completed'
                              ? '#34d399'
                              : w.status === 'pending'
                              ? '#fbbf24'
                              : '#f87171',
                            border: `1px solid ${
                              w.status === 'completed'
                                ? 'rgba(16, 185, 129, 0.3)'
                                : w.status === 'pending'
                                ? 'rgba(245, 158, 11, 0.3)'
                                : 'rgba(244, 63, 94, 0.3)'
                            }`
                          }}>
                            {w.status === 'completed' ? '✓ Completed / Paid' : (w.status || 'pending')}
                          </span>
                          {w.completed_at && (
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                              Paid: {String(w.completed_at).slice(0, 16).replace('T', ' ')}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px', textAlign: 'right', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        {w.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => openProcessModal(w, 'completed')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 16px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: '#fff',
                                fontWeight: 800,
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                              }}
                            >
                              ✓ Paid / Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => openProcessModal(w, 'rejected')}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 14px',
                                borderRadius: '10px',
                                background: 'rgba(244, 63, 94, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(244, 63, 94, 0.3)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openProcessModal(w, w.status)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              color: '#cbd5e1',
                              fontWeight: 700,
                              cursor: 'pointer',
                              fontSize: '11px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Details / Update ⚙️
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Page {page} of {totalPages} ({filteredWithdrawals.length} female payout records)
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#fff',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: '#fff',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Process Payout Modal (Popup with Screenshot Upload & Status Picker) ────────── */}
      {modalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            background: 'rgba(5, 5, 12, 0.85)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) closeModal();
          }}
        >
          <div
            style={{
              background: '#121324',
              border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(236, 72, 153, 0.15)',
              position: 'relative'
            }}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💸</span>
                  <span>Process Payout & Upload Proof</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Request #{modalItem.id} • {modalItem.user_name || 'Female User'}
                </p>
              </div>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={closeModal}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitModal} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Recipient Details & Payment Info Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                {/* Amount & User Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700 }}>PAYOUT AMOUNT</span>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981' }}>
                      {formatAmount(modalItem.amount)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      🪙 {getCoinsCount(modalItem)} Coins
                    </span>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                      Wallet ID: #{modalItem.wallet_id || modalItem.user_id}
                    </div>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }}></div>

                {/* Recipient Payment Method details with 1-click Copy */}
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Payment Destination ({String(modalItem.method).toUpperCase()})
                  </div>

                  {String(modalItem.method || '').toLowerCase() === 'upi' ? (
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#60a5fa', fontWeight: 700 }}>⚡ UPI ID</div>
                        <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '15px', color: '#f8fafc', marginTop: '2px', wordBreak: 'break-all' }}>
                          {modalItem.account_number || modalItem.upi_id || modalItem.bank_name || 'N/A'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(modalItem.account_number || modalItem.upi_id || modalItem.bank_name, 'modal-upi')}
                        style={{
                          background: copiedId === 'modal-upi' ? '#10b981' : 'rgba(59, 130, 246, 0.2)',
                          color: copiedId === 'modal-upi' ? '#fff' : '#60a5fa',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                      >
                        {copiedId === 'modal-upi' ? '✓ Copied' : '📋 Copy UPI'}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(168, 85, 247, 0.1)',
                      border: '1px solid rgba(168, 85, 247, 0.3)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      fontSize: '12px',
                      color: '#cbd5e1'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#c084fc', fontWeight: 700 }}>Account Name:</span>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{modalItem.account_holder_name || modalItem.user_name || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#c084fc', fontWeight: 700 }}>Bank:</span>
                        <span>{modalItem.bank_name || 'N/A'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#c084fc', fontWeight: 700 }}>A/C Number:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f8fafc' }}>{modalItem.account_number}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(modalItem.account_number, 'modal-ac')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedId === 'modal-ac' ? '#10b981' : '#c084fc',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            {copiedId === 'modal-ac' ? '✓ Copied' : '📋'}
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#c084fc', fontWeight: 700 }}>IFSC Code:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#f8fafc' }}>
                            {cleanVal(modalItem.ifsc_code) || cleanVal(modalItem.ifscCode) || 'N/A'}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cleanVal(modalItem.ifsc_code) || cleanVal(modalItem.ifscCode) || '', 'modal-ifsc')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: copiedId === 'modal-ifsc' ? '#10b981' : '#c084fc',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700
                            }}
                          >
                            {copiedId === 'modal-ifsc' ? '✓ Copied' : '📋'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px' }}>
                  Update Payout Status *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {/* Option: Completed / Paid */}
                  <label
                    style={{
                      border: `2px solid ${modalStatus === 'completed' ? '#10b981' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: modalStatus === 'completed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <input
                      type="radio"
                      name="payout_status"
                      value="completed"
                      checked={modalStatus === 'completed'}
                      onChange={() => setModalStatus('completed')}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '16px' }}>✓</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: modalStatus === 'completed' ? '#34d399' : '#94a3b8' }}>
                      Completed / Paid
                    </span>
                  </label>

                  {/* Option: Pending */}
                  <label
                    style={{
                      border: `2px solid ${modalStatus === 'pending' ? '#f59e0b' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: modalStatus === 'pending' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <input
                      type="radio"
                      name="payout_status"
                      value="pending"
                      checked={modalStatus === 'pending'}
                      onChange={() => setModalStatus('pending')}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '16px' }}>⏳</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: modalStatus === 'pending' ? '#fbbf24' : '#94a3b8' }}>
                      Pending (Hold)
                    </span>
                  </label>

                  {/* Option: Rejected */}
                  <label
                    style={{
                      border: `2px solid ${modalStatus === 'rejected' ? '#ef4444' : 'rgba(255, 255, 255, 0.1)'}`,
                      background: modalStatus === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '12px',
                      padding: '12px 8px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <input
                      type="radio"
                      name="payout_status"
                      value="rejected"
                      checked={modalStatus === 'rejected'}
                      onChange={() => setModalStatus('rejected')}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '16px' }}>✕</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: modalStatus === 'rejected' ? '#f87171' : '#94a3b8' }}>
                      Rejected
                    </span>
                  </label>
                </div>
              </div>

              {/* Payment Screenshot Upload Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1' }}>
                    Payment Screenshot / Receipt Proof 📷
                  </label>
                  {modalPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ✕ Remove Image
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {modalPreview ? (
                  <div style={{
                    position: 'relative',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    background: '#0a0b14',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '12px'
                  }}>
                    <img
                      src={modalPreview}
                      alt="Payment Proof"
                      style={{
                        maxHeight: '200px',
                        maxWidth: '100%',
                        borderRadius: '8px',
                        objectFit: 'contain'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                        style={{
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#f8fafc',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        🔄 Change Screenshot
                      </button>
                      <button
                        type="button"
                        onClick={() => setLightboxImage({ url: modalPreview, title: `Screenshot Preview - Request #${modalItem.id}` })}
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          border: '1px solid rgba(59, 130, 246, 0.4)',
                          color: '#60a5fa',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        🔍 View Full Size
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    style={{
                      border: '2px dashed rgba(255, 255, 255, 0.15)',
                      borderRadius: '14px',
                      padding: '24px 16px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(255, 255, 255, 0.02)',
                      transition: 'all 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files && e.dataTransfer.files[0];
                      if (file && file.type.startsWith('image/')) {
                        setModalFile(file);
                        const reader = new FileReader();
                        reader.onload = (event) => setModalPreview(event.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <span style={{ fontSize: '32px' }}>📸</span>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      Click to upload payment screenshot
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      PNG, JPG, JPEG, WEBP (Max 10MB)
                    </div>
                  </div>
                )}
              </div>

              {/* UTR / Transaction Reference or Rejection/Hold Note */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: modalStatus === 'rejected' ? '#f87171' : modalStatus === 'pending' ? '#fbbf24' : '#cbd5e1',
                  marginBottom: '6px'
                }}>
                  {modalStatus === 'rejected'
                    ? 'Rejection Reason (Notification will be sent to user) *'
                    : modalStatus === 'pending'
                    ? 'Hold Reason / Note (Notification will be sent to user)'
                    : 'Transaction / UTR Reference No. or Note'}
                </label>
                <input
                  type="text"
                  placeholder={
                    modalStatus === 'rejected'
                      ? 'e.g. Invalid UPI ID, Bank Details Mismatch, KYC Incomplete...'
                      : modalStatus === 'pending'
                      ? 'e.g. Account under verification...'
                      : 'e.g. UTR: 412345678901, Paid via PhonePe/GPay...'
                  }
                  value={modalNote}
                  onChange={(e) => setModalNote(e.target.value)}
                  required={modalStatus === 'rejected'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${modalStatus === 'rejected' ? 'rgba(239, 68, 68, 0.5)' : modalStatus === 'pending' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                    background: modalStatus === 'rejected' ? 'rgba(239, 68, 68, 0.05)' : modalStatus === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.04)',
                    color: '#f8fafc',
                    fontSize: '13px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={closeModal}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#cbd5e1',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    background: modalStatus === 'completed'
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : modalStatus === 'rejected'
                      ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                      : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span>⏳</span>
                      <span>Saving & Uploading...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Submit & Update Payout</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── Image Lightbox Modal ────────────────────────────────────── */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'rgba(0, 0, 0, 0.9)',
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              color: '#f8fafc'
            }}>
              <span style={{ fontWeight: 700, fontSize: '14px' }}>{lightboxImage.title || 'Payment Proof Screenshot'}</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a
                  href={lightboxImage.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    textDecoration: 'none',
                    fontWeight: 600
                  }}
                >
                  ↗ Open Full Image
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '28px',
                    height: '28px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            <img
              src={lightboxImage.url}
              alt="Proof Full"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
