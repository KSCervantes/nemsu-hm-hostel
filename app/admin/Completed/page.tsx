"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import PageSearch from "../components/PageSearch";
import Swal from "sweetalert2";
import { formatDate, formatDateOnly, toDateObject } from "@/lib/date-utils";

type OrderItem = {
  id: number;
  foodId?: string;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  notes?: string;
  menuItemMissing?: boolean;
};

type Order = {
  id: number;
  uid?: string;
  customer: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  desiredAt?: string;
  orderType?: 'DELIVERY' | 'PICKUP';
  total: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

const monthOptions = Array.from({ length: 12 }, (_, month) => ({
  value: month,
  label: new Date(2024, month, 1).toLocaleDateString('en-US', { month: 'long' }),
}));

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeeksInMonth(year: number, month: number): DateRange[] {
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
  const weeks: DateRange[] = [];
  let weekStart = new Date(monthStart);

  while (weekStart <= monthEnd) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    if (weekEnd > monthEnd) {
      weekEnd.setTime(monthEnd.getTime());
    }

    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    });

    weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() + 1);
    weekStart.setHours(0, 0, 0, 0);
  }

  return weeks;
}

function getSelectedDateRange(
  filterType: FilterType,
  selectedYear: number,
  selectedMonth: number,
  selectedDay: number,
  selectedWeek: number
): DateRange | null {
  if (filterType === 'all') {
    return null;
  }

  if (filterType === 'daily') {
    const date = new Date(selectedYear, selectedMonth, selectedDay, 0, 0, 0, 0);
    return {
      start: date,
      end: new Date(selectedYear, selectedMonth, selectedDay, 23, 59, 59, 999),
      label: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
  }

  if (filterType === 'weekly') {
    const weeks = getWeeksInMonth(selectedYear, selectedMonth);
    return weeks[selectedWeek] || weeks[0] || null;
  }

  if (filterType === 'monthly') {
    const start = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);
    return {
      start,
      end: new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999),
      label: start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  }

  return {
    start: new Date(selectedYear, 0, 1, 0, 0, 0, 0),
    end: new Date(selectedYear, 11, 31, 23, 59, 59, 999),
    label: selectedYear.toString(),
  };
}

function getReportScope(filterType: FilterType, range: DateRange | null) {
  if (filterType === 'all' || !range) {
    return 'All completed orders';
  }

  return `${filterOptions.find((option) => option.value === filterType)?.label ?? 'Selected'} view for ${range.label}`;
}

