const { useState, useEffect } = React;

const PAGE_SIZE = 10;

window.Users = function Users({
  users,
  total,
  page,
  onPageChange,
  search,
  onSearchChange,
  status,
  onStatusChange,
  online,
  onOnlineChange,
  kyc,
  onKycChange,
  role,
  onRoleChange,
  sort,
  onSortChange,
  onViewProfile,
  onChangeStatus,
  onDeleteUser,
  dateStr,
  loading
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  // Generate page numbers range centered around current page, no duplicates
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
      <div className="panel-body">

        {/* ── Filters ──────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.015)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}>

          {/* Search */}
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{
              position: 'absolute', left: '14px', top: '50%',
              transform: 'translateY(-50%)', color: '#71717a',
              display: 'flex', alignItems: 'center', pointerEvents: 'none'
            }}>
              {loading
                ? <window.Icon name="refresh-cw" size={16} className="animate-spin" />
                : <window.Icon name="search" size={16} />
              }
            </span>
            <input
              className="input"
              placeholder="Search by Unique ID, name, or email..."
              value={search}
              onChange={(e) => { onSearchChange(e.target.value); onPageChange(1); }}
              style={{ paddingLeft: '38px', paddingRight: '38px', height: '44px', width: '100%', borderRadius: '8px' }}
            />
            {search && (
              <button
                type="button"
                onClick={() => { onSearchChange(''); onPageChange(1); }}
                style={{
                  position: 'absolute', right: '14px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none', border: 'none',
                  color: '#71717a', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer'
                }}
              >
                <window.Icon name="x" size={16} />
              </button>
            )}
          </div>

          {/* Filter selects (no limit select) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>

            <select className="select" value={status}
              onChange={(e) => { onStatusChange(e.target.value); onPageChange(1); }}
              style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '13px', border: '1px solid var(--border)' }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
              <option value="deleted">Deleted</option>
            </select>

            <select className="select" value={online}
              onChange={(e) => { onOnlineChange(e.target.value); onPageChange(1); }}
              style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '13px', border: '1px solid var(--border)' }}>
              <option value="">All Activity</option>
              <option value="online">Online Users</option>
              <option value="offline">Offline Users</option>
            </select>

            <select className="select" value={kyc}
              onChange={(e) => { onKycChange(e.target.value); onPageChange(1); }}
              style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '13px', border: '1px solid var(--border)' }}>
              <option value="">All KYC Status</option>
              <option value="approved">Done KYC (Verified)</option>
              <option value="pending">Pending KYC</option>
              <option value="not_submitted">Unverified</option>
              <option value="rejected">Rejected KYC</option>
            </select>

            <select className="select" value={role}
              onChange={(e) => { onRoleChange(e.target.value); onPageChange(1); }}
              style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '13px', border: '1px solid var(--border)' }}>
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>

            <select className="select" value={sort}
              onChange={(e) => { onSortChange(e.target.value); onPageChange(1); }}
              style={{ height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', fontSize: '13px', border: '1px solid var(--border)' }}>
              <option value="newest">New Users First</option>
              <option value="oldest">Oldest Users First</option>
            </select>

          </div>
        </div>

        {/* ── Data Table ────────────────────────────────────────── */}
        <div className="table-wrap">
          {users.length === 0 ? (
            <div className="empty">
              <div>
                <div className="metric-icon" style={{ margin: '0 auto' }}>--</div>
                <p className="empty-title">No Data Found</p>
                <h3 style={{ marginTop: '8px' }}>No users found</h3>
                <p className="muted" style={{ marginTop: '8px' }}>
                  No users match the search criteria or selected filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>User Profile Info</th>
                    <th>Unique ID / Contact</th>
                    <th>Activity Status</th>
                    <th>KYC Option</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const avatarLetter = u.name ? u.name.charAt(0).toUpperCase() : '?';
                    const displayId = String(u.unique_id || u.id || '').replace(/^STK-/i, '').padStart(6, '0');
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '38px', height: '38px', borderRadius: '50%',
                              background: 'linear-gradient(135deg, var(--primary), #475569)',
                              display: 'grid', placeItems: 'center', fontSize: '14px',
                              fontWeight: 'bold', color: 'white', flexShrink: 0,
                              border: '1px solid rgba(255,255,255,0.15)'
                            }}>
                              {avatarLetter}
                            </div>
                            <div>
                              <strong style={{ color: '#f4f4f5', fontSize: '14px' }}>{u.name}</strong>
                              <div className="muted" style={{ fontSize: '11px', marginTop: '2px' }}>
                                Reg: {dateStr(u.created_at)}
                              </div>
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
                          }}>🆔 {displayId}</span>
                          <br />
                          <span className="muted" style={{ fontSize: '12px', marginTop: '3px', display: 'inline-block' }}>✉ {u.email || '-'}</span>
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
                            {u.kyc_status === 'approved' ? 'Done KYC'
                              : u.kyc_status === 'pending' ? 'Pending KYC'
                              : u.kyc_status === 'rejected' ? 'Rejected'
                              : 'Unverified'}
                          </span>
                        </td>
                        <td>
                          <div className="actions">
                            <button className="btn-action btn-primary" style={{ width: '34px', padding: 0 }} onClick={() => onViewProfile(u)} title="View Profile">
                              <window.Icon name="eye" size={14} />
                            </button>
                            <button className="btn-action btn-outline" style={{ width: '34px', padding: 0, color: u.status === 'active' ? '#f43f5e' : '#10b981', borderColor: u.status === 'active' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)', backgroundColor: u.status === 'active' ? 'rgba(244, 63, 94, 0.02)' : 'rgba(16, 185, 129, 0.02)' }} onClick={() => onChangeStatus(u.id)} title={u.status === 'active' ? 'Deactivate User' : 'Activate User'}>
                              <window.Icon name={u.status === 'active' ? 'user-x' : 'user-check'} size={14} />
                            </button>
                            <button className="btn-action btn-danger-outline" style={{ width: '34px', padding: 0 }} onClick={() => onDeleteUser(u.id)} title="Delete User">
                              <window.Icon name="trash-2" size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* ── Pagination Controls ──────────────────────────── */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: '20px', borderTop: '1px solid var(--border)',
                paddingTop: '16px', flexWrap: 'wrap', gap: '12px'
              }}>
                {/* Record count */}
                <div className="muted" style={{ fontSize: '13px' }}>
                  Showing <strong>{showingFrom}</strong> to <strong>{showingTo}</strong> of <strong>{total}</strong> users
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
