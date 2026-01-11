"use client";

import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import { useRouter } from "next/navigation";

interface OrderData {
  id: number;
  status: string;
  createdAt: string;
  items: { quantity: number; unitPrice: string }[];
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
  const [orderFilter, setOrderFilter] = useState<'daily' | '7days' | 'monthly'>('7days');
  const [filteredOrders, setFilteredOrders] = useState<{ date: string; label: string; PENDING: number; ACCEPTED: number; COMPLETED: number; CANCELLED: number }[]>([]);
  const [hoveredChart, setHoveredChart] = useState<{ chart: string; index: number } | null>(null);

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

    // Fetch orders and calculate analytics
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data: OrderData[]) => {
        if (Array.isArray(data)) {
          setOrders(data);
          setStats((prev) => ({ ...prev, orders: data.length }));

          // Calculate status counts
          const statusCounts = { PENDING: 0, ACCEPTED: 0, COMPLETED: 0, CANCELLED: 0 };
          data.forEach((order) => {
            if (order.status in statusCounts) {
              statusCounts[order.status as keyof typeof statusCounts]++;
            }
          });

          // Calculate daily orders (last 7 days)
          const today = new Date();
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            return d.toISOString().split("T")[0];
          });

          const dailyOrders = last7Days.map((date) => ({
            date,
            count: data.filter((order) => order.createdAt.startsWith(date)).length,
          }));

          // Calculate daily revenue for last 7 days
          const dailyRevenue = last7Days.map((date) => {
            const dayRevenue = data
              .filter((order) => order.status === "COMPLETED" && order.createdAt.startsWith(date))
              .reduce((sum, order) => {
                const orderTotal = order.items.reduce(
                  (itemSum, item) => itemSum + item.quantity * parseFloat(item.unitPrice),
                  0
                );
                return sum + orderTotal;
              }, 0);
            return { date, revenue: dayRevenue };
          });

          // Calculate total revenue
          const totalRevenue = data
            .filter((order) => order.status === "COMPLETED")
            .reduce((sum, order) => {
              const orderTotal = order.items.reduce(
                (itemSum, item) => itemSum + item.quantity * parseFloat(item.unitPrice),
                0
              );
              return sum + orderTotal;
            }, 0);

          setChartData({ statusCounts, dailyOrders, dailyRevenue, totalRevenue });

          // Calculate filtered orders data (initially 7 days)
          calculateFilteredOrders(data, '7days');
        }
      })
      .catch(() => {});
  }, [router]);

  // Function to calculate filtered orders based on selected time period
  const calculateFilteredOrders = (data: OrderData[], filter: 'daily' | '7days' | 'monthly') => {
    const today = new Date();
    let periods: string[] = [];
    let formatLabel: (date: string) => string;

    if (filter === 'daily') {
      // Show today only
      periods = [today.toISOString().split('T')[0]];
      formatLabel = (date: string) => 'Today';
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
    } else {
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
    }

    const filtered = periods.map((period) => {
      const periodOrders = data.filter((order) => {
        if (filter === 'monthly') {
          return order.createdAt.startsWith(period);
        }
        return order.createdAt.startsWith(period);
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

    setFilteredOrders(filtered);
  };

  const handleFilterChange = (filter: 'daily' | '7days' | 'monthly') => {
    setOrderFilter(filter);
    calculateFilteredOrders(orders, filter);
  };

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Dashboard" subtitle="Monitor your business performance" breadcrumbs={["Home", "Dashboard"]} />
          <div style={{ padding: 32 }}>

          {/* Stats Cards */}
          <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
            <StatCard label="Total Orders" value={stats.orders} />
            <StatCard label="Pending Orders" value={chartData.statusCounts.PENDING} />
            <StatCard label="Accepted Orders" value={chartData.statusCounts.ACCEPTED} />
            <StatCard label="Completed Orders" value={chartData.statusCounts.COMPLETED} />
          </section>

          {/* Analytics Charts */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 32 }}>
            {/* Order Status Chart */}
            <div style={{ background: "white", padding: 20, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <h3 style={{ margin: "0 0 20px 0", fontSize: 16, fontWeight: 600, color: "#1e293b" }}>Order Status Distribution</h3>
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
            <div style={{ background: "white", padding: 20, borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>Orders</h3>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleFilterChange('daily')}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: orderFilter === 'daily' ? "#2563eb" : "white",
                      color: orderFilter === 'daily' ? "white" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => handleFilterChange('7days')}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: orderFilter === '7days' ? "#2563eb" : "white",
                      color: orderFilter === '7days' ? "white" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => handleFilterChange('monthly')}
                    style={{
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: 500,
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      background: orderFilter === 'monthly' ? "#2563eb" : "white",
                      color: orderFilter === 'monthly' ? "white" : "#64748b",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: orderFilter === 'monthly' ? 8 : 12, height: 220, justifyContent: "space-around", padding: "0 8px", marginTop: 20, position: "relative" }}>
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
          <div style={{ background: "white", padding: 20, borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1e293b" }}>Revenue</h3>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: 13, color: "#64748b" }}>Income</span>
                </div>
              </div>
            </div>
            <div style={{ position: "relative", height: 200 }}>
              {chartData.dailyRevenue.length > 0 ? (
                <>
                  <svg width="100%" height="200" style={{ overflow: "visible" }} viewBox="0 0 100 200" preserveAspectRatio="none">
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={i * 40}
                        x2="100"
                        y2={i * 40}
                        stroke="#f1f5f9"
                        strokeWidth="0.3"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    {/* Revenue line (green) */}
                    <polyline
                      points={chartData.dailyRevenue.map((day, idx) => {
                        const x = (idx / Math.max(chartData.dailyRevenue.length - 1, 1)) * 100;
                        const maxRevenue = Math.max(...chartData.dailyRevenue.map(d => d.revenue), 1);
                        const y = 180 - ((day.revenue / maxRevenue) * 160);
                        return `${x},${y}`;
                      }).join(" ")}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* Data points with hover */}
                    {chartData.dailyRevenue.map((day, idx) => {
                      const x = (idx / Math.max(chartData.dailyRevenue.length - 1, 1)) * 100;
                      const maxRevenue = Math.max(...chartData.dailyRevenue.map(d => d.revenue), 1);
                      const y = 180 - ((day.revenue / maxRevenue) * 160);
                      return (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r="1.2"
                          fill="#10b981"
                          vectorEffect="non-scaling-stroke"
                          style={{ cursor: "pointer" }}
                          onMouseEnter={() => setHoveredChart({ chart: "revenue", index: idx })}
                          onMouseLeave={() => setHoveredChart(null)}
                        />
                      );
                    })}
                  </svg>

                  {/* Tooltip for Revenue */}
                  {hoveredChart?.chart === "revenue" && hoveredChart.index !== undefined && (
                    <div style={{
                      position: "absolute",
                      top: -50,
                      left: `${(hoveredChart.index / Math.max(chartData.dailyRevenue.length - 1, 1)) * 100}%`,
                      transform: "translateX(-50%)",
                      background: "#1e293b",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      zIndex: 10,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    }}>
                      ₱{chartData.dailyRevenue[hoveredChart.index]?.revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 14 }}>
                  No revenue data available
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingLeft: 8, paddingRight: 8 }}>
              {chartData.dailyRevenue.map((day, idx) => (
                <span key={idx} style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, textAlign: "center", flex: 1 }}>
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 16, background: "#f9fafb", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Total Revenue</div>
                <div style={{ fontSize: 24, fontWeight: 600, color: "#1e293b" }}>
                  ₱{chartData.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>Avg Order Value</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: "#1e293b" }}>
                  ₱{chartData.statusCounts.COMPLETED > 0
                    ? (chartData.totalRevenue / chartData.statusCounts.COMPLETED).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : "0.00"}
                </div>
              </div>
            </div>
          </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number | string; icon?: string; gradient?: string }) {
  return (
    <div style={{
      background: "white",
      padding: 20,
      borderRadius: 8,
      minWidth: 180,
      border: "1px solid #e2e8f0"
    }}>
      <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 600, color: "#1e293b" }}>{value}</div>
    </div>
  );
}

function BarItem({ label, value, max, color }: { label: string; value: number; max: number; color: string; emoji?: string }) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontWeight: 500, fontSize: 14, color: "#475569" }}>{label}</span>
        <span style={{ color: "#64748b", fontWeight: 600, fontSize: 14 }}>{value}</span>
      </div>
      <div style={{ background: "#f1f5f9", borderRadius: 4, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${percentage}%`, height: "100%", background: color, borderRadius: 4 }} />
      </div>
    </div>
  );
}
