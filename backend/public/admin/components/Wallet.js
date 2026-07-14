const { useState } = React;

const PAGE_SIZE = 10;

window.Wallet = function Wallet({ users, transactions, total, page, onPageChange, onAdjust, dateStr }) {
  const [filterText, setFilterText] = useState('');

  // Local search filter on the current page of transactions
  const filteredTransactions = transactions.filter((tx) => {
    const userName = tx.user_name || `User #${tx.user_id}`;
    const desc = tx.description || tx.title || '';
    const type = tx.type || '';
    const term = filterText.toLowerCase();
    return (
      userName.toLowerCase().includes(term) ||
      desc.toLowerCase().includes(term) ||
      type.toLowerCase().includes(term)
    );
  });

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

  return (
    <section className="panel">
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ── Wallet Adjustment Form ─────────────────────────── */}
        <form
          className="toolbar"
          onSubmit={onAdjust}
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <select className="select" name="userId" required style={{ flex: '1', minWidth: '200px' }}>
            <option value="">Select user</option>
            {users.filter((u) => u.role === 'user').map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.phone || '-'})</option>
            ))}
          </select>
          <input className="input" name="coins" type="number" min="1" placeholder="Coin amount" required style={{ flex: '1', minWidth: '150px' }} />
          <input className="input" name="reason" placeholder="Admin reason" style={{ flex: '2', minWidth: '200px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn success" name="mode" value="add" type="submit">Add Coins</button>
            <button className="btn danger" name="mode" value="deduct" type="submit">Deduct</button>
          </div>
        </form>

        {/* ── Transaction History Header ─────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '4px', flexWrap: 'wrap', gap: '10px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold' }}>Transaction History</h3>

          {/* Local search filter */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <span style={{
              position: 'absolute', left: '10px', top: '50%',
              transform: 'translateY(-50%)', color: '#71717a',
              display: 'flex', alignItems: 'center', pointerEvents: 'none'
            }}>
              <window.Icon name="search" size={14} />
            </span>
            <input
              className="input"
              placeholder="Search by user or description..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              style={{ paddingLeft: '30px', paddingRight: '30px', height: '36px', fontSize: '13px', borderRadius: '8px' }}
            />
            {filterText && (
              <button
                type="button"
                onClick={() => setFilterText('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  color: '#71717a', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer'
                }}
              >
                <window.Icon name="x" size={14} />
              </button>
            )}
          </div>
        </div>

        {/* ── Transactions Table ─────────────────────────────── */}
        <div className="table-wrap">
          {filteredTransactions.length === 0 ? (
            <div className="empty">
              <div>
                <div className="metric-icon" style={{ margin: '0 auto' }}>--</div>
                <p className="empty-title">No Data Found</p>
                <h3 style={{ marginTop: '8px' }}>No wallet transactions</h3>
                <p className="muted" style={{ marginTop: '8px' }}>No transactions match your search or filter.</p>
              </div>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Coins</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, idx) => (
                    <tr key={tx.id || idx}>
                      <td>
                        {tx.user_name || `User #${tx.user_id}`}<br />
                        <span className="muted" style={{ fontSize: '12px' }}>{tx.user_phone || ''}</span>
                      </td>
                      <td>{tx.type || '-'}</td>
                      <td>{tx.description || tx.title || '-'}</td>
                      <td style={{ fontWeight: 'bold', color: tx.coins > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        {tx.coins > 0 ? `+${tx.coins}` : tx.coins}
                      </td>
                      <td>
                        <span className={`badge ${tx.status === 'completed' || tx.status === 'success' ? 'green' : 'red'}`}>
                          {tx.status || '-'}
                        </span>
                      </td>
                      <td>{dateStr(tx.created_at)}</td>
                    </tr>
                  ))}
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
                  Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{total}</strong> transactions
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
