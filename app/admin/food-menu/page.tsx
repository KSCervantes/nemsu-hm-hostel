"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import AdminHeader from "../components/AdminHeader";
import Swal from "sweetalert2";

type FoodItem = {
  id: number;
  name: string;
  description?: string;
  price: string;
  category?: string;
  code?: string;
  img?: string;
  available: boolean;
};

export default function AdminFoodMenuPage() {
  const router = useRouter();
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "main",
    code: "",
    img: "",
    available: true,
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

    fetchItems();
  }, [router]);

  function fetchItems() {
    setLoading(true);
    fetch("/api/food-items")
      .then((res) => res.json())
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      price: "",
      category: "main",
      code: "",
      img: "",
      available: true,
    });
    setEditingItem(null);
    setShowForm(false);
  }

  function handleEdit(item: FoodItem) {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category || "main",
      code: item.code || "",
      img: item.img || "",
      available: item.available,
    });
    setShowForm(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File Type",
        text: "Please upload a JPEG, PNG, WebP, or GIF image.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Maximum file size is 5MB.",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setFormData({ ...formData, img: data.url });

      Swal.fire({
        icon: "success",
        title: "Image Uploaded!",
        text: "Your image has been uploaded successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.message || "Failed to upload image. Please try again.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      category: formData.category,
      code: formData.code,
      img: formData.img,
      available: formData.available,
    };

    Swal.fire({
      title: editingItem ? 'Updating...' : 'Creating...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      if (editingItem) {
        const res = await fetch(`/api/food-items/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to update");
        }
      } else {
        const res = await fetch("/api/food-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to create");
        }
      }
      fetchItems();
      resetForm();

      Swal.fire({
        icon: 'success',
        title: editingItem ? 'Updated!' : 'Created!',
        text: `Menu item "${payload.name}" has been ${editingItem ? 'updated' : 'added'} successfully`,
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.message || "Failed to save item. Please try again.",
        confirmButtonColor: '#dc2626'
      });
    }
  }

  async function handleDelete(id: number) {
    const item = items.find(i => i.id === id);
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete Menu Item?',
      text: `Are you sure you want to delete "${item?.name || 'this item'}"? This action cannot be undone.`,
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/food-items/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchItems();

      Swal.fire({
        icon: 'success',
        title: 'Deleted!',
        text: 'Menu item has been deleted successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete item. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    }
  }

  return (
    <div style={{ fontFamily: "system-ui,Segoe UI,Roboto,Helvetica,Arial", padding: 0 }}>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <AdminHeader title="Food Menu" subtitle="Manage menu items and products" breadcrumbs={["Home", "Food Menu"]} />
          <div style={{ padding: 32 }}>
            <div style={{ height: 12 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div />
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              style={{ background: "#0070f3", color: "#fff", border: "none", padding: "10px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
            >
              + Add New Product
            </button>
          </div>

          {loading && <div>Loading menu items...</div>}

          {!loading && items.length === 0 && <div>No items found. Add your first product!</div>}

          {!loading && items.length > 0 && (
            <div style={{ overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 8 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, background: "#fff" }}>
                <thead>
                  <tr style={{ textAlign: "left", background: "#f8fafc", borderBottom: "2px solid #e5e7eb" }}>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>ID</th>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Name</th>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Category</th>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Code</th>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Price</th>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151", borderRight: "1px solid #e5e7eb" }}>Available</th>
                    <th style={{ padding: "14px 12px", fontWeight: 600, color: "#374151" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>{item.id}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>{item.name}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>{item.category || "—"}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>{item.code || "—"}</td>
                      <td style={{ padding: "12px", fontWeight: 600, borderRight: "1px solid #e5e7eb" }}>₱{item.price}</td>
                      <td style={{ padding: "12px", borderRight: "1px solid #e5e7eb" }}>
                        <span style={{ background: item.available ? "#d1fae5" : "#fee2e2", color: item.available ? "#065f46" : "#991b1b", padding: "4px 8px", borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                          {item.available ? "Yes" : "No"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", display: "flex", gap: 8 }}>
                        <button onClick={() => handleEdit(item)} style={{ background: "#0070f3", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          Edit
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={resetForm} />

          <div style={{ position: "relative", maxWidth: 600, width: "100%", background: "#fff", borderRadius: 12, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginTop: 0 }}>{editingItem ? "Edit Product" : "Add New Product"}</h2>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Name *</label>
                <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Price *</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
                    <option value="main">Main Dishes</option>
                    <option value="snacks">Snacks</option>
                    <option value="desserts">Desserts</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Code</label>
                  <input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. M1, S2" style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }} />
                </div>

                <div>
                  <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Available</label>
                  <select value={formData.available ? "true" : "false"} onChange={(e) => setFormData({ ...formData, available: e.target.value === "true" })} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }}>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Product Image</label>

                {/* File Upload */}
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                    id="image-upload"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      background: uploading ? "#9ca3af" : "#10b981",
                      color: "#fff",
                      border: "none",
                      padding: "10px 16px",
                      borderRadius: 6,
                      cursor: uploading ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    {uploading ? (
                      <>
                        <span style={{ display: "inline-block", width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                        Uploading...
                      </>
                    ) : (
                      <>📷 Upload Image</>
                    )}
                  </button>
                  <small style={{ color: "#666", fontSize: 12, display: "block", marginTop: 4 }}>
                    Supported: JPEG, PNG, WebP, GIF (max 5MB)
                  </small>
                </div>

                {/* OR Divider */}
                <div style={{ display: "flex", alignItems: "center", margin: "12px 0" }}>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                  <span style={{ padding: "0 12px", color: "#9ca3af", fontSize: 12, fontWeight: 600 }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: "#e5e7eb" }} />
                </div>

                {/* URL Input */}
                <label style={{ display: "block", fontWeight: 500, marginBottom: 4, fontSize: 13, color: "#6b7280" }}>Paste Image URL</label>
                <input
                  value={formData.img}
                  onChange={(e) => setFormData({ ...formData, img: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 6 }}
                />

                {/* Image Preview */}
                {formData.img && (
                  <div style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#374151" }}>Preview:</p>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, img: "" })}
                        style={{ background: "#fee2e2", color: "#dc2626", border: "none", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 600 }}
                      >
                        ✕ Remove
                      </button>
                    </div>
                    <img
                      src={formData.img}
                      alt="Preview"
                      style={{ maxWidth: "100%", maxHeight: 200, objectFit: "contain", borderRadius: 6, border: "1px solid #e5e7eb" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                        const errorMsg = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                        if (errorMsg) errorMsg.style.display = "block";
                      }}
                    />
                    <p style={{ color: "#dc2626", fontSize: 12, margin: "8px 0 0 0", display: "none" }}>
                      ⚠️ Image failed to load. Please check the URL.
                    </p>
                  </div>
                )}
              </div>

              <style jsx>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button type="button" onClick={resetForm} style={{ background: "#f3f4f6", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ background: "#0070f3", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
                  {editingItem ? "Update" : "Add"} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
