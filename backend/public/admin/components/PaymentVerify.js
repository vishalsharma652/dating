const { useState, useEffect, useMemo, useRef } = React;

window.PaymentVerify = function PaymentVerify({ rupees, dateStr, showNotice, onTabChange, apiRequest }) {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ totalCount: 0, pendingCount: 0, pendingAmount: 0, approvedCount: 0, approvedAmount: 0, rejectedCount: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [actionModal, setActionModal] = useState({ show: false, item: null, type: 'approve', utr: '', note: '', error: '' });

  const PAGE_SIZE = 15;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/admin/payments?page=${page}&limit=${PAGE_SIZE}&status=${statusFilter}&search=${encodeURIComponent(search)}&date=${date}`);
      if (res.success) {
        setRequests(res.data.requests || []);
        setTotal(res.data.total || 0);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (err) {
      if (showNotice) showNotice(err.message || 'Failed to load payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, statusFilter, date]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchPayments();
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openApproveModal = (item) => {
    setActionModal({
      show: true,
      item,
      type: 'approve',
      utr: item.transaction_ref || '',
      note: 'Payment verified and approved by admin',
      error: ''
    });
  };

  const openRejectModal = (item) => {
    setActionModal({
      show: true,
      item,
      type: 'reject',
      utr: '',
      note: '',
      error: ''
    });
  };

  const handleActionSubmit = async () => {
    if (!actionModal.item) return;

    if (actionModal.type === 'approve') {
      if (!actionModal.utr || !actionModal.utr.trim()) {
        setActionModal((m) => ({ ...m, error: 'Please enter the Transaction UTR / Reference number from the screenshot proof.' }));
        if (showNotice) showNotice('Transaction UTR is required to approve payment', 'error');
        return;
      }
    } else if (actionModal.type === 'reject') {
      if (!actionModal.note.trim()) {
        setActionModal((m) => ({ ...m, error: 'Please enter a rejection reason for the user.' }));
        if (showNotice) showNotice('Please enter a rejection reason for the user', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    setActionModal((m) => ({ ...m, error: '' }));

    try {
      const targetStatus = actionModal.type === 'approve' ? 'approved' : 'rejected';
      const res = await apiRequest(`/admin/payments/${actionModal.item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: targetStatus,
          transaction_ref: actionModal.utr ? actionModal.utr.trim() : undefined,
          utr: actionModal.utr ? actionModal.utr.trim() : undefined,
          admin_note: actionModal.note.trim()
        })
      });

      if (res.success) {
        if (showNotice) {
          showNotice(
            actionModal.type === 'approve'
              ? `Payment #REQ ${actionModal.item.id} approved! 🪙 Coins credited to user wallet.`
              : `Payment #REQ ${actionModal.item.id} rejected.`,
            'success'
          );
        }
        setActionModal({ show: false, item: null, type: 'approve', utr: '', note: '', error: '' });
        setSelectedRecord(null);
        fetchPayments();
      } else {
        const errorMsg = res.message || 'Action failed';
        setActionModal((m) => ({ ...m, error: errorMsg }));
        if (showNotice) showNotice(errorMsg, 'error');
      }
    } catch (err) {
      const errorMsg = err.message || 'Server error';
      setActionModal((m) => ({ ...m, error: errorMsg }));
      if (showNotice) showNotice(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 text-slate-100 max-w-full">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#171138] via-[#1c1448] to-[#120e2e] border border-purple-500/20 shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#2b1b59] border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner flex-shrink-0">
            <window.Icon name="shield-check" size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Payment Proof Verification</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-[#341d6b] text-[#c084fc] border border-purple-400/30">
                KOTAK 811
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify UPI QR code payment screenshots and credit coins to user accounts.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={fetchPayments}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#311b74] to-[#43239c] hover:from-[#3c218e] hover:to-[#4e2bb7] text-white text-xs font-bold transition flex items-center gap-2 border border-purple-400/30 shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            <window.Icon name="refresh-cw" size={13} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: PENDING VERIFICATION */}
        <div
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            statusFilter === 'pending'
              ? 'bg-[#181424] border-amber-500/60 shadow-lg shadow-amber-500/10'
              : 'bg-[#131122] border-amber-500/20 hover:border-amber-500/40 hover:bg-[#161326]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-400 truncate">PENDING VERIFICATION</span>
            <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center flex-shrink-0">
              <window.Icon name="clock" size={14} />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{stats.pendingCount || 0}</h3>
            <p className="text-[11px] text-amber-400/90 font-bold mt-0.5">₹{Number(stats.pendingAmount || 0).toLocaleString('en-IN')} to verify</p>
          </div>
        </div>

        {/* Card 2: APPROVED & CREDITED */}
        <div
          onClick={() => { setStatusFilter('approved'); setPage(1); }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            statusFilter === 'approved'
              ? 'bg-[#0f1c1a] border-emerald-500/60 shadow-lg shadow-emerald-500/10'
              : 'bg-[#0e171c] border-emerald-500/20 hover:border-emerald-500/40 hover:bg-[#111c20]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-400 truncate">APPROVED &amp; CREDITED</span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <window.Icon name="check-circle-2" size={14} />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{Number(stats.approvedCount || 0).toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-emerald-400/90 font-bold mt-0.5">₹{Number(stats.approvedAmount || 0).toLocaleString('en-IN')} approved</p>
          </div>
        </div>

        {/* Card 3: REJECTED */}
        <div
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            statusFilter === 'rejected'
              ? 'bg-[#22121b] border-rose-500/60 shadow-lg shadow-rose-500/10'
              : 'bg-[#191019] border-rose-500/20 hover:border-rose-500/40 hover:bg-[#1d121d]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-rose-400 truncate">REJECTED</span>
            <div className="w-7 h-7 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center flex-shrink-0">
              <window.Icon name="x-circle" size={14} />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{Number(stats.rejectedCount || 0).toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Declined proofs</p>
          </div>
        </div>

        {/* Card 4: ALL SUBMISSIONS */}
        <div
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden ${
            statusFilter === 'all'
              ? 'bg-[#1c1836] border-purple-500/60 shadow-lg shadow-purple-500/10'
              : 'bg-[#14122b] border-purple-500/20 hover:border-purple-500/40 hover:bg-[#171431]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-purple-400 truncate">ALL SUBMISSIONS</span>
            <div className="w-7 h-7 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center flex-shrink-0">
              <window.Icon name="layers" size={14} />
            </div>
          </div>
          <div className="mt-2.5">
            <h3 className="text-2xl sm:text-3xl font-black text-white">{Number(stats.totalCount || 0).toLocaleString('en-IN')}</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Total requests</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-[#0e101f] border border-white/5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xl">
        {/* Status Tabs (Zero Scroll) */}
        <div className="flex items-center gap-1 bg-[#080914] p-1 rounded-xl border border-white/5 w-auto">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: 'Pending ⏳' },
            { id: 'approved', label: 'Approved ✅' },
            { id: 'rejected', label: 'Rejected ❌' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer select-none ${
                statusFilter === tab.id
                  ? 'bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white shadow-md shadow-indigo-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Date Filter */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <input
              type="text"
              placeholder="Search User ID, Name, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-7 text-xs rounded-xl bg-[#080914] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition font-medium"
            />
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <window.Icon name="search" size={13} />
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[10px] flex items-center justify-center transition"
              >
                ✕
              </button>
            )}
          </div>

          <input
            type="date"
            value={date}
            onChange={(e) => { setDate(e.target.value); setPage(1); }}
            className="h-9 px-3 text-xs rounded-xl bg-[#080914] border border-white/10 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition font-medium cursor-pointer"
          />

          {date && (
            <button
              onClick={() => setDate('')}
              className="h-9 px-2.5 text-xs rounded-xl bg-[#1e1b4b] hover:bg-[#2e2a72] text-indigo-300 transition font-bold whitespace-nowrap cursor-pointer border border-indigo-500/30"
              title="Clear date"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Table Container (Responsive Horizontal Scroll) */}
      <div className="rounded-2xl bg-[#0c0d19] border border-white/5 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center animate-pulse">
              <window.Icon name="loader-2" size={20} className="animate-spin" />
            </div>
            <p className="text-xs font-bold text-slate-300">Loading payment requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-14 text-center text-slate-400 flex flex-col items-center justify-center gap-2.5">
            <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-400">
              <window.Icon name="inbox" size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-200">No Payment Requests Found</h4>
            <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
              {search || date || statusFilter !== 'all'
                ? 'No records match the current filters. Try changing your search query or status tab.'
                : 'There are currently no payment screenshot submissions to verify.'}
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse table-auto min-w-[980px]">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#080914] text-[#627d98] font-black uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-3 pl-5 whitespace-nowrap">ID &amp; DATE</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">USER DETAILS</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">PACKAGE &amp; AMOUNT</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">COINS TO CREDIT</th>
                  <th className="py-3.5 px-3 text-center whitespace-nowrap">SCREENSHOT PROOF</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">TRANSACTION UTR</th>
                  <th className="py-3.5 px-3 whitespace-nowrap">STATUS</th>
                  <th className="py-3.5 px-3 pr-5 text-right whitespace-nowrap">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-slate-300">
                {requests.map((item) => {
                  const totalCoins = Number(item.coins || 0) + Number(item.bonus_coins || 0);
                  const isPending = item.status === 'pending';
                  const isApproved = item.status === 'approved';
                  const isRejected = item.status === 'rejected';

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* ID & DATE */}
                      <td className="py-3 px-3 pl-5 align-middle whitespace-nowrap">
                        <div className="font-mono font-black text-white text-xs whitespace-nowrap">
                          #REQ {item.id}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                          {new Date(item.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}, {new Date(item.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </td>

                      {/* USER DETAILS (Avatar + Name + ID Badge, No Phone) */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.profilePhotoUrl || './default-avatar.png'}
                            alt={item.user_name}
                            onError={(e) => {
                              e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.user_name || 'U') + '&background=3b1f7d&color=c084fc&bold=true';
                            }}
                            className="w-8 h-8 rounded-full object-cover border-2 border-purple-500/40 shadow-sm flex-shrink-0 bg-[#1e1338]"
                          />
                          <div>
                            <div className="font-bold text-white text-xs whitespace-nowrap">
                              {item.user_name || 'User'}
                            </div>
                            <div className="mt-0.5 flex items-center gap-1">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#241a4a] text-[#c084fc] border border-purple-400/30 whitespace-nowrap">
                                ID: {item.user_unique_id || item.user_id}
                              </span>
                              {item.user_gender && (
                                <span className="text-[8px] uppercase font-black text-slate-400 px-1 py-0.2 bg-white/5 rounded border border-white/5 whitespace-nowrap">
                                  {item.user_gender}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PACKAGE & AMOUNT */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <div className="font-bold text-slate-200 text-xs whitespace-nowrap">{item.package_name}</div>
                        <div className="text-sm font-black text-[#ec4899] mt-0.5 tracking-tight whitespace-nowrap">
                          ₹{Number(item.amount).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* COINS TO CREDIT */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0b211f] border border-[#10b981]/30 text-[#10b981] font-black text-xs shadow-sm whitespace-nowrap">
                          <span>🪙</span> {totalCoins} Coins
                        </span>
                        {Number(item.bonus_coins) > 0 && (
                          <div className="text-[9px] text-amber-400 font-bold mt-0.5 whitespace-nowrap">
                            +{item.bonus_coins} Bonus
                          </div>
                        )}
                      </td>

                      {/* SCREENSHOT PROOF (Pink Icon Card / Thumbnail) */}
                      <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                        {item.screenshot_url ? (
                          <div
                            onClick={() => setLightboxImage(item.screenshot_url)}
                            className="relative w-11 h-11 rounded-lg border border-[#d946ef]/40 overflow-hidden bg-[#1a0e28] hover:bg-[#251239] cursor-pointer group/thumb inline-flex flex-col items-center justify-center text-[#f472b6] shadow-md transition mx-auto"
                            title="Click to view payment proof"
                          >
                            <img
                              src={item.screenshot_url}
                              alt="Screenshot"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                              className="w-full h-full object-cover group-hover/thumb:scale-110 transition duration-200"
                            />
                            <div className="hidden absolute inset-0 w-full h-full flex-col items-center justify-center bg-[#1a0e28] text-[#f472b6] p-0.5 text-center">
                              <window.Icon name="image" size={14} />
                              <span className="mt-0.5 font-bold text-[8px] leading-none">Proof</span>
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center text-white">
                              <window.Icon name="zoom-in" size={13} />
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-lg border border-white/10 bg-black/40 inline-flex flex-col items-center justify-center text-slate-500 text-[8px] font-semibold p-0.5 mx-auto">
                            <window.Icon name="image-off" size={13} />
                            <span className="mt-0.5">No Proof</span>
                          </div>
                        )}
                      </td>

                      {/* TRANSACTION UTR */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        {item.transaction_ref ? (
                          <div className="inline-flex items-center gap-1.5 bg-[#080914] px-2.5 py-1 rounded-lg border border-white/10 whitespace-nowrap">
                            <span className="font-mono font-bold text-xs text-slate-200 whitespace-nowrap select-all tracking-wide">
                              {item.transaction_ref}
                            </span>
                            <button
                              onClick={() => handleCopy(item.transaction_ref, item.id)}
                              className="p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer flex-shrink-0"
                              title="Copy UTR"
                            >
                              <window.Icon
                                name={copiedId === item.id ? 'check' : 'copy'}
                                size={12}
                                className={copiedId === item.id ? 'text-emerald-400' : ''}
                              />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[10px] italic whitespace-nowrap">Not entered</span>
                        )}
                      </td>

                      {/* STATUS (Pills matching image) */}
                      <td className="py-3 px-3 align-middle whitespace-nowrap">
                        {isPending && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2a1d08] border border-[#f59e0b]/40 text-[#f59e0b] whitespace-nowrap">
                              <window.Icon name="clock" size={11} />
                              Pending
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                              {new Date(item.created_at).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                        )}
                        {isApproved && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#07241d] border border-[#10b981]/40 text-[#10b981] whitespace-nowrap">
                              <window.Icon name="check" size={11} />
                              Approved
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                              {new Date(item.verified_at || item.created_at).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                        )}
                        {isRejected && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2b0e14] border border-[#f43f5e]/40 text-[#f43f5e] whitespace-nowrap">
                              <window.Icon name="x" size={11} />
                              Rejected
                            </span>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-medium whitespace-nowrap">
                              {new Date(item.created_at).toLocaleDateString('en-GB')}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* ACTIONS (Green check, Red cross, Eye button) */}
                      <td className="py-3 px-3 pr-5 text-right align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {isPending ? (
                            <>
                              {/* Approve Green Button */}
                              <button
                                onClick={() => openApproveModal(item)}
                                className="w-8 h-8 rounded-lg bg-[#064e3b] hover:bg-[#059669] text-[#34d399] hover:text-white flex items-center justify-center border border-[#10b981]/40 transition shadow-md cursor-pointer"
                                title="Approve & Credit Coins"
                              >
                                <window.Icon name="check" size={15} />
                              </button>

                              {/* Reject Red Button */}
                              <button
                                onClick={() => openRejectModal(item)}
                                className="w-8 h-8 rounded-lg bg-[#4c0519] hover:bg-[#e11d48] text-[#f43f5e] hover:text-white flex items-center justify-center border border-[#f43f5e]/40 transition shadow-md cursor-pointer"
                                title="Reject Submission"
                              >
                                <window.Icon name="x" size={15} />
                              </button>
                            </>
                          ) : null}

                          {/* Eye Details Button */}
                          <button
                            onClick={() => setSelectedRecord(item)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 transition cursor-pointer shadow-sm"
                            title="View Full Details"
                          >
                            <window.Icon name="eye" size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > PAGE_SIZE && (
          <div className="p-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 bg-[#080914]">
            <div className="whitespace-nowrap">
              Showing <span className="font-bold text-white">{((page - 1) * PAGE_SIZE) + 1}</span> to <span className="font-bold text-white">{Math.min(page * PAGE_SIZE, total)}</span> of <span className="font-bold text-white">{total}</span> requests
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-[#171431] hover:bg-[#221e48] text-white disabled:opacity-30 transition font-bold cursor-pointer border border-white/10"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-black text-white bg-white/5 rounded-lg border border-white/10">{page}</span>
              <button
                disabled={page * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-[#171431] hover:bg-[#221e48] text-white disabled:opacity-30 transition font-bold cursor-pointer border border-white/10"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record Detail Modal (Fully Responsive) */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="max-w-2xl w-full max-h-[92vh] flex flex-col bg-[#121024] border border-purple-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#16132e]">
              <div>
                <span className="text-[11px] font-mono font-bold text-[#c084fc] bg-[#241a4a] px-2.5 py-0.5 rounded-full border border-purple-400/30">
                  #REQ {selectedRecord.id}
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1">Payment Verification Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* User & Package Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-2xl bg-[#080914] border border-white/5 space-y-2">
                  <p className="text-slate-400 font-black uppercase tracking-wider text-[10px]">User Profile</p>
                  <div className="font-black text-white text-sm sm:text-base">{selectedRecord.user_name}</div>
                  <div className="text-slate-400">
                    Unique ID: <span className="font-mono text-[#c084fc] font-bold">{selectedRecord.user_unique_id || selectedRecord.user_id}</span>
                  </div>
                  {selectedRecord.user_gender && (
                    <div className="text-slate-400">
                      Gender: <span className="text-slate-200 capitalize font-semibold">{selectedRecord.user_gender}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-[#080914] border border-white/5 space-y-2">
                  <p className="text-slate-400 font-black uppercase tracking-wider text-[10px]">Package &amp; Amount</p>
                  <div className="font-black text-white text-sm sm:text-base">{selectedRecord.package_name}</div>
                  <div className="text-slate-400">Amount: <span className="text-[#ec4899] font-black text-sm sm:text-base">₹{selectedRecord.amount}</span></div>
                  <div className="text-slate-400">Coins to Credit: <span className="text-emerald-400 font-black">🪙 {Number(selectedRecord.coins || 0) + Number(selectedRecord.bonus_coins || 0)} Coins</span></div>
                </div>
              </div>

              {/* Screenshot Preview */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-300 mb-2">
                  <span className="flex items-center gap-1.5">
                    <window.Icon name="image" size={13} className="text-pink-400" />
                    Uploaded Payment Screenshot
                  </span>
                  {selectedRecord.screenshot_url && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage(selectedRecord.screenshot_url)}
                      className="text-[#c084fc] hover:underline flex items-center gap-1 font-bold text-xs cursor-pointer"
                    >
                      <window.Icon name="external-link" size={12} /> Full Screen
                    </button>
                  )}
                </div>
                {selectedRecord.screenshot_url ? (
                  <div
                    onClick={() => setLightboxImage(selectedRecord.screenshot_url)}
                    className="w-full max-h-72 rounded-2xl border border-white/10 bg-[#080914] p-3 flex items-center justify-center overflow-hidden cursor-pointer group shadow-inner relative"
                  >
                    <img
                      src={selectedRecord.screenshot_url}
                      alt="Payment proof"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                      className="max-h-64 w-auto object-contain rounded-xl group-hover:scale-[1.02] transition"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-slate-300 font-semibold backdrop-blur">
                      🔍 Click to Zoom
                    </span>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 bg-[#080914] rounded-2xl font-medium text-xs">No screenshot uploaded</div>
                )}
              </div>

              {/* Reference UTR */}
              {selectedRecord.transaction_ref && (
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                  <span className="text-slate-400 font-semibold">Transaction UTR / Reference:</span>
                  <span className="font-mono font-black text-white text-xs sm:text-sm bg-black/40 px-3 py-1 rounded-xl border border-white/10 select-all break-all">
                    {selectedRecord.transaction_ref}
                  </span>
                </div>
              )}

              {/* Admin Note */}
              {selectedRecord.admin_note && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                  <strong className="font-black">Admin Note:</strong> {selectedRecord.admin_note}
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            {selectedRecord.status === 'pending' && (
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-white/10 bg-[#0e0c1f] flex items-center gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => openApproveModal(selectedRecord)}
                  className="flex-1 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer whitespace-nowrap"
                >
                  <window.Icon name="check" size={15} />
                  Approve &amp; Credit Coins
                </button>
                <button
                  type="button"
                  onClick={() => openRejectModal(selectedRecord)}
                  className="flex-1 h-11 sm:h-12 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 border border-rose-500/30 cursor-pointer whitespace-nowrap"
                >
                  <window.Icon name="x" size={15} />
                  Reject Submission
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Approve / Reject Action Modal (Fully Responsive) */}
      {actionModal.show && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="max-w-lg w-full max-h-[92vh] flex flex-col bg-[#121024] border border-purple-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header (Sticky) */}
            <div className="px-5 py-4 sm:px-6 sm:py-4.5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#16132e]">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner flex-shrink-0 ${
                  actionModal.type === 'approve' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  <window.Icon name={actionModal.type === 'approve' ? 'shield-check' : 'alert-triangle'} size={20} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                    {actionModal.type === 'approve' ? 'Verify & Approve Payment' : 'Reject Payment Request'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Request #REQ {actionModal.item?.id} · {actionModal.item?.user_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActionModal({ show: false, item: null, type: 'approve', utr: '', note: '', error: '' })}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition cursor-pointer text-sm font-bold flex-shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
              {/* User & Payment Summary Card */}
              <div className="p-3.5 rounded-2xl bg-[#080914] border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">User:</span>
                  <span className="font-bold text-white truncate max-w-[200px]">{actionModal.item?.user_name} ({actionModal.item?.user_unique_id || actionModal.item?.user_id})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Amount:</span>
                  <span className="font-black text-[#ec4899]">₹{actionModal.item?.amount} ({actionModal.item?.package_name})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Coins:</span>
                  <span className="font-black text-emerald-400">🪙 {Number(actionModal.item?.coins || 0) + Number(actionModal.item?.bonus_coins || 0)} Coins</span>
                </div>
              </div>

              {/* Screenshot Proof Preview (Check UTR) */}
              {actionModal.type === 'approve' && actionModal.item?.screenshot_url && (
                <div className="p-3 rounded-2xl bg-[#080914] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <window.Icon name="image" size={13} className="text-pink-400" />
                      Screenshot Proof (Verify UTR)
                    </span>
                    <button
                      type="button"
                      onClick={() => setLightboxImage(actionModal.item.screenshot_url)}
                      className="text-[#c084fc] hover:underline font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <window.Icon name="maximize-2" size={11} /> Zoom
                    </button>
                  </div>
                  <div
                    onClick={() => setLightboxImage(actionModal.item.screenshot_url)}
                    className="w-full max-h-48 sm:max-h-56 rounded-xl bg-black/70 flex items-center justify-center overflow-hidden cursor-pointer border border-white/5 group relative"
                  >
                    <img
                      src={actionModal.item.screenshot_url}
                      alt="Payment proof screenshot"
                      className="max-h-44 sm:max-h-52 w-auto object-contain rounded-lg group-hover:scale-105 transition duration-200"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-slate-300 font-semibold backdrop-blur">
                      🔍 Click to Zoom
                    </span>
                  </div>
                </div>
              )}

              {/* Approve Form: UTR Number Input */}
              {actionModal.type === 'approve' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-amber-300 mb-1.5 flex items-center justify-between">
                      <span>Transaction UTR / Reference <span className="text-rose-400">*</span></span>
                      <span className="text-[10px] text-slate-400 lowercase font-normal">(must be unique)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter 12-digit UTR from screenshot (e.g. 423987123456)"
                      value={actionModal.utr}
                      onChange={(e) => setActionModal((m) => ({ ...m, utr: e.target.value, error: '' }))}
                      className="w-full h-11 sm:h-12 px-3.5 text-xs sm:text-sm rounded-xl bg-[#080914] border-2 border-purple-500/40 text-white font-mono font-bold placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition tracking-wider"
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      ⚠️ Screenshot me se UTR number daalein. Duplicate UTR aane par system error dega.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Admin Note <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Verified in Kotak 811 statement"
                      value={actionModal.note}
                      onChange={(e) => setActionModal((m) => ({ ...m, note: e.target.value }))}
                      className="w-full h-10 px-3.5 text-xs rounded-xl bg-[#080914] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Rejection Reason <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Invalid screenshot, fake UTR, amount not received in account..."
                    value={actionModal.note}
                    onChange={(e) => setActionModal((m) => ({ ...m, note: e.target.value, error: '' }))}
                    className="w-full p-3.5 text-xs rounded-xl bg-[#080914] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 transition resize-none font-medium"
                  />
                </div>
              )}

              {/* Error Message Display in Modal */}
              {actionModal.error && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-in slide-in-from-top-1">
                  <window.Icon name="alert-triangle" size={16} className="text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="font-semibold leading-relaxed break-words">
                    {actionModal.error}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Sticky) */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-white/10 bg-[#0e0c1f] flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => setActionModal({ show: false, item: null, type: 'approve', utr: '', note: '', error: '' })}
                className="flex-1 h-11 sm:h-12 rounded-xl bg-[#1b1738] hover:bg-[#25204d] text-slate-300 font-bold text-xs sm:text-sm transition cursor-pointer border border-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleActionSubmit}
                className={`flex-1 h-11 sm:h-12 rounded-xl font-bold text-xs sm:text-sm text-white transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer ${
                  actionModal.type === 'approve'
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:opacity-95 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {isSubmitting ? (
                  <window.Icon name="loader-2" size={16} className="animate-spin" />
                ) : (
                  actionModal.type === 'approve' ? 'Verify UTR & Approve' : 'Confirm Rejection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[92vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Full size screenshot"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              ✕ Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
