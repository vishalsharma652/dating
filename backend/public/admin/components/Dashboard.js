const { useState, useEffect } = React;

window.Dashboard = function Dashboard({ data, users, onViewProfile, rupees }) {
  const d = data || {};
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="grid metrics">
        <div className="metric">
          <div>
            <p className="muted">Total Users</p>
            <p className="metric-value">{d.totalUsers || 0}</p>
          </div>
          <div className="metric-icon">US</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Total Revenue</p>
            <p className="metric-value">{rupees(d.revenue || 0)}</p>
          </div>
          <div className="metric-icon">INR</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Paid to Girls</p>
            <p className="metric-value">{rupees(d.totalPaid || 0)}</p>
          </div>
          <div className="metric-icon">INR</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Pending KYC</p>
            <p className="metric-value">{d.pendingKyc || 0}</p>
          </div>
          <div className="metric-icon">KY</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Withdrawals</p>
            <p className="metric-value">{d.pendingWithdrawals || 0}</p>
          </div>
          <div className="metric-icon">WD</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Active Chats</p>
            <p className="metric-value">{d.activeChats || 0}</p>
          </div>
          <div className="metric-icon">CH</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Coins Sold</p>
            <p className="metric-value">{d.coinsSold || 0}</p>
          </div>
          <div className="metric-icon">CO</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <section className="panel">
          <div className="panel-head"><h3>Coin Sales & Revenue Trend</h3></div>
          <div className="panel-body">
            <div style={{ height: '230px', display: 'flex', alignItems: 'end', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px' }}>
              {[32, 46, 40, 64, 58, 78, 88].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--primary)', borderRadius: '8px 8px 0 0' }}></div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>User Registrations Trend</h3></div>
          <div className="panel-body">
            <div style={{ height: '230px', display: 'flex', alignItems: 'end', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px' }}>
              {[18, 26, 36, 44, 56, 72, 82].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--primary)', borderRadius: '8px 8px 0 0' }}></div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-head"><h3>Recently Registered Users</h3></div>
        <div className="panel-body">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User Profile Info</th>
                  <th>Mobile / Contact</th>
                  <th>Activity Status</th>
                  <th>KYC Option</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((u) => {
                  const avatarLetter = u.name ? u.name.charAt(0).toUpperCase() : '?';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #475569)', display: 'grid', placeItems: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white', flexShrink: 0, border: '1px solid rgba(255,255,255,0.15)' }}>
                            {avatarLetter}
                          </div>
                          <div>
                            <strong style={{ color: '#f4f4f5', fontSize: '14px' }}>{u.name}</strong>
                            <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>ID: {u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>Phone:</strong> {u.phone || '-'}<br />
                        <span className="muted" style={{ fontSize: '12px' }}>Email: {u.email || '-'}</span>
                      </td>
                      <td>
                        {u.online_status ? (
                          <span className="badge green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></span>
                            Online
                          </span>
                        ) : (
                          <span className="badge red">Offline</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.kyc_status === 'approved' ? 'green' : u.kyc_status === 'pending' ? 'yellow' : 'red'}`}>
                          {u.kyc_status === 'approved' ? 'Done KYC' : u.kyc_status === 'pending' ? 'Pending' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <div className="actions">
                          <button className="btn-action btn-primary" onClick={() => onViewProfile(u)}>View Profile</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
