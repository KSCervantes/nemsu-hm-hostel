"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date-utils";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
}

interface Order {
  id: string; // Firestore document ID
  numericId: number; // Numeric order ID
  uid?: string;
  customer: string;
  total: string;
  status: string;
  createdAt: string;
  orderType?: 'DELIVERY' | 'PICKUP';
}

// Helper function to play notification sound
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // Create a simple beep sound
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.setValueAtTime(800, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.setValueAtTime(0, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  } catch (e) {
    console.log("Could not play notification sound:", e);
  }
};

export default function AdminHeader({ title, subtitle, breadcrumbs }: AdminHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const [readOrderIds, setReadOrderIds] = useState<Set<number>>(new Set());
  const [lastCheckedOrderId, setLastCheckedOrderId] = useState<number>(0);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const lastCheckedRef = useRef<number>(0);
  const readOrderIdsRef = useRef<Set<number>>(new Set());

  // Calculate unread orders
  const unreadOrders = newOrders.filter(order => !readOrderIds.has(order.numericId));
  const unreadCount = unreadOrders.length;

  // Log whenever newOrders changes
  useEffect(() => {
    console.log("🎯 [AdminHeader] newOrders state updated to:", newOrders.length, "unread:", unreadCount);
  }, [newOrders, unreadCount]);

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  // Fetch new orders periodically
  useEffect(() => {
    // Get last checked order ID from localStorage on mount
    const storedLastId = localStorage.getItem("lastCheckedOrderId");
    const initialLastId = storedLastId ? parseInt(storedLastId, 10) : 0;
    setLastCheckedOrderId(initialLastId);
    lastCheckedRef.current = initialLastId;

    // Load read order IDs from localStorage
    const storedReadIds = localStorage.getItem("readOrderIds");
    if (storedReadIds) {
      try {
        const parsed = JSON.parse(storedReadIds);
        if (Array.isArray(parsed)) {
          const readSet = new Set<number>(parsed);
          setReadOrderIds(readSet);
          readOrderIdsRef.current = readSet;
          console.log("📖 Loaded read order IDs:", parsed);
        }
      } catch (e) {
        console.error("Failed to parse read order IDs:", e);
      }
    }

    const checkNewOrders = async () => {
      try {
        const res = await fetch("/api/orders?archived=false");
        if (res.ok) {
          const orders: Order[] = await res.json();

          // Ensure orders is an array
          if (!Array.isArray(orders)) {
            console.warn("Orders response is not an array:", orders);
            setNewOrders([]); // Set empty if invalid response
            return;
          }

          console.log("📊 Total orders fetched:", orders.length);
          console.log("🔍 Raw orders data:", orders);

          // Get current last checked ID from ref for browser notifications
          const currentLastId = lastCheckedRef.current;

          // Filter for PENDING orders that are newer than last checked (for notifications)
          const newPendingOrders = orders.filter((order) => {
            if (!order || typeof order.numericId !== "number") {
              console.warn("Invalid order object:", order);
              return false;
            }
            // Handle both uppercase and lowercase status
            const status = typeof order.status === "string" ? order.status.toUpperCase() : "";
            const isPending = status === "PENDING";
            const isNew = order.numericId > currentLastId;
            if (isPending && isNew) console.log(`✨ NEW PENDING order found: #${order.numericId}, status: ${status}, customer: ${order.customer || "Unknown"}`);
            return isPending && isNew;
          });

          // ALSO get ALL pending orders to show in dropdown
          const allPendingOrders = orders.filter((order) => {
            if (!order || typeof order.numericId !== "number") return false;
            // Handle both uppercase and lowercase status
            const status = typeof order.status === "string" ? order.status.toUpperCase() : "";
            const isPending = status === "PENDING";
            if (isPending) console.log(`📦 PENDING order for dropdown: #${order.numericId}, customer: ${order.customer || "Unknown"}, status: ${order.status}`);
            return isPending;
          });

          console.log(`🔔 Found ${newPendingOrders.length} NEW pending orders (not seen before)`);
          console.log(`📋 Found ${allPendingOrders.length} TOTAL pending orders (to display in dropdown)`);
          console.log("Dropdown data about to be set:", allPendingOrders.slice(0, 10));

          // ALWAYS update dropdown to show ALL pending orders
          console.log("Setting dropdown orders to:", allPendingOrders.slice(0, 10));
          setNewOrders(allPendingOrders.slice(0, 10));

          // Clean up read order IDs - remove IDs for orders that are no longer pending
          const currentPendingIds = new Set(allPendingOrders.map(o => o.numericId));
          const currentReadIds = readOrderIdsRef.current;
          const cleanedReadIds = new Set<number>();
          currentReadIds.forEach(id => {
            if (currentPendingIds.has(id)) {
              cleanedReadIds.add(id);
            }
          });
          if (cleanedReadIds.size !== currentReadIds.size) {
            console.log("🧹 Cleaned up read order IDs:", currentReadIds.size, "->", cleanedReadIds.size);
            setReadOrderIds(cleanedReadIds);
            readOrderIdsRef.current = cleanedReadIds;
            localStorage.setItem("readOrderIds", JSON.stringify(Array.from(cleanedReadIds)));
          }

          // Show browser notifications only for NEW orders (not in read list)
          // Filter out orders that have already been read
          const unreadNewOrders = newPendingOrders.filter(order => !readOrderIdsRef.current.has(order.numericId));

          if (unreadNewOrders.length > 0) {
            console.log(`✨ ${unreadNewOrders.length} NEW unread orders to notify about`);

            // Update last checked to the highest ID for next check
            const maxId = Math.max(...unreadNewOrders.map((o) => o.numericId), currentLastId);
            setLastCheckedOrderId(maxId);
            lastCheckedRef.current = maxId;
            localStorage.setItem("lastCheckedOrderId", maxId.toString());

            // Show browser notifications if permission granted
            if ("Notification" in window && Notification.permission === "granted") {
              // Play sound for new orders
              playNotificationSound();

              unreadNewOrders.forEach((order) => {
                try {
                  const customerName = order.customer?.trim() || "Guest";
                  const orderTotal = typeof order.total === "string" ? parseFloat(order.total) : order.total;
                  const orderAmount = isFinite(orderTotal) ? orderTotal.toFixed(2) : "0.00";
                  const orderRef = order.uid || `Order #${order.numericId}`;

                  new Notification(`🎉 New Order from ${customerName}`, {
                    body: `₱${orderAmount} • ${orderRef} • ${order.orderType || "ORDER"}`,
                    icon: "/img/NEMSU.png",
                    tag: `order-${order.id}`,
                    badge: "/img/NEMSU.png",
                    requireInteraction: true,
                    data: { orderId: order.numericId, orderUrl: `/admin/orders` },
                  });
                  console.log(`✅ Browser notification sent for order #${order.numericId}`);
                } catch (notifError) {
                  console.error(`Failed to show notification for order #${order.numericId}:`, notifError);
                }
              });
            } else if ("Notification" in window) {
              console.log("Notification permission:", Notification.permission);
            }
          }

          // Also trigger browser notifications for ALL pending orders on first load if no checked yet
          if (currentLastId === 0 && allPendingOrders.length > 0 && "Notification" in window && Notification.permission === "granted") {
            console.log("🔔 First load: notifying about existing pending orders");
            playNotificationSound();
            allPendingOrders.slice(0, 3).forEach((order) => {
              try {
                const customerName = order.customer?.trim() || "Guest";
                const orderTotal = typeof order.total === "string" ? parseFloat(order.total) : order.total;
                const orderAmount = isFinite(orderTotal) ? orderTotal.toFixed(2) : "0.00";
                const orderRef = order.uid || `Order #${order.numericId}`;

                new Notification(`🎉 Order from ${customerName}`, {
                  body: `₱${orderAmount} • ${orderRef} • ${order.orderType || "ORDER"}`,
                  icon: "/img/NEMSU.png",
                  tag: `order-${order.numericId}`,
                  badge: "/img/NEMSU.png",
                  requireInteraction: false,
                  data: { orderId: order.numericId, orderUrl: `/admin/orders` },
                });
              } catch (notifError) {
                console.error(`Failed to notify for order:`, notifError);
              }
            });
            // Set last checked to highest ID so we don't repeat
            const maxId = Math.max(...allPendingOrders.map((o) => o.numericId));
            lastCheckedRef.current = maxId;
            localStorage.setItem("lastCheckedOrderId", maxId.toString());
          }
        }
      } catch (error) {
        console.error("Error checking new orders:", error);
      }
    };

    // Request notification permission with better UX
    const requestNotificationPermission = async () => {
      try {
        if ("Notification" in window) {
          setNotificationPermission(Notification.permission);
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission();
            console.log("Notification permission response:", permission);
            setNotificationPermission(permission);
            if (permission === "granted") {
              console.log("✅ Notifications enabled!");
            } else {
              console.log("⚠️ Notifications blocked by user");
            }
          } else if (Notification.permission === "granted") {
            console.log("✅ Notifications already enabled");
          }
        }
      } catch (error) {
        console.error("Error requesting notification permission:", error);
      }
    };

    // Request permission on mount
    requestNotificationPermission();

    // Check immediately
    checkNewOrders();

    // Then check every 5 seconds
    const interval = setInterval(checkNewOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (orderId: number) => {
    // Mark this order as read
    setReadOrderIds((prev) => {
      const newSet = new Set(prev);
      newSet.add(orderId);
      // Save to localStorage
      localStorage.setItem("readOrderIds", JSON.stringify(Array.from(newSet)));
      readOrderIdsRef.current = newSet;
      console.log("✅ Marked order as read:", orderId);
      return newSet;
    });

    router.push(`/admin/orders`);
    setNotificationOpen(false);
  };

  const markAllAsRead = () => {
    if (newOrders.length > 0) {
      // Mark all current orders as read
      setReadOrderIds((prev) => {
        const newSet = new Set(prev);
        newOrders.forEach(order => newSet.add(order.numericId));
        // Save to localStorage
        localStorage.setItem("readOrderIds", JSON.stringify(Array.from(newSet)));
        readOrderIdsRef.current = newSet;
        console.log("✅ Marked all orders as read:", Array.from(newSet));
        return newSet;
      });

      // Update last checked ID
      const maxId = Math.max(...newOrders.map((o) => o.numericId), lastCheckedRef.current);
      setLastCheckedOrderId(maxId);
      lastCheckedRef.current = maxId;
      localStorage.setItem("lastCheckedOrderId", maxId.toString());
    }
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(0.95); }
        }
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.05); }
        }
        @keyframes slideDown {
          0% { opacity: 0; transform: translateY(-10px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeSlideIn {
          0% { opacity: 0; transform: translateX(-8px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 8px rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 16px rgba(16, 185, 129, 0.6); }
        }
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(12deg); }
          20% { transform: rotate(-10deg); }
          30% { transform: rotate(8deg); }
          40% { transform: rotate(-6deg); }
          50% { transform: rotate(4deg); }
          60% { transform: rotate(0deg); }
        }
        .notification-dropdown {
          animation: slideDown 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .notification-item {
          animation: fadeSlideIn 0.3s ease-out forwards;
          opacity: 0;
        }
        .notification-badge {
          animation: bounce 0.5s ease-out, pulse 2s infinite 0.5s;
        }
        .bell-icon:hover {
          animation: bellRing 0.6s ease-in-out;
        }
      `}</style>
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
        padding: "16px 40px",
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", letterSpacing: "-0.5px" }}>{title || "Admin"}</div>
          {subtitle && (
            <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>{subtitle}</div>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
              {breadcrumbs.join(" / ")}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, position: "relative" }}>
        {/* Notifications */}
        <div style={{ position: "relative" }} ref={notificationRef}>
          <button
            onClick={() => setNotificationOpen((s) => !s)}
            className="bell-icon"
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              border: notificationPermission === "granted" ? "2px solid #10b981" : "1px solid #e5e7eb",
              background: notificationOpen ? "#3b82f6" : "#f8fafc",
              color: notificationOpen ? "#fff" : "#6b7280",
              cursor: "pointer",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              boxShadow: notificationPermission === "granted"
                ? "0 0 12px rgba(16, 185, 129, 0.3)"
                : notificationOpen
                  ? "0 4px 12px rgba(59, 130, 246, 0.25)"
                  : "none",
              transform: notificationOpen ? "scale(1.05)" : "scale(1)",
            }}
            title={notificationPermission === "granted" ? "Notifications enabled" : "Click to enable notifications"}
            onMouseEnter={(e) => {
              if (!notificationOpen) {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!notificationOpen) {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.boxShadow = notificationPermission === "granted" ? "0 0 12px rgba(16, 185, 129, 0.3)" : "none";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <svg width="22" height="22" fill="currentColor" viewBox="0 0 16 16" style={{ transition: "transform 0.2s ease" }}>
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2zM8 1.918l-.797.161A4.002 4.002 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 0 0-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 .99 0A5.002 5.002 0 0 1 13 6c0 .88.32 4.2 1.22 6z"/>
            </svg>
            {/* Show badge only if there are UNREAD orders */}
            {unreadCount > 0 && (
              <span
                className="notification-badge"
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  color: "#fff",
                  borderRadius: "50%",
                  minWidth: 22,
                  height: 22,
                  padding: "0 5px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2.5px solid #fff",
                  boxShadow: "0 3px 10px rgba(239, 68, 68, 0.4)",
                }}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div
              className="notification-dropdown"
              style={{
                position: "absolute",
                top: 56,
                right: 0,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
                minWidth: 380,
                maxWidth: 440,
                maxHeight: 560,
                overflow: "hidden",
                zIndex: 1000,
                transformOrigin: "top right",
              }}
            >
              <div style={{
                padding: "18px 20px",
                borderBottom: "1px solid #e5e7eb",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#1f2937", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🔔</span>
                  <span>Orders</span>
                  {notificationPermission === "granted" && (
                    <span style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      boxShadow: "0 0 8px rgba(16, 185, 129, 0.5)",
                      animation: "pulse 2s infinite"
                    }}></span>
                  )}
                  {unreadCount > 0 && (
                    <span style={{
                      background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                      color: "#fff",
                      borderRadius: 20,
                      padding: "4px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      marginLeft: 4,
                      boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                    }}>
                      {unreadCount} unread
                    </span>
                  )}
                  {unreadCount === 0 && newOrders.length > 0 && (
                    <span style={{
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#fff",
                      borderRadius: 20,
                      padding: "4px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      marginLeft: 4,
                      boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                    }}>
                      ✓ All read
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    style={{
                      background: "#3b82f6",
                      border: "none",
                      color: "#fff",
                      fontSize: 12,
                      padding: "6px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 3px rgba(59, 130, 246, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(59, 130, 246, 0.3)";
                    }}
                  >
                    ✓ Clear all
                  </button>
                )}
              </div>

              {notificationPermission !== "granted" && (
                <div style={{
                  padding: "14px 18px",
                  background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
                  borderBottom: "1px solid rgba(251, 191, 36, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #fde68a 0%, #fcd34d 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)";
                }}
                onClick={async () => {
                  if ("Notification" in window && Notification.permission === "default") {
                    const permission = await Notification.requestPermission();
                    setNotificationPermission(permission);
                  }
                }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#fbbf24",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="18" height="18" fill="#78350f" viewBox="0 0 16 16">
                      <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0l-5.708 9.99a1.13 1.13 0 0 0 .982 1.694h11.464a1.13 1.13 0 0 0 .982-1.694L8.982 1.566ZM8 5c.535 0 .954.462.951.997l-.001.71c0 .656-.122 1.279-.121 1.285a.75.75 0 1 1-1.5-.007c.001-.006-.122-.626-.121-1.278l-.001-.71C7.046 5.462 7.465 5 8 5zm.003 9a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#78350f" }}>Enable notifications</div>
                    <div style={{ fontSize: 11, color: "#92400e", marginTop: 2 }}>Click to get instant alerts for new orders</div>
                  </div>
                  <svg width="16" height="16" fill="#92400e" viewBox="0 0 16 16" style={{ marginLeft: "auto" }}>
                    <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                  </svg>
                </div>
              )}

              <div style={{ maxHeight: 380, overflowY: "auto", overflowX: "hidden" }}>
                {newOrders.length === 0 ? (
                  <div style={{ padding: "70px 20px", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>
                    <div style={{
                      fontSize: 56,
                      marginBottom: 16,
                      filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                    }}>✨</div>
                    <div style={{ fontWeight: 700, marginBottom: 6, color: "#6b7280", fontSize: 16 }}>All caught up!</div>
                    <div style={{ fontSize: 13, color: "#9ca3af" }}>No pending orders right now</div>
                  </div>
                ) : (
                  <div style={{ padding: "6px 0" }}>
                    {newOrders.map((order, idx) => {
                      const isRead = readOrderIds.has(order.numericId);
                      return (
                        <button
                          key={`${order.numericId}-${idx}`}
                          className="notification-item"
                          onClick={() => handleNotificationClick(order.numericId)}
                          style={{
                            width: "calc(100% - 16px)",
                            padding: "16px 18px",
                            margin: "4px 8px",
                            background: isRead ? "#f9fafb" : "#ffffff",
                            border: isRead ? "1px solid #e5e7eb" : "1px solid #dbeafe",
                            borderRadius: 10,
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            position: "relative",
                            animationDelay: `${idx * 0.05}s`,
                            boxShadow: isRead ? "none" : "0 1px 3px rgba(59, 130, 246, 0.1)",
                            opacity: isRead ? 0.7 : 1,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#f1f5f9";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                            e.currentTarget.style.transform = "translateX(4px)";
                            e.currentTarget.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = isRead ? "#f9fafb" : "#ffffff";
                            e.currentTarget.style.boxShadow = isRead ? "none" : "0 1px 3px rgba(59, 130, 246, 0.1)";
                            e.currentTarget.style.transform = "translateX(0)";
                            e.currentTarget.style.opacity = isRead ? "0.7" : "1";
                          }}
                        >
                          {/* Unread indicator dot */}
                          {!isRead && (
                            <div style={{
                              position: "absolute",
                              left: 6,
                              top: "50%",
                              transform: "translateY(-50%)",
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "#3b82f6",
                            }} />
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, paddingLeft: !isRead ? 10 : 0 }}>
                            <div style={{ fontSize: 15, fontWeight: isRead ? 600 : 700, color: isRead ? "#6b7280" : "#1f2937", flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{
                                background: isRead ? "#9ca3af" : "#3b82f6",
                                color: "#fff",
                                padding: "3px 8px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 700,
                              }}>#{order.numericId}</span>
                              <span>{order.customer?.substring(0, 18) || "Guest"}</span>
                            </div>
                            <div style={{
                              fontSize: 16,
                            fontWeight: 800,
                            color: "#059669",
                            whiteSpace: "nowrap",
                            marginLeft: 12,
                            background: "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                            padding: "4px 10px",
                            borderRadius: 8,
                          }}>
                            ₱{(typeof order.total === "string" ? parseFloat(order.total) : order.total).toFixed(2)}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          {order.orderType && (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "5px 10px",
                                borderRadius: 8,
                                background: order.orderType === "PICKUP"
                                  ? "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)"
                                  : "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
                                color: order.orderType === "PICKUP" ? "#92400e" : "#1e40af",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              {order.orderType === "PICKUP" ? "🏪" : "🚗"} {order.orderType}
                            </span>
                          )}
                          {order.status && (
                            <span
                              style={{
                                fontSize: 11,
                                padding: "5px 10px",
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #fef08a 0%, #fde047 100%)",
                                color: "#854d0e",
                                fontWeight: 700,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              ⏳ {order.status}
                            </span>
                          )}
                          <span style={{
                            fontSize: 11,
                            color: "#9ca3af",
                            marginLeft: "auto",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}>
                            🕐 {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer with view all link */}
              {newOrders.length > 0 && (
                <div style={{
                  padding: "14px 18px",
                  borderTop: "1px solid #e5e7eb",
                  background: "#f8fafc",
                  textAlign: "center",
                }}>
                  <button
                    onClick={() => {
                      setNotificationOpen(false);
                      window.location.href = "/admin/orders";
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#3b82f6",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      margin: "0 auto",
                      padding: "6px 12px",
                      borderRadius: 8,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#eff6ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    View all orders
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Admin Menu */}
        <div ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((s) => !s)}
            style={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              border: "1px solid #e5e7eb",
              background: dropdownOpen ? "#3b82f6" : "#f8fafc",
              color: dropdownOpen ? "#fff" : "#6b7280",
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
              transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            title="Admin Menu"
            onMouseEnter={(e) => {
              if (!dropdownOpen) {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!dropdownOpen) {
                e.currentTarget.style.backgroundColor = "#f8fafc";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            👤
          </button>

          {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: 52,
              right: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              minWidth: 220,
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px", borderBottom: "1px solid #e5e7eb", background: "#f8fafc" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1f2937", marginBottom: 3 }}>👨‍💼 Admin User</div>
              <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Administrator</div>
            </div>

            <div style={{ padding: "6px 0" }}>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/admin/profile");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "background 200ms ease",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path fillRule="evenodd" d="M14 14s-1-4-6-4-6 4-6 4 1 1 6 1 6-1 6-1Z" />
                </svg>
                <span>Profile</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/admin/settings");
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "background 200ms ease",
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                  <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm1.586-4.541a.375.375 0 0 0 0 .75.375.375 0 0 0 0-.75zm-4.348 0a.375.375 0 0 0 0 .75.375.375 0 0 0 0-.75zM4.5 8.75a.375.375 0 1 0 0 .75.375.375 0 0 0 0-.75zm4 0a.375.375 0 1 0 0 .75.375.375 0 0 0 0-.75zm4-4a.375.375 0 1 0 0 .75.375.375 0 0 0 0-.75zM13.914 7.5a.375.375 0 1 0 0 .75.375.375 0 0 0 0-.75zm0 4a.375.375 0 1 0 0 .75.375.375 0 0 0 0-.75zM2 8.75a.375.375 0 1 0 0 .75.375.375 0 0 0 0-.75z"/>
                </svg>
                <span>Settings</span>
              </button>

              <div style={{ borderTop: "1px solid #f0f0f0", margin: "6px 0" }}></div>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "background 200ms ease",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h4a.5.5 0 0 0 0-1h-4Z" />
                  <path d="M9.146 10.854a.5.5 0 0 0 .708 0l2.5-2.5a.5.5 0 0 0 0-.708l-2.5-2.5a.5.5 0 1 0-.708.708L11.293 7.5H6.5a.5.5 0 0 0 0 1h4.793l-1.147 1.146a.5.5 0 0 0 0 .708Z" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </header>
    </>
  );
}