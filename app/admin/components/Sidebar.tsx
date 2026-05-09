"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  badge?: number;
  submenu?: NavItem[];
};

function SettingsIcon({ size = 20 }: { size?: number }) {
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
      <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Sidebar({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const sidebarWidth = open ? 280 : 80;

  function toggleMenu(label: string) {
    setExpandedMenu(expandedMenu === label ? null : label);
  }

  function getIcon(label: string) {
    const iconMap: Record<string, ReactNode> = {
      Dashboard: (
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="7" height="9" x="3" y="3" rx="1"/>
          <rect width="7" height="5" x="14" y="3" rx="1"/>
          <rect width="7" height="9" x="14" y="12" rx="1"/>
          <rect width="7" height="5" x="3" y="16" rx="1"/>
        </svg>
      ),
      Orders: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
        </svg>
      ),
      "Food Menu": (
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M7 8h10"/>
          <path d="M7 12h10"/>
          <path d="M7 16h10"/>
        </svg>
      ),
      Archive: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
        </svg>
      ),
      Completed: (
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.801 10A10 10 0 1 1 17 3.335"/>
          <path d="m9 11 3 3L22 4"/>
        </svg>
      ),
      Income: (
        <svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="currentColor">
          <path d="M23 12h-2.08a7 7 0 0 0 .08-1.21 6.82 6.82 0 0 0-.08-.79H23a1 1 0 0 0 0-2h-2.72a7.32 7.32 0 0 0-6.53-4H11a2 2 0 0 0-2 2v2H7a1 1 0 0 0 0 2h2v2H7a1 1 0 0 0 0 2h2v11a1 1 0 0 0 2 0v-7h3a6.9 6.9 0 0 0 5-2.13A6.62 6.62 0 0 0 20.32 14H23a1 1 0 0 0 0-2ZM11 6h2.75a5.35 5.35 0 0 1 4.17 2H11Zm0 4h7.88a4.83 4.83 0 0 1 .12.85 5.54 5.54 0 0 1-.11 1.15H11Zm6.59 4.48A5 5 0 0 1 14 16h-3v-2h7a5.71 5.71 0 0 1-.41.48Z"/>
        </svg>
      ),
      Inbox: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M.5 1a.5.5 0 0 0 0 1h1.11l.5 4H.5a.5.5 0 0 0 0 1h.756l1.487 5.5A1.5 1.5 0 0 0 4.5 14h7a1.5 1.5 0 0 0 1.456-1.088l1.487-5.5H15.5a.5.5 0 0 0 0-1H13.39l.5-4H15.5a.5.5 0 0 0 0-1H.5zm2.561 5l.5 4h9.878l.5-4H3.061z" />
        </svg>
      ),
      Contacts: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm.494 7.172a.75.75 0 0 0-1.392.368l.712 3.574a.5.5 0 0 0 .488.392h1.196a.5.5 0 0 0 .488-.392l.712-3.574a.75.75 0 1 0-1.392-.368l-.712 3.574H8.5l-.712-3.574Z" />
          <path d="M5.5 5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1-.5-.5Z" />
        </svg>
      ),
      Settings: (
        <SettingsIcon />
      ),
      Feedback: (
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
        </svg>
      ),
    };
    return iconMap[label] || (
      <span style={{ fontSize: "14px", fontWeight: "bold" }}>
        {label.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <aside
      style={{
        width: sidebarWidth,
        transition: "width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
        borderRight: "1px solid #f0f0f0",
        padding: "24px 12px",
        boxSizing: "border-box",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        overflow: "visible",
      }}
    >
      <button
        type="button"
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        title={open ? "Collapse sidebar" : "Expand sidebar"}
        onClick={() => setOpen((s) => !s)}
        style={{
          position: "absolute",
          top: "50%",
          right: -18,
          transform: "translateY(-50%)",
          width: 36,
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#6b7280",
          backgroundColor: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "999px",
          boxShadow: "0 8px 20px rgba(15, 23, 42, 0.12)",
          cursor: "pointer",
          transition: "all 180ms cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 30,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#eff6ff";
          e.currentTarget.style.borderColor = "#bfdbfe";
          e.currentTarget.style.color = "#2563eb";
          e.currentTarget.style.transform = "translateY(-50%) scale(1.05)";
          e.currentTarget.style.boxShadow = "0 10px 24px rgba(37, 99, 235, 0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#ffffff";
          e.currentTarget.style.borderColor = "#e5e7eb";
          e.currentTarget.style.color = "#6b7280";
          e.currentTarget.style.transform = "translateY(-50%)";
          e.currentTarget.style.boxShadow = "0 8px 20px rgba(15, 23, 42, 0.12)";
        }}
      >
        {open ? (
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ transition: "transform 280ms ease", transform: "scaleX(-1)" }}>
            <path d="M12 14.72a.75.75 0 0 0 0 1.06.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 0 0 0-1.06L13 8.22a.75.75 0 0 0-1 1.06L14.69 12Zm-4.25 0a.75.75 0 0 0 0 1.06.75.75 0 0 0 1.06 0L12 12.53a.75.75 0 0 0 0-1.06L8.78 8.22a.75.75 0 0 0-1.06 1.06L10.44 12Z"/>
          </svg>
        ) : (
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ transition: "transform 280ms ease" }}>
            <path d="M12 14.72a.75.75 0 0 0 0 1.06.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 0 0 0-1.06L13 8.22a.75.75 0 0 0-1 1.06L14.69 12Zm-4.25 0a.75.75 0 0 0 0 1.06.75.75 0 0 0 1.06 0L12 12.53a.75.75 0 0 0 0-1.06L8.78 8.22a.75.75 0 0 0-1.06 1.06L10.44 12Z"/>
          </svg>
        )}
      </button>

      {/* Header with Logo and Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          minHeight: open ? 84 : 60,
        }}
      >
        <Image
          src="/img/NEMSU.png"
          alt="NEMSU Logo"
          width={open ? 76 : 48}
          height={open ? 76 : 48}
          priority
          style={{
            width: open ? 76 : 48,
            height: open ? 76 : 48,
            borderRadius: open ? "16px" : "10px",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, marginBottom: 24 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => {
            const isActive = pathname === item.href;
            const isMenuOpen = expandedMenu === item.label;

            return (
              <li key={item.href} style={{ marginBottom: 4 }}>
                <div
                  onClick={() => {
                    if (item.submenu && item.submenu.length > 0) {
                      toggleMenu(item.label);
                    } else {
                      router.push(item.href);
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 12px",
                    color: isActive ? "#2563eb" : "#6b7280",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: isActive ? "600" : "500",
                    transition: "all 180ms ease",
                    backgroundColor: isActive ? "#eff6ff" : "transparent",
                    cursor: "pointer",
                    border: isActive ? "1px solid #dbeafe" : "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "#f3f4f6";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "6px",
                        backgroundColor: isActive ? "#dbeafe" : "#f3f4f6",
                        color: "currentColor",
                        transition: "all 180ms ease",
                        flexShrink: 0,
                      }}
                    >
                      {getIcon(item.label)}
                    </div>
                    {open && (
                      <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* Badge and Submenu Arrow */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.badge && open && (
                      <span
                        style={{
                          minWidth: "24px",
                          height: "24px",
                          borderRadius: "12px",
                          backgroundColor: "#ef4444",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "11px",
                          fontWeight: "600",
                          flexShrink: 0,
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.submenu && item.submenu.length > 0 && open && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                        style={{
                          transition: "transform 200ms ease",
                          transform: isMenuOpen ? "rotate(90deg)" : "rotate(0deg)",
                          flexShrink: 0,
                        }}
                      >
                        <path d="M6.354 1.646a.5.5 0 0 1 0 .708L2.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Submenu */}
                {item.submenu &&
                  item.submenu.length > 0 &&
                  isMenuOpen &&
                  open && (
                    <ul
                      style={{
                        listStyle: "none",
                        padding: "4px 0 4px 12px",
                        margin: 0,
                        borderLeft: "2px solid #e5e7eb",
                        marginLeft: "16px",
                        paddingLeft: "12px",
                      }}
                    >
                      {item.submenu.map((subitem) => {
                        const isSubActive = pathname === subitem.href;
                        return (
                          <li key={subitem.href} style={{ marginBottom: 2 }}>
                            <Link
                              href={subitem.href}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 10,
                                padding: "8px 12px",
                                color: isSubActive ? "#2563eb" : "#9ca3af",
                                textDecoration: "none",
                                borderRadius: "6px",
                                fontSize: "13px",
                                fontWeight: isSubActive ? "600" : "500",
                                transition: "all 180ms ease",
                                backgroundColor: isSubActive ? "#eff6ff" : "transparent",
                              }}
                              onMouseEnter={(e) => {
                                if (!isSubActive) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb";
                                  (e.currentTarget as HTMLElement).style.color = "#6b7280";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isSubActive) {
                                  (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                  (e.currentTarget as HTMLElement).style.color = "#9ca3af";
                                }
                              }}
                            >
                              {subitem.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
