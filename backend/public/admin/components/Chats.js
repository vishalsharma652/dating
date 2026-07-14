const { useState, useEffect } = React;

window.Chats = function Chats({ chats, dateStr }) {
  const coinsSpent = chats.reduce((sum, c) => sum + Number(c.duration_minutes || 0) * 10, 0);
  const avgDuration = chats.length ? `${Math.round(chats.reduce((sum, c) => sum + Number(c.duration_minutes || 0), 0) / chats.length)}m` : '0m';

  return (
    <section className="panel">
      <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="grid metrics">
          <div className="metric">
            <div>
              <p className="muted">Active Chats</p>
              <p className="metric-value">{chats.length}</p>
            </div>
            <div className="metric-icon">CH</div>
          </div>
          <div className="metric">
            <div>
              <p className="muted">Coins Spent</p>
              <p className="metric-value">{coinsSpent}</p>
            </div>
            <div className="metric-icon">CO</div>
          </div>
          <div className="metric">
            <div>
              <p className="muted">Avg Duration</p>
              <p className="metric-value">{avgDuration}</p>
            </div>
            <div className="metric-icon">TM</div>
          </div>
        </div>

        <div className="table-wrap">
          {chats.length === 0 ? (
            <div className="empty">
              <div>
                <div className="metric-icon" style={{ margin: '0 auto' }}>--</div>
                <p className="empty-title">No Data Found</p>
                <h3 style={{ marginTop: '8px' }}>No active chats</h3>
                <p className="muted" style={{ marginTop: '8px' }}>Live chat sessions will appear here.</p>
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Chat ID</th>
                  <th>Matched Users</th>
                  <th>Duration</th>
                  <th>Messages</th>
                  <th>Coins Expended</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {chats.map((c) => (
                  <tr key={c.id}>
                    <td>#{c.id}</td>
                    <td>{c.user_one_name || '-'} / {c.user_two_name || '-'}</td>
                    <td>{c.duration_minutes || 0} min</td>
                    <td>{c.message_count || 0}</td>
                    <td>{Number(c.duration_minutes || 0) * 10}</td>
                    <td>{dateStr(c.updated_at)}</td>
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
