const { useState } = React;

window.SupportTickets = function SupportTickets({ tickets = [], onRefresh, showNotice }) {
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [updating, setUpdating] = useState(false);

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const s = search.toLowerCase().trim();
    const matchesSearch =
      !s ||
      (t.name && t.name.toLowerCase().includes(s)) ||
      (t.email && t.email.toLowerCase().includes(s)) ||
      (t.subject && t.subject.toLowerCase().includes(s)) ||
      (t.category && t.category.toLowerCase().includes(s)) ||
      (t.message && t.message.toLowerCase().includes(s));
    return matchesStatus && matchesSearch;
  });

  const pendingCount = tickets.filter((t) => t.status === 'pending').length;
  const resolvedCount = tickets.filter((t) => t.status === 'resolved').length;
  const closedCount = tickets.filter((t) => t.status === 'closed').length;

  const handleUpdateStatus = async (ticketId, newStatus, adminReply = null) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({
          status: newStatus,
          admin_reply: adminReply !== null ? adminReply : replyText
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update ticket');
      }
      if (showNotice) showNotice(`Ticket #${ticketId} updated (${newStatus})`, 'success');
      setSelectedTicket(null);
      setReplyText('');
      if (onRefresh) onRefresh();
    } catch (err) {
      if (showNotice) showNotice(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getCategoryBadgeClass = (category = '') => {
    const cat = category.toLowerCase();
    if (cat.includes('payment') || cat.includes('coin')) return 'badge yellow';
    if (cat.includes('account') || cat.includes('profile')) return 'badge purple';
    if (cat.includes('chat') || cat.includes('match')) return 'badge red';
    if (cat.includes('tech')) return 'badge blue';
    return 'badge green';
  };

  const quickTemplates = [
    'Thanks for reaching out! Your issue has been investigated and resolved.',
    'We have checked your account details and updated your settings accordingly.',
    'Our technical team is working on this. We will update you once it is fixed.',
    'Please refresh your app or relogin to see the updated changes.'
  ];

  return (
    <section className="panel" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Panel Header */}
      <div className="panel-head" style={{ flexWrap: 'wrap', gap: '16px', padding: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.25) 0%, rgba(99, 102, 241, 0.1) 100%)', border: '1px solid rgba(129, 140, 248, 0.3)', color: '#a5b4fc', width: '42px', height: '42px', borderRadius: '12px', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '18px' }}>
              📩
            </span>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 40%, #c7d2fe 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Support Tickets Center
              </h3>
              <p className="muted" style={{ fontSize: '13px', marginTop: '2px' }}>
                Click on any ticket row or button to open full details popup and send responses.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Search user, email, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ height: '42px', fontSize: '13px', paddingLeft: '38px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '14px' }}>
              🔍
            </span>
          </div>
        </div>
      </div>

      <div className="panel-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Metrics Row */}
        <div className="grid metrics" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="metric" style={{ background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.6) 100%)', borderColor: 'rgba(129, 140, 248, 0.25)' }}>
            <div>
              <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Total Support Tickets</p>
              <p className="metric-value" style={{ fontSize: '28px' }}>{tickets.length}</p>
            </div>
            <div className="metric-icon" style={{ background: 'rgba(129, 140, 248, 0.15)', borderColor: 'rgba(129, 140, 248, 0.3)', color: '#818cf8', fontSize: '20px' }}>
              📩
            </div>
          </div>

          <div className="metric" style={{ background: 'linear-gradient(135deg, rgba(120, 53, 15, 0.35) 0%, rgba(15, 23, 42, 0.6) 100%)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <div>
              <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', color: '#fef08a' }}>Pending Issues</p>
              <p className="metric-value" style={{ color: '#fbbf24', fontSize: '28px' }}>{pendingCount}</p>
            </div>
            <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '20px' }}>
              ⏳
            </div>
          </div>

          <div className="metric" style={{ background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.6) 100%)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
            <div>
              <p className="muted" style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em', color: '#a7f3d0' }}>Resolved Tickets</p>
              <p className="metric-value" style={{ color: '#34d399', fontSize: '28px' }}>{resolvedCount}</p>
            </div>
            <div className="metric-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399', fontSize: '20px' }}>
              ✅
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px' }}>
          {[
            { id: 'all', label: 'All Tickets', count: tickets.length },
            { id: 'pending', label: 'Pending', count: pendingCount, color: '#fbbf24' },
            { id: 'resolved', label: 'Resolved', count: resolvedCount, color: '#34d399' },
            { id: 'closed', label: 'Closed', count: closedCount }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn-action ${filterStatus === tab.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ borderRadius: '12px', fontSize: '13px', padding: '6px 18px', height: '38px' }}
              onClick={() => setFilterStatus(tab.id)}
            >
              <span>{tab.label}</span>
              <span style={{
                background: filterStatus === tab.id ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800,
                color: tab.color || 'inherit'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tickets Table List */}
        <div className="table-wrap" style={{ borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(13, 20, 38, 0.4)' }}>
          {filteredTickets.length === 0 ? (
            <div className="empty" style={{ padding: '48px 24px' }}>
              <div>
                <div className="metric-icon" style={{ margin: '0 auto', width: '60px', height: '60px', fontSize: '26px' }}>📩</div>
                <p className="empty-title" style={{ marginTop: '14px' }}>No Support Tickets</p>
                <h3 style={{ marginTop: '6px', color: '#f1f5f9' }}>No support inquiries match your current filter</h3>
                <p className="muted" style={{ marginTop: '6px', fontSize: '13px' }}>User submitted support messages will appear here.</p>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 800, whiteSpace: 'nowrap' }}>TICKET ID</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, whiteSpace: 'nowrap' }}>USER / SENDER</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, whiteSpace: 'nowrap' }}>CATEGORY</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, whiteSpace: 'nowrap' }}>STATUS</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, whiteSpace: 'nowrap' }}>SUBMITTED AT</th>
                  <th style={{ padding: '16px 20px', fontWeight: 800, textAlign: 'right', whiteSpace: 'nowrap' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => {
                  const firstChar = (t.name || 'U').charAt(0).toUpperCase();
                  const isPending = t.status === 'pending';
                  const isResolved = t.status === 'resolved';

                  return (
                    <tr
                      key={t.id}
                      className="clickable"
                      style={{
                        background: isPending ? 'rgba(245, 158, 11, 0.03)' : 'transparent',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        transition: 'all 0.2s ease'
                      }}
                      onClick={() => {
                        setSelectedTicket(t);
                        setReplyText(t.admin_reply || '');
                      }}
                    >
                      {/* Ticket ID */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          background: 'rgba(129, 140, 248, 0.12)',
                          border: '1px solid rgba(129, 140, 248, 0.3)',
                          color: '#a5b4fc',
                          fontWeight: 800,
                          fontSize: '13px',
                          whiteSpace: 'nowrap'
                        }}>
                          #TKT-{t.id}
                        </span>
                      </td>

                      {/* User Info */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            color: '#fff',
                            fontWeight: 800,
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '15px',
                            flexShrink: 0,
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
                          }}>
                            {firstChar}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#f8fafc', fontSize: '14px' }}>{t.name}</div>
                            <div className="muted" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                              <span>✉️</span> {t.email}
                            </div>
                            {t.user_unique_id && (
                              <span style={{
                                display: 'inline-block',
                                marginTop: '4px',
                                fontSize: '10px',
                                fontWeight: 800,
                                color: '#34d399',
                                background: 'rgba(16,185,129,0.12)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                border: '1px solid rgba(16,185,129,0.25)'
                              }}>
                                User ID: {t.user_unique_id}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span className={getCategoryBadgeClass(t.category)} style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em', padding: '5px 12px', whiteSpace: 'nowrap' }}>
                          {t.category || 'General Query'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${isResolved ? 'green' : isPending ? 'yellow' : 'red'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', whiteSpace: 'nowrap' }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 6px currentColor' }} />
                          {t.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ padding: '16px 20px', fontSize: '13px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {t.created_at ? new Date(t.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-action btn-primary"
                          style={{ height: '38px', fontSize: '13px', padding: '0 18px', borderRadius: '10px', fontWeight: 700, whiteSpace: 'nowrap' }}
                          onClick={() => {
                            setSelectedTicket(t);
                            setReplyText(t.admin_reply || '');
                          }}
                        >
                          💬 View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Render Modal via Portal to avoid backdrop-filter trapping inside .panel */}
        {renderModal()}
      </div>
    </section>
  );

  function renderModal() {
    if (!selectedTicket) return null;

    const modalContent = (
      <div
        className="modal-backdrop"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(5, 7, 15, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxSizing: 'border-box'
        }}
        onClick={() => setSelectedTicket(null)}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(145deg, #11182c 0%, #0a0e1c 100%)',
            border: '1px solid rgba(129, 140, 248, 0.3)',
            borderRadius: '24px',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.95), 0 0 50px rgba(124, 92, 255, 0.2)',
            color: '#f8fafc',
            overflow: 'hidden',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Modal Fixed Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.6)', flexShrink: 0 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#fff', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, boxShadow: '0 4px 12px rgba(79,70,229,0.4)' }}>
                  #TKT-{selectedTicket.id}
                </span>
                <span className={getCategoryBadgeClass(selectedTicket.category)} style={{ fontSize: '11px', padding: '4px 12px' }}>
                  {selectedTicket.category || 'General Query'}
                </span>
                <span className={`badge ${selectedTicket.status === 'resolved' ? 'green' : selectedTicket.status === 'pending' ? 'yellow' : 'red'}`} style={{ fontSize: '11px', padding: '4px 12px' }}>
                  {selectedTicket.status}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                Ticket Details & Admin Reply
              </h3>
            </div>
            <button
              type="button"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94a3b8',
                fontSize: '18px',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setSelectedTicket(null)}
            >
              ✕
            </button>
          </div>

          {/* 2. Modal Inner Scrollable Body */}
          <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
            {/* Sender Info Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '14px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: '#fff', fontWeight: 800, display: 'grid', placeItems: 'center', fontSize: '16px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)', flexShrink: 0 }}>
                  {(selectedTicket.name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff' }}>{selectedTicket.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '1px' }}>{selectedTicket.email}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {selectedTicket.user_unique_id && (
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.25)', display: 'inline-block', marginBottom: '4px' }}>
                    ID: {selectedTicket.user_unique_id}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  {new Date(selectedTicket.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>

            {/* User Issue Subject & Full Message Card */}
            <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '20px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#818cf8', marginBottom: '8px' }}>
                📌 ISSUE SUBJECT:
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                {selectedTicket.subject}
              </div>

              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#818cf8', marginBottom: '6px' }}>
                💬 MESSAGE CONTENT:
              </div>
              <div style={{ fontSize: '14px', lineHeight: 1.6, color: '#e2e8f0', whiteSpace: 'pre-wrap', background: 'rgba(255, 255, 255, 0.025)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {selectedTicket.message}
              </div>
            </div>

            {/* Current Admin Reply (if exists) */}
            {selectedTicket.admin_reply && (
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, fontSize: '13px', marginBottom: '6px' }}>
                  <span>💬 Official Admin Response:</span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#a7f3d0' }}>
                  {selectedTicket.admin_reply}
                </p>
              </div>
            )}

            {/* Quick Templates */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#818cf8', marginBottom: '10px' }}>
                ⚡ Quick Response Templates (Click to apply)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {quickTemplates.map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    style={{
                      fontSize: '12px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#cbd5e1',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      lineHeight: 1.3
                    }}
                    onClick={() => setReplyText(tmpl)}
                  >
                    {tmpl}
                  </button>
                ))}
              </div>
            </div>

            {/* Response Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, marginBottom: '8px', color: '#ffffff' }}>
                Send Official Admin Reply (Will be delivered to user)
              </label>
              <textarea
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to the user or solution details here..."
                className="input"
                style={{
                  height: 'auto',
                  minHeight: '100px',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  background: 'rgba(0, 0, 0, 0.4)',
                  borderColor: 'rgba(129, 140, 248, 0.3)',
                  color: '#ffffff',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* 3. Modal Sticky Action Footer */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center', padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.95)', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn secondary"
              style={{ height: '42px', padding: '0 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}
              onClick={() => setSelectedTicket(null)}
            >
              Cancel
            </button>

            <button
              type="button"
              className="btn secondary"
              style={{ height: '42px', padding: '0 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, borderColor: 'rgba(245,158,11,0.3)', color: '#fbbf24' }}
              onClick={() => handleUpdateStatus(selectedTicket.id, 'pending', replyText)}
              disabled={updating}
            >
              Save as Pending ⏳
            </button>

            <button
              type="button"
              className="btn success"
              style={{ height: '42px', padding: '0 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 800 }}
              onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved', replyText)}
              disabled={updating}
            >
              {updating ? 'Sending Reply...' : '✅ Send Reply & Mark Resolved'}
            </button>
          </div>
        </div>
      </div>
    );

    if (typeof document !== 'undefined' && typeof ReactDOM !== 'undefined' && ReactDOM.createPortal) {
      return ReactDOM.createPortal(modalContent, document.body);
    }
    return modalContent;
  }
      </div>
    </section>
  );
};
