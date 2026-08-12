const { useState, useEffect } = React;

window.Dashboard = function Dashboard({ data, users, onViewProfile, onTabChange, rupees }) {
  const d = data || {};

  // Color mappings (RGB)
  const colors = {
    users: '124, 92, 255',    // Neon Purple
    revenue: '79, 140, 255',  // Neon Blue
    paid: '244, 63, 94',      // Pink/Rose
    kyc: '251, 191, 36',      // Warning/Orange
    withdraw: '45, 226, 230',  // Neon Cyan
    chats: '168, 85, 247',    // Purple
    coins: '251, 191, 36'      // Yellow
  };

  // Helper to render metric card
  const renderMetricCard = ({ title, value, badge, iconName, color, desc, wavePath, areaPath, id, onClick }) => {
    return (
      <div 
        className="metric" 
        onClick={onClick}
        style={{ 
          position: 'relative', 
          display: 'flex', 
          flexDirection: 'row', 
          gap: '14px', 
          padding: '20px 16px', 
          alignItems: 'center', 
          justify: 'flex-start', 
          minHeight: '130px', 
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, border-color 0.2s ease'
        }}
      >
        {/* Left Side: Large Icon Container */}
        <span style={{ 
          width: '52px', 
          height: '52px', 
          borderRadius: '12px', 
          background: `linear-gradient(135deg, rgba(${color}, 0.2) 0%, rgba(${color}, 0.05) 100%)`, 
          color: `rgb(${color})`, 
          display: 'grid', 
          placeItems: 'center',
          border: `1px solid rgba(${color}, 0.35)`,
          flexShrink: 0,
          boxShadow: `0 6px 15px rgba(${color}, 0.08)`
        }}>
          <window.Icon name={iconName} size={24} />
        </span>

        {/* Right Side: Text Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', zIndex: 3, position: 'relative', flex: 1, minWidth: 0 }}>
          {/* Top Line: Title & Badge Inline to prevent collisions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', width: '100%' }}>
            <p className="muted" style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {title}
            </p>
            <span style={{ 
              fontSize: '8.5px', 
              fontWeight: '800', 
              color: `rgb(${color})`, 
              background: `rgba(${color}, 0.08)`, 
              border: `1px solid rgba(${color}, 0.18)`, 
              padding: '1px 5px', 
              borderRadius: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              flexShrink: 0
            }}>
              {badge}
            </span>
          </div>

          <h3 style={{ fontSize: '30px', fontWeight: '800', color: 'white', margin: '2px 0', letterSpacing: '-0.02em', fontFamily: '"Inter", sans-serif', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {value}
          </h3>
          
          <p className="muted" style={{ fontSize: '10.5px', color: '#64748b', margin: 0, fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {desc}
          </p>
        </div>

        {/* Mini SVG Sparkline at absolute bottom */}
        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '40px', opacity: 0.7, zIndex: 1, overflow: 'hidden', borderRadius: '0 0 20px 20px' }}>
          <svg viewBox="0 0 100 30" width="100%" height="100%" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={`rgb(${color})`} stopOpacity="0.25" />
                <stop offset="100%" stopColor={`rgb(${color})`} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#grad-${id})`} />
            <path d={wavePath} fill="none" stroke={`rgb(${color})`} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── Row 1 Metrics (4 cards) ─────────────────────────── */}
      <div className="metric-row-1">
        {renderMetricCard({
          id: 'users',
          title: 'Total Users',
          value: d.totalUsers || 0,
          badge: 'US',
          iconName: 'users',
          color: colors.users,
          desc: 'All time registered users',
          wavePath: 'M 0 22 Q 25 10 50 18 T 100 4',
          areaPath: 'M 0 22 Q 25 10 50 18 T 100 4 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('users')
        })}
        {renderMetricCard({
          id: 'revenue',
          title: 'Total Revenue',
          value: rupees(d.revenue || 0),
          badge: 'INR',
          iconName: 'banknote',
          color: colors.revenue,
          desc: 'Total revenue earned',
          wavePath: 'M 0 18 Q 25 24 50 8 T 100 6',
          areaPath: 'M 0 18 Q 25 24 50 8 T 100 6 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('reports')
        })}
        {renderMetricCard({
          id: 'paid',
          title: 'Paid to Girls',
          value: rupees(d.totalPaid || 0),
          badge: 'PAID',
          iconName: 'heart',
          color: colors.paid,
          desc: (d.pendingWithdrawals && d.pendingWithdrawals > 0)
            ? `⏳ ${d.pendingWithdrawals} pending payout${d.pendingWithdrawals > 1 ? 's' : ''}`
            : `✓ ${d.completedWithdrawals || 0} approved payout${(d.completedWithdrawals || 0) === 1 ? '' : 's'}`,
          wavePath: 'M 0 24 Q 25 20 50 26 T 100 22',
          areaPath: 'M 0 24 Q 25 20 50 26 T 100 22 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('paid_to_girls')
        })}
        {renderMetricCard({
          id: 'kyc',
          title: 'Pending KYC',
          value: d.pendingKyc || 0,
          badge: 'KY',
          iconName: 'shield-alert',
          color: colors.kyc,
          desc: 'Pending verification',
          wavePath: 'M 0 8 Q 25 14 50 4 T 100 18',
          areaPath: 'M 0 8 Q 25 14 50 4 T 100 18 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('kyc')
        })}
      </div>

      {/* ── Row 2 Metrics (3 cards + 1 banner) ───────────────── */}
      <div className="metric-row-2">
        {renderMetricCard({
          id: 'withdraw',
          title: 'Withdrawals (Paid)',
          value: d.completedWithdrawals || 0,
          badge: 'PAID',
          iconName: 'arrow-up-right',
          color: colors.withdraw,
          desc: `${rupees(d.totalPaid || 0)} total paid records`,
          wavePath: 'M 0 22 Q 25 18 50 24 T 100 8',
          areaPath: 'M 0 22 Q 25 18 50 24 T 100 8 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('withdrawals')
        })}
        {renderMetricCard({
          id: 'chats',
          title: 'Active Chats',
          value: d.activeChats || 0,
          badge: 'CH',
          iconName: 'message-square',
          color: colors.chats,
          desc: 'Currently active chats',
          wavePath: 'M 0 18 Q 25 8 50 22 T 100 12',
          areaPath: 'M 0 18 Q 25 8 50 22 T 100 12 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('chats')
        })}
        {renderMetricCard({
          id: 'coins',
          title: 'Coins Sold',
          value: d.coinsSold || 0,
          badge: 'CO',
          iconName: 'coins',
          color: colors.coins,
          desc: 'Total coins sold',
          wavePath: 'M 0 14 Q 25 26 50 10 T 100 4',
          areaPath: 'M 0 14 Q 25 26 50 10 T 100 4 L 100 30 L 0 30 Z',
          onClick: () => onTabChange && onTabChange('wallet')
        })}
        
        {/* Keep Growing Banner Card */}
        <div className="metric" style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.12) 0%, rgba(99, 102, 241, 0.02) 100%)', border: '1px solid rgba(129, 140, 248, 0.22)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '20px 16px', position: 'relative', overflow: 'hidden', minHeight: '130px' }}>
          <div style={{ zIndex: 2, maxWidth: '62%' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', marginBottom: '2px', letterSpacing: '-0.01em' }}>Keep Growing!</h4>
            <p className="muted" style={{ fontSize: '10.5px', lineHeight: '1.3', marginBottom: '8px', color: '#94a3b8' }}>Track platform metrics in real-time.</p>
            <button className="btn-action btn-primary" style={{ height: '26px', padding: '0 10px', fontSize: '10px', borderRadius: '4px' }} onClick={() => onTabChange('reports')}>
              View Reports &rarr;
            </button>
          </div>
          {/* Stacked coins illustration */}
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', opacity: 0.85 }}>
            <svg width="72" height="72" viewBox="0 0 100 100" fill="none">
              <defs>
                <linearGradient id="coinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
              <ellipse cx="40" cy="70" rx="18" ry="8" fill="url(#coinGrad)" opacity="0.4" />
              <ellipse cx="40" cy="65" rx="18" ry="8" fill="url(#coinGrad)" opacity="0.6" />
              <ellipse cx="40" cy="60" rx="18" ry="8" fill="url(#coinGrad)" />
              
              <ellipse cx="60" cy="55" rx="14" ry="6" fill="#10b981" opacity="0.4" />
              <ellipse cx="60" cy="50" rx="14" ry="6" fill="#10b981" opacity="0.6" />
              <ellipse cx="60" cy="45" rx="14" ry="6" fill="#10b981" />
              
              {/* Arrow rising */}
              <path d="M22,65 L48,38 L62,45 L82,22" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M72,22 L82,22 L82,32" stroke="#f43f5e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Row 3 Charts (Trend Analysis) ────────────────────── */}
      <div className="chart-row">
        
        {/* Coin Sales & Revenue Combined Chart */}
        <section className="panel">
          <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Coin Sales & Revenue Trend</h3>
            <select className="select" style={{ width: '120px', height: '32px', padding: '0 8px', fontSize: '11px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="panel-body" style={{ padding: '20px 16px', position: 'relative' }}>
            {/* HTML Axis Labels absolute layers */}
            <div style={{ position: 'absolute', left: '16px', top: '20px', bottom: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: '#64748b', zIndex: 2 }}>
              <span>4K</span>
              <span>3K</span>
              <span>2K</span>
              <span>1K</span>
              <span>0</span>
            </div>
            <div style={{ position: 'absolute', right: '16px', top: '20px', bottom: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: '#64748b', zIndex: 2, alignItems: 'flex-end' }}>
              <span>5K</span>
              <span>4K</span>
              <span>3K</span>
              <span>2K</span>
              <span>1K</span>
              <span>0</span>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '220px', padding: '0 30px' }}>
              <svg width="100%" height="100%" viewBox="0 0 380 150" preserveAspectRatio="none">
                <defs>
                  {/* Gradients */}
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" />
                    <stop offset="100%" stopColor="rgba(79, 140, 255, 0.2)" />
                  </linearGradient>
                  <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2de2e6" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#2de2e6" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Shadow filter for line */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Horizontal dotted gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                  const y = pct * 140 + 5;
                  return (
                    <line key={pct} x1="0" y1={y} x2="380" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                  );
                })}

                {/* Bars: Coins Sold */}
                {[1.6, 2.2, 2.0, 3.2, 2.9, 3.9, 5.0].map((v, i) => {
                  const x = 15 + i * 55;
                  const barH = (v / 5.0) * 140;
                  const y = 145 - barH;
                  return (
                    <rect key={i} x={x} y={y} width="16" height={barH} rx="3" fill="url(#barGrad)" style={{ transition: 'all 0.3s' }} />
                  );
                })}

                {/* Area under green line */}
                <path d="M 23 115 L 78 102 L 133 86 L 188 73 L 243 54 L 298 28 L 353 6 L 353 145 L 23 145 Z" fill="url(#revAreaGrad)" />

                {/* Line Path: Revenue */}
                <path d="M 23 115 L 78 102 L 133 86 L 188 73 L 243 54 L 298 28 L 353 6" fill="none" stroke="#2de2e6" strokeWidth="2.5" filter="url(#glow)" />

                {/* Line nodes circles */}
                {[
                  { cx: 23, cy: 115 },
                  { cx: 78, cy: 102 },
                  { cx: 133, cy: 86 },
                  { cx: 188, cy: 73 },
                  { cx: 243, cy: 54 },
                  { cx: 298, cy: 28 },
                  { cx: 353, cy: 6 }
                ].map((pt, idx) => (
                  <circle key={idx} cx={pt.cx} cy={pt.cy} r="4" fill="#2de2e6" stroke="#0b1020" strokeWidth="1.5" />
                ))}
              </svg>
            </div>
            {/* HTML X-Axis labels spread cleanly */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', marginTop: '4px', fontSize: '9px', color: '#64748b' }}>
              <span>May 17</span>
              <span>May 18</span>
              <span>May 19</span>
              <span>May 20</span>
              <span>May 21</span>
              <span>May 22</span>
              <span>May 23</span>
            </div>
            {/* Chart Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#818cf8' }}></span>
                <span className="muted">Coins Sold</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '2px', background: '#10b981' }}></span>
                <span className="muted">Revenue (₹)</span>
              </div>
            </div>
          </div>
        </section>

        {/* User Registrations Chart */}
        <section className="panel">
          <div className="panel-head"><h3>User Registrations Trend</h3></div>
          <div className="panel-body" style={{ padding: '20px 16px', position: 'relative' }}>
            {/* HTML Y-axis labels */}
            <div style={{ position: 'absolute', left: '16px', top: '20px', bottom: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: '#64748b', zIndex: 2 }}>
              <span>20</span>
              <span>16</span>
              <span>12</span>
              <span>8</span>
              <span>4</span>
              <span>0</span>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '220px', padding: '0 30px' }}>
              <svg width="100%" height="100%" viewBox="0 0 380 150" preserveAspectRatio="none">
                {/* Horizontal grids */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map(pct => {
                  const y = pct * 140 + 5;
                  return (
                    <line key={pct} x1="0" y1={y} x2="380" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" strokeDasharray="3,3" />
                  );
                })}

                {/* Bars: User count */}
                {[4, 6, 8, 9, 11, 13, 17].map((v, i) => {
                  const x = 12 + i * 55;
                  const barH = (v / 20.0) * 140;
                  const y = 145 - barH;
                  return (
                    <rect key={i} x={x} y={y} width="22" height={barH} rx="3" fill="url(#barGrad2)" />
                  );
                })}

                <defs>
                  <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c5cff" />
                    <stop offset="100%" stopColor="#4f8cff" opacity="0.3" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            {/* HTML X-Axis labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 40px', marginTop: '4px', fontSize: '9px', color: '#64748b' }}>
              <span>May 17</span>
              <span>May 18</span>
              <span>May 19</span>
              <span>May 20</span>
              <span>May 21</span>
              <span>May 22</span>
              <span>May 23</span>
            </div>
            {/* Chart Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#818cf8' }}></span>
                <span className="muted">New Users</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* ── Row 4 Table (Recently Registered Users) ───────────── */}
      <section className="panel">
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Recently Registered Users</h3>
          <button className="btn-action btn-outline" style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }} onClick={() => onTabChange('users')}>
            View All Users
          </button>
        </div>
        <div className="panel-body" style={{ padding: '16px' }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>USER INFO</th>
                  <th>UNIQUE ID / EMAIL</th>
                  <th>STATUS</th>
                  <th>KYC</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 5).map((u) => {
                  const avatarLetter = u.name ? u.name.charAt(0).toUpperCase() : '?';
                  const displayId = String(u.unique_id || u.id || '').replace(/^STK-/i, '').padStart(6, '0');
                  return (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '50%', 
                            background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)', 
                            display: 'grid', 
                            placeItems: 'center', 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: 'white', 
                            flexShrink: 0, 
                            border: '1.5px solid rgba(255,255,255,0.1)' 
                          }}>
                            {avatarLetter}
                          </div>
                          <div>
                            <strong style={{ color: '#f8fafc', fontSize: '14px', display: 'block' }}>{u.name}</strong>
                            <span className="muted" style={{ fontSize: '11px', marginTop: '2px', display: 'block' }}>ID: {u.id}</span>
                          </div>
                        </div>
                      </td>
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
                        }}>ID {displayId}</span>
                        <div className="muted" style={{ fontSize: '11px', marginTop: '3px' }}>✉ {u.email || '-'}</div>
                      </td>
                      <td>
                        {u.online_status ? (
                          <span className="badge green" style={{ textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                            Online
                          </span>
                        ) : (
                          <span className="badge red" style={{ textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e' }}></span>
                            Offline
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${u.kyc_status === 'approved' ? 'green' : 'red'}`} style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                          {u.kyc_status === 'approved' ? 'Verified' : 'Unverified'}
                        </span>
                      </td>
                      <td>
                        <div className="actions" style={{ gap: '10px' }}>
                          <button className="btn-action btn-primary" style={{ height: '32px', fontSize: '12px', borderRadius: '6px', padding: '0 14px' }} onClick={() => onViewProfile(u)}>
                            View Profile
                          </button>
                          <button className="btn secondary" style={{ width: '32px', height: '32px', padding: 0, borderRadius: '6px', display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }} type="button">
                            <window.Icon name="more-vertical" size={14} />
                          </button>
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

      {/* Footer */}
      <footer style={{ display: 'flex', justifyContent: 'center', padding: '24px 0 8px', borderTop: '1px solid var(--border)', marginTop: '20px' }}>
        <p className="muted" style={{ fontSize: '11px', color: '#64748b' }}>&copy; 2025 Saathika. All rights reserved.</p>
      </footer>

    </div>
  );
};