function getFilenameScope(filterType: FilterType, range: DateRange | null) {
  if (filterType === 'all' || !range) {
    return 'all-time';
  }

  return `${filterType}-${range.label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function getItemDisplayName(item: OrderItem) {
  return item.menuItemMissing ? "Removed menu item" : item.name;
}

function getItemAuditNote(item: OrderItem) {
  return item.menuItemMissing ? `Saved as: ${item.name}` : item.notes ? `Note: ${item.notes}` : "";
}

export default function CompletedPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDate());
  const [selectedWeek, setSelectedWeek] = useState(0);

  const navItems = [
    { label: "Dashboard", href: "/admin/Dashboard" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Food Menu", href: "/admin/food-menu" },
    { label: "Archive", href: "/admin/archive" },
    { label: "Completed", href: "/admin/Completed" },
    { label: "Income", href: "/admin/Income" },
  ];

  function updateSearchTerm(value: string) {
    setSearchTerm(value);
    setCurrentPage(1);

    const params = new URLSearchParams(window.location.search);
    const hasSearch = value.trim().length > 0;

    if (hasSearch) {
      params.set("search", value);
    } else {
      params.delete("search");
    }

    const query = params.toString();
    router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    window.dispatchEvent(new CustomEvent("admin-search-change", { detail: { search: hasSearch ? value : "" } }));
  }

  useEffect(() => {
    function syncSearchFromUrl() {
      setSearchTerm(new URLSearchParams(window.location.search).get("search") ?? "");
      setCurrentPage(1);
    }

    function handleAdminSearch(event: Event) {
      if (event instanceof CustomEvent && typeof event.detail?.search === "string") {
        setSearchTerm(event.detail.search);
        setCurrentPage(1);
      }
    }

    syncSearchFromUrl();
    window.addEventListener("popstate", syncSearchFromUrl);
    window.addEventListener("admin-search-change", handleAdminSearch);

    return () => {
      window.removeEventListener("popstate", syncSearchFromUrl);
      window.removeEventListener("admin-search-change", handleAdminSearch);
    };
  }, []);

  const fetchCompletedOrders = useCallback(() => {
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        // Filter only completed orders
        const completed = Array.isArray(data)
          ? data.filter((order: Order) => order.status === 'COMPLETED')
          : [];
        setOrders(completed);
        setLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setLoading(false);
      });
  }, []);

  const weeksInSelectedMonth = useMemo(
    () => getWeeksInMonth(selectedYear, selectedMonth),
    [selectedMonth, selectedYear]
  );
  const daysInSelectedMonth = useMemo(
    () => getDaysInMonth(selectedYear, selectedMonth),
    [selectedMonth, selectedYear]
  );
  const effectiveSelectedDay = Math.min(selectedDay, daysInSelectedMonth);
  const effectiveSelectedWeek = Math.min(selectedWeek, Math.max(weeksInSelectedMonth.length - 1, 0));

  const selectedDateRange = useMemo(
    () => getSelectedDateRange(filterType, selectedYear, selectedMonth, effectiveSelectedDay, effectiveSelectedWeek),
    [effectiveSelectedDay, effectiveSelectedWeek, filterType, selectedMonth, selectedYear]
  );

  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<number>();

    for (let year = currentYear - 8; year <= currentYear + 1; year += 1) {
      years.add(year);
    }

    orders.forEach((order) => {
      const orderDate = toDateObject(order.createdAt);
      if (orderDate) {
        years.add(orderDate.getFullYear());
      }
    });

    years.add(selectedYear);
    return Array.from(years).sort((a, b) => b - a);
  }, [orders, selectedYear]);

  const reportDescription = getReportScope(filterType, selectedDateRange);
  const filenameScope = getFilenameScope(filterType, selectedDateRange);

  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    if (selectedDateRange) {
      filtered = filtered.filter(order => {
        const orderDate = toDateObject(order.createdAt);
        return orderDate ? orderDate >= selectedDateRange.start && orderDate <= selectedDateRange.end : false;
      });
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.uid?.toLowerCase().includes(term) ||
        order.customer?.toLowerCase().includes(term) ||
        order.contactNumber?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term) ||
        order.id.toString().includes(term)
      );
    }

    return filtered;
  }, [orders, searchTerm, selectedDateRange]);

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

    fetchCompletedOrders();
  }, [fetchCompletedOrders, router]);

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Completed Orders Report</title>
          <style>
            @media print {
              @page { margin: 1cm; }
            }
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            h1 {
              text-align: center;
              color: #333;
              margin-bottom: 30px;
            }
            .filter-info {
              text-align: center;
              margin-bottom: 20px;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f97316;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total-row {
              font-weight: bold;
              background-color: #fff3e0;
            }
            .summary {
              margin-top: 30px;
              padding: 15px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            .logo {
              max-width: 150px;
              height: auto;
              margin: 0 auto 20px;
              display: block;
            }
            .header-section {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #ddd;
              padding-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header-section">
            <img src="/img/NEMSU.png" alt="NEMSU Logo" class="logo" />
            <h1>Completed Orders Report</h1>
            <p style="margin: 5px 0; color: #666;">North Eastern Mindanao State University</p>
            <p style="margin: 5px 0; color: #666;">Hotel Management System</p>
          </div>
          <div class="filter-info">
            Filter: ${reportDescription} |
            Total Orders: ${filteredOrders.length} |
            Generated: ${new Date().toLocaleString()}
          </div>
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Items</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredOrders.map(order => `
                <tr>
                  <td>${order.uid || order.id}</td>
                  <td>${formatDateOnly(order.createdAt)}</td>
                  <td>${order.customer || 'N/A'}</td>
                  <td>${order.contactNumber || 'N/A'}</td>
                  <td>${order.items.map(item => `${getItemDisplayName(item)} (x${item.quantity})${item.menuItemMissing ? ` [${getItemAuditNote(item)}]` : ''}`).join(', ')}</td>
                  <td>₱${parseFloat(order.total).toFixed(2)}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">Total Revenue:</td>
                <td>₱${filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="summary">
            <strong>Summary:</strong><br>
            Total Orders: ${filteredOrders.length}<br>
            Total Revenue: ₱${filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0).toFixed(2)}<br>
            Average Order Value: ₱${filteredOrders.length > 0 ? (filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0) / filteredOrders.length).toFixed(2) : '0.00'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }

  function handleExportExcel() {
    // Create CSV content (Excel can open CSV files)
    const headers = ['Order ID', 'Date', 'Customer', 'Contact', 'Email', 'Address', 'Order Type', 'Items', 'Quantity', 'Unit Price', 'Line Total', 'Total'];

    const rows = filteredOrders.flatMap(order => {
      if (order.items.length === 0) {
        return [[
          order.uid || order.id,
          formatDateOnly(order.createdAt),
          order.customer || '',
          order.contactNumber || '',
          order.email || '',
          order.address || '',
          order.orderType || '',
          '',
          '',
          '',
          '',
          parseFloat(order.total).toFixed(2)
        ]];
      }

      return order.items.map((item, index) => [
        index === 0 ? (order.uid || order.id) : '',
        index === 0 ? formatDateOnly(order.createdAt) : '',
        index === 0 ? (order.customer || '') : '',
        index === 0 ? (order.contactNumber || '') : '',
        index === 0 ? (order.email || '') : '',
        index === 0 ? (order.address || '') : '',
        index === 0 ? (order.orderType || '') : '',
        item.menuItemMissing ? `${getItemDisplayName(item)} (${getItemAuditNote(item)})` : item.name,
        item.quantity,
        parseFloat(item.unitPrice).toFixed(2),
        parseFloat(item.lineTotal).toFixed(2),
        index === 0 ? parseFloat(order.total).toFixed(2) : ''
      ]);
    });

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `completed-orders-${filenameScope}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      icon: 'success',
      title: 'Export Successful',
      text: `Exported ${filteredOrders.length} completed orders to CSV file.`,
      timer: 2000,
      showConfirmButton: false
    });
  }

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar items={navItems} />

      <main style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
        <AdminHeader title="Completed Orders" subtitle="View and manage completed food orders" breadcrumbs={["Home", "Orders", "Completed"]} />
        <div style={{ padding: 32 }}>

        {/* Filters and Actions */}
        <div
          style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <PageSearch
                ariaLabel="Search completed orders"
                placeholder="Search completed orders by ID, customer, contact, or email..."
                value={searchTerm}
                onChange={updateSearchTerm}
                onClear={() => updateSearchTerm("")}
                resultCount={filteredOrders.length}
                resultLabel="order"
                marginBottom={0}
                maxWidth="100%"
              />
            </div>
            <button
              onClick={handlePrint}
              style={{
                padding: "10px 20px",
                background: "#3b82f6",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🖨️ Print
            </button>
            <button
              onClick={handleExportExcel}
              style={{
                padding: "10px 20px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              📊 Export Excel
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                View By
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: "10px 16px",
                      fontSize: 14,
                      fontWeight: 600,
                      border: filterType === option.value ? "2px solid #3b82f6" : "1px solid #e5e7eb",
                      borderRadius: 10,
                      background: filterType === option.value ? "#eff6ff" : "white",
                      color: filterType === option.value ? "#3b82f6" : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filterType === 'daily' && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Day
                </label>
                <select
                  aria-label="Select day"
                  value={effectiveSelectedDay}
                  onChange={(event) => {
                    setSelectedDay(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    minWidth: 90,
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "white",
                    color: "#1f2937",
                    cursor: "pointer",
                  }}
                >
                  {Array.from({ length: daysInSelectedMonth }, (_, day) => day + 1).map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType === 'weekly' && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Week
                </label>
                <select
                  aria-label="Select week"
                  value={effectiveSelectedWeek}
                  onChange={(event) => {
                    setSelectedWeek(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    minWidth: 190,
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "white",
                    color: "#1f2937",
                    cursor: "pointer",
                  }}
                >
                  {weeksInSelectedMonth.map((week, index) => (
                    <option key={`${week.start.toISOString()}-${index}`} value={index}>
                      Week {index + 1}: {week.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType !== 'all' && filterType !== 'yearly' && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Month
                </label>
                <select
                  aria-label="Select month"
                  value={selectedMonth}
                  onChange={(event) => {
                    setSelectedMonth(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    minWidth: 150,
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "white",
                    color: "#1f2937",
                    cursor: "pointer",
                  }}
                >
                  {monthOptions.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filterType !== 'all' && (
              <div>
                <label style={{ display: "block", fontSize: 12, color: "#6b7280", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Year
                </label>
                <select
                  aria-label="Select year"
                  value={selectedYear}
                  onChange={(event) => {
                    setSelectedYear(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                  style={{
                    minWidth: 110,
                    padding: "10px 12px",
                    border: "1px solid #d1d5db",
                    borderRadius: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "white",
                    color: "#1f2937",
                    cursor: "pointer",
                  }}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ minWidth: 220, paddingBottom: 3 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Showing
              </div>
              <div style={{ fontSize: 14, color: "#1f2937", fontWeight: 700 }}>
                {reportDescription}
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div style={{ padding: 16, background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
              <div style={{ fontSize: 12, color: "#0369a1", marginBottom: 4 }}>Total Orders</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0c4a6e" }}>{filteredOrders.length}</div>
            </div>
            <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: 12, color: "#166534", marginBottom: 4 }}>Total Revenue</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#14532d" }}>₱{totalRevenue.toFixed(2)}</div>
            </div>
            <div style={{ padding: 16, background: "#fef3c7", borderRadius: 8, border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 12, color: "#92400e", marginBottom: 4 }}>Average Order</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#78350f" }}>
                ₱{filteredOrders.length > 0 ? (totalRevenue / filteredOrders.length).toFixed(2) : '0.00'}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>Loading completed orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 40,
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ fontSize: 18, color: "#6b7280", marginBottom: 8 }}>
              No completed orders found
            </div>
            <div style={{ fontSize: 14, color: "#9ca3af" }}>
              {searchTerm ? "Try adjusting your search terms" : "Orders will appear here once they are completed"}
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>
                      Order ID
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>
                      Date
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>
                      Customer
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>
                      Contact
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: 13, fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>
                      Items
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "right", fontSize: 13, fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>
                      Total
                    </th>
                    <th style={{ padding: "14px 16px", textAlign: "center", fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((order) => (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: "1px solid #e5e7eb",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#fff";
                      }}
                    >
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#1f2937", borderRight: "1px solid #e5e7eb" }}>
                        <span style={{ fontWeight: 600 }}>{order.uid || `ORD${String(order.id).padStart(6, '0')}`}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}>
                        {formatDateOnly(order.createdAt)}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#1f2937", borderRight: "1px solid #e5e7eb" }}>
                        {order.customer || "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}>
                        {order.contactNumber || "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {order.items.slice(0, 2).map((item) => (
                            <span key={item.id}>
                              {getItemDisplayName(item)} (x{item.quantity})
                              {item.menuItemMissing && (
                                <span style={{ display: "block", color: "#9ca3af", fontSize: 12 }}>
                                  {getItemAuditNote(item)}
                                </span>
                              )}
                            </span>
                          ))}
                          {order.items.length > 2 && (
                            <span style={{ color: "#9ca3af", fontSize: 12 }}>
                              +{order.items.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600, color: "#10b981", textAlign: "right", borderRight: "1px solid #e5e7eb" }}>
                        ₱{parseFloat(order.total).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={{
                            padding: "6px 12px",
                            background: "#3b82f6",
                            color: "#fff",
                            border: "none",
                            borderRadius: 4,
                            cursor: "pointer",
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 16px",
                      background: currentPage === 1 ? "#f3f4f6" : "#fff",
                      color: currentPage === 1 ? "#9ca3af" : "#374151",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: 14,
                    }}
                  >
                    Previous
                  </button>
                  <div style={{ padding: "8px 16px", fontSize: 14, color: "#6b7280" }}>
                    Page {currentPage} of {totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 16px",
                      background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                      color: currentPage === totalPages ? "#9ca3af" : "#374151",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: 14,
                    }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Order Detail Modal */}
        {selectedOrder && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: 20,
            }}
            onClick={() => setSelectedOrder(null)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                padding: 24,
                maxWidth: 600,
                width: "100%",
                maxHeight: "90vh",
                overflow: "auto",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 20, color: "#1f2937" }}>
                  Order Details - {selectedOrder.uid || `ORD${String(selectedOrder.id).padStart(6, '0')}`}
                </h2>
                <button
                  aria-label="Close order details"
                  onClick={() => setSelectedOrder(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 24,
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Customer</div>
                  <div style={{ fontSize: 14, color: "#1f2937" }}>{selectedOrder.customer || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Contact</div>
                  <div style={{ fontSize: 14, color: "#1f2937" }}>{selectedOrder.contactNumber || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Email</div>
                  <div style={{ fontSize: 14, color: "#1f2937" }}>{selectedOrder.email || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Address</div>
                  <div style={{ fontSize: 14, color: "#1f2937" }}>{selectedOrder.address || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Order Type</div>
                  <div style={{ fontSize: 14, color: "#1f2937" }}>{selectedOrder.orderType || "N/A"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Date</div>
                  <div style={{ fontSize: 14, color: "#1f2937" }}>
                    {formatDate(selectedOrder.createdAt)}
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>Items</div>
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f9fafb" }}>
                          <th style={{ padding: "8px 12px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                            Item
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "center", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                            Qty
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                            Price
                          </th>
                          <th style={{ padding: "8px 12px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#6b7280" }}>
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} style={{ borderTop: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "8px 12px", fontSize: 14, color: "#1f2937" }}>
                              {getItemDisplayName(item)}
                              {getItemAuditNote(item) && (
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                                  {getItemAuditNote(item)}
                                </div>
                              )}
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 14, color: "#6b7280", textAlign: "center" }}>
                              {item.quantity}
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 14, color: "#6b7280", textAlign: "right" }}>
                              ₱{parseFloat(item.unitPrice).toFixed(2)}
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600, color: "#1f2937", textAlign: "right" }}>
                              ₱{parseFloat(item.lineTotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr style={{ background: "#f9fafb", borderTop: "2px solid #e5e7eb" }}>
                          <td colSpan={3} style={{ padding: "8px 12px", fontSize: 14, fontWeight: 600, color: "#1f2937", textAlign: "right" }}>
                            Total:
                          </td>
                          <td style={{ padding: "8px 12px", fontSize: 16, fontWeight: 700, color: "#10b981", textAlign: "right" }}>
                            ₱{parseFloat(selectedOrder.total).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
