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
                  <th>Mobile</th>
                  <th>KYC Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((u) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong><br /><span className="muted">ID {u.id}</span></td>
                    <td>{u.phone || '-'}</td>
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
