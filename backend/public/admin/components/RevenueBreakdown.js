const { useState, useEffect, useMemo } = React;

window.RevenueBreakdown = function RevenueBreakdown({ rupees, dateStr, showNotice, onTabChange, apiRequest }) {
  const [data, setData] = useState({
    summary: { totalRevenue: 0, totalTransactions: 0, totalCoinsSold: 0, averageOrderValue: 0 },
    packages: [],
    transactions: []
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;

  const fetchRevenue = async () => {
    setLoading(true);
    try {
      const res = await apiRequest('/admin/revenue');
      if (res && res.data && res.data.revenue) {
        setData(res.data.revenue);
      }
    } catch (err) {
      if (showNotice) showNotice(err.message || 'Failed to load revenue details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const copyToClipboard = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTransactions = useMemo(() => {
    let list = data.transactions || [];
    if (gatewayFilter !== 'all') {
      list = list.filter((t) => (t.payment_gateway || 'other').toLowerCase() === gatewayFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter((t) =>
        (t.user_name && t.user_name.toLowerCase().includes(q)) ||
        (t.wallet_id && String(t.wallet_id).toLowerCase().includes(q)) ||
        (t.user_email && t.user_email.toLowerCase().includes(q)) ||
        (t.user_phone && t.user_phone.toLowerCase().includes(q)) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.payment_reference && String(t.payment_reference).toLowerCase().includes(q)) ||
        (t.payment_gateway && String(t.payment_gateway).toLowerCase().includes(q))
      );
    }
    return list;
  }, [data.transactions, search, gatewayFilter]);

  const totalPages = Math.ceil(filteredTransactions.length / PAGE_SIZE) || 1;

  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, page]);

  const showingFrom = filteredTransactions.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, filteredTransactions.length);

  const totalRev = Number(data.summary?.totalRevenue || 0);

  // Avatar Gradient Palette Generator
  const getAvatarGradient = (name = '') => {
    const gradients = [
      'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
      'linear-gradient(135deg, #3b82f6 0%, #22c55e 100%)',
      'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
      'linear-gradient(135deg, #14b8a6 0%, #3b82f6 100%)'
    ];
    let charCodeSum = 0;
    for (let i = 0; i < name.length; i++) charCodeSum += name.charCodeAt(i);
    return gradients[charCodeSum % gradients.length];
  };

  // Payment Gateway Badge Color Helper
  const getGatewayStyle = (gwayStr = '') => {
    const g = gwayStr.toLowerCase();
    if (g.includes('phonepe')) {
      return { bg: 'rgba(124, 58, 237, 0.18)', color: '#c084fc', border: 'rgba(124, 58, 237, 0.35)', label: 'PHONEPE' };
    }
    if (g.includes('upi') || g.includes('qr')) {
      return { bg: 'rgba(16, 185, 129, 0.18)', color: '#34d399', border: 'rgba(16, 185, 129, 0.35)', label: 'UPI / QR' };
    }
    if (g.includes('razorpay')) {
      return { bg: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.35)', label: 'RAZORPAY' };
    }
    if (g.includes('stripe')) {
      return { bg: 'rgba(99, 102, 241, 0.18)', color: '#818cf8', border: 'rgba(99, 102, 241, 0.35)', label: 'STRIPE' };
    }
    return { bg: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: 'rgba(148, 163, 184, 0.3)', label: gwayStr.toUpperCase() || 'DIRECT' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* ── Glassmorphic Hero Banner ──────────────────────────── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%)',
        padding: '22px 24px',
        borderRadius: '20px',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              type="button"
              onClick={() => onTabChange && onTabChange('dashboard')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#e2e8f0',
                padding: '9px 16px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(51, 65, 85, 0.9)'; e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)'; }}
            >
              ← Back to Dashboard
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
                  Total Revenue (Approved Payments)
                </h2>
                <span style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#34d399',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 900
                }}>
                  {rupees ? rupees(totalRev) : `₹${totalRev.toLocaleString('en-IN')}`}
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: '#94a3b8', margin: '4px 0 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>✓ Verified &amp; approved incoming payments only</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchRevenue}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#f3e8ff',
              padding: '9px 18px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            {loading ? '🔄 Syncing...' : '🔄 Refresh Log'}
          </button>
        </div>
      </div>

      {/* ── Main Data Table Card ─────────────────────────────── */}
      <div style={{
        background: '#0b1120',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden'
      }}>

        {/* ── Integrated Toolbar Header ──────────────────────── */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justify: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>📜</span>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              Transaction Log Records
            </h3>
            <span style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          {/* Search & Gateway Filter Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search Name, Wallet ID, UTR..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{
                  width: '260px',
                  padding: '9px 14px 9px 36px',
                  fontSize: '12.5px',
                  borderRadius: '12px',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
              />
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '13px' }}>🔍</span>
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setPage(1); }}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '12px' }}
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={gatewayFilter}
              onChange={(e) => { setGatewayFilter(e.target.value); setPage(1); }}
              style={{
                padding: '9px 14px',
                fontSize: '12.5px',
                borderRadius: '12px',
                background: '#1e293b',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                outline: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <option value="all">⚡ All Gateways</option>
              <option value="phonepe">🟣 PhonePe</option>
              <option value="upi">🟢 UPI / QR</option>
              <option value="razorpay">🔵 Razorpay</option>
              <option value="stripe">🟣 Stripe</option>
            </select>
          </div>
        </div>

        {/* ── Table Content ──────────────────────────────────── */}
        {loading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', fontWeight: 600 }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔄</div>
            Fetching live revenue transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>No matching transactions found</div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Try searching with a different term or clearing your gateway filter</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '980px', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{
                  background: 'rgba(15, 23, 42, 0.9)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#64748b',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap'
                }}>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Wallet ID</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>User</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Package / Type</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Amount Paid</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Coins Credited</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Gateway &amp; Reference UTR</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Date &amp; Time</th>
                  <th style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((t, idx) => {
                  const amt = Number(t.amount || 0);
                  const userName = t.user_name || 'User #' + t.user_id;
                  const initial = userName.trim().charAt(0).toUpperCase() || 'U';
                  const avatarGradient = getAvatarGradient(userName);
                  const gStyle = getGatewayStyle(t.payment_gateway || 'UPI');
                  const ref = t.payment_reference;

                  return (
                    <tr
                      key={t.id || idx}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        background: idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'; }}
                    >

                      {/* Wallet ID */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: '#c084fc',
                          background: 'rgba(168, 85, 247, 0.12)',
                          border: '1px solid rgba(168, 85, 247, 0.25)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          letterSpacing: '0.05em'
                        }}>
                          {t.wallet_id || 'N/A'}
                        </span>
                      </td>

                      {/* User Details with Initial Avatar */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: avatarGradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: 900,
                            fontSize: '14px',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
                            flexShrink: 0
                          }}>
                            {initial}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '13.5px', lineHeight: '1.2', whiteSpace: 'nowrap' }}>{userName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', whiteSpace: 'nowrap' }}>{t.user_email || `ID: ${t.wallet_id || t.user_id}`}</div>
                          </div>
                        </div>
                      </td>

                      {/* Package / Description Tag */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-block',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          padding: '3px 9px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          {t.description || t.title || 'Coin Package'}
                        </span>
                        {t.title && t.title !== t.description && (
                          <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px', whiteSpace: 'nowrap' }}>{t.title}</div>
                        )}
                      </td>

                      {/* Amount Paid */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 900, color: '#34d399', fontSize: '14.5px', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                          +{rupees ? rupees(amt) : `₹${amt}`}
                        </div>
                      </td>

                      {/* Coins Credited */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#fbbf24',
                          border: '1px solid rgba(245, 158, 11, 0.25)',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}>
                          🪙 +{t.coins}
                        </span>
                      </td>

                      {/* Gateway & Ref UTR Code Block */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 900,
                            background: gStyle.bg,
                            color: gStyle.color,
                            border: `1px solid ${gStyle.border}`,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap'
                          }}>
                            {gStyle.label}
                          </span>

                          {ref && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ref, `ref-${t.id}`)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: 'rgba(15, 23, 42, 0.9)',
                                border: copiedId === `ref-${t.id}` ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
                                color: copiedId === `ref-${t.id}` ? '#34d399' : '#cbd5e1',
                                borderRadius: '8px',
                                padding: '4px 9px',
                                fontFamily: 'monospace',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                              title="Click to copy full UTR reference"
                            >
                              <span>{copiedId === `ref-${t.id}` ? '✓ Copied!' : '📋'}</span>
                              <span>{String(ref).substring(0, 16)}{String(ref).length > 16 ? '...' : ''}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', color: '#94a3b8', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                        {dateStr ? dateStr(t.date) : t.date}
                      </td>

                      {/* Status Pulse Badge */}
                      <td style={{ padding: '16px 18px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                          background: 'rgba(16, 185, 129, 0.12)',
                          color: '#34d399',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          letterSpacing: '0.04em'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', marginRight: '6px', boxShadow: '0 0 8px #34d399', flexShrink: 0 }} />
                          Payment Successfully Done
                        </span>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Footer ───────────────────────────── */}
        {!loading && filteredTransactions.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            padding: '16px 24px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '12.5px',
            color: '#94a3b8'
          }}>
            <div>
              Showing <strong style={{ color: '#f8fafc' }}>{showingFrom}</strong> to <strong style={{ color: '#f8fafc' }}>{showingTo}</strong> of <strong style={{ color: '#f8fafc' }}>{filteredTransactions.length}</strong> revenue records
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: page <= 1 ? '#64748b' : '#f8fafc',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  opacity: page <= 1 ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                ← Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) => {
                  if (item === '...') {
                    return <span key={`dots-${idx}`} style={{ padding: '0 4px', color: '#64748b' }}>...</span>;
                  }
                  const isCurrent = item === page;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setPage(item)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: isCurrent ? 'linear-gradient(135deg, #7c5cff, #4f8cff)' : 'rgba(30, 41, 59, 0.8)',
                        border: isCurrent ? '1px solid #7c5cff' : '1px solid rgba(255, 255, 255, 0.12)',
                        color: isCurrent ? '#ffffff' : '#cbd5e1',
                        fontWeight: isCurrent ? 800 : 600,
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {item}
                    </button>
                  );
                })}

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: page >= totalPages ? '#64748b' : '#f8fafc',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  opacity: page >= totalPages ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                Next →
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
