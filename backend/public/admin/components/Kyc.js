const { useState, useEffect } = React;

window.Kyc = function Kyc({ requests, onViewRecord, onApprove, onReject, dateStr }) {
  return (
    <section className="panel">
      <div className="panel-body">
        <div className="table-wrap">
          {requests.length === 0 ? (
            <div className="empty">
              <div>
                <div className="metric-icon" style={{ margin: '0 auto' }}>--</div>
                <p className="empty-title">No Data Found</p>
                <h3 style={{ marginTop: '8px' }}>No pending KYC requests</h3>
                <p className="muted" style={{ marginTop: '8px' }}>All user profiles are verified.</p>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email / Unique ID</th>
                  <th>KYC Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong><br /><span className="muted" style={{ fontSize: '11px' }}>ID: {String(u.unique_id || u.id || '').replace(/^STK-/i, '').padStart(6, '0')}</span></td>
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        color: '#10b981',
                        background: 'rgba(16,185,129,0.1)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        border: '1px solid rgba(16,185,129,0.2)'
                      }}>ID {String(u.unique_id || u.id || '').replace(/^STK-/i, '').padStart(6, '0')}</span>
                      <br />
                      <span className="muted" style={{ fontSize: '12px', marginTop: '3px', display: 'inline-block' }}>✉ {u.email || '-'}</span>
                    </td>
                    <td><span className="badge yellow">{u.kyc_status || 'pending'}</span></td>
                    <td>{dateStr(u.created_at)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn-action btn-outline" onClick={() => onViewRecord(u)}>View Record</button>
                        <button className="btn-action btn-primary" style={{ backgroundColor: 'var(--success)', color: '#07120b' }} onClick={() => onApprove(u.id)}>Approve</button>
                        <button className="btn-action btn-danger-outline" onClick={() => onReject(u.id)}>Reject</button>
                      </div>
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
