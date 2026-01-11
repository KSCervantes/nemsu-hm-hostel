"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type NavItem = { label: string; href: string };

export default function Sidebar({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  return (
    <aside
      style={{
        width: open ? 220 : 64,
        transition: "width 160ms ease",
        borderRight: "1px solid #e2e8f0",
        padding: "12px 10px",
        boxSizing: "border-box",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: "#fff",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src="/img/Back.jpg"
            alt="Logo"
            style={{ width: open ? 80 : 40, height: open ? 80 : 40, borderRadius: "50%", objectFit: "cover" }}
          />
        </div>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setOpen((s) => !s)}
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6 }}
        >
          {open ? "«" : "»"}
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((it) => {
            let icon;
            if (it.label === "Dashboard") {
              icon = (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5V6a.5.5 0 0 1-1 0V4.5A.5.5 0 0 1 8 4zM3.732 5.732a.5.5 0 0 1 .707 0l.915.914a.5.5 0 1 1-.708.708l-.914-.915a.5.5 0 0 1 0-.707zM2 10a.5.5 0 0 1 .5-.5h1.586a.5.5 0 0 1 0 1H2.5A.5.5 0 0 1 2 10zm9.5 0a.5.5 0 0 1 .5-.5h1.5a.5.5 0 0 1 0 1H12a.5.5 0 0 1-.5-.5zm.754-4.246a.389.389 0 0 0-.527-.02L7.547 9.31a.91.91 0 1 0 1.302 1.258l3.434-4.297a.389.389 0 0 0-.029-.518z"/>
                  <path fillRule="evenodd" d="M0 10a8 8 0 1 1 15.547 2.661c-.442 1.253-1.845 1.602-2.932 1.25C11.309 13.488 9.475 13 8 13c-1.474 0-3.31.488-4.615.911-1.087.352-2.49.003-2.932-1.25A7.988 7.988 0 0 1 0 10zm8-7a7 7 0 0 0-6.603 9.329c.203.575.923.876 1.68.63C4.397 12.533 6.358 12 8 12s3.604.532 4.923.96c.757.245 1.477-.056 1.68-.631A7 7 0 0 0 8 3z"/>
                </svg>
              );
            } else if (it.label === "Orders") {
              icon = (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
              );
            } else if (it.label === "Food Menu") {
              icon = (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8.5 5.5a.5.5 0 0 0-1 0v3.362l-1.429 2.38a.5.5 0 1 0 .858.515l1.5-2.5A.5.5 0 0 0 8.5 9V5.5z"/>
                  <path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"/>
                </svg>
              );
            } else if (it.label === "Archive") {
              icon = (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1v7.5a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 1 12.5V5a1 1 0 0 1-1-1V2zm2 3v7.5A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V5H2zm13-3H1v2h14V2zM5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z"/>
                </svg>
              );
            } else if (it.label === "Income") {
              icon = (
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M4 10.781c.148 1.667 1.513 2.85 3.591 3.003V15h1.043v-1.216c2.27-.179 3.678-1.438 3.678-3.3 0-1.59-.947-2.51-2.956-3.028l-.722-.187V3.467c1.122.11 1.879.714 2.07 1.616h1.47c-.166-1.6-1.54-2.748-3.54-2.875V1H7.591v1.233c-1.939.23-3.27 1.472-3.27 3.156 0 1.454.966 2.483 2.661 2.917l.61.162v4.031c-1.149-.17-1.94-.8-2.131-1.718H4zm3.391-3.836c-1.043-.263-1.6-.825-1.6-1.616 0-.944.704-1.641 1.8-1.828v3.495l-.2-.05zm1.591 1.872c1.287.323 1.852.859 1.852 1.769 0 1.097-.826 1.828-2.2 1.939V8.73l.348.086z"/>
                </svg>
              );
            } else {
              icon = <span>{it.label.charAt(0)}</span>;
            }

            return (
              <li key={it.href} style={{ marginBottom: 6 }}>
                <Link href={it.href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", color: "#111", textDecoration: "none", borderRadius: 6 }}>
                  <div style={{ width: 28, textAlign: "center", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
                  {open && <span>{it.label}</span>}
                </Link>
              </li>
            );
          })}
          {/* Completed view shortcut */}
          <li style={{ marginBottom: 6 }}>
            <Link href="/admin/Completed" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 8px", color: "#111", textDecoration: "none", borderRadius: 6 }}>
              <div style={{ width: 28, textAlign: "center", color: "#666", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M6.173 9.428 4.5 7.757l-1.06 1.06L6.173 12l6.889-6.889L11.999 3.5 6.173 9.428z"/></svg>
              </div>
              {open && <span>Completed</span>}
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
