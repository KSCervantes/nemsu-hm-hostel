"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  title?: string;
  subtitle?: string;
  breadcrumbs?: string[];
}

export default function AdminHeader({ title, subtitle, breadcrumbs }: AdminHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "12px 32px 12px 32px",
        position: "sticky",
        top: 0,
        zIndex: 30,
        background: "#fff",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>{title || "Admin"}</div>
          {subtitle && (
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>{subtitle}</div>
          )}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {breadcrumbs.join(" / ")}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((s) => !s)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: "1px solid #e2e8f0",
            background: dropdownOpen ? "#1e293b" : "#fff",
            color: dropdownOpen ? "#fff" : "#475569",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          title="Admin Menu"
        >
          A
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: 48,
              right: 0,
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
              minWidth: 200,
              zIndex: 1000,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #e5e7eb", background: "#f9fafb" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#1f2937", marginBottom: 2 }}>Admin User</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Administrator</div>
            </div>

            <div style={{ padding: "6px 0" }}>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/admin/profile");
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
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
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#374151",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 1a2 2 0 0 0-1.985 1.75l-.11.88-.878.11A2 2 0 0 0 3.25 5.5l-.768.64-.64.768a2 2 0 0 0 .66 3.058l.802.401.401.802a2 2 0 0 0 3.059.66l.768-.64.64-.768a2 2 0 0 0 .11-1.107l-.11-.879.879-.11A2 2 0 0 0 12.75 8.5l.768-.64.64-.768a2 2 0 0 0-.66-3.059l-.802-.401-.401-.802a2 2 0 0 0-3.059-.66l-.768.64-.64.768a2 2 0 0 0-.11 1.107l.11.879-.879.11A2 2 0 0 0 5.5 7.75l-.768.64-.64.768a2 2 0 0 0 .66 3.059l.802.401.401.802a2 2 0 0 0 3.059.66l.768-.64.64-.768a2 2 0 0 0 .11-1.107l-.11-.879.879-.11A2 2 0 0 0 12.75 8.5l.768-.64.64-.768a2 2 0 0 0-.66-3.059l-.802-.401-.401-.802a2 2 0 0 0-3.059-.66l-.768.64-.64.768a2 2 0 0 0-.11 1.107l.11.879-.879.11A2 2 0 0 0 5.5 7.75Z" />
                </svg>
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  handleLogout();
                }}
                style={{
                  width: "100%",
                  padding: "10px 16px",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#b91c1c",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.2s",
                  fontWeight: 600,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h4a.5.5 0 0 0 0-1h-4a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h4a.5.5 0 0 0 0-1h-4Z" />
                  <path d="M9.146 10.854a.5.5 0 0 0 .708 0l2.5-2.5a.5.5 0 0 0 0-.708l-2.5-2.5a.5.5 0 1 0-.708.708L11.293 7.5H6.5a.5.5 0 0 0 0 1h4.793l-1.147 1.146a.5.5 0 0 0 0 .708Z" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}