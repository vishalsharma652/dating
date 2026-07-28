const { useState, useEffect } = React;

window.Withdrawals = function Withdrawals({ withdrawals, onProcess, rupees, dateStr }) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="table-wrap">
          {withdrawals.length === 0 ? (
            <div className="empty">
              <div>
                <div className="metric-icon" style={{ margin: '0 auto' }}>--</div>
                <p className="empty-title">No Data Found</p>
                <h3 style={{ marginTop: '8px' }}>No withdrawal requests</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Withdrawal requests will appear here.</p>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Wallet ID</th>
                  <th>User Info</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Bank / UPI Details</th>
                  <th>Status</th>
                  <th>Requested</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>
                      {w.wallet_id ? (
                        <span style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          color: '#a78bfa',
                          background: 'rgba(139,92,246,0.1)',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          letterSpacing: '1px',
                          border: '1px solid rgba(139,92,246,0.2)',
                          whiteSpace: 'nowrap'
                        }}>{w.wallet_id}</span>
                      ) : (
                        <span className="muted">N/A</span>
                      )}
                    </td>
                    <td>
                      <strong>{w.user_name || `User #${w.user_id}`}</strong>
                      <br /><span className="muted">📱 {w.user_phone || '-'}</span>
                      {w.user_email && <><br /><span className="muted" style={{ fontSize: '11px' }}>✉ {w.user_email}</span></>}
                    </td>
                    <td><strong>{rupees(w.amount || 0)}</strong></td>
                    <td>
                      <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '11px' }}>{w.method || '-'}</span>
                    </td>
                    <td>
                      {w.bank_name || '-'}
                      {w.account_number && <><br /><span className="muted">A/C: {w.account_number}</span></>}
                      {w.ifsc_code && <><br /><span className="muted" style={{ fontSize: '11px' }}>IFSC: {w.ifsc_code}</span></>}
                    </td>
                    <td>
                      <span className={`badge ${w.status === 'completed' ? 'green' : w.status === 'pending' ? 'yellow' : 'red'}`}>{w.status || '-'}</span>
                    </td>
                    <td>{dateStr(w.created_at)}</td>
                    <td>
                      {w.status === 'pending' ? (
                        <div className="actions">
                          <button className="btn-action btn-primary" style={{ backgroundColor: 'var(--success)', color: '#07120b' }} onClick={() => onProcess(w.id, 'completed')}>Approve</button>
                          <button className="btn-action btn-danger-outline" onClick={() => onProcess(w.id, 'rejected')}>Reject</button>
                        </div>
                      ) : (
                        <span className="muted">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};
