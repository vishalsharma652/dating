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
                    <td><strong>{w.user_name || `User #${w.user_id}`}</strong><br /><span className="muted">Phone: {w.user_phone || '-'}</span></td>
                    <td>{rupees(w.amount || 0)}</td>
                    <td>{w.method || '-'}</td>
                    <td>
                      {w.bank_name || '-'}
                      {w.account_number && <><br /><span className="muted">A/C: {w.account_number}</span></>}
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
