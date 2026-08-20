const { useState, useMemo, useRef } = React;

window.Withdrawals = function Withdrawals({ withdrawals = [], onProcess, onRefresh, rupees, dateStr }) {
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  // Detail modal state
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Process / Approve popup modal state
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

  // ── Filtering & Search (Payment Done Only) ───────────────────────
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      if ((w.status || '').toLowerCase() !== 'completed') {
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
  }, [withdrawals, methodFilter, search]);

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

  // Open Process/Approval Modal
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
    } catch (err) {
      console.error('Failed to update payout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* ── Top Back Button Toolbar ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%' }}>
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
      </div>

      {/* ── Filter Bar & Search ─────────────────────────────────────────── */}
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
            placeholder="Search by User Name, Email, Wallet ID, UPI..."
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
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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

      {/* ── Table Card ─────────────────────────────────────────────────── */}
      <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', minWidth: '850px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>WALLET ID</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>USER INFO</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>AMOUNT & COINS</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>METHOD</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>BANK / UPI DETAILS</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>STATUS</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>REQUESTED DATE</th>
                <th style={{ padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>💳</div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>No Withdrawal Records Found</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>
                      {search || methodFilter !== 'all'
                        ? 'No payment done records match your search or filter criteria.'
                        : 'No payment done records found.'}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedWithdrawals.map((w) => {
                  const isCompleted = w.status === 'completed';
                  const isPending = w.status === 'pending';
                  const coinsCount = getCoinsCount(w);
                  const formattedWalletId = '#' + String(w.wallet_id || w.user_id || '').replace(/^STK-/i, '').padStart(6, '0');
                  const detailsStr = w.account_number || w.ifsc_code || w.bank_name || '';

                  return (
                    <tr key={w.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}>
                      {/* Wallet ID */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '12px',
                          color: '#a78bfa',
                          background: 'rgba(139, 92, 246, 0.1)',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(139, 92, 246, 0.25)',
                          display: 'inline-block'
                        }}>
                          {formattedWalletId}
                        </span>
                      </td>

                      {/* User Info */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc' }}>
                              {w.user_name || `User #${w.user_id}`}
                            </span>
                            {w.user_gender && ['female', 'woman', 'girl', 'women'].includes(String(w.user_gender).toLowerCase()) && (
                              <span style={{ fontSize: '10px', background: 'rgba(236,72,153,0.15)', color: '#f472b6', padding: '1px 6px', borderRadius: '6px', fontWeight: 800, border: '1px solid rgba(236,72,153,0.3)' }}>
                                ♀ Female
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            {w.user_phone && <span>📞 {w.user_phone}</span>}
                            {w.user_email && <span>✉ {w.user_email}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Amount & Coins */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                            {formatAmount(w.amount || 0)}
                          </span>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: '#fbbf24',
                            background: 'rgba(251, 191, 36, 0.12)',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            width: 'fit-content'
                          }}>
                            🪙 {coinsCount.toLocaleString()} Coins
                          </span>
                        </div>
                      </td>

                      {/* Method */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          textTransform: 'uppercase',
                          fontWeight: 800,
                          fontSize: '10px',
                          letterSpacing: '0.5px',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          background: (w.method || '').toLowerCase() === 'upi' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(168, 85, 247, 0.12)',
                          color: (w.method || '').toLowerCase() === 'upi' ? '#38bdf8' : '#c084fc',
                          border: `1px solid ${(w.method || '').toLowerCase() === 'upi' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(168, 85, 247, 0.25)'}`
                        }}>
                          {w.method === 'upi' ? 'UPI' : 'Bank'}
                        </span>
                      </td>

                      {/* Bank / UPI Details */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                            <span style={{ fontWeight: 700, color: '#e2e8f0' }}>{w.bank_name || (w.method === 'upi' ? 'UPI' : 'Bank Transfer')}</span>
                            {w.account_number && (
                              <div style={{ fontSize: '12px', color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>
                                {w.account_number}
                              </div>
                            )}
                            {cleanVal(w.ifsc_code) && (
                              <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                IFSC: {cleanVal(w.ifsc_code)}
                              </div>
                            )}
                          </div>
                          {detailsStr && (
                            <button
                              type="button"
                              title="Copy account details"
                              onClick={() => copyToClipboard(w.account_number || detailsStr, w.id)}
                              style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: copiedId === w.id ? '#10b981' : '#94a3b8',
                                borderRadius: '6px',
                                padding: '3px 7px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              {copiedId === w.id ? '✓ Copied' : '📋 Copy'}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span className={`badge ${isCompleted ? 'green' : isPending ? 'yellow' : 'red'}`} style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            textTransform: 'uppercase',
                            width: 'fit-content'
                          }}>
                            {isCompleted ? '✓ Payment Done' : (w.status || 'pending')}
                          </span>
                          {w.admin_note && (
                            <span style={{ fontSize: '11px', color: '#cbd5e1', fontFamily: 'monospace' }}>
                              💬 {w.admin_note}
                            </span>
                          )}
                          {w.screenshot_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage({ url: w.screenshot_url, title: `Proof - ${w.user_name || 'User'} (₹${w.amount})` })}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#34d399',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: 0,
                                textAlign: 'left',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              📷 Proof Attached
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Requested Date */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {dateStr ? dateStr(w.created_at) : new Date(w.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {isPending ? (
                          <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn-action btn-primary"
                              style={{
                                backgroundColor: '#10b981',
                                color: '#07120b',
                                fontWeight: 800,
                                fontSize: '12px',
                                padding: '6px 14px',
                                height: '32px',
                                borderRadius: '8px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)'
                              }}
                              onClick={() => openProcessModal(w, 'completed')}
                            >
                              ✓ Paid / Approve
                            </button>
                            <button
                              type="button"
                              className="btn-action btn-danger-outline"
                              style={{
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                fontWeight: 700,
                                fontSize: '12px',
                                padding: '6px 12px',
                                height: '32px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              onClick={() => openProcessModal(w, 'rejected')}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setSelectedRecord(w)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: '#94a3b8',
                              borderRadius: '8px',
                              padding: '5px 12px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Details 🔍
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

        {/* ── Pagination Footer ─────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 20px',
            borderTop: '1px solid rgba(255,255,255,0.06)'
          }}>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Page {page} of {totalPages} ({filteredWithdrawals.length} records)
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: page === 1 ? '#64748b' : '#f1f5f9',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: page === totalPages ? '#64748b' : '#f1f5f9',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '12px',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── Process / Approve Payout Modal (with Screenshot Upload) ── */}
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
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 30px rgba(99, 102, 241, 0.15)',
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
                  <span>Process Withdrawal & Upload Proof</span>
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                  Request #{modalItem.id} • {modalItem.user_name || 'User'}
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
                      name="wd_payout_status"
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
                      name="wd_payout_status"
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
                      name="wd_payout_status"
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

      {/* ── Detail View Popup Modal ───────────────────────────────── */}
      {selectedRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#f8fafc' }}>
                  Withdrawal #{selectedRecord.id} Details
                </h3>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '12px' }}>
                  Requested on {dateStr ? dateStr(selectedRecord.created_at) : new Date(selectedRecord.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Content Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Info</span>
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>{selectedRecord.user_name || `User #${selectedRecord.user_id}`}</p>
                {selectedRecord.user_email && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#cbd5e1' }}>✉ {selectedRecord.user_email}</p>}
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#a78bfa', fontFamily: 'monospace', fontWeight: 700 }}>
                  Wallet ID: #{String(selectedRecord.wallet_id || selectedRecord.user_id || '').replace(/^STK-/i, '').padStart(6, '0')}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Amount</span>
                  <p style={{ margin: '4px 0 0', fontSize: '18px', fontWeight: 800, color: '#38bdf8' }}>
                    {formatAmount(selectedRecord.amount || 0)}
                  </p>
                  <span style={{ fontSize: '11px', color: '#fbbf24', fontWeight: 700 }}>
                    🪙 {getCoinsCount(selectedRecord)} Coins
                  </span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                  <p style={{ margin: '4px 0 0' }}>
                    <span className={`badge ${selectedRecord.status === 'completed' ? 'green' : selectedRecord.status === 'pending' ? 'yellow' : 'red'}`}>
                      {selectedRecord.status === 'completed' ? '✓ Payment Done' : (selectedRecord.status || 'pending')}
                    </span>
                  </p>
                  {selectedRecord.completed_at && (
                    <span style={{ fontSize: '11px', color: '#34d399', display: 'block', marginTop: '4px' }}>
                      Paid: {dateStr ? dateStr(selectedRecord.completed_at) : new Date(selectedRecord.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Payout Account / UPI Details</span>
                <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                  Method: {selectedRecord.method === 'upi' ? 'UPI Transfer' : 'Bank Account Transfer'}
                </p>
                <div style={{ margin: '8px 0 0', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px', fontFamily: 'monospace', fontSize: '13px', color: '#34d399', wordBreak: 'break-all' }}>
                  {selectedRecord.account_number || selectedRecord.ifsc_code || selectedRecord.bank_name || 'No details provided'}
                </div>
              </div>

              {selectedRecord.screenshot_url && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>Payment Proof Screenshot 📷</span>
                  <div style={{ marginTop: '8px', textAlign: 'center' }}>
                    <img
                      src={selectedRecord.screenshot_url}
                      alt="Payment Proof"
                      onClick={() => setLightboxImage({ url: selectedRecord.screenshot_url, title: `Proof - ${selectedRecord.user_name || 'User'} (₹${selectedRecord.amount})` })}
                      style={{ maxHeight: '180px', maxWidth: '100%', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', objectFit: 'contain', cursor: 'pointer' }}
                    />
                    <div style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setLightboxImage({ url: selectedRecord.screenshot_url, title: `Proof - ${selectedRecord.user_name || 'User'} (₹${selectedRecord.amount})` })}
                        style={{ background: 'none', border: 'none', fontSize: '11px', color: '#60a5fa', cursor: 'pointer', fontWeight: 600 }}
                      >
                        🔍 View Full Screen Lightbox
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedRecord.admin_note && (
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Transaction / UTR Reference</span>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#f8fafc', fontFamily: 'monospace' }}>
                    💬 {selectedRecord.admin_note}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '14px' }}>
              {selectedRecord.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    style={{
                      background: '#10b981',
                      color: '#07120b',
                      fontWeight: 800,
                      borderRadius: '10px',
                      padding: '8px 16px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const rec = selectedRecord;
                      setSelectedRecord(null);
                      openProcessModal(rec, 'completed');
                    }}
                  >
                    ✓ Paid / Approve
                  </button>
                  <button
                    type="button"
                    style={{
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontWeight: 700,
                      borderRadius: '10px',
                      padding: '8px 16px',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const rec = selectedRecord;
                      setSelectedRecord(null);
                      openProcessModal(rec, 'rejected');
                    }}
                  >
                    Reject
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    color: '#e2e8f0',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedRecord(null)}
                >
                  Close
                </button>
              )}
            </div>
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
