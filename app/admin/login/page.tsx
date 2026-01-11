"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Show loading
    Swal.fire({
      title: 'Logging in...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: data?.error || "Invalid credentials. Please try again.",
          confirmButtonColor: '#0070f3'
        });
        return;
      }
      try {
        localStorage.setItem("admin_token", "local-session");
      } catch (e) {}

      Swal.fire({
        icon: 'success',
        title: 'Welcome Back!',
        text: 'Login successful',
        timer: 1500,
        showConfirmButton: false
      }).then(() => {
        router.push("/admin/Dashboard");
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Connection Error',
        text: 'Unable to connect to the server. Please check your connection.',
        confirmButtonColor: '#0070f3'
      });
    }
  }

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ width: 360, maxWidth: "100%", padding: 20, border: "1px solid #eee", borderRadius: 8, background: "#fff" }}>
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "block", marginBottom: 6 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123" style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ddd" }} />
        </div>
        {error && <div style={{ color: "#b32", marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}>
          <button type="submit" style={{ padding: "8px 12px", borderRadius: 6, background: "#0070f3", color: "#fff", border: "none", cursor: "pointer" }}>Sign in</button>
          <div style={{ fontSize: 12, color: "#666" }}>Use your admin credentials</div>
        </div>
      </form>
    </div>
  );
}
