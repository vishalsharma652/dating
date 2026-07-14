const { useState, useEffect } = React;

window.Reports = function Reports({ data, rupees }) {
  const r = data || {};
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="grid metrics">
        <div className="metric">
          <div>
            <p className="muted">Total Revenue</p>
            <p className="metric-value">{rupees(r.revenue || 0)}</p>
          </div>
          <div className="metric-icon">INR</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Total Paid to Girls</p>
            <p className="metric-value">{rupees(r.totalPaid || 0)}</p>
          </div>
          <div className="metric-icon">INR</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Active Users</p>
            <p className="metric-value">{r.users || 0}</p>
          </div>
          <div className="metric-icon">US</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Total Coins Sold</p>
            <p className="metric-value">{r.coins || 0}</p>
          </div>
          <div className="metric-icon">CO</div>
        </div>
        <div className="metric">
          <div>
            <p className="muted">Active Chats</p>
            <p className="metric-value">{r.chats || 0}</p>
          </div>
          <div className="metric-icon">CH</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <section className="panel">
          <div className="panel-head"><h3>Monthly Revenue Performance</h3></div>
          <div className="panel-body">
            <div style={{ height: '230px', display: 'flex', alignItems: 'end', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px' }}>
              {[22, 34, 46, 55, 69, 78, 88].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--primary)', borderRadius: '8px 8px 0 0' }}></div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>User Registration Growth</h3></div>
          <div className="panel-body">
            <div style={{ height: '230px', display: 'flex', alignItems: 'end', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px' }}>
              {[18, 30, 42, 50, 58, 70, 84].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--primary)', borderRadius: '8px 8px 0 0' }}></div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <div className="panel-head"><h3>Call Activity</h3></div>
          <div className="panel-body">
            <div style={{ height: '230px', display: 'flex', alignItems: 'end', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px' }}>
              {[40, 34, 58, 62, 51, 74, 90].map((v, i) => (
                <div key={i} style={{ flex: 1, height: `${v}%`, background: 'var(--primary)', borderRadius: '8px 8px 0 0' }}></div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
