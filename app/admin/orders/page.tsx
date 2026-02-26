"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import Swal from "sweetalert2";
import { formatDate, formatDateOnly } from "@/lib/date-utils";
import { getDeliveryFee, getOrderTotal } from "@/lib/order-pricing";

type OrderItem = {
  id: number;
  name: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  notes?: string;
  img?: string | null;
  foodId?: string;
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

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // Create Order states
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  // Edit Order states
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<{ id?: number; foodId?: number; name: string; quantity: number; unitPrice: string; notes?: string }[]>([]);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [createOrderItems, setCreateOrderItems] = useState<{id: number, name: string, price: number, quantity: number, notes: string}[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [desiredTime, setDesiredTime] = useState("");
  const [regions, setRegions] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [barangays, setBarangays] = useState<any[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  const createItemsSubtotal = createOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const createDeliveryFee = getDeliveryFee(orderType);
  const createOrderTotal = getOrderTotal(createItemsSubtotal, orderType);
  const editPricingOrderType = editOrder?.orderType === "PICKUP" ? "PICKUP" : "DELIVERY";
  const editItemsSubtotal = editItems.reduce((sum, item) => sum + (Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0);
  const editDeliveryFee = getDeliveryFee(editPricingOrderType);
  const editOrderTotal = getOrderTotal(editItemsSubtotal, editPricingOrderType);

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

    fetchOrders();
    fetchMenuItems();
    fetchRegions();
  }, [router]);

  function fetchOrders() {
    setLoading(true);
    fetch("/api/orders?archived=false")
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

  function fetchMenuItems() {
    fetch("/api/food-items")
      .then((res) => res.json())
      .then((data) => {
        setMenuItems(data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          description: item.description || "",
          category: item.category || "main",
        })));
      })
      .catch(() => {});
  }

  function fetchRegions() {
    fetch("https://psgc.gitlab.io/api/regions/")
      .then((res) => res.json())
      .then((data) => setRegions(data))
      .catch(() => {});
  }

  // Load provinces when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      setSelectedProvince("");
      setSelectedCity("");
      setSelectedBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/regions/${selectedRegion}/provinces/`)
      .then((res) => res.json())
      .then((data) => {
        setProvinces(data);
        setCities([]);
        setBarangays([]);
        setSelectedProvince("");
        setSelectedCity("");
        setSelectedBarangay("");
      })
      .catch(() => {});
  }, [selectedRegion]);

  // Load cities when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setBarangays([]);
      setSelectedCity("");
      setSelectedBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`)
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
        setBarangays([]);
        setSelectedCity("");
        setSelectedBarangay("");
      })
      .catch(() => {});
  }, [selectedProvince]);

  // Load barangays when city changes
  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      setSelectedBarangay("");
      return;
    }
    fetch(`https://psgc.gitlab.io/api/cities-municipalities/${selectedCity}/barangays/`)
      .then((res) => res.json())
      .then((data) => {
        setBarangays(data);
        setSelectedBarangay("");
      })
      .catch(() => {});
  }, [selectedCity]);

  async function handleCreateOrder() {
    // Validation
    if (!customerName.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Name', text: 'Please enter customer name.' });
      return;
    }
    if (!contactNumber.trim()) {
      Swal.fire({ icon: 'error', title: 'Missing Contact', text: 'Please enter contact number.' });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Swal.fire({ icon: 'error', title: 'Invalid Email', text: 'Please enter a valid email address.' });
      return;
    }
    if (createOrderItems.length === 0) {
      Swal.fire({ icon: 'error', title: 'No Items', text: 'Please add at least one item to the order.' });
      return;
    }
    if (orderType === 'DELIVERY' && (!selectedRegion || !selectedProvince || !selectedCity || !selectedBarangay || !streetAddress.trim())) {
      Swal.fire({ icon: 'error', title: 'Incomplete Address', text: 'Please complete the delivery address.' });
      return;
    }

    // Build address
    let fullAddress = '';
    if (orderType === 'DELIVERY') {
      const regionName = regions.find(r => r.code === selectedRegion)?.name || '';
      const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
      const cityName = cities.find(c => c.code === selectedCity)?.name || '';
      const barangayName = barangays.find(b => b.code === selectedBarangay)?.name || '';
      fullAddress = `${streetAddress}, ${barangayName}, ${cityName}, ${provinceName}, ${regionName}`;
    }

    const payload = {
      customer: customerName,
      contactNumber,
      email,
      address: orderType === 'DELIVERY' ? fullAddress : undefined,
      desiredAt: desiredTime || undefined,
      orderType,
      items: createOrderItems.map(item => ({
        foodItemId: item.id,
        quantity: item.quantity,
        notes: item.notes || undefined,
      })),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to create order');

      await Swal.fire({
        icon: 'success',
        title: 'Order Created!',
        text: 'The order has been successfully created.',
        timer: 3000,
        showConfirmButton: false,
      });

      // Reset form
      setIsCreateOrderOpen(false);
      setCustomerName('');
      setContactNumber('');
      setEmail('');
      setDesiredTime('');
      setCreateOrderItems([]);
      setOrderType('DELIVERY');
      setSelectedRegion('');
      setSelectedProvince('');
      setSelectedCity('');
      setSelectedBarangay('');
      setStreetAddress('');
      fetchOrders();
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create order. Please try again.',
      });
    }
  }

  async function handleStatusChange(orderId: number, newStatus: string) {
    const statusMessages: {[key: string]: {title: string, text: string}} = {
      ACCEPTED: { title: 'Accept Order?', text: 'This will notify the customer that their order has been accepted.' },
      COMPLETED: { title: 'Mark as Completed?', text: 'This will mark the order as completed and finalize the transaction.' },
    };

    const message = statusMessages[newStatus] || { title: 'Update Order Status?', text: `Change status to ${newStatus}` };

    const result = await Swal.fire({
      icon: 'question',
      title: message.title,
      text: message.text,
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, proceed',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }

      Swal.fire({
        icon: 'success',
        title: 'Status Updated!',
        text: `Order #${orderId} has been ${newStatus.toLowerCase()}`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update order status. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function handleDeleteOrder(orderId: number, orderStatus: string) {
    // Check if order is ACCEPTED or COMPLETED
    if (orderStatus === 'ACCEPTED' || orderStatus === 'COMPLETED') {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Delete',
        text: 'Orders that have been accepted or completed cannot be deleted.',
        confirmButtonColor: '#dc2626'
      });
      return;
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Order?',
      text: 'This action cannot be undone. Are you sure you want to delete this order?',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }

      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(null);
      }

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Order has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: err.message || 'Failed to delete order. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  }

  function openEdit(order: Order) {
    setEditOrder(order);
    // Map items to editable shape
    const mapped = order.items.map((it) => ({ id: it.id, foodId: (it as any).foodId, name: it.name, quantity: it.quantity, unitPrice: it.unitPrice, notes: it.notes }));
    setEditItems(mapped);
    setIsEditOrderOpen(true);
  }

  async function handleEditSubmit() {
    if (!editOrder) return;
    // Prevent editing if order is accepted or completed
    if (editOrder.status === 'ACCEPTED' || editOrder.status === 'COMPLETED') {
      Swal.fire({ icon: 'error', title: 'Cannot Edit', text: 'Orders that have been accepted or completed cannot be edited.' });
      setIsEditOrderOpen(false);
      return;
    }
    // basic validation
    if (!editOrder.customer || !editOrder.contactNumber || !editOrder.email) {
      Swal.fire({ icon: 'error', title: 'Missing fields', text: 'Please fill in customer name, contact and email.' });
      return;
    }

    const payload: any = {
      customer: editOrder.customer,
      contactNumber: editOrder.contactNumber,
      email: editOrder.email,
      address: editOrder.address,
      desiredAt: editOrder.desiredAt || undefined,
      items: editItems.map(i => ({ id: i.id, foodId: i.foodId, name: i.name, quantity: i.quantity, unitPrice: parseFloat(String(i.unitPrice)), notes: i.notes }))
    }

    try {
      const res = await fetch(`/api/orders/${editOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Update failed');

      const updated = await res.json();
      setIsEditOrderOpen(false);
      setEditOrder(null);
      setEditItems([]);
      fetchOrders();

      Swal.fire({ icon: 'success', title: 'Order Updated', timer: 2000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Update Failed', text: 'Failed to update order. Please try again.' });
    }
  }

  function handlePrintOrder(order: Order) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      Swal.fire({
        icon: 'warning',
        title: 'Pop-up Blocked',
        text: 'Please allow pop-ups for this site to print orders',
        confirmButtonColor: '#0070f3'
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order ${order.uid || `#${order.id}`} - Receipt</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
          .logo { max-width: 120px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .header p { font-size: 12px; color: #666; }
          .section { margin-bottom: 15px; }
          .section-title { font-weight: bold; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; }
          .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
          .info-label { font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .items-table th { text-align: left; padding: 8px 4px; border-bottom: 2px solid #000; font-size: 12px; }
          .items-table td { padding: 8px 4px; border-bottom: 1px dashed #ccc; font-size: 12px; }
          .total-row { font-weight: bold; font-size: 16px; margin-top: 10px; text-align: right; padding: 10px 0; border-top: 2px solid #000; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-accepted { background: #dbeafe; color: #1e40af; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; font-size: 12px; color: #666; }
          @media print {
            body { padding: 10px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/img/NEMSU.png" alt="NEMSU Logo" class="logo" />
          <h1>🍽️ ORDER RECEIPT</h1>
          <p>Hotel Management System</p>
          <p>North Eastern Mindanao State University</p>
        </div>

        <div class="section">
          <div class="section-title">Order Information</div>
          <div class="info-row">
            <span class="info-label">Order ID:</span>
            <span>${order.uid ? `#${order.uid}` : `#${order.id}`}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date:</span>
            <span>${formatDate(order.createdAt)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="status-badge status-${order.status.toLowerCase()}">${order.status}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Customer Details</div>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span>${order.customer || "Guest"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Contact:</span>
            <span>${order.contactNumber || "—"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${order.email || "—"}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span>${order.address || "—"}</span>
          </div>
          ${order.desiredAt ? `
          <div class="info-row">
            <span class="info-label">Desired At:</span>
            <span>${order.desiredAt}</span>
          </div>
          ` : ""}
        </div>

        <div class="section">
          <div class="section-title">Order Items</div>
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.name}${item.notes ? `<br><small style="color: #666;">${item.notes}</small>` : ""}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">₱${parseFloat(item.unitPrice).toFixed(2)}</td>
                  <td style="text-align: right;">₱${parseFloat(item.lineTotal).toFixed(2)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="total-row">
            TOTAL: ₱${parseFloat(order.total).toFixed(2)}
          </div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>For inquiries, please contact us at your convenience.</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #0070f3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; margin-right: 10px;">Print</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  }

  function handleExportToCSV() {
    // Prepare CSV headers
    const headers = [
      "Order ID",
      "Customer",
      "Contact Number",
      "Email",
      "Address",
      "Date",
      "Time",
      "Status",
      "Total Amount",
      "Created At",
      "Items"
    ];

    // Prepare CSV rows
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
        order.desiredAt ? `"${formatDateOnly(order.desiredAt)}"` : "N/A",
        order.desiredAt ? `"${formatDate(order.desiredAt).split(", ")[1] || formatDate(order.desiredAt)}"` : "N/A",
        order.status,
        order.total,
        `"${formatDate(order.createdAt)}"`,
        `"${itemsList}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `orders_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Show success toast
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });

    Toast.fire({
      icon: 'success',
      title: 'CSV Exported Successfully!',
      text: `${orders.length} orders exported`
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
          <AdminHeader title="Orders" subtitle="View and manage all customer orders" breadcrumbs={["Home", "Orders"]} />
          <div style={{ padding: 32 }}>
            <div style={{ height: 12 }} />
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end" }}>
            <button
              onClick={() => setIsCreateOrderOpen(true)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
                boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(102, 126, 234, 0.3)";
              }}
            >
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
              </svg>
              Create Order
            </button>
            {orders.length > 0 && (
              <button
                onClick={handleExportToCSV}
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
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 185, 129, 0.3)";
                }}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
                Export to CSV
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
                  placeholder="Search by order ID, customer, contact, email, or status..."
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
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Clear search"
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

          {loading && <div>Loading orders...</div>}

          {!loading && orders.length === 0 && <div>No orders found.</div>}

          {!loading && orders.length > 0 && filteredOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              <svg style={{ margin: "0 auto 16px", color: "#d1d5db" }} width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
              <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>No orders found</p>
              <p style={{ fontSize: 14 }}>Try adjusting your search terms</p>
            </div>
          )}

          {!loading && orders.length > 0 && (
            <>
              <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#fff" }}>
                  <thead>
                    <tr style={{ textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>ID</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Customer</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Contact</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Email</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb", minWidth: 200 }}>Order Items</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Total</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Status</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Created</th>
                      <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrders.map((order, index) => (
                    <tr key={order.id} style={{ borderBottom: "1px solid #e5e7eb", background: index % 2 === 0 ? "#fff" : "#f9fafb", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#eff6ff"} onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#f9fafb"}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#3b82f6", borderRight: "1px solid #e5e7eb" }}>{order.uid || order.id}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>{order.customer || "Guest"}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>{order.contactNumber || "—"}</td>
                      <td style={{ padding: "12px", fontSize: 13, borderRight: "1px solid #e5e7eb" }}>{order.email || "—"}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {order.items && order.items.length > 0 ? (
                            order.items.slice(0, 3).map((item, i) => (
                              <div key={i} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "6px 8px",
                                background: "#f8fafc",
                                borderRadius: 6,
                                border: "1px solid #e5e7eb",
                              }}>
                                {item.img ? (
                                  <img
                                    src={item.img}
                                    alt={item.name}
                                    style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 4,
                                      objectFit: "cover",
                                      border: "1px solid #e5e7eb",
                                      flexShrink: 0,
                                    }}
                                  />
                                ) : (
                                  <div style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 4,
                                    background: "#e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    flexShrink: 0,
                                  }}>
                                    🍽️
                                  </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: "#1e293b",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}>
                                    {item.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: "#64748b" }}>
                                    x{item.quantity} • ₱{parseFloat(item.unitPrice).toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <span style={{ color: "#9ca3af", fontSize: 12 }}>No items</span>
                          )}
                          {order.items && order.items.length > 3 && (
                            <div style={{
                              fontSize: 11,
                              color: "#667eea",
                              fontWeight: 600,
                              padding: "4px 8px",
                              background: "#eef2ff",
                              borderRadius: 4,
                              textAlign: "center",
                            }}>
                              +{order.items.length - 3} more item{order.items.length - 3 > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#10b981", borderRight: "1px solid #e5e7eb" }}>₱{order.total}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>
                        <span style={{
                          background: order.status === "PENDING" ? "#fef3c7" : order.status === "ACCEPTED" ? "#dbeafe" : order.status === "COMPLETED" ? "#d1fae5" : "#fee2e2",
                          color: order.status === "PENDING" ? "#92400e" : order.status === "ACCEPTED" ? "#1e40af" : order.status === "COMPLETED" ? "#065f46" : "#991b1b",
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
                      <td style={{ padding: "12px", fontSize: 12, color: "#6b7280", borderRight: "1px solid #e5e7eb" }}>{formatDate(order.createdAt)}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => setSelectedOrder(order)} style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          View
                        </button>
                        {(order.status === "ACCEPTED" || order.status === "COMPLETED") && (
                          <button
                            onClick={() => handlePrintOrder(order)}
                            style={{ background: "#6366f1", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                            title="Print Order"
                          >
                            🖨️ Print
                          </button>
                        )}
                        {order.status === "PENDING" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "ACCEPTED")}
                            disabled={updatingStatus === order.id}
                            style={{ background: "#3b82f6", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: updatingStatus === order.id ? "not-allowed" : "pointer", fontSize: 12, opacity: updatingStatus === order.id ? 0.6 : 1 }}
                          >
                            {updatingStatus === order.id ? "..." : "Accept"}
                          </button>
                        )}
                        {order.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleStatusChange(order.id, "COMPLETED")}
                            disabled={updatingStatus === order.id}
                            style={{ background: "#10b981", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: updatingStatus === order.id ? "not-allowed" : "pointer", fontSize: 12, opacity: updatingStatus === order.id ? 0.6 : 1 }}
                          >
                            {updatingStatus === order.id ? "..." : "Complete"}
                          </button>
                        )}
                        {order.status !== "ACCEPTED" && order.status !== "COMPLETED" && (
                          <button
                            onClick={() => handleDeleteOrder(order.id, order.status)}
                            style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            Delete
                          </button>
                        )}
                        {/* Edit button: only available if not accepted or completed */}
                        {order.status !== "ACCEPTED" && order.status !== "COMPLETED" && (
                          <button
                            onClick={() => openEdit(order)}
                            style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                          >
                            Edit
                          </button>
                        )}
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
                Showing <strong>{indexOfFirstOrder + 1}</strong> to <strong>{Math.min(indexOfLastOrder, filteredOrders.length)}</strong> of <strong>{filteredOrders.length}</strong> {searchTerm ? "filtered" : ""} orders
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
                    fontWeight: 500,
                    transition: "all 0.2s"
                  }}
                >
                  ← Previous
                </button>

                <div style={{ display: "flex", gap: 4 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
                    // Show first page, last page, current page, and pages around current
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
                          borderColor: currentPage === pageNumber ? "#667eea" : "#e5e7eb",
                          borderRadius: 6,
                          background: currentPage === pageNumber ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" : "#fff",
                          color: currentPage === pageNumber ? "#fff" : "#374151",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: currentPage === pageNumber ? 600 : 500,
                          minWidth: 40,
                          transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                          if (currentPage !== pageNumber) {
                            e.currentTarget.style.borderColor = "#667eea";
                            e.currentTarget.style.background = "#f0f9ff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (currentPage !== pageNumber) {
                            e.currentTarget.style.borderColor = "#e5e7eb";
                            e.currentTarget.style.background = "#fff";
                          }
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
                    fontWeight: 500,
                    transition: "all 0.2s"
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
              <h2 style={{ margin: 0 }}>Order {selectedOrder.uid ? `#${selectedOrder.uid}` : `#${selectedOrder.id}`}</h2>
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
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Desired Delivery/Pickup</div>
                  <div>{selectedOrder.desiredAt ? formatDate(selectedOrder.desiredAt) : "—"}</div>
                </div>
                {selectedOrder.orderType && (
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Order Type</div>
                    <div>
                      <span style={{ background: selectedOrder.orderType === 'PICKUP' ? '#fde68a' : '#dbeafe', color: '#1f2937', padding: '4px 10px', borderRadius: 9999, fontSize: 12, fontWeight: 700 }}>
                        {selectedOrder.orderType}
                      </span>
                    </div>
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Status</div>
                  <div>{selectedOrder.status}</div>
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

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedOrder(null)} style={{ background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {/* Edit Order Modal */}
      {isEditOrderOpen && editOrder && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Edit Order {editOrder.uid ? `#${editOrder.uid}` : `#${editOrder.id}`}</h2>
              <button onClick={() => { setIsEditOrderOpen(false); setEditOrder(null); setEditItems([]); }} style={{ background: "transparent", border: "none", fontSize: 28, cursor: "pointer", color: "#6b7280", lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Customer Name</label>
                <input value={editOrder.customer} onChange={(e) => setEditOrder({ ...editOrder, customer: e.target.value })} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Contact Number</label>
                  <input value={editOrder.contactNumber || ''} onChange={(e) => setEditOrder({ ...editOrder, contactNumber: e.target.value })} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Email</label>
                  <input value={editOrder.email || ''} onChange={(e) => setEditOrder({ ...editOrder, email: e.target.value })} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Address</label>
                <input value={editOrder.address || ''} onChange={(e) => setEditOrder({ ...editOrder, address: e.target.value })} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Desired At</label>
                <input type="datetime-local" value={editOrder.desiredAt || ''} onChange={(e) => setEditOrder({ ...editOrder, desiredAt: e.target.value })} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
              </div>

              <h3 style={{ marginTop: 0, marginBottom: 12 }}>Order Items</h3>
              <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, marginBottom: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: 12, alignItems: "end" }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Select Item</label>
                    <select id="editMenuItemSelect" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }}>
                      <option value="">-- Choose Item --</option>
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} - ₱{item.price}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Quantity</label>
                    <input id="editQuantityInput" type="number" min="1" defaultValue="1" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Notes (Optional)</label>
                    <input id="editNotesInput" type="text" placeholder="Special instructions..." style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <button onClick={() => {
                    const select = document.getElementById('editMenuItemSelect') as HTMLSelectElement;
                    const qtyInput = document.getElementById('editQuantityInput') as HTMLInputElement;
                    const notesInput = document.getElementById('editNotesInput') as HTMLInputElement;
                    const itemId = parseInt(select.value);
                    const qty = parseInt(qtyInput.value) || 1;
                    const notes = notesInput.value;
                    if (!itemId) { Swal.fire({ icon: 'warning', title: 'Select Item', text: 'Please select an item first.' }); return; }
                    const item = menuItems.find(m => m.id === itemId);
                    if (!item) return;
                    setEditItems([...editItems, { foodId: item.id, name: item.name, quantity: qty, unitPrice: String(item.price), notes }]);
                    select.value = '';
                    qtyInput.value = '1';
                    notesInput.value = '';
                  }} style={{ background: "#667eea", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}>
                    + Add
                  </button>
                </div>
              </div>

              {editItems.length > 0 ? (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                        <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Item</th>
                        <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Qty</th>
                        <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Price</th>
                        <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Total</th>
                        <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Notes</th>
                        <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {editItems.map((it, idx) => (
                        <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "10px 12px", fontSize: 14 }}>
                            <input value={it.name} onChange={(e) => { const copy = [...editItems]; copy[idx].name = e.target.value; setEditItems(copy); }} style={{ width: '100%', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6 }} />
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 14 }}>
                            <input type="number" min="1" value={String(it.quantity)} onChange={(e) => { const copy = [...editItems]; copy[idx].quantity = Number(e.target.value || 1); setEditItems(copy); }} style={{ width: '80px', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6 }} />
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 14 }}>
                            <input value={it.unitPrice} onChange={(e) => { const copy = [...editItems]; copy[idx].unitPrice = e.target.value; setEditItems(copy); }} style={{ width: '120px', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6 }} />
                          </td>
                          <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600 }}>₱{(Number(it.unitPrice || 0) * Number(it.quantity || 0)).toFixed(2)}</td>
                          <td style={{ padding: "10px 12px", fontSize: 14 }}>
                            <input value={it.notes || ''} onChange={(e) => { const copy = [...editItems]; copy[idx].notes = e.target.value; setEditItems(copy); }} style={{ width: '100%', border: '1px solid #e5e7eb', padding: '6px 8px', borderRadius: 6 }} />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ padding: '12px 16px', background: '#f9fafb', textAlign: 'right', fontSize: 16, fontWeight: 700, borderTop: '2px solid #e5e7eb' }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#4b5563' }}>
                      Subtotal: ₱{editItemsSubtotal.toFixed(2)}
                    </div>
                    {editPricingOrderType === "DELIVERY" && (
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#4b5563' }}>
                        Delivery Fee: ₱{editDeliveryFee.toFixed(2)}
                      </div>
                    )}
                    <div>
                      Total: ₱{editOrderTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No items. Add items above.</div>
              )}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                <button onClick={() => { setIsEditOrderOpen(false); setEditOrder(null); setEditItems([]); }} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancel</button>
                <button onClick={handleEditSubmit} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isCreateOrderOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 900, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#fff", zIndex: 10 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Create New Order</h2>
              <button onClick={() => setIsCreateOrderOpen(false)} style={{ background: "transparent", border: "none", fontSize: 28, cursor: "pointer", color: "#6b7280", lineHeight: 1, padding: 0 }}>×</button>
            </div>

            <div style={{ padding: 24 }}>
              {/* Order Type Selection */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Order Type</label>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setOrderType('DELIVERY')}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      border: orderType === 'DELIVERY' ? "2px solid #667eea" : "2px solid #e5e7eb",
                      borderRadius: 8,
                      background: orderType === 'DELIVERY' ? "#f0f4ff" : "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    🚚 Delivery
                  </button>
                  <button
                    onClick={() => setOrderType('PICKUP')}
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      border: orderType === 'PICKUP' ? "2px solid #f97316" : "2px solid #e5e7eb",
                      borderRadius: 8,
                      background: orderType === 'PICKUP' ? "#fff7ed" : "#fff",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s"
                    }}
                  >
                    🏃 Pickup
                  </button>
                </div>
              </div>

              {/* Customer Information */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Customer Information</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Full Name *</label>
                    <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Contact Number *</label>
                    <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Email Address *</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Preferred {orderType === 'PICKUP' ? 'Pickup' : 'Delivery'} Time</label>
                    <input type="datetime-local" value={desiredTime} onChange={(e) => setDesiredTime(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                </div>
              </div>

              {/* Delivery Address (only for DELIVERY) */}
              {orderType === 'DELIVERY' && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Delivery Address *</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Region</label>
                      <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }}>
                        <option value="">-- Select Region --</option>
                        {regions.map((r) => (
                          <option key={r.code} value={r.code}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Province</label>
                      <select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} disabled={!selectedRegion} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14, background: !selectedRegion ? "#f3f4f6" : "#fff" }}>
                        <option value="">-- Select Province --</option>
                        {provinces.map((p) => (
                          <option key={p.code} value={p.code}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>City/Municipality</label>
                      <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedProvince} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14, background: !selectedProvince ? "#f3f4f6" : "#fff" }}>
                        <option value="">-- Select City --</option>
                        {cities.map((c) => (
                          <option key={c.code} value={c.code}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Barangay</label>
                      <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} disabled={!selectedCity} style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14, background: !selectedCity ? "#f3f4f6" : "#fff" }}>
                        <option value="">-- Select Barangay --</option>
                        {barangays.map((b) => (
                          <option key={b.code} value={b.code}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Street Address / House Number</label>
                    <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g., 123 Main Street, Unit 5B" style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }} />
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Order Items *</h3>

                {/* Add Item Section */}
                <div style={{ background: "#f9fafb", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 2fr auto", gap: 12, alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Select Item</label>
                      <select
                        id="menuItemSelect"
                        style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }}
                      >
                        <option value="">-- Choose Item --</option>
                        {menuItems.map((item) => (
                          <option key={item.id} value={item.id}>{item.name} - ₱{item.price}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Quantity</label>
                      <input
                        id="quantityInput"
                        type="number"
                        min="1"
                        defaultValue="1"
                        style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Notes (Optional)</label>
                      <input
                        id="notesInput"
                        type="text"
                        placeholder="Special instructions..."
                        style={{ width: "100%", border: "1px solid #d1d5db", padding: "8px 12px", borderRadius: 6, fontSize: 14 }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        const select = document.getElementById('menuItemSelect') as HTMLSelectElement;
                        const qtyInput = document.getElementById('quantityInput') as HTMLInputElement;
                        const notesInput = document.getElementById('notesInput') as HTMLInputElement;

                        const itemId = parseInt(select.value);
                        const qty = parseInt(qtyInput.value) || 1;
                        const notes = notesInput.value;

                        if (!itemId) {
                          Swal.fire({ icon: 'warning', title: 'Select Item', text: 'Please select an item first.' });
                          return;
                        }

                        const item = menuItems.find(m => m.id === itemId);
                        if (!item) return;

                        setCreateOrderItems([...createOrderItems, { id: item.id, name: item.name, price: item.price, quantity: qty, notes }]);
                        select.value = '';
                        qtyInput.value = '1';
                        notesInput.value = '';
                      }}
                      style={{
                        background: "#667eea",
                        color: "#fff",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 14,
                        whiteSpace: "nowrap"
                      }}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {createOrderItems.length > 0 && (
                  <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                          <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Item</th>
                          <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Qty</th>
                          <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Price</th>
                          <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Total</th>
                          <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>Notes</th>
                          <th style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {createOrderItems.map((item, idx) => (
                          <tr key={idx} style={{ borderTop: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "10px 12px", fontSize: 14 }}>{item.name}</td>
                            <td style={{ padding: "10px 12px", fontSize: 14 }}>{item.quantity}</td>
                            <td style={{ padding: "10px 12px", fontSize: 14 }}>₱{item.price}</td>
                            <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 600 }}>₱{(item.price * item.quantity).toFixed(2)}</td>
                            <td style={{ padding: "10px 12px", fontSize: 14, color: "#6b7280" }}>{item.notes || '-'}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <button
                                onClick={() => setCreateOrderItems(createOrderItems.filter((_, i) => i !== idx))}
                                style={{ background: "#ef4444", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ padding: "12px 16px", background: "#f9fafb", textAlign: "right", fontSize: 16, fontWeight: 700, borderTop: "2px solid #e5e7eb" }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#4b5563' }}>
                        Subtotal: ₱{createItemsSubtotal.toFixed(2)}
                      </div>
                      {orderType === "DELIVERY" && (
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#4b5563' }}>
                          Delivery Fee: ₱{createDeliveryFee.toFixed(2)}
                        </div>
                      )}
                      <div>
                        Total: ₱{createOrderTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {createOrderItems.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                    No items added yet. Use the form above to add items.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
                <button
                  onClick={() => setIsCreateOrderOpen(false)}
                  style={{ background: "#f3f4f6", border: "1px solid #d1d5db", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 14 }}
                >
                  Create Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
