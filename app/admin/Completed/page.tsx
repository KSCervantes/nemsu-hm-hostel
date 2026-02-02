"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import Swal from "sweetalert2";
import { formatDate, formatDateOnly, toDateObject } from "@/lib/date-utils";

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  notes?: string;
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

export default function CompletedPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

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

    fetchCompletedOrders();
  }, [router]);

  useEffect(() => {
    applyFilters();
  }, [orders, filterType, searchTerm]);

  function fetchCompletedOrders() {
    setLoading(true);
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
  }

  function applyFilters() {
    let filtered = [...orders];

    // Apply date filter
    const now = new Date();
    switch (filterType) {
      case 'daily':
        filtered = filtered.filter(order => {
          const orderDate = toDateObject(order.createdAt);
          return orderDate ? orderDate.toDateString() === now.toDateString() : false;
        });
        break;
      case 'weekly':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(order => {
          const orderDate = toDateObject(order.createdAt);
          return orderDate ? orderDate >= weekAgo : false;
        });
        break;
      case 'monthly':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter(order => {
          const orderDate = toDateObject(order.createdAt);
          return orderDate ? orderDate >= monthAgo : false;
        });
        break;
      case 'yearly':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        filtered = filtered.filter(order => {
          const orderDate = toDateObject(order.createdAt);
          return orderDate ? orderDate >= yearAgo : false;
        });
        break;
      case 'all':
      default:
        // No date filtering
        break;
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.uid?.toLowerCase().includes(term) ||
        order.customer?.toLowerCase().includes(term) ||
        order.contactNumber?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term) ||
        order.id.toString().includes(term)
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }

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
            Filter: ${filterType.charAt(0).toUpperCase() + filterType.slice(1)} |
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
                  <td>${order.items.map(item => `${item.name} (x${item.quantity})`).join(', ')}</td>
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
        item.name,
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
    link.setAttribute('download', `completed-orders-${filterType}-${new Date().toISOString().split('T')[0]}.csv`);
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
              <input
                type="text"
                placeholder="Search by ID, customer, contact, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              style={{
                padding: "10px 12px",
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                fontSize: 14,
                outline: "none",
                cursor: "pointer",
                minWidth: 120,
              }}
            >
              <option value="all">All Time</option>
              <option value="daily">Today</option>
              <option value="weekly">This Week</option>
              <option value="monthly">This Month</option>
              <option value="yearly">This Year</option>
            </select>
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
                              {item.name} (x{item.quantity})
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
                              {item.name}
                              {item.notes && (
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                                  Note: {item.notes}
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
