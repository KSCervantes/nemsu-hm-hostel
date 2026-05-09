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
  items: { quantity: number; unitPrice: string }[];
}

type OrderTrendFilter = "daily" | "7days" | "monthly" | "yearly";
type OrderTrendPeriod = {
  date: string;
  label: string;
  PENDING: number;
  ACCEPTED: number;
  COMPLETED: number;
  CANCELLED: number;
};

function PendingIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <g>
        <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" />
        <path d="M12,6a1,1,0,0,0-1,1v4.59L8.29,14.29a1,1,0,1,0,1.41,1.41l3-3A1,1,0,0,0,13,12V7A1,1,0,0,0,12,6Z" />
      </g>
    </svg>
  );
}

function ClipboardCheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="m9 14 2 2 4-4" />
    </svg>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ rooms: 32, bookings: 18, guests: 46, orders: 0 });
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [chartData, setChartData] = useState({
    statusCounts: { PENDING: 0, ACCEPTED: 0, COMPLETED: 0, CANCELLED: 0 },
    dailyOrders: [] as { date: string; count: number }[],
    dailyRevenue: [] as { date: string; revenue: number }[],
    totalRevenue: 0,
  });
  const [orderFilter, setOrderFilter] = useState<OrderTrendFilter>('7days');
  const [hoveredChart, setHoveredChart] = useState<{ chart: string; index: number } | null>(null);
  const filteredOrders = calculateFilteredOrders(orders, orderFilter);

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
    } catch {
      hasToken = false;
    }
    if (!hasToken) {
      router.push("/admin/login");
      return;
    }

    // Fetch actual dashboard metrics from API
    Promise.all([
      fetch("/api/dashboard/metrics").then(res => res.json()),
      fetch("/api/orders").then(res => res.json())
    ])
      .then(([metricsData, ordersData]) => {
        // Set stats with actual data
        if (metricsData.stats) {
          setStats(metricsData.stats);
        }

        // Set chart data with actual data
        if (metricsData.chartData) {
          setChartData(metricsData.chartData);
        }

        // Set orders
        if (Array.isArray(ordersData)) {
          setOrders(ordersData);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch dashboard data:", error);
        // Fallback: still fetch orders even if metrics fail
        fetch("/api/orders")
          .then(res => res.json())
          .then((data: OrderData[]) => {
            if (Array.isArray(data)) {
              setOrders(data);
            }
          });
      });
  }, [router]);

  // Function to calculate filtered orders based on selected time period
  function calculateFilteredOrders(data: OrderData[], filter: OrderTrendFilter): OrderTrendPeriod[] {
    const today = new Date();
    let periods: string[] = [];
    let formatLabel: (date: string) => string;

    if (filter === 'daily') {
      // Show today only
      periods = [today.toISOString().split('T')[0]];
      formatLabel = () => 'Today';
    } else if (filter === '7days') {
      // Last 7 days
      periods = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split('T')[0];
      });
      formatLabel = (date: string) => {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };
    } else if (filter === 'monthly') {
      // Last 12 months
      periods = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
        return d.toISOString().split('T')[0].substring(0, 7); // YYYY-MM format
      });
      formatLabel = (date: string) => {
        const [year, month] = date.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1);
        return d.toLocaleDateString('en-US', { month: 'short' });
      };
    } else {
      // Last 5 years
      periods = Array.from({ length: 5 }, (_, i) => String(today.getFullYear() - (4 - i)));
      formatLabel = (date: string) => date;
    }

    const filtered = periods.map((period) => {
      const periodOrders = data.filter((order) => {
        // Convert Firebase Timestamp to ISO string for comparison
        const dateObj = toDateObject(order.createdAt);
        if (!dateObj) return false;
        const dateStr = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format

        if (filter === 'monthly' || filter === 'yearly') {
          return dateStr.startsWith(period); // period is YYYY-MM or YYYY
        }
        return dateStr.startsWith(period); // period is YYYY-MM-DD
      });

      const statusBreakdown = {
        date: period,
        label: formatLabel(period),
        PENDING: periodOrders.filter(o => o.status === 'PENDING').length,
        ACCEPTED: periodOrders.filter(o => o.status === 'ACCEPTED').length,
        COMPLETED: periodOrders.filter(o => o.status === 'COMPLETED').length,
        CANCELLED: periodOrders.filter(o => o.status === 'CANCELLED').length,
      };

      return statusBreakdown;
    });

    return filtered;
  }

  const handleFilterChange = (filter: OrderTrendFilter) => {
    setOrderFilter(filter);
  };

  const formatCurrency = (value: number) =>
    `\u20b1${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatCompactCurrency = (value: number) =>
    `\u20b1${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value)}`;

  const maxDailyRevenue = Math.max(...chartData.dailyRevenue.map((day) => day.revenue), 1);
  const revenueTicks = [1, 0.75, 0.5, 0.25, 0].map((ratio) => maxDailyRevenue * ratio);

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Dashboard" subtitle="Monitor your business performance" breadcrumbs={["Home", "Dashboard"]} />
          <div style={{ padding: 32 }}>

          {/* Summary Stats Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20, marginBottom: 32 }}>
            {/* Total Orders Card - Primary */}
            <button type="button" onClick={() => router.push("/admin/orders")} style={{
              background: "#ffffff",
              padding: 28,
              borderRadius: 14,
              border: "2px solid #e5e7eb",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              transition: "transform 180ms ease, box-shadow 180ms ease"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(59, 130, 246, 0.14)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
              }}
              aria-label={`View all ${stats.orders} orders`}
            >
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Orders</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#3b82f6", marginBottom: 8 }}>{stats.orders}</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>All-time orders placed</div>
            </button>

            {/* Completed Orders - Success State */}
            <button type="button" onClick={() => router.push("/admin/Completed")} style={{
              background: "linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)",
              padding: 28,
              borderRadius: 14,
              border: "2px solid #10b981",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              transition: "transform 180ms ease, box-shadow 180ms ease"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(16, 185, 129, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.15)";
              }}
              aria-label={`View ${chartData.statusCounts.COMPLETED} completed orders`}
            >
              <div style={{ fontSize: 13, color: "#047857", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>✓ Completed</div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#059669", marginBottom: 8 }}>{chartData.statusCounts.COMPLETED}</div>
              <div style={{ fontSize: 12, color: "#047857", fontWeight: 500 }}>Successfully completed</div>
            </button>

            {/* Pending Orders - Warning State */}
            <button type="button" onClick={() => router.push("/admin/orders?status=PENDING")} style={{
              background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
              padding: 28,
              borderRadius: 14,
              border: "2px solid #f59e0b",
              boxShadow: "0 4px 12px rgba(245, 158, 11, 0.15)",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              transition: "transform 180ms ease, box-shadow 180ms ease"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(245, 158, 11, 0.22)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.15)";
              }}
              aria-label={`View ${chartData.statusCounts.PENDING} pending orders`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#92400e", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <PendingIcon size={16} />
                <span>Pending</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#d97706", marginBottom: 8 }}>{chartData.statusCounts.PENDING}</div>
              <div style={{ fontSize: 12, color: "#92400e", fontWeight: 500 }}>Awaiting confirmation</div>
            </button>

            {/* Accepted Orders - Active State */}
            <button type="button" onClick={() => router.push("/admin/orders?status=ACCEPTED")} style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)",
              padding: 28,
              borderRadius: 14,
              border: "2px solid #3b82f6",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
              cursor: "pointer",
              textAlign: "left",
              font: "inherit",
              transition: "transform 180ms ease, box-shadow 180ms ease"
            }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 10px 24px rgba(59, 130, 246, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.15)";
              }}
              aria-label={`View ${chartData.statusCounts.ACCEPTED} accepted orders`}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#1e40af", marginBottom: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                <ClipboardCheckIcon size={16} />
                <span>Accepted</span>
              </div>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#2563eb", marginBottom: 8 }}>{chartData.statusCounts.ACCEPTED}</div>
              <div style={{ fontSize: 12, color: "#1e40af", fontWeight: 500 }}>In preparation</div>
            </button>
          </section>

          {/* Analytics Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 32 }}>
            {/* Order Status Chart */}
            <div style={{ background: "white", padding: 28, borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>Order Status Overview</h3>
                <p style={{ margin: 0, fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Distribution of all orders by status</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 32, position: "relative" }}>
                {/* Donut Chart */}
                <div style={{ position: "relative", width: 140, height: 140, flexShrink: 0 }}>
                  <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="70" cy="70" r="60" fill="none" stroke="#f1f5f9" strokeWidth="20" />
                    <circle
                      cx="70"
                      cy="70"
                      r="60"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="20"
                      strokeDasharray={`${(chartData.statusCounts.PENDING / Math.max(stats.orders, 1)) * 377} 377`}
                      strokeDashoffset="0"
                      style={{ cursor: "pointer", transition: "opacity 0.2s", opacity: hoveredChart === null || hoveredChart.chart === "donut" && hoveredChart.index === 0 ? 1 : 0.5 }}
                      onMouseEnter={() => setHoveredChart({ chart: "donut", index: 0 })}
                      onMouseLeave={() => setHoveredChart(null)}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r="60"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray={`${(chartData.statusCounts.ACCEPTED / Math.max(stats.orders, 1)) * 377} 377`}
                      strokeDashoffset={`-${(chartData.statusCounts.PENDING / Math.max(stats.orders, 1)) * 377}`}
                      style={{ cursor: "pointer", transition: "opacity 0.2s", opacity: hoveredChart === null || hoveredChart.chart === "donut" && hoveredChart.index === 1 ? 1 : 0.5 }}
                      onMouseEnter={() => setHoveredChart({ chart: "donut", index: 1 })}
                      onMouseLeave={() => setHoveredChart(null)}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r="60"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="20"
                      strokeDasharray={`${(chartData.statusCounts.COMPLETED / Math.max(stats.orders, 1)) * 377} 377`}
                      strokeDashoffset={`-${((chartData.statusCounts.PENDING + chartData.statusCounts.ACCEPTED) / Math.max(stats.orders, 1)) * 377}`}
                      style={{ cursor: "pointer", transition: "opacity 0.2s", opacity: hoveredChart === null || hoveredChart.chart === "donut" && hoveredChart.index === 2 ? 1 : 0.5 }}
                      onMouseEnter={() => setHoveredChart({ chart: "donut", index: 2 })}
                      onMouseLeave={() => setHoveredChart(null)}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r="60"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="20"
                      strokeDasharray={`${(chartData.statusCounts.CANCELLED / Math.max(stats.orders, 1)) * 377} 377`}
                      strokeDashoffset={`-${((chartData.statusCounts.PENDING + chartData.statusCounts.ACCEPTED + chartData.statusCounts.COMPLETED) / Math.max(stats.orders, 1)) * 377}`}
                      style={{ cursor: "pointer", transition: "opacity 0.2s", opacity: hoveredChart === null || hoveredChart.chart === "donut" && hoveredChart.index === 3 ? 1 : 0.5 }}
                      onMouseEnter={() => setHoveredChart({ chart: "donut", index: 3 })}
                      onMouseLeave={() => setHoveredChart(null)}
                    />
                  </svg>

                  {/* Tooltip for Donut */}
                  {hoveredChart?.chart === "donut" && (
                    <div style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "#1e293b",
                      color: "white",
                      padding: "12px 16px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      textAlign: "center"
                    }}>
                      {hoveredChart.index === 0 && `Pending: ${chartData.statusCounts.PENDING}`}
                      {hoveredChart.index === 1 && `Accepted: ${chartData.statusCounts.ACCEPTED}`}
                      {hoveredChart.index === 2 && `Completed: ${chartData.statusCounts.COMPLETED}`}
                      {hoveredChart.index === 3 && `Cancelled: ${chartData.statusCounts.CANCELLED}`}
                    </div>
                  )}
                </div>
                {/* Legend */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    onMouseEnter={() => setHoveredChart({ chart: "donut", index: 0 })}
                    onMouseLeave={() => setHoveredChart(null)}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontSize: 14, color: "#64748b" }}>Pending</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{chartData.statusCounts.PENDING}</span>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    onMouseEnter={() => setHoveredChart({ chart: "donut", index: 1 })}
                    onMouseLeave={() => setHoveredChart(null)}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#3b82f6", flexShrink: 0 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontSize: 14, color: "#64748b" }}>Accepted</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{chartData.statusCounts.ACCEPTED}</span>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    onMouseEnter={() => setHoveredChart({ chart: "donut", index: 2 })}
                    onMouseLeave={() => setHoveredChart(null)}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981", flexShrink: 0 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontSize: 14, color: "#64748b" }}>Completed</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{chartData.statusCounts.COMPLETED}</span>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
                    onMouseEnter={() => setHoveredChart({ chart: "donut", index: 3 })}
                    onMouseLeave={() => setHoveredChart(null)}
                  >
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontSize: 14, color: "#64748b" }}>Cancelled</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{chartData.statusCounts.CANCELLED}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Orders Chart */}
            <div style={{ background: "white", padding: 28, borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>Order Trends</h3>
                <p style={{ margin: "0 0 16px 0", fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Track order volume over time</p>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <div></div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    onClick={() => handleFilterChange('daily')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: orderFilter === 'daily' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: orderFilter === 'daily' ? "#eff6ff" : "white",
                      color: orderFilter === 'daily' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => handleFilterChange('7days')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: orderFilter === '7days' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: orderFilter === '7days' ? "#eff6ff" : "white",
                      color: orderFilter === '7days' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleFilterChange('monthly')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: orderFilter === 'monthly' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: orderFilter === 'monthly' ? "#eff6ff" : "white",
                      color: orderFilter === 'monthly' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => handleFilterChange('yearly')}
                    style={{
                      padding: "10px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      border: orderFilter === 'yearly' ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: orderFilter === 'yearly' ? "#eff6ff" : "white",
                      color: orderFilter === 'yearly' ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Yearly
                  </button>
                </div>
                <div></div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: orderFilter === 'monthly' ? 8 : orderFilter === 'yearly' ? 14 : 12, height: 220, justifyContent: "space-around", padding: "0 8px", marginTop: 20, position: "relative" }}>
                {filteredOrders.map((period, idx) => {
                  const maxCount = Math.max(...filteredOrders.map((p) => p.PENDING + p.ACCEPTED + p.COMPLETED + p.CANCELLED), 1);
                  const statuses = [
                    { key: 'CANCELLED', value: period.CANCELLED, color: '#ef4444' },
                    { key: 'PENDING', value: period.PENDING, color: '#f59e0b' },
                    { key: 'ACCEPTED', value: period.ACCEPTED, color: '#3b82f6' },
                    { key: 'COMPLETED', value: period.COMPLETED, color: '#10b981' },
                  ];

                  return (
                    <div
                      key={idx}
                      style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, position: "relative" }}
                      onMouseEnter={() => setHoveredChart({ chart: "orders", index: idx })}
                      onMouseLeave={() => setHoveredChart(null)}
                    >
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 180, width: "100%" }}>
                        {statuses.map((status) => {
                          const height = (status.value / maxCount) * 100;
                          return (
                            <div
                              key={status.key}
                              style={{
                                flex: 1,
                                height: `${height}%`,
                                minHeight: status.value > 0 ? 20 : 3,
                                background: status.value > 0 ? status.color : "#f1f5f9",
                                borderRadius: "3px 3px 0 0",
                                position: "relative",
                                cursor: "pointer",
                                transition: "opacity 0.2s",
                                opacity: hoveredChart === null || hoveredChart.chart === "orders" && hoveredChart.index === idx ? 1 : 0.4
                              }}
                            />
                          );
                        })}
                      </div>

                      {/* Tooltip for Orders */}
                      {hoveredChart?.chart === "orders" && hoveredChart.index === idx && (
                        <div style={{
                          position: "absolute",
                          bottom: 200,
                          left: "50%",
                          transform: "translateX(-50%)",
                          background: "#1e293b",
                          color: "white",
                          padding: "12px 16px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          zIndex: 10,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        }}>
                          <div style={{ marginBottom: 4 }}>Total: {period.PENDING + period.ACCEPTED + period.COMPLETED + period.CANCELLED}</div>
                          <div style={{ color: "#f59e0b", marginBottom: 2 }}>Pending: {period.PENDING}</div>
                          <div style={{ color: "#3b82f6", marginBottom: 2 }}>Accepted: {period.ACCEPTED}</div>
                          <div style={{ color: "#10b981", marginBottom: 2 }}>Completed: {period.COMPLETED}</div>
                          <div style={{ color: "#ef4444" }}>Cancelled: {period.CANCELLED}</div>
                        </div>
                      )}

                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500, textAlign: "center", marginTop: 8 }}>
                        {period.label || new Date(period.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#ef4444" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Cancelled</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#f59e0b" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Pending</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#3b82f6" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Accepted</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: "#10b981" }} />
                  <span style={{ fontSize: 12, color: "#64748b" }}>Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div style={{ background: "white", padding: 28, borderRadius: 14, border: "1px solid #e5e7eb", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700, color: "#1f2937" }}>Revenue Performance</h3>
              <p style={{ margin: 0, fontSize: 14, color: "#6b7280", fontWeight: 500 }}>Daily income tracking</p>
            </div>
            <div style={{ position: "relative", height: 250 }}>
              {chartData.dailyRevenue.length > 0 ? (
                <div style={{ position: "relative", height: "100%", padding: "8px 0 32px 58px", boxSizing: "border-box" }}>
                  <div style={{
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 32,
                    width: 46,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                  }}>
                    {revenueTicks.map((tick, idx) => (
                      <span key={idx} style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700 }}>
                        {formatCompactCurrency(tick)}
                      </span>
                    ))}
                  </div>

                  <div style={{
                    position: "absolute",
                    left: 58,
                    right: 0,
                    top: 8,
                    bottom: 32,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    pointerEvents: "none",
                  }}>
                    {revenueTicks.map((_, idx) => (
                      <div
                        key={idx}
                        style={{
                          height: 1,
                          background: idx === revenueTicks.length - 1 ? "#cbd5e1" : "#eef2f7",
                        }}
                      />
                    ))}
                  </div>

                  <div style={{
                    position: "relative",
                    display: "grid",
                    gridTemplateColumns: `repeat(${chartData.dailyRevenue.length}, minmax(42px, 1fr))`,
                    gap: 14,
                    height: "100%",
                    zIndex: 1,
                  }}>
                    {chartData.dailyRevenue.map((day, idx) => {
                      const percentage = maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0;
                      const isHovered = hoveredChart?.chart === "revenue" && hoveredChart.index === idx;
                      const hasRevenue = day.revenue > 0;

                      return (
                        <div
                          key={idx}
                          style={{
                            position: "relative",
                            minWidth: 0,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          {isHovered && (
                            <div style={{
                              position: "absolute",
                              top: -6,
                              left: "50%",
                              transform: "translate(-50%, -100%)",
                              background: "#0f172a",
                              color: "white",
                              padding: "8px 10px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 700,
                              whiteSpace: "nowrap",
                              zIndex: 3,
                              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.22)",
                            }}>
                              {formatCurrency(day.revenue)}
                            </div>
                          )}

                          <div style={{
                            flex: 1,
                            width: "100%",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            paddingTop: 14,
                          }}>
                            <button
                              type="button"
                              aria-label={`Revenue for ${new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${formatCurrency(day.revenue)}`}
                              onMouseEnter={() => setHoveredChart({ chart: "revenue", index: idx })}
                              onMouseLeave={() => setHoveredChart(null)}
                              style={{
                                width: "min(54px, 72%)",
                                height: hasRevenue ? `${Math.max(percentage, 8)}%` : 4,
                                border: 0,
                                borderRadius: hasRevenue ? "10px 10px 4px 4px" : 999,
                                background: hasRevenue
                                  ? "linear-gradient(180deg, #34d399 0%, #10b981 52%, #059669 100%)"
                                  : "#e2e8f0",
                                boxShadow: hasRevenue
                                  ? "0 12px 22px rgba(16, 185, 129, 0.22)"
                                  : "none",
                                cursor: "pointer",
                                transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                                transition: "height 0.25s ease, transform 0.2s ease, box-shadow 0.2s ease",
                              }}
                            />
                          </div>

                          <div style={{
                            height: 28,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "center",
                            fontSize: 11,
                            color: "#64748b",
                            fontWeight: 700,
                            textAlign: "center",
                            whiteSpace: "nowrap",
                          }}>
                            {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 14 }}>
                  No revenue data available
                </div>
              )}
            </div>
            <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Total Revenue</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#10b981", marginBottom: 4 }}>
                  ₱{chartData.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>All-time income</div>
              </div>
              <div style={{ padding: 20, background: "#f8fafc", borderRadius: 12, border: "1px solid #e5e7eb" }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Avg Order Value</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#3b82f6", marginBottom: 4 }}>
                  ₱{chartData.statusCounts.COMPLETED > 0
                    ? (chartData.totalRevenue / chartData.statusCounts.COMPLETED).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "0.00"}
                </div>
                <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Per completed order</div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}
