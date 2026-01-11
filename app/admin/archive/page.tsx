"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import Swal from "sweetalert2";

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
  total: string;
  status: string;
  createdAt: string;
  archivedAt?: string;
  items: OrderItem[];
};

export default function ArchivePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

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

    fetchArchivedOrders();
  }, [router]);

  function fetchArchivedOrders() {
    setLoading(true);
    fetch("/api/orders?archived=true")
      .then((res) => res.json())
      .then((data) => {
        // Ensure data is always an array
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setOrders([]);
        setLoading(false);
      });
  }

  async function handleRestoreOrder(orderId: number) {
    const result = await Swal.fire({
      icon: 'question',
      title: 'Restore Order?',
      text: 'This will move the order back to active orders with PENDING status.',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, restore it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "PENDING",
          archived: false,
          archivedAt: null
        }),
      });

      if (!res.ok) throw new Error();

      fetchArchivedOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      Swal.fire({
        icon: 'success',
        title: 'Restored!',
        text: 'Order has been restored to active orders',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Restore Failed',
        text: 'Failed to restore order. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  }

  async function handlePermanentDelete(orderId: number) {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Permanently Delete?',
      html: '<strong style="color: #dc2626;">WARNING:</strong> This action cannot be undone!<br>The order will be permanently removed from the database.',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete permanently',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      // Delete order items first
      const deleteItemsRes = await fetch(`/api/orders/${orderId}/items`, {
        method: "DELETE"
      });

      // Then delete the order
      const res = await fetch(`/api/orders/${orderId}/permanent`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      fetchArchivedOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      Swal.fire({
        icon: 'success',
        title: 'Permanently Deleted!',
        text: 'Order has been permanently removed',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete order permanently. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  }

  function handleExportToCSV() {
    const headers = [
      "Order ID",
      "Customer",
      "Contact Number",
      "Email",
      "Address",
      "Status",
      "Total Amount",
      "Created At",
      "Archived At",
      "Items"
    ];

    const rows = orders.map(order => {
      const itemsList = order.items.map(item =>
        `${item.name} (x${item.quantity}) - ₱${item.lineTotal}${item.notes ? ` [Note: ${item.notes}]` : ""}`
      ).join("; ");

      return [
        order.uid || order.id,
        `"${order.customer || "Guest"}"`,
        `"${order.contactNumber || "N/A"}"`,
        `"${order.email || "N/A"}"`,
        `"${order.address || "N/A"}"`,
        order.status,
        order.total,
        `"${new Date(order.createdAt).toLocaleString()}"`,
        order.archivedAt ? `"${new Date(order.archivedAt).toLocaleString()}"` : "N/A",
        `"${itemsList}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `archived_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });

    Toast.fire({
      icon: 'success',
      title: 'CSV Exported Successfully!',
      text: `${orders.length} archived orders exported`
    });
  }

  // Search and filter orders
  const filteredOrders = orders.filter((order) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (order.uid ? order.uid.toLowerCase().includes(searchLower) : order.id.toString().includes(searchLower)) ||
      order.customer?.toLowerCase().includes(searchLower) ||
      order.contactNumber?.toLowerCase().includes(searchLower) ||
      order.email?.toLowerCase().includes(searchLower) ||
      order.status.toLowerCase().includes(searchLower)
    );
  });

  // Pagination calculations
  const indexOfLastOrder = currentPage * itemsPerPage;
  const indexOfFirstOrder = indexOfLastOrder - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0 }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Archive" subtitle="Completed, cancelled, and deleted orders" breadcrumbs={["Home", "Archive"]} />
          <div style={{ padding: 32 }}>
            <div style={{ height: 12 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
            {orders.length > 0 && (
              <button
                onClick={handleExportToCSV}
                style={{
                  background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
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
                  boxShadow: "0 2px 8px rgba(107, 114, 128, 0.3)",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(107, 114, 128, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(107, 114, 128, 0.3)";
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Export Archive
              </button>
            )}
          </div>

          {/* Search Bar */}
          {!loading && orders.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ position: "relative", maxWidth: 500 }}>
                <svg
                  style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}
                  width="18"
                  height="18"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search archived orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 40px",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 14,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#667eea";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(102, 126, 234, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    style={{
                      position: "absolute",
                      right: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "transparent",
                      border: "none",
                      color: "#9ca3af",
                      cursor: "pointer",
                      fontSize: 18,
                      padding: 4
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
              {searchTerm && (
                <div style={{ marginTop: 8, fontSize: 13, color: "#6b7280" }}>
                  Found <strong>{filteredOrders.length}</strong> {filteredOrders.length === 1 ? "order" : "orders"}
                </div>
              )}
            </div>
          )}

          {loading && <div>Loading archived orders...</div>}

          {!loading && orders.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              <svg style={{ margin: "0 auto 16px", color: "#d1d5db" }} width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2 1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h9.586a2 2 0 0 1 1.414.586l2 2V2a1 1 0 0 0-1-1H2zm12-1a2 2 0 0 1 2 2v12.793a.5.5 0 0 1-.854.353l-2.853-2.853a1 1 0 0 0-.707-.293H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12z"/>
                <path d="M5 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
              </svg>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No archived orders</p>
              <p style={{ fontSize: 14 }}>Completed and cancelled orders will appear here</p>
            </div>
          )}

          {!loading && orders.length > 0 && filteredOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              <svg style={{ margin: "0 auto 16px", color: "#d1d5db" }} width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No orders found</p>
              <p style={{ fontSize: 14 }}>Try adjusting your search terms</p>
            </div>
          )}

          {!loading && filteredOrders.length > 0 && (
            <>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                  <thead>
                    <tr style={{ textAlign: "left", borderBottom: "2px solid #e5e7eb", background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)", color: "#fff" }}>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>ID</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Customer</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Contact</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Total</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Status</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Archived</th>
                      <th style={{ padding: "12px 10px", fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order, index) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6", background: index % 2 === 0 ? "#fff" : "#f9fafb", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f0f9ff"} onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#f9fafb"}>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#6b7280" }}>{order.uid || order.id}</td>
                      <td style={{ padding: "12px 10px" }}>{order.customer || "Guest"}</td>
                      <td style={{ padding: "12px 10px" }}>{order.contactNumber || "—"}</td>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#6b7280" }}>₱{order.total}</td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{
                          background: order.status === "COMPLETED" ? "#d1fae5" : "#fee2e2",
                          color: order.status === "COMPLETED" ? "#065f46" : "#991b1b",
                          padding: "5px 12px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px"
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", fontSize: 12, color: "#6b7280" }}>
                        {order.archivedAt ? new Date(order.archivedAt).toLocaleString() : "—"}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => setSelectedOrder(order)} style={{ background: "#6b7280", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          View
                        </button>
                        <button
                          onClick={() => handleRestoreOrder(order.id)}
                          style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handlePermanentDelete(order.id)}
                          style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                        >
                          Delete
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  Showing <strong>{indexOfFirstOrder + 1}</strong> to <strong>{Math.min(indexOfLastOrder, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong> {searchTerm ? "filtered" : ""} archived orders
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      background: currentPage === 1 ? "#f3f4f6" : "#fff",
                      color: currentPage === 1 ? "#9ca3af" : "#374151",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                      const showPage =
                        pageNumber === 1 ||
                        pageNumber === totalPages ||
                        (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);

                      const showEllipsis =
                        (pageNumber === currentPage - 2 && currentPage > 3) ||
                        (pageNumber === currentPage + 2 && currentPage < totalPages - 2);

                      if (showEllipsis) {
                        return <span key={pageNumber} style={{ padding: "8px 4px", color: "#9ca3af" }}>...</span>;
                      }

                      if (!showPage) return null;

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          style={{
                            padding: "8px 12px",
                            border: "1px solid",
                            borderColor: currentPage === pageNumber ? "#6b7280" : "#e5e7eb",
                            borderRadius: 6,
                            background: currentPage === pageNumber ? "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)" : "#fff",
                            color: currentPage === pageNumber ? "#fff" : "#374151",
                            cursor: "pointer",
                            fontSize: 14,
                            fontWeight: currentPage === pageNumber ? 600 : 500,
                            minWidth: 40
                          }}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "8px 12px",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      background: currentPage === totalPages ? "#f3f4f6" : "#fff",
                      color: currentPage === totalPages ? "#9ca3af" : "#374151",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
          </div>
        </main>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setSelectedOrder(null)} />

          <div style={{ position: "relative", maxWidth: 700, width: "100%", background: "#fff", borderRadius: 12, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>Archived Order {selectedOrder.uid ? `#${selectedOrder.uid}` : `#${selectedOrder.id}`}</h2>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "transparent", border: "none", fontSize: 24, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Customer Name</div>
                  <div>{selectedOrder.customer || "Guest"}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Contact Number</div>
                  <div>{selectedOrder.contactNumber || "—"}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Email</div>
                  <div>{selectedOrder.email || "—"}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Delivery Address</div>
                  <div>{selectedOrder.address || "—"}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Status</div>
                  <div>{selectedOrder.status}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Archived At</div>
                  <div>{selectedOrder.archivedAt ? new Date(selectedOrder.archivedAt).toLocaleString() : "—"}</div>
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Order Items</h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd", background: "#fafafa" }}>
                    <th style={{ padding: "8px 6px" }}>Item</th>
                    <th style={{ padding: "8px 6px" }}>Qty</th>
                    <th style={{ padding: "8px 6px" }}>Unit Price</th>
                    <th style={{ padding: "8px 6px" }}>Line Total</th>
                    <th style={{ padding: "8px 6px" }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                      <td style={{ padding: "8px 6px" }}>{item.name}</td>
                      <td style={{ padding: "8px 6px" }}>{item.quantity}</td>
                      <td style={{ padding: "8px 6px" }}>₱{item.unitPrice}</td>
                      <td style={{ padding: "8px 6px" }}>₱{item.lineTotal}</td>
                      <td style={{ padding: "8px 6px", fontSize: 12, color: "#666" }}>{item.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: 16, textAlign: "right", fontSize: 18, fontWeight: 700 }}>
              Total: ₱{selectedOrder.total}
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => handleRestoreOrder(selectedOrder.id)}
                style={{ background: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                Restore Order
              </button>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
