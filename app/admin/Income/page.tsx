"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import { useRouter } from "next/navigation";

interface OrderData {
  id: number;
  status: string;
  createdAt: string;
  items: { quantity: number; unitPrice: string; lineTotal: string }[];
}

interface IncomeData {
  period: string;
  income: number;
  orderCount: number;
  label: string;
}

export default function IncomePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [filter, setFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [incomeData, setIncomeData] = useState<IncomeData[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const navItems = [
    { label: "Dashboard", href: "/admin/Dashboard" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Food Menu", href: "/admin/food-menu" },
    { label: "Archive", href: "/admin/archive" },
    { label: "Income", href: "/admin/Income" },
  ];

  useEffect(() => {
    let hasToken = false;
    try {
      hasToken = Boolean(localStorage.getItem("admin_token"));
    } catch (e) {
      hasToken = false;
    }
    if (!hasToken) {
      router.push("/admin/login");
      return;
    }

    // Fetch orders
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data: OrderData[]) => {
        if (Array.isArray(data)) {
          setOrders(data);
          calculateIncome(data, filter);
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (orders.length > 0) {
      calculateIncome(orders, filter);
    }
  }, [filter, orders]);

  const calculateIncome = (data: OrderData[], filterType: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    const today = new Date();
    let periods: { start: Date; end: Date; label: string }[] = [];

    if (filterType === 'daily') {
      // Last 7 days
      periods = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (6 - i));
        return {
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999)),
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
      });
    } else if (filterType === 'weekly') {
      // Last 12 weeks
      periods = Array.from({ length: 12 }, (_, i) => {
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (11 - i) * 7);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        return {
          start: weekStart,
          end: weekEnd,
          label: `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
        };
      });
    } else if (filterType === 'monthly') {
      // Last 12 months
      periods = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          start: monthStart,
          end: monthEnd,
          label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      });
    } else {
      // Last 5 years
      periods = Array.from({ length: 5 }, (_, i) => {
        const year = today.getFullYear() - (4 - i);
        return {
          start: new Date(year, 0, 1, 0, 0, 0, 0),
          end: new Date(year, 11, 31, 23, 59, 59, 999),
          label: year.toString()
        };
      });
    }

    const income: IncomeData[] = periods.map(period => {
      const periodOrders = data.filter(order => {
        if (order.status !== 'COMPLETED') return false;
        const orderDate = new Date(order.createdAt);
        return orderDate >= period.start && orderDate <= period.end;
      });

      const periodIncome = periodOrders.reduce((sum, order) => {
        const orderTotal = order.items.reduce(
          (itemSum, item) => itemSum + parseFloat(item.lineTotal),
          0
        );
        return sum + orderTotal;
      }, 0);

      return {
        period: period.start.toISOString(),
        income: periodIncome,
        orderCount: periodOrders.length,
        label: period.label
      };
    });

    const total = data
      .filter(order => order.status === 'COMPLETED')
      .reduce((sum, order) => {
        const orderTotal = order.items.reduce(
          (itemSum, item) => itemSum + parseFloat(item.lineTotal),
          0
        );
        return sum + orderTotal;
      }, 0);

    setIncomeData(income);
    setTotalIncome(total);
  };

  const handleExportCSV = () => {
    const headers = ['Period', 'Income (₱)', 'Orders'];
    const rows = incomeData.map(item => [item.label, item.income.toFixed(2), item.orderCount]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `income_report_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Income" subtitle="View and analyze your income reports" breadcrumbs={["Home", "Income"]} />
          <div style={{ padding: 32 }}>

            {/* Filter and Export Controls */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setFilter('daily')}
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    background: filter === 'daily' ? "#2563eb" : "white",
                    color: filter === 'daily' ? "white" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Daily
                </button>
                <button
                  onClick={() => setFilter('weekly')}
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    background: filter === 'weekly' ? "#2563eb" : "white",
                    color: filter === 'weekly' ? "white" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setFilter('monthly')}
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    background: filter === 'monthly' ? "#2563eb" : "white",
                    color: filter === 'monthly' ? "white" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFilter('yearly')}
                  style={{
                    padding: "10px 16px",
                    fontSize: 14,
                    fontWeight: 500,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    background: filter === 'yearly' ? "#2563eb" : "white",
                    color: filter === 'yearly' ? "white" : "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Yearly
                </button>
              </div>

              <button
                onClick={handleExportCSV}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Export CSV
              </button>
            </div>

            {/* Total Income Card */}
            <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8, fontWeight: 500 }}>Total Income (All Time)</div>
              <div style={{ fontSize: 36, fontWeight: 700, color: "#10b981" }}>
                ₱{totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Income Chart */}
            <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 600, color: "#1e293b" }}>
                Income & Orders Trend ({filter.charAt(0).toUpperCase() + filter.slice(1)})
              </h3>

              {incomeData.length > 0 ? (
                <>
                  <div style={{ position: "relative", height: 350, paddingLeft: 50, paddingRight: 20 }}>
                    {/* Y-axis labels for Income */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 50, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 11, color: "#94a3b8" }}>
                      {Array.from({ length: 6 }, (_, i) => {
                        const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                        const value = maxIncome * (1 - i / 5);
                        return (
                          <div key={i} style={{ textAlign: "right", width: 45 }}>
                            ₱{value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Area */}
                    <div style={{ marginLeft: 50, height: 300, position: "relative" }}>
                      <svg width="100%" height="300" style={{ position: "absolute", top: 0, left: 0 }}>
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <line
                            key={i}
                            x1="0"
                            y1={i * 50}
                            x2="100%"
                            y2={i * 50}
                            stroke="#f1f5f9"
                            strokeWidth="1"
                          />
                        ))}

                        {/* Bars */}
                        {incomeData.map((item, idx) => {
                          const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                          const maxOrders = Math.max(...incomeData.map(d => d.orderCount), 1);
                          const incomeHeight = (item.income / maxIncome) * 250;
                          const ordersHeight = (item.orderCount / maxOrders) * 250;
                          const barWidth = 80 / incomeData.length;
                          const groupWidth = 100 / incomeData.length;
                          const centerOffset = groupWidth / 2;
                          const spacing = barWidth * 0.15;

                          return (
                            <g
                              key={idx}
                              onMouseEnter={(e) => {
                                setHoveredIndex(idx);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                              }}
                              onMouseLeave={() => setHoveredIndex(null)}
                              style={{ cursor: "pointer" }}
                            >
                              {/* Income Bar (Orange) */}
                              <rect
                                x={`${idx * groupWidth + centerOffset - barWidth * 0.6}%`}
                                y={250 - incomeHeight}
                                width={`${barWidth * 0.5}%`}
                                height={incomeHeight}
                                fill="#f59e0b"
                                rx="3"
                                style={{ transition: "opacity 0.2s", opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.4 }}
                              />

                              {/* Orders Bar (Blue) */}
                              <rect
                                x={`${idx * groupWidth + centerOffset + spacing}%`}
                                y={250 - ordersHeight}
                                width={`${barWidth * 0.5}%`}
                                height={ordersHeight}
                                fill="#3b82f6"
                                rx="3"
                                style={{ transition: "opacity 0.2s", opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.4 }}
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Overlay Line Chart for Income Trend */}
                      <svg width="100%" height="300" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                        <polyline
                          points={incomeData.map((item, idx) => {
                            const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                            const groupWidth = 100 / incomeData.length;
                            const x = idx * groupWidth + groupWidth / 2;
                            const y = 250 - ((item.income / maxIncome) * 250);
                            return `${x}%,${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points on line */}
                        {incomeData.map((item, idx) => {
                          const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                          const groupWidth = 100 / incomeData.length;
                          const xPercent = idx * groupWidth + groupWidth / 2;
                          const y = 250 - ((item.income / maxIncome) * 250);
                          return (
                            <circle
                              key={idx}
                              cx={`${xPercent}%`}
                              cy={y}
                              r="4"
                              fill="#ef4444"
                              stroke="white"
                              strokeWidth="2"
                              style={{
                                cursor: "pointer",
                                transition: "r 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                setHoveredIndex(idx);
                                const rect = e.currentTarget.getBoundingClientRect();
                                setTooltipPos({ x: rect.left, y: rect.top });
                              }}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />
                          );
                        })}
                      </svg>
                    </div>

                    {/* Tooltip */}
                    {hoveredIndex !== null && (
                      <div
                        style={{
                          position: "absolute",
                          top: -80,
                          left: `${(hoveredIndex / incomeData.length) * 100 + 100 / incomeData.length / 2}%`,
                          transform: "translateX(-50%)",
                          background: "#1e293b",
                          color: "white",
                          padding: "12px 16px",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          zIndex: 10,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div style={{ marginBottom: 4, color: "#f59e0b" }}>
                          Income: ₱{incomeData[hoveredIndex].income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: "#3b82f6" }}>
                          Orders: {incomeData[hoveredIndex].orderCount}
                        </div>
                      </div>
                    )}

                    {/* X-axis labels */}
                    <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, marginLeft: 50, paddingRight: 20 }}>
                      {incomeData.map((item, idx) => (
                        <span key={idx} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textAlign: "center", flex: 1 }}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, background: "#f59e0b", borderRadius: 3 }}></div>
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Income</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, background: "#3b82f6", borderRadius: 3 }}></div>
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Orders</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 24, height: 3, background: "#ef4444", borderRadius: 2 }}></div>
                      <span style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>Trend Line</span>
                    </div>
                  </div>

                  {/* Income Data Table */}
                  <div style={{ marginTop: 32, overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                          <th style={{ padding: "12px", textAlign: "left", fontWeight: 600, color: "#475569" }}>Period</th>
                          <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#475569" }}>Income</th>
                          <th style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#475569" }}>Orders</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px", color: "#64748b" }}>{item.label}</td>
                            <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#f59e0b" }}>
                              ₱{item.income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", fontWeight: 600, color: "#3b82f6" }}>
                              {item.orderCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "2px solid #e2e8f0", background: "#f8fafc" }}>
                          <td style={{ padding: "12px", fontWeight: 700, color: "#1e293b" }}>Total</td>
                          <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#f59e0b" }}>
                            ₱{incomeData.reduce((sum, item) => sum + item.income, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#3b82f6" }}>
                            {incomeData.reduce((sum, item) => sum + item.orderCount, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
                  No income data available for the selected period
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
