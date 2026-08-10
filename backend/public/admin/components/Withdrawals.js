const { useState, useMemo } = React;

window.Withdrawals = function Withdrawals({ withdrawals = [], onProcess, rupees, dateStr }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const PAGE_SIZE = 10;

  // ── Statistics Overview ──────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCount = withdrawals.length;
    const totalAmount = withdrawals.reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const pendingList = withdrawals.filter((w) => w.status === 'pending');
    const completedList = withdrawals.filter((w) => w.status === 'completed');
    const rejectedList = withdrawals.filter((w) => w.status === 'rejected');

    const pendingAmount = pendingList.reduce((acc, w) => acc + Number(w.amount || 0), 0);
    const completedAmount = completedList.reduce((acc, w) => acc + Number(w.amount || 0), 0);

    return {
      totalCount,
      totalAmount,
      pendingCount: pendingList.length,
      pendingAmount,
      completedCount: completedList.length,
      completedAmount,
      rejectedCount: rejectedList.length,
    };
  }, [withdrawals]);

  // ── Filtering & Search ───────────────────────────────────────────
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((w) => {
      // Status filter
      if (statusFilter !== 'all' && (w.status || '').toLowerCase() !== statusFilter) {
        return false;
      }
      // Method filter
      if (methodFilter !== 'all' && (w.method || '').toLowerCase() !== methodFilter) {
        return false;
      }
      // Search query
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* ── Stats Overview Cards ───────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        {/* Total Requested */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Requested
            </p>
            <h3 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 800, color: '#f8fafc' }}>
              {rupees ? rupees(stats.totalAmount) : `₹${stats.totalAmount}`}
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'inline-block' }}>
              {stats.totalCount} total request{stats.totalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(124, 58, 237, 0.15)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#a78bfa'
          }}>
            💳
          </div>
        </div>

        {/* Pending Payouts */}
        <div style={{
          background: 'rgba(245, 158, 11, 0.04)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pending Action
            </p>
            <h3 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 800, color: '#fbbf24' }}>
              {rupees ? rupees(stats.pendingAmount) : `₹${stats.pendingAmount}`}
            </h3>
            <span style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', display: 'inline-block', fontWeight: 700 }}>
              {stats.pendingCount} request{stats.pendingCount !== 1 ? 's' : ''} pending
            </span>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#f59e0b'
          }}>
            ⏳
          </div>
        </div>

        {/* Completed Payouts */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.04)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Paid Out
            </p>
            <h3 style={{ margin: '6px 0 0', fontSize: '24px', fontWeight: 800, color: '#34d399' }}>
              {rupees ? rupees(stats.completedAmount) : `₹${stats.completedAmount}`}
            </h3>
            <span style={{ fontSize: '11px', color: '#10b981', marginTop: '4px', display: 'inline-block' }}>
              {stats.completedCount} request{stats.completedCount !== 1 ? 's' : ''} approved
            </span>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#10b981'
          }}>
            ✅
          </div>
        </div>
      </div>

      {/* ── Main Panel Table ───────────────────────────────────────── */}
      <section className="panel" style={{ width: '100%', overflow: 'hidden' }}>
        <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>

          {/* Toolbar: Filters & Search */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            background: 'rgba(255, 255, 255, 0.015)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            padding: '14px 16px'
          }}>
            {/* Status Filter Tabs */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {[
                { id: 'all', label: 'All', count: stats.totalCount },
                { id: 'pending', label: 'Pending', count: stats.pendingCount, color: '#f59e0b' },
                { id: 'completed', label: 'Completed', count: stats.completedCount, color: '#10b981' },
                { id: 'rejected', label: 'Rejected', count: stats.rejectedCount, color: '#ef4444' },
              ].map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                    style={{
                      background: active ? (tab.color ? `${tab.color}22` : 'rgba(124, 58, 237, 0.2)') : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${active ? (tab.color || '#7c3aed') : 'rgba(255, 255, 255, 0.08)'}`,
                      color: active ? (tab.color || '#a78bfa') : '#94a3b8',
                      borderRadius: '10px',
                      padding: '6px 14px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      background: active ? (tab.color || '#7c3aed') : 'rgba(255,255,255,0.1)',
                      color: active ? '#fff' : '#cbd5e1',
                      borderRadius: '10px',
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 800
                    }}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right side: Method Select & Search Input */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: '1', justifyContent: 'flex-end', minWidth: '280px' }}>
              <select
                value={methodFilter}
                onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#e2e8f0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Methods</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>

              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Search user, ID, UPI..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#f8fafc',
                    borderRadius: '10px',
                    padding: '8px 12px 8px 30px',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '12px' }}>🔍</span>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Table Container ───────────────────────────────────── */}
          <div className="table-wrap" style={{
            width: '100%',
            overflowX: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            {filteredWithdrawals.length === 0 ? (
              <div className="empty" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>💸</div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#f1f5f9' }}>No Withdrawals Found</h3>
                  <p className="muted" style={{ fontSize: '13px', margin: 0 }}>
                    {search || statusFilter !== 'all' || methodFilter !== 'all'
                      ? 'No withdrawal requests match your selected filters.'
                      : 'No withdrawal requests have been created yet.'}
                  </p>
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', minWidth: '940px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ width: '115px', padding: '14px 16px' }}>Wallet ID</th>
                    <th style={{ padding: '14px 16px' }}>User Details</th>
                    <th style={{ width: '100px', padding: '14px 16px' }}>Amount</th>
                    <th style={{ width: '100px', padding: '14px 16px' }}>Method</th>
                    <th style={{ padding: '14px 16px' }}>Payout Account / Details</th>
                    <th style={{ width: '110px', padding: '14px 16px' }}>Status</th>
                    <th style={{ width: '140px', padding: '14px 16px' }}>Requested</th>
                    <th style={{ width: '180px', padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedWithdrawals.map((w) => {
                    const formattedWalletId = w.wallet_id
                      ? String(w.wallet_id).replace(/^STK-/i, '').padStart(6, '0')
                      : String(w.user_id || '').padStart(6, '0');

                    const isPending = w.status === 'pending';
                    const isCompleted = w.status === 'completed';
                    const isRejected = w.status === 'rejected';

                    const detailsStr = w.account_number || w.ifsc_code || w.bank_name || '';

                    return (
                      <tr
                        key={w.id}
                        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.15s' }}
                      >
                        {/* Wallet ID */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#a78bfa',
                            background: 'rgba(139, 92, 246, 0.12)',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            letterSpacing: '0.8px',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            display: 'inline-block',
                            whiteSpace: 'nowrap'
                          }}>
                            {formattedWalletId}
                          </span>
                        </td>

                        {/* User Info */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#f8fafc' }}>
                              {w.user_name || `User #${w.user_id}`}
                            </span>
                            {w.user_email && (
                              <span style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                ✉ {w.user_email}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                            {rupees ? rupees(w.amount || 0) : `₹${w.amount || 0}`}
                          </span>
                        </td>

                        {/* Method */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
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
                                <div style={{ fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {w.account_number}
                                </div>
                              )}
                              {w.ifsc_code && (
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                  IFSC: {w.ifsc_code}
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
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                          <span className={`badge ${isCompleted ? 'green' : isPending ? 'yellow' : 'red'}`} style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            textTransform: 'uppercase'
                          }}>
                            {w.status || 'pending'}
                          </span>
                        </td>

                        {/* Requested Date */}
                        <td style={{ padding: '14px 16px', verticalAlign: 'middle', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {dateStr ? dateStr(w.created_at) : new Date(w.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions — FIX FOR CUT OFF BUTTONS */}
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
                                onClick={() => onProcess(w.id, 'completed')}
                              >
                                ✓ Approve
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
                                onClick={() => onProcess(w.id, 'rejected')}
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
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* ── Pagination Footer ─────────────────────────────────── */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              paddingTop: '10px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: '12px',
              color: '#94a3b8'
            }}>
              <span>
                Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, filteredWithdrawals.length)} of {filteredWithdrawals.length} entries
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    background: page === 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
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
                <span style={{ padding: '5px 10px', fontWeight: 700, color: '#f8fafc' }}>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  style={{
                    background: page === totalPages ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.06)',
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
        </div>
      </section>

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
              maxWidth: '520px',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
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
                    {rupees ? rupees(selectedRecord.amount || 0) : `₹${selectedRecord.amount || 0}`}
                  </p>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>({(selectedRecord.amount || 0) * 4} Coins)</span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', padding: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Status</span>
                  <p style={{ margin: '4px 0 0' }}>
                    <span className={`badge ${selectedRecord.status === 'completed' ? 'green' : selectedRecord.status === 'pending' ? 'yellow' : 'red'}`}>
                      {selectedRecord.status || 'pending'}
                    </span>
                  </p>
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
                      onProcess(selectedRecord.id, 'completed');
                      setSelectedRecord(null);
                    }}
                  >
                    Approve Payout
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
                      onProcess(selectedRecord.id, 'rejected');
                      setSelectedRecord(null);
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
    </div>
  );
};
