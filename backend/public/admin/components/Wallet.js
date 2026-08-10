const { useState } = React;

const PAGE_SIZE = 10;

window.Wallet = function Wallet({
  transactions,
  total,
  stats = { totalCount: 0, totalCredited: 0, totalDeducted: 0, netCoins: 0 },
  page,
  onPageChange,
  gender,
  onGenderChange,
  search,
  onSearchChange,
  date,
  onDateChange,
  dateStr
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const getPageNumbers = () => {
    const maxButtons = 5;
    let start = Math.max(1, page - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - maxButtons + 1);
    }
    const pages = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  };

  const showingFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo   = Math.min(page * PAGE_SIZE, total);

  // Helper to format time cleanly
  const formatTime = (timeStr, txTime) => {
    if (txTime) return txTime;
    if (!timeStr) return '-';
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch {
      return '-';
    }
  };

  // Helper to format date cleanly
  const formatDate = (timeStr, txDate) => {
    if (txDate) return txDate;
    if (!timeStr) return '-';
    return dateStr ? dateStr(timeStr) : new Date(timeStr).toLocaleDateString();
  };

  // Helper to format type badge
  const getTypeBadge = (type, title, coins) => {
    const rawType = String(type || '').toLowerCase();
    const rawTitle = String(title || '').toLowerCase();
    const isCredit = Number(coins) > 0 || ['purchase', 'earning', 'credit', 'reward', 'welcome_bonus'].includes(rawType);

    let label = type || 'Transaction';
    if (rawType === 'purchase') label = 'Coin Purchase';
    else if (rawType === 'spending') label = 'Spent / Deduct';
    else if (rawType === 'earning') label = 'Earned / Credit';
    else if (rawType === 'chat' || rawType === 'chat_charge') label = 'Chat Message';
    else if (rawType === 'call' || rawType === 'call_charge') label = 'Call Charge';
    else if (rawType === 'gift' || rawType === 'gift_charge') label = 'Gift Sent';
    else if (rawType === 'reward' || rawType === 'welcome_bonus') label = 'Bonus Reward';
    else if (rawTitle.includes('admin') || rawType.includes('admin')) label = isCredit ? 'Admin Credit' : 'Admin Deduct';
    else {
      label = String(type).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    }

    return (
      <span className={`badge ${isCredit ? 'green' : 'red'}`} style={{ fontWeight: 600, fontSize: '11px', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    );
  };

  const totalCredited = Number(stats?.totalCredited || 0);
  const totalDeducted = Number(stats?.totalDeducted || 0);
  const netCoins = Number(stats?.netCoins || 0);

  return (
    <section className="panel">
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Daily Summary & Totals Cards ────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px'
        }}>
          {/* Card 1: Total Deducted / Spent */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(244,63,94,0.08), rgba(244,63,94,0.02))',
            border: '1px solid rgba(244,63,94,0.22)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'rgba(244,63,94,0.15)',
              display: 'grid', placeItems: 'center', color: '#fb7185', flexShrink: 0
            }}>
              <window.Icon name="trending-down" size={20} />
            </div>
            <div>
              <span className="muted" style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Total Used / Deducted
              </span>
              <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#f43f5e', margin: '3px 0 0', fontFamily: 'monospace' }}>
                -{totalDeducted.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600, color: '#fb7185' }}>Coins</span>
              </h4>
            </div>
          </div>

          {/* Card 2: Total Added / Earned */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
            border: '1px solid rgba(16,185,129,0.22)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'rgba(16,185,129,0.15)',
              display: 'grid', placeItems: 'center', color: '#34d399', flexShrink: 0
            }}>
              <window.Icon name="trending-up" size={20} />
            </div>
            <div>
              <span className="muted" style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Total Earned / Credited
              </span>
              <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#10b981', margin: '3px 0 0', fontFamily: 'monospace' }}>
                +{totalCredited.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>Coins</span>
              </h4>
            </div>
          </div>

          {/* Card 3: Net Balance Flow */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))',
            border: '1px solid rgba(99,102,241,0.22)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'rgba(99,102,241,0.15)',
              display: 'grid', placeItems: 'center', color: '#818cf8', flexShrink: 0
            }}>
              <window.Icon name="activity" size={20} />
            </div>
            <div>
              <span className="muted" style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Net Activity Flow
              </span>
              <h4 style={{ fontSize: '19px', fontWeight: 800, color: netCoins >= 0 ? '#38bdf8' : '#fb7185', margin: '3px 0 0', fontFamily: 'monospace' }}>
                {(netCoins >= 0 ? '+' : '') + netCoins.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600, color: '#a5b4fc' }}>Coins</span>
              </h4>
            </div>
          </div>

          {/* Card 4: Total Filtered Activities */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(168,85,247,0.08), rgba(168,85,247,0.02))',
            border: '1px solid rgba(168,85,247,0.22)',
            borderRadius: '12px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '10px',
              background: 'rgba(168,85,247,0.15)',
              display: 'grid', placeItems: 'center', color: '#c084fc', flexShrink: 0
            }}>
              <window.Icon name="layers" size={20} />
            </div>
            <div>
              <span className="muted" style={{ fontSize: '11.5px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                Total Transactions
              </span>
              <h4 style={{ fontSize: '19px', fontWeight: 800, color: '#f4f4f5', margin: '3px 0 0', fontFamily: 'monospace' }}>
                {total.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 600, color: '#c084fc' }}>Records</span>
              </h4>
            </div>
          </div>
        </div>

        {/* ── Filters Bar ─────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.015)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>
          {/* Top Title & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 'bold', color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🪙</span> Daily Coin Activity & Transaction History
              </h3>
              <p className="muted" style={{ fontSize: '12px', marginTop: '2px' }}>
                Track real-time coin additions, deductions, spendings, and earnings of all users
              </p>
            </div>
          </div>

          {/* Filter Inputs Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>

            {/* Search Input */}
            <div style={{ position: 'relative', gridColumn: 'span 2', minWidth: '220px' }}>
              <span style={{
                position: 'absolute', left: '12px', top: '50%',
                transform: 'translateY(-50%)', color: '#71717a',
                display: 'flex', alignItems: 'center', pointerEvents: 'none'
              }}>
                <window.Icon name="search" size={15} />
              </span>
              <input
                className="input"
                placeholder="Search by User Name, Unique ID, or Email..."
                value={search || ''}
                onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
                style={{ paddingLeft: '36px', paddingRight: '36px', height: '40px', width: '100%', borderRadius: '8px', fontSize: '13px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { onSearchChange(''); onPageChange(1); }}
                  style={{
                    position: 'absolute', right: '12px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: '#71717a', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer'
                  }}
                >
                  <window.Icon name="x" size={15} />
                </button>
              )}
            </div>

            {/* Gender Filter */}
            <div>
              <select
                className="select"
                value={gender || ''}
                onChange={(e) => { onGenderChange(e.target.value); onPageChange(1); }}
                style={{ height: '40px', width: '100%', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '13px', border: '1px solid var(--border)' }}
              >
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Date Filter */}
            <div style={{ position: 'relative' }}>
              <input
                type="date"
                className="input"
                value={date || ''}
                title="Filter by specific date"
                onChange={(e) => { onDateChange(e.target.value); onPageChange(1); }}
                style={{ height: '40px', width: '100%', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.04)' }}
              />
              {date && (
                <button
                  type="button"
                  title="Clear Date"
                  onClick={() => { onDateChange(''); onPageChange(1); }}
                  style={{
                    position: 'absolute', right: '28px', top: '50%',
                    transform: 'translateY(-50%)', background: 'none', border: 'none',
                    color: '#71717a', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer'
                  }}
                >
                  <window.Icon name="x" size={13} />
                </button>
              )}
            </div>

          </div>
        </div>

        {/* ── Transactions Table ─────────────────────────────── */}
        <div className="table-wrap">
          {transactions.length === 0 ? (
            <div className="empty">
              <div>
                <div className="metric-icon" style={{ margin: '0 auto' }}>--</div>
                <p className="empty-title">No Activity Found</p>
                <h3 style={{ marginTop: '8px' }}>No coin transactions found</h3>
                <p className="muted" style={{ marginTop: '8px' }}>
                  No coin activity matches your selected filters or date.
                </p>
              </div>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>User Details</th>
                    <th>Date & Time</th>
                    <th>Coin Amount</th>
                    <th>Transaction Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, idx) => {
                    const avatarLetter = tx.user_name ? tx.user_name.charAt(0).toUpperCase() : '?';
                    const displayId = String(tx.user_unique_id || tx.user_id || '').replace(/^STK-/i, '').padStart(6, '0');
                    const rawType = String(tx.type || '').toLowerCase();
                    const isCredit = Number(tx.coins) > 0 || ['purchase', 'earning', 'credit', 'reward'].includes(rawType);
                    const coinVal = Math.abs(Number(tx.coins) || 0);

                    return (
                      <tr key={tx.id || idx}>
                        {/* User Details */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366f1, #4338ca)',
                              display: 'grid', placeItems: 'center', fontSize: '13px',
                              fontWeight: 'bold', color: 'white', flexShrink: 0,
                              border: '1px solid rgba(255,255,255,0.15)'
                            }}>
                              {avatarLetter}
                            </div>
                            <div>
                              <strong style={{ color: '#f4f4f5', fontSize: '13.5px' }}>
                                {tx.user_name || `User #${tx.user_id}`}
                              </strong>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                <span style={{
                                  fontFamily: 'monospace',
                                  fontWeight: 800,
                                  color: '#10b981',
                                  background: 'rgba(16,185,129,0.1)',
                                  padding: '1px 6px',
                                  borderRadius: '6px',
                                  fontSize: '11px',
                                  border: '1px solid rgba(16,185,129,0.2)'
                                }}>ID {displayId}</span>
                                {tx.user_email && (
                                  <span className="muted" style={{ fontSize: '11px' }}>
                                    {tx.user_email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Date & Time */}
                        <td style={{ whiteSpace: 'nowrap', minWidth: '135px' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#e4e4e7', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <window.Icon name="calendar" size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                            <span>{formatDate(tx.created_at, tx.tx_date)}</span>
                          </div>
                          <div className="muted" style={{ fontSize: '11.5px', marginTop: '3px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                            <window.Icon name="clock" size={12} style={{ color: '#71717a', flexShrink: 0 }} />
                            <span>{formatTime(tx.created_at, tx.tx_time)}</span>
                          </div>
                        </td>

                        {/* Coin Amount */}
                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '16px',
                            fontWeight: 800,
                            fontSize: '13px',
                            fontFamily: 'monospace',
                            color: isCredit ? '#10b981' : '#f43f5e',
                            background: isCredit ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)',
                            border: `1px solid ${isCredit ? 'rgba(16,185,129,0.25)' : 'rgba(244,63,94,0.25)'}`
                          }}>
                            {isCredit ? `+${coinVal}` : `-${coinVal}`} Coins
                          </span>
                        </td>

                        {/* Transaction Type */}
                        <td>
                          {getTypeBadge(tx.type, tx.title, tx.coins)}
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`badge ${tx.status === 'completed' || tx.status === 'success' ? 'green' : 'yellow'}`}>
                            {tx.status || 'completed'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Pagination Controls ──────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: '20px', borderTop: '1px solid var(--border)',
                paddingTop: '16px', flexWrap: 'wrap', gap: '12px'
              }}>
                {/* Record count */}
                <div className="muted" style={{ fontSize: '13px' }}>
                  Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{total}</strong> coin records
                </div>

                {/* Navigation buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    className="btn-action btn-outline"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    style={{ height: '36px', paddingLeft: '14px', paddingRight: '14px' }}
                  >
                    ← Previous
                  </button>

                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      className={`btn-action ${page === pageNum ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => onPageChange(pageNum)}
                      style={{ width: '36px', height: '36px', padding: 0, fontWeight: page === pageNum ? '700' : '400' }}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    className="btn-action btn-outline"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    style={{ height: '36px', paddingLeft: '14px', paddingRight: '14px' }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
