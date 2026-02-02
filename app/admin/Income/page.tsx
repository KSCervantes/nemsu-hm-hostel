"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import { useRouter } from "next/navigation";
import { toDateObject } from "@/lib/date-utils";

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
    { label: "Completed", href: "/admin/Completed" },
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
        const orderDate = toDateObject(order.createdAt);
        if (!orderDate) return false;
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

        <main style={{ flex: 1, background: "transparent", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Income & Analytics" subtitle="Track your revenue and order performance" breadcrumbs={["Home", "Income"]} />
          <div style={{ padding: 32 }}>

            {/* Summary Cards Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 32 }}>
              {/* Total Income Card */}
              <div style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: 28,
                borderRadius: 16,
                boxShadow: "0 8px 24px rgba(16, 185, 129, 0.25)",
                border: "1px solid rgba(255,255,255,0.3)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.95)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Income
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.25)",
                    padding: 10,
                    borderRadius: 12,
                    backdropFilter: "blur(10px)"
                  }}>
                    <svg width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.43 122.88">
                      <path d="M118.45,51l1,1-.74,9.11H99A40.52,40.52,0,0,1,81.88,78.43q-11.44,6.28-27.71,7h-15l.5,37.43H21.42l.74-36.94-.24-24.87H1L0,59.84.74,51H21.92l-.25-15.26H1l-1-1,.74-9.11H21.67L21.42.25,63.29,0Q78.8,0,88.65,6.53T102,25.61h16.5l1,1.23-.74,8.87h-15v3.94A53.17,53.17,0,0,1,102.44,51ZM39.65,25.61H81.26Q74.85,14,58.61,13.3L39.89,14l-.24,11.57ZM39.4,51H83.23a39.51,39.51,0,0,0,1.23-9.6,46.17,46.17,0,0,0-.24-5.66H39.65L39.4,51ZM58.61,71.91q12.56-2.72,19.21-10.84H39.4l-.25,10.1,19.46.74Z"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: "white", marginBottom: 4, lineHeight: 1 }}>
                  ₱{totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>
                  All completed orders
                </div>
              </div>

              {/* Period Income Card */}
              <div style={{
                background: "white",
                padding: 28,
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Period Income
                  </div>
                  <div style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    padding: 10,
                    borderRadius: 12
                  }}>
                    <svg width="24" height="24" fill="#f59e0b" viewBox="0 0 16 16">
                      <path d="M1 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3zm5-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm5-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V2z"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#1f2937", marginBottom: 4, lineHeight: 1 }}>
                  ₱{incomeData.reduce((sum, item) => sum + item.income, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)} view
                </div>
              </div>

              {/* Total Orders Card */}
              <div style={{
                background: "white",
                padding: 28,
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Orders
                  </div>
                  <div style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    padding: 10,
                    borderRadius: 12
                  }}>
                    <svg width="24" height="24" fill="#3b82f6" viewBox="0 0 16 16">
                      <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#1f2937", marginBottom: 4, lineHeight: 1 }}>
                  {incomeData.reduce((sum, item) => sum + item.orderCount, 0)}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  Completed orders
                </div>
              </div>

              {/* Average Order Value Card */}
              <div style={{
                background: "white",
                padding: 28,
                borderRadius: 16,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Avg Order Value
                  </div>
                  <div style={{
                    background: "rgba(139, 92, 246, 0.1)",
                    padding: 10,
                    borderRadius: 12
                  }}>
                    <svg width="24" height="24" fill="#8b5cf6" viewBox="0 0 16 16">
                      <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                      <path d="M8 13.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11zm0 .5A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"/>
                    </svg>
                  </div>
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: "#1f2937", marginBottom: 4, lineHeight: 1 }}>
                  ₱{(incomeData.reduce((sum, item) => sum + item.orderCount, 0) > 0
                    ? incomeData.reduce((sum, item) => sum + item.income, 0) / incomeData.reduce((sum, item) => sum + item.orderCount, 0)
                    : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>
                  Per order
                </div>
              </div>
            </div>

            {/* Filter and Export Controls */}
            <div style={{
              background: "white",
              padding: "20px 24px",
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              marginBottom: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Time Period
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setFilter('daily')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      border: filter === 'daily' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: filter === 'daily' ? "#eff6ff" : "transparent",
                      color: filter === 'daily' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => setFilter('weekly')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      border: filter === 'weekly' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: filter === 'weekly' ? "#eff6ff" : "transparent",
                      color: filter === 'weekly' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setFilter('monthly')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      border: filter === 'monthly' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: filter === 'monthly' ? "#eff6ff" : "transparent",
                      color: filter === 'monthly' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setFilter('yearly')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 600,
                      border: filter === 'yearly' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: filter === 'yearly' ? "#eff6ff" : "transparent",
                      color: filter === 'yearly' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Yearly
                  </button>
                </div>
              </div>

              <button
                onClick={handleExportCSV}
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "#fff",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                }}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Export to CSV
              </button>
            </div>

            {/* Income Chart */}
            <div style={{
              background: "white",
              padding: 32,
              borderRadius: 16,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
              marginBottom: 24
            }}>
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ margin: "0 0 8px 0", fontSize: 20, fontWeight: 700, color: "#1f2937" }}>
                  Revenue & Orders Trend
                </h3>
                <p style={{ margin: 0, fontSize: 14, color: "#6b7280", fontWeight: 500 }}>
                  Showing {filter} performance data
                </p>
              </div>
            </div>

            {/* Income Chart */}
            <div style={{ background: "white", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
              <h3 style={{ margin: "0 0 24px 0", fontSize: 18, fontWeight: 600, color: "#1e293b" }}>
                Income & Orders Trend ({filter.charAt(0).toUpperCase() + filter.slice(1)})
              </h3>

              {incomeData.length > 0 ? (
                <>
                  <div style={{ position: "relative", height: 380, paddingLeft: 60, paddingRight: 20, paddingBottom: 20 }}>
                    {/* Y-axis labels for Income */}
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 60, display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 12, color: "#6b7280", fontWeight: 600 }}>
                      {Array.from({ length: 6 }, (_, i) => {
                        const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                        const value = maxIncome * (1 - i / 5);
                        return (
                          <div key={i} style={{ textAlign: "right", width: 55 }}>
                            ₱{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}
                          </div>
                        );
                      })}
                    </div>

                    {/* Chart Area */}
                    <div style={{ marginLeft: 60, height: 320, position: "relative" }}>
                      <svg width="100%" height="320" style={{ position: "absolute", top: 0, left: 0 }}>
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <line
                            key={i}
                            x1="0"
                            y1={i * 53.3}
                            x2="100%"
                            y2={i * 53.3}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                          />
                        ))}

                        {/* Bars */}
                        {incomeData.map((item, idx) => {
                          const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                          const maxOrders = Math.max(...incomeData.map(d => d.orderCount), 1);
                          const incomeHeight = (item.income / maxIncome) * 270;
                          const ordersHeight = (item.orderCount / maxOrders) * 270;
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
                                y={270 - incomeHeight}
                                width={`${barWidth * 0.5}%`}
                                height={incomeHeight}
                                fill="#f59e0b"
                                rx="4"
                                style={{ transition: "opacity 0.2s", opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.3 }}
                              />

                              {/* Orders Bar (Blue) */}
                              <rect
                                x={`${idx * groupWidth + centerOffset + spacing}%`}
                                y={270 - ordersHeight}
                                width={`${barWidth * 0.5}%`}
                                height={ordersHeight}
                                fill="#3b82f6"
                                rx="4"
                                style={{ transition: "opacity 0.2s", opacity: hoveredIndex === null || hoveredIndex === idx ? 1 : 0.3 }}
                              />
                            </g>
                          );
                        })}
                      </svg>

                      {/* Overlay Line Chart for Income Trend */}
                      <svg width="100%" height="320" style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}>
                        <polyline
                          points={incomeData.map((item, idx) => {
                            const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                            const groupWidth = 100 / incomeData.length;
                            const x = idx * groupWidth + groupWidth / 2;
                            const y = 270 - ((item.income / maxIncome) * 270);
                            return `${x}%,${y}`;
                          }).join(" ")}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Data points on line */}
                        {incomeData.map((item, idx) => {
                          const maxIncome = Math.max(...incomeData.map(d => d.income), 1);
                          const groupWidth = 100 / incomeData.length;
                          const xPercent = idx * groupWidth + groupWidth / 2;
                          const y = 270 - ((item.income / maxIncome) * 270);
                          return (
                            <circle
                              key={idx}
                              cx={`${xPercent}%`}
                              cy={y}
                              r="5"
                              fill="#ef4444"
                              stroke="white"
                              strokeWidth="2.5"
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
                          top: -100,
                          left: `${(hoveredIndex / incomeData.length) * 100 + 100 / incomeData.length / 2}%`,
                          transform: "translateX(-50%)",
                          background: "linear-gradient(135deg, #1f2937 0%, #374151 100%)",
                          color: "white",
                          padding: "16px 20px",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          zIndex: 10,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <div style={{ marginBottom: 6, color: "#f59e0b", fontSize: 13 }}>
                          💰 Income: ₱{incomeData[hoveredIndex].income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: "#3b82f6", fontSize: 13 }}>
                          🛒 Orders: {incomeData[hoveredIndex].orderCount}
                        </div>
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(59, 130, 246, 0.2)", color: "#93c5fd", fontSize: 12 }}>
                          📅 {incomeData[hoveredIndex].label}
                        </div>
                      </div>
                    )}

                    {/* X-axis labels */}
                    <div style={{ display: "flex", justifyContent: "space-around", marginTop: 16, marginLeft: 60, paddingRight: 20 }}>
                      {incomeData.map((item, idx) => (
                        <span key={idx} style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, textAlign: "center", flex: 1 }}>
                          {item.label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Legend */}
                  <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 24, paddingTop: 24, borderTop: "2px solid #e5e7eb" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, background: "#f59e0b", borderRadius: 4, boxShadow: "0 2px 4px rgba(245, 158, 11, 0.3)" }}></div>
                      <span style={{ fontSize: 14, color: "#1f2937", fontWeight: 600 }}>Income</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 20, height: 20, background: "#3b82f6", borderRadius: 4, boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)" }}></div>
                      <span style={{ fontSize: 14, color: "#1f2937", fontWeight: 600 }}>Orders</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 3, background: "#ef4444", borderRadius: 2 }}></div>
                      <span style={{ fontSize: 14, color: "#1f2937", fontWeight: 600 }}>Trend Line</span>
                    </div>
                  </div>

                  {/* Income Data Table */}
                  <div style={{ marginTop: 40, overflowX: "auto" }}>
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>
                        Detailed Breakdown
                      </h4>
                      <p style={{ margin: 0, fontSize: 14, color: "#6b7280", fontWeight: 500 }}>
                        Income and order statistics by period
                      </p>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, border: "1px solid #e5e7eb" }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e5e7eb", background: "#f8fafc" }}>
                          <th style={{ padding: "14px 16px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", borderRight: "1px solid #e5e7eb" }}>Period</th>
                          <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#374151", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", borderRight: "1px solid #e5e7eb" }}>Income</th>
                          <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#374151", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", borderRight: "1px solid #e5e7eb" }}>Orders</th>
                          <th style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#374151", fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg/Order</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incomeData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #e5e7eb", background: idx % 2 === 0 ? "white" : "#f9fafb" }}>
                            <td style={{ padding: "14px 16px", color: "#1f2937", fontWeight: 600, borderRight: "1px solid #e5e7eb" }}>{item.label}</td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#f59e0b", fontSize: 15, borderRight: "1px solid #e5e7eb" }}>
                              ₱{item.income.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#3b82f6", fontSize: 15, borderRight: "1px solid #e5e7eb" }}>
                              {item.orderCount}
                            </td>
                            <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 600, color: "#6b7280" }}>
                              ₱{(item.orderCount > 0 ? item.income / item.orderCount : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ borderTop: "3px solid #e5e7eb", background: "#f8fafc" }}>
                          <td style={{ padding: "16px", fontWeight: 800, color: "#1f2937", fontSize: 15, borderRight: "1px solid #e5e7eb" }}>TOTAL</td>
                          <td style={{ padding: "16px", textAlign: "right", fontWeight: 800, color: "#10b981", fontSize: 16, borderRight: "1px solid #e5e7eb" }}>
                            ₱{incomeData.reduce((sum, item) => sum + item.income, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: "16px", textAlign: "right", fontWeight: 800, color: "#3b82f6", fontSize: 16, borderRight: "1px solid #e5e7eb" }}>
                            {incomeData.reduce((sum, item) => sum + item.orderCount, 0)}
                          </td>
                          <td style={{ padding: "16px", textAlign: "right", fontWeight: 700, color: "#6b7280", fontSize: 15 }}>
                            ₱{(incomeData.reduce((sum, item) => sum + item.orderCount, 0) > 0
                              ? incomeData.reduce((sum, item) => sum + item.income, 0) / incomeData.reduce((sum, item) => sum + item.orderCount, 0)
                              : 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{
                  textAlign: "center",
                  padding: 60,
                  color: "#6b7280",
                  background: "#f8fafc",
                  borderRadius: 12,
                  border: "2px dashed #e5e7eb"
                }}>
                  <svg width="64" height="64" fill="#9ca3af" viewBox="0 0 16 16" style={{ marginBottom: 16 }}>
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                  </svg>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginBottom: 8 }}>
                    No Data Available
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    No income data found for the selected period
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
