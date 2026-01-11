"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";

type AggregatedItem = { name: string; qty: number; total: number; timesOrdered: number };

export default function CompletedPage() {
  const [aggregatedItems, setAggregatedItems] = useState<AggregatedItem[]>([]);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [orderCount, setOrderCount] = useState<number>(0);
  const [uniqueCustomers, setUniqueCustomers] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "daily" | "weekly" | "yearly">("all");
  const [dateFrom, setDateFrom] = useState<string | null>(null);
  const [dateTo, setDateTo] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // when preset filter changes, compute date range accordingly
  useEffect(() => {
    const now = new Date();
    if (filter === 'daily') {
      const iso = now.toISOString().slice(0, 10);
      setDateFrom(iso);
      setDateTo(iso);
    } else if (filter === 'weekly') {
      const to = now;
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      setDateFrom(from.toISOString().slice(0, 10));
      setDateTo(to.toISOString().slice(0, 10));
    } else if (filter === 'yearly') {
      const to = now;
      const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      setDateFrom(from.toISOString().slice(0, 10));
      setDateTo(to.toISOString().slice(0, 10));
    } else {
      setDateFrom(null);
      setDateTo(null);
    }
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    async function loadAggregated() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateFrom) params.set('dateFrom', dateFrom);
        if (dateTo) params.set('dateTo', dateTo);
        const res = await fetch(`/api/reports/completed-items?${params.toString()}`);
        const data = await res.json();
        if (data && Array.isArray(data.items)) {
          setAggregatedItems(data.items);
          setGrandTotal(Number(data.grandTotal || 0));
          setOrderCount(data.orderCount || 0);
          setUniqueCustomers(data.uniqueCustomers || 0);
        } else {
          setAggregatedItems([]);
          setGrandTotal(0);
          setOrderCount(0);
          setUniqueCustomers(0);
        }
      } catch (e) {
        setAggregatedItems([]);
        setGrandTotal(0);
        setOrderCount(0);
        setUniqueCustomers(0);
      } finally {
        setLoading(false);
      }
    }
    loadAggregated();
  }, [dateFrom, dateTo]);

  // apply search filter
  const searched = useMemo(() => {
    if (!search.trim()) return aggregatedItems;
    const q = search.toLowerCase();
    return aggregatedItems.filter(a => a.name.toLowerCase().includes(q));
  }, [aggregatedItems, search]);

  // pagination
  const totalPages = Math.max(1, Math.ceil(searched.length / itemsPerPage));
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(1); }, [totalPages]);
  const pageItems = useMemo(() => searched.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [searched, currentPage, itemsPerPage]);

  const navItems = [
    { label: "Dashboard", href: "/admin/Dashboard" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Food Menu", href: "/admin/food-menu" },
    { label: "Archive", href: "/admin/archive" },
    { label: "Income", href: "/admin/Income" },
  ];

  function exportCSV() {
    const headers = ['Food','Quantity','Times Ordered','Total Price'];
    const rows = aggregatedItems.map(r => [r.name, String(r.qty), String(r.timesOrdered), r.total.toFixed(2)]);
    const csv = [headers.join(','), ...rows.map(r=> r.map(c=> '"'+String(c).replace(/"/g,'""')+'"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `completed_foods_${filter}_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(a); a.click(); a.remove();
  }

  const formatCurrency = (val: number) => `₱${val.toFixed(2)}`;
  const formatDate = (d: string | null) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0 }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />
        <main style={{ flex: 1, background: "#f0f4f8", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Completed Orders" subtitle="Sales analytics: Foods sold and revenue by date range" breadcrumbs={["Home","Completed"]} />
          
          <div style={{ padding: "32px 40px" }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>COMPLETED ORDERS</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>{orderCount}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>UNIQUE CUSTOMERS</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>{uniqueCustomers}</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 600, marginBottom: 8 }}>ITEMS SOLD</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#1f2937' }}>{aggregatedItems.reduce((s, i) => s + i.qty, 0)}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: 12, padding: 20, boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 600, marginBottom: 8 }}>TOTAL REVENUE</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{formatCurrency(grandTotal)}</div>
              </div>
            </div>

            {/* Filters Section */}
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 12 }}>📅 Quick Filters</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {['daily', 'weekly', 'yearly', 'all'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 8,
                        border: filter === f ? '2px solid #667eea' : '1px solid #d1d5db',
                        background: filter === f ? '#eef2ff' : '#fff',
                        color: filter === f ? '#667eea' : '#6b7280',
                        cursor: 'pointer',
                        fontWeight: filter === f ? 600 : 500,
                        fontSize: 14,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {f === 'daily' && '📅 Today'}
                      {f === 'weekly' && '📆 This Week'}
                      {f === 'yearly' && '📊 This Year'}
                      {f === 'all' && '🌍 All Time'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 12 }}>📍 Custom Date Range</label>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input type="date" value={dateFrom ?? ''} onChange={(e) => { setDateFrom(e.target.value || null); setFilter('all'); setCurrentPage(1); }} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>to</span>
                  <input type="date" value={dateTo ?? ''} onChange={(e) => { setDateTo(e.target.value || null); setFilter('all'); setCurrentPage(1); }} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  placeholder="🔍 Search food name..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  style={{ flex: 1, minWidth: 250, padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                />
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, cursor: 'pointer' }}>
                  <option value={10}>10 rows</option>
                  <option value={25}>25 rows</option>
                  <option value={50}>50 rows</option>
                </select>
                <button onClick={exportCSV} style={{ background: 'linear-gradient(135deg,#10b981 0%,#059669 100%)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>📥 Export CSV</button>
              </div>
            </div>

            {/* Data Display */}
            {loading && (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12 }}>
                <div style={{ color: '#6b7280', fontSize: 16 }}>⏳ Loading completed orders...</div>
              </div>
            )}

            {!loading && searched.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 18, color: '#6b7280', fontWeight: 500 }}>📭 No completed items found</div>
                <div style={{ fontSize: 14, color: '#9ca3af', marginTop: 8 }}>Try adjusting your date range or search filters</div>
              </div>
            )}

            {!loading && searched.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ textAlign: 'left', background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <th style={{ padding: 16, fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Food Item</th>
                        <th style={{ padding: 16, width: 120, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quantity</th>
                        <th style={{ padding: 16, width: 140, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Orders</th>
                        <th style={{ padding: 16, width: 150, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((r, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                          <td style={{ padding: 16, fontSize: 14, color: '#1f2937', fontWeight: 500 }}>{r.name}</td>
                          <td style={{ padding: 16, textAlign: 'right', fontSize: 14, color: '#374151' }}><span style={{ background: '#dbeafe', color: '#0369a1', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>{r.qty}</span></td>
                          <td style={{ padding: 16, textAlign: 'right', fontSize: 14, color: '#374151' }}><span style={{ background: '#fce7f3', color: '#be185d', padding: '4px 8px', borderRadius: 4, fontWeight: 600 }}>{r.timesOrdered}x</span></td>
                          <td style={{ padding: 16, textAlign: 'right', fontSize: 14, color: '#1f2937', fontWeight: 700 }}>{formatCurrency(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Grand Total */}
                <div style={{ borderTop: '2px solid #e5e7eb', padding: 20, background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#1f2937' }}>💰 Grand Total</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981' }}>{formatCurrency(grandTotal)}</div>
                </div>

                {/* Pagination */}
                <div style={{ padding: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: currentPage === 1 ? '#f3f4f6' : '#fff', color: '#374151', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500 }}>← Previous</button>
                  <div style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #d1d5db', background: '#eef2ff', color: '#667eea', fontWeight: 600 }}>{currentPage} / {totalPages}</div>
                  <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #d1d5db', background: currentPage === totalPages ? '#f3f4f6' : '#fff', color: '#374151', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 500 }}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
