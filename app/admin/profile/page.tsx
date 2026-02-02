"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";
import { formatDateOnly } from "@/lib/date-utils";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminData, setAdminData] = useState({
    username: "",
    email: "",
    role: "Administrator",
    createdAt: "",
  });
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navItems = [
    { label: "Dashboard", href: "/admin/Dashboard" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Food Menu", href: "/admin/food-menu" },
    { label: "Archive", href: "/admin/archive" },
    { label: "Completed", href: "/admin/Completed" },
    { label: "Income", href: "/admin/Income" },
  ];

  useEffect(() => {
    let token: string | null = null;
    try {
      token = localStorage.getItem("admin_token");
    } catch (e) {
      token = null;
    }
    if (!token) {
      router.push("/admin/login");
      return;
    }

    // Fetch admin profile from API
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/admin/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // If unauthorized, redirect to login
          if (res.status === 401) {
            localStorage.removeItem("admin_token");
            router.push("/admin/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();

        // Handle Firebase Timestamp format (comes as {_seconds, _nanoseconds} or string)
        let createdAtStr = "";
        if (data.createdAt) {
          if (data.createdAt._seconds) {
            // Firebase Timestamp format
            createdAtStr = new Date(data.createdAt._seconds * 1000).toISOString().split("T")[0];
          } else if (typeof data.createdAt === "string") {
            createdAtStr = new Date(data.createdAt).toISOString().split("T")[0];
          } else if (data.createdAt.seconds) {
            // Alternative Timestamp format
            createdAtStr = new Date(data.createdAt.seconds * 1000).toISOString().split("T")[0];
          }
        }

        const profileData = {
          username: data.username || "admin",
          email: data.email || "",
          role: "Administrator",
          createdAt: createdAtStr,
        };
        setAdminData(profileData);
        setEditForm({
          username: profileData.username,
          email: profileData.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        // Fallback to stored username
        const storedUsername = localStorage.getItem("admin_username") || "admin";
        setAdminData({
          username: storedUsername,
          email: "",
          role: "Administrator",
          createdAt: "",
        });
        setEditForm({
          username: storedUsername,
          email: "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleSaveChanges = async () => {
    // Validate form
    if (!editForm.username.trim()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Username is required",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    if (!editForm.email.trim() || !editForm.email.includes("@")) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Valid email is required",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    // If changing password, validate password fields
    if (editForm.newPassword || editForm.confirmPassword) {
      if (!editForm.currentPassword) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "Current password is required to change password",
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      if (editForm.newPassword.length < 6) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "New password must be at least 6 characters",
          confirmButtonColor: "#dc2626",
        });
        return;
      }

      if (editForm.newPassword !== editForm.confirmPassword) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: "New passwords do not match",
          confirmButtonColor: "#dc2626",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
          currentPassword: editForm.currentPassword || undefined,
          newPassword: editForm.newPassword || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local state with new data
      setAdminData({
        ...adminData,
        username: data.user?.username || editForm.username,
        email: data.user?.email || editForm.email,
      });

      setSaving(false);
      setEditing(false);

      Swal.fire({
        icon: "success",
        title: "Profile Updated!",
        text: editForm.newPassword
          ? "Your profile and password have been updated successfully"
          : "Your profile has been updated successfully",
        timer: 2000,
        showConfirmButton: false,
      });

      // Clear password fields
      setEditForm({
        ...editForm,
        username: data.user?.username || editForm.username,
        email: data.user?.email || editForm.email,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setSaving(false);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: error.message || "Failed to update profile",
        confirmButtonColor: "#dc2626",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      username: adminData.username,
      email: adminData.email,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setEditing(false);
  };

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0 }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, padding: 24, background: "#f9fafb" }}>
          {/* Header */}
          <header style={{ marginBottom: 24 }}>
            <h1 style={{ margin: 0, display: "flex", alignItems: "center", gap: 8, fontSize: 28, color: "#1f2937" }}>
              👤 Admin Profile
            </h1>
            <p style={{ color: "#6b7280", margin: "8px 0 0 0", fontSize: 14 }}>
              Manage your account information and security
            </p>
          </header>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
          ) : (
            <div style={{ maxWidth: 800 }}>
              {/* Profile Card */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", marginBottom: 20 }}>
                {/* Avatar Section */}
                <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 30, paddingBottom: 20, borderBottom: "1px solid #e5e7eb" }}>
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 36,
                      color: "#fff",
                      border: "4px solid #e5e7eb",
                    }}
                  >
                    👤
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 24, color: "#1f2937" }}>{adminData.username}</h2>
                    <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: 14 }}>{adminData.role}</p>
                    <p style={{ margin: "4px 0 0 0", color: "#9ca3af", fontSize: 12 }}>
                      Member since {formatDateOnly(adminData.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Profile Information */}
                {!editing ? (
                  <div>
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                        Username
                      </label>
                      <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 6, fontSize: 14, color: "#1f2937" }}>
                        {adminData.username}
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                        Email Address
                      </label>
                      <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 6, fontSize: 14, color: "#1f2937" }}>
                        {adminData.email}
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                        Role
                      </label>
                      <div style={{ padding: "10px 12px", background: "#f9fafb", borderRadius: 6, fontSize: 14, color: "#1f2937" }}>
                        {adminData.role}
                      </div>
                    </div>

                    <button
                      onClick={() => setEditing(true)}
                      style={{
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#fff",
                        border: "none",
                        padding: "10px 20px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 14,
                        fontWeight: 600,
                        marginTop: 10,
                      }}
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                        Username *
                      </label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontSize: 14,
                          outline: "none",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontSize: 14,
                          outline: "none",
                        }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                      />
                    </div>

                    {/* Password Change Section */}
                    <div style={{ marginTop: 30, paddingTop: 20, borderTop: "1px solid #e5e7eb" }}>
                      <h3 style={{ margin: "0 0 16px 0", fontSize: 16, color: "#1f2937" }}>Change Password (Optional)</h3>

                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={editForm.currentPassword}
                          onChange={(e) => setEditForm({ ...editForm, currentPassword: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            fontSize: 14,
                            outline: "none",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                        />
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          New Password
                        </label>
                        <input
                          type="password"
                          value={editForm.newPassword}
                          onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            fontSize: 14,
                            outline: "none",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                          placeholder="At least 6 characters"
                        />
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={editForm.confirmPassword}
                          onChange={(e) => setEditForm({ ...editForm, confirmPassword: e.target.value })}
                          style={{
                            width: "100%",
                            padding: "10px 12px",
                            border: "1px solid #e5e7eb",
                            borderRadius: 6,
                            fontSize: 14,
                            outline: "none",
                          }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#667eea")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                      <button
                        onClick={handleSaveChanges}
                        disabled={saving}
                        style={{
                          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                          color: "#fff",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: 8,
                          cursor: saving ? "not-allowed" : "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        {saving ? "Saving..." : "💾 Save Changes"}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={saving}
                        style={{
                          background: "#f3f4f6",
                          color: "#374151",
                          border: "1px solid #d1d5db",
                          padding: "10px 20px",
                          borderRadius: 8,
                          cursor: saving ? "not-allowed" : "pointer",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Info Card */}
              <div style={{ background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#1f2937", display: "flex", alignItems: "center", gap: 8 }}>
                  🔒 Security Information
                </h3>
                <div style={{ fontSize: 14, color: "#6b7280", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 12px 0" }}>
                    <strong>Last Login:</strong> {new Date().toLocaleString()}
                  </p>
                  <p style={{ margin: "0 0 12px 0" }}>
                    <strong>Account Status:</strong>{" "}
                    <span style={{ color: "#10b981", fontWeight: 600 }}>Active</span>
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>Security Tip:</strong> Use a strong, unique password and change it regularly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
