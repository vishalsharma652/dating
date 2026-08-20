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

  const totalRev = Number(data.summary?.totalRevenue || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Top Bar ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(30,41,59,0.5)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => onTabChange && onTabChange('dashboard')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
          >
            ← Back to Dashboard
          </button>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💰 Total Revenue Transactions Log</span>
            </h2>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Complete record of all coin purchases, user details &amp; payment UTR reference transactions
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn secondary"
          onClick={fetchRevenue}
          disabled={loading}
          style={{ fontSize: '13px', padding: '8px 14px', borderRadius: '10px' }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {/* ── All Revenue Transactions Log ─────────────────────── */}
      <div className="card" style={{ padding: '24px', borderRadius: '16px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
              📜 Detailed Revenue Transactions ({filteredTransactions.length})
            </h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
              Individual payment transactions contributing to Total Revenue ({rupees ? rupees(totalRev) : `₹${totalRev}`})
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <input
              className="input"
              type="text"
              placeholder="🔍 Search User, Wallet ID, Ref/UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '260px', padding: '8px 12px', fontSize: '12px', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
            />
            <select
              className="input"
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '12px', borderRadius: '10px', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff' }}
            >
              <option value="all">All Payment Gateways</option>
              <option value="phonepe">PhonePe</option>
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="manual">Manual / Admin / UPI</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading revenue records...</div>
        ) : filteredTransactions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No matching revenue transactions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '12px 14px' }}>Wallet ID</th>
                  <th style={{ padding: '12px 14px' }}>User Details</th>
                  <th style={{ padding: '12px 14px' }}>Package / Description</th>
                  <th style={{ padding: '12px 14px' }}>Amount Paid</th>
                  <th style={{ padding: '12px 14px' }}>Coins Credited</th>
                  <th style={{ padding: '12px 14px' }}>Gateway &amp; Reference UTR</th>
                  <th style={{ padding: '12px 14px' }}>Date &amp; Time</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((t) => {
                  const amt = Number(t.amount || 0);
                  const gway = String(t.payment_gateway || 'UPI/Direct').toUpperCase();
                  const ref = t.payment_reference;
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', color: '#e2e8f0' }}>
                      {/* Wallet ID */}
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#c084fc', background: 'rgba(192,132,252,0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                          {t.wallet_id || 'N/A'}
                        </span>
                      </td>

                      {/* User Details */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{t.user_name || 'User #' + t.user_id}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{t.user_phone || t.user_email || '—'}</div>
                      </td>

                      {/* Package / Description */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 700, color: '#38bdf8' }}>{t.description || t.title || 'Coin Recharge'}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.title}</div>
                      </td>

                      {/* Amount Paid */}
                      <td style={{ padding: '14px', fontWeight: 900, color: '#34d399', fontSize: '13px' }}>
                        +{rupees ? rupees(amt) : `₹${amt}`}
                      </td>

                      {/* Coins Credited */}
                      <td style={{ padding: '14px', fontWeight: 800, color: '#fbbf24' }}>
                        🪙 +{t.coins}
                      </td>

                      {/* Gateway & Ref UTR */}
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '2px 6px', borderRadius: '4px' }}>
                            {gway}
                          </span>
                          {ref && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(ref, `ref-${t.id}`)}
                              style={{ background: 'transparent', border: 'none', color: copiedId === `ref-${t.id}` ? '#10b981' : '#a855f7', cursor: 'pointer', fontSize: '11px', fontWeight: 700, fontFamily: 'monospace' }}
                              title="Click to copy UTR / Reference ID"
                            >
                              {copiedId === `ref-${t.id}` ? '✓ Copied' : `📋 ${String(ref).substring(0, 16)}${String(ref).length > 16 ? '...' : ''}`}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td style={{ padding: '14px', color: '#94a3b8', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        {dateStr ? dateStr(t.date) : t.date}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px' }}>
                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                          ✓ Completed
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
