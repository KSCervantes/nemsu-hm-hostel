"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type NavItem = { label: string; href: string };

export default function Sidebar({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  return (
    <aside
      style={{
        width: open ? 280 : 80,
        transition: "width 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        borderRight: "1px solid #e5e7eb",
        padding: "16px 12px",
        boxSizing: "border-box",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: open ? "space-between" : "center",
        marginBottom: 16,
        padding: "12px 8px",
        transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        background: "#f8fafc",
        borderRadius: "12px",
        border: "1px solid #e5e7eb"
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 160ms ease"
        }}>
          <img
            src="/img/NEMSU.png"
            alt="Logo"
            style={{
              width: open ? 70 : 40,
              height: open ? 70 : 40,
              borderRadius: "50%",
              objectFit: "cover",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              transition: "all 160ms ease",
              border: "3px solid #e5e7eb",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.15)";
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
              e.currentTarget.style.transform = "scale(1)";
            }}
            onClick={() => router.push("/admin/Dashboard")}
          />
        </div>
        {open && (
          <button
            aria-label="Toggle sidebar"
            onClick={() => setOpen((s) => !s)}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              fontSize: "20px",
              fontWeight: "bold",
              color: "#6b7280",
              transition: "all 160ms ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#3b82f6";
              e.currentTarget.style.transform = "scale(1.2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#6b7280";
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            {open ? "«" : "»"}
          </button>
        )}
      </div>
      {!open && (
        <button
          aria-label="Toggle sidebar"
          onClick={() => setOpen((s) => !s)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 8,
            fontSize: "16px",
            fontWeight: "bold",
            color: "#6b7280",
            transition: "all 160ms ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 12,
            borderRadius: "6px"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#3b82f6";
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.transform = "scale(1.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#6b7280";
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          »
        </button>
      )}

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((it) => {
            let icon;
            if (it.label === "Dashboard") {
              icon = (
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z" />
                  <path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z" />
                </svg>
              );
            } else if (it.label === "Orders") {
              icon = (
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
                </svg>
              );
            } else if (it.label === "Food Menu") {
              icon = (
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9V5.5z" />
                  <path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z" />
                </svg>
              );
            } else if (it.label === "Archive") {
              icon = (
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                </svg>
              );
            } else if (it.label === "Income") {
              icon = (
                <svg width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 119.43 122.88">
                  <path d="M118.45,51l1,1-.74,9.11H99A40.52,40.52,0,0,1,81.88,78.43q-11.44,6.28-27.71,7h-15l.5,37.43H21.42l.74-36.94-.24-24.87H1L0,59.84.74,51H21.92l-.25-15.26H1l-1-1,.74-9.11H21.67L21.42.25,63.29,0Q78.8,0,88.65,6.53T102,25.61h16.5l1,1.23-.74,8.87h-15v3.94A53.17,53.17,0,0,1,102.44,51ZM39.65,25.61H81.26Q74.85,14,58.61,13.3L39.89,14l-.24,11.57ZM39.4,51H83.23a39.51,39.51,0,0,0,1.23-9.6,46.17,46.17,0,0,0-.24-5.66H39.65L39.4,51ZM58.61,71.91q12.56-2.72,19.21-10.84H39.4l-.25,10.1,19.46.74Z"/>
                </svg>
              );
            } else if (it.label === "Completed") {
              icon = (
                <svg width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/>
                  <path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm15 0a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2z"/>
                </svg>
              );
            } else {
              icon = <span style={{ fontSize: "16px", fontWeight: "bold" }}>{it.label.charAt(0)}</span>;
            }

            return (
              <li key={it.href} style={{ marginBottom: 10 }}>
                <Link
                  href={it.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 12px",
                    color: pathname === it.href ? "#3b82f6" : "#374151",
                    textDecoration: "none",
                    borderRadius: 10,
                    fontSize: "15px",
                    fontWeight: pathname === it.href ? "700" : "600",
                    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    backgroundColor: pathname === it.href ? "#eff6ff" : "transparent",
                    border: pathname === it.href ? "1px solid #bfdbfe" : "1px solid transparent",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: pathname === it.href ? "0 1px 3px rgba(59, 130, 246, 0.1)" : "none"
                  }}
                  onMouseEnter={(e) => {
                    if (pathname !== it.href) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9";
                      (e.currentTarget as HTMLElement).style.border = "1px solid #e5e7eb";
                      (e.currentTarget as HTMLElement).style.transform = "translateX(4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (pathname !== it.href) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      (e.currentTarget as HTMLElement).style.border = "1px solid transparent";
                      (e.currentTarget as HTMLElement).style.transform = "translateX(0)";
                    }
                  }}
                >
                  <div style={{
                    width: 36,
                    height: 36,
                    textAlign: "center",
                    color: pathname === it.href ? "#3b82f6" : "#6b7280",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    transition: "all 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                    borderRadius: "8px",
                    backgroundColor: pathname === it.href ? "#dbeafe" : "#f3f4f6",
                    flexShrink: 0
                  }}>
                    {icon}
                  </div>
                  {open && <span style={{ letterSpacing: "0.4px", flex: 1 }}>{it.label}</span>}
                  {open && pathname === it.href && (
                    <div style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#3b82f6"
                    }}></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
