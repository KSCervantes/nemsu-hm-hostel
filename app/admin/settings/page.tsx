"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // Theme Settings
    primaryColor: "#667eea",
    secondaryColor: "#764ba2",
    accentColor: "#10b981",
    dangerColor: "#dc2626",
    fontFamily: "system-ui",
    fontSize: "14",

    // Application Settings
    siteName: "Hostel Admin",
    itemsPerPage: "10",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h",

    // Notification Settings
    emailNotifications: true,
    orderNotifications: true,
    systemNotifications: true,

    // Advanced Settings
    enableDebugMode: false,
    sessionTimeout: "30",
  });

  const navItems = [
    { label: "Dashboard", href: "/admin/Dashboard" },
    { label: "Orders", href: "/admin/orders" },
    { label: "Food Menu", href: "/admin/food-menu" },
    { label: "Archive", href: "/admin/archive" },
  ];

  const fontOptions = [
    { value: "system-ui", label: "System UI" },
    { value: "Arial", label: "Arial" },
    { value: "Helvetica", label: "Helvetica" },
    { value: "Georgia", label: "Georgia" },
    { value: "Times New Roman", label: "Times New Roman" },
    { value: "Courier New", label: "Courier New" },
    { value: "Verdana", label: "Verdana" },
    { value: "Trebuchet MS", label: "Trebuchet MS" },
    { value: "Comic Sans MS", label: "Comic Sans MS" },
    { value: "Impact", label: "Impact" },
  ];

  const fontSizeOptions = [
    { value: "12", label: "Small (12px)" },
    { value: "14", label: "Medium (14px)" },
    { value: "16", label: "Large (16px)" },
    { value: "18", label: "Extra Large (18px)" },
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

    // Load settings from localStorage
    const savedSettings = localStorage.getItem("admin_settings");
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error("Failed to parse settings:", e);
      }
    }
    setLoading(false);
  }, [router]);

  const handleSaveSettings = async () => {
    setSaving(true);

    // Simulate API call
    setTimeout(() => {
      // Save to localStorage
      localStorage.setItem("admin_settings", JSON.stringify(settings));

      setSaving(false);

      Swal.fire({
        icon: "success",
        title: "Settings Saved!",
        text: "Your settings have been updated successfully. Refresh the page to see changes.",
        confirmButtonColor: settings.primaryColor,
        confirmButtonText: "OK",
      });
    }, 800);
  };

  const handleResetSettings = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Reset Settings?",
      text: "This will restore all settings to their default values.",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, reset",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    const defaultSettings = {
      primaryColor: "#667eea",
      secondaryColor: "#764ba2",
      accentColor: "#10b981",
      dangerColor: "#dc2626",
      fontFamily: "system-ui",
      fontSize: "14",
      siteName: "Hostel Admin",
      itemsPerPage: "10",
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      emailNotifications: true,
      orderNotifications: true,
      systemNotifications: true,
      enableDebugMode: false,
      sessionTimeout: "30",
    };

    setSettings(defaultSettings);
    localStorage.setItem("admin_settings", JSON.stringify(defaultSettings));

    Swal.fire({
      icon: "success",
      title: "Settings Reset!",
      text: "All settings have been restored to defaults.",
      timer: 2000,
      showConfirmButton: false,
    });
  };

  return (
    <div
      style={{
        fontFamily: settings.fontFamily,
        fontSize: `${settings.fontSize}px`,
        padding: 0,
      }}
    >
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar items={navItems} />

        <main style={{ flex: 1, padding: 24, background: "#f9fafb" }}>
          {/* Header */}
          <header style={{ marginBottom: 24 }}>
            <h1
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 28,
                color: "#1f2937",
              }}
            >
              ⚙️ Settings
            </h1>
            <p style={{ color: "#6b7280", margin: "8px 0 0 0", fontSize: 14 }}>
              Customize your admin panel appearance and preferences
            </p>
          </header>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>Loading...</div>
          ) : (
            <div style={{ maxWidth: 1000 }}>
              {/* Theme Settings */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: 20,
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  🎨 Theme & Appearance
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Primary Color */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Primary Color
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          setSettings({ ...settings, primaryColor: e.target.value })
                        }
                        style={{
                          width: 50,
                          height: 40,
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      />
                      <input
                        type="text"
                        value={settings.primaryColor}
                        onChange={(e) =>
                          setSettings({ ...settings, primaryColor: e.target.value })
                        }
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Secondary Color
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) =>
                          setSettings({ ...settings, secondaryColor: e.target.value })
                        }
                        style={{
                          width: 50,
                          height: 40,
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      />
                      <input
                        type="text"
                        value={settings.secondaryColor}
                        onChange={(e) =>
                          setSettings({ ...settings, secondaryColor: e.target.value })
                        }
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Accent Color (Success)
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) =>
                          setSettings({ ...settings, accentColor: e.target.value })
                        }
                        style={{
                          width: 50,
                          height: 40,
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      />
                      <input
                        type="text"
                        value={settings.accentColor}
                        onChange={(e) =>
                          setSettings({ ...settings, accentColor: e.target.value })
                        }
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  {/* Danger Color */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Danger Color (Error)
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="color"
                        value={settings.dangerColor}
                        onChange={(e) =>
                          setSettings({ ...settings, dangerColor: e.target.value })
                        }
                        style={{
                          width: 50,
                          height: 40,
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      />
                      <input
                        type="text"
                        value={settings.dangerColor}
                        onChange={(e) =>
                          setSettings({ ...settings, dangerColor: e.target.value })
                        }
                        style={{
                          flex: 1,
                          padding: "10px 12px",
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          fontSize: 14,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 16,
                    marginTop: 16,
                  }}
                >
                  {/* Font Family */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Font Family
                    </label>
                    <select
                      value={settings.fontFamily}
                      onChange={(e) =>
                        setSettings({ ...settings, fontFamily: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                        fontFamily: settings.fontFamily,
                      }}
                    >
                      {fontOptions.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Font Size
                    </label>
                    <select
                      value={settings.fontSize}
                      onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      {fontSizeOptions.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preview */}
                <div
                  style={{
                    marginTop: 20,
                    padding: 16,
                    background: "#f9fafb",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#6b7280", marginBottom: 12 }}>
                    Preview
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div
                      style={{
                        padding: "8px 16px",
                        background: settings.primaryColor,
                        color: "#fff",
                        borderRadius: 6,
                        fontSize: settings.fontSize + "px",
                        fontFamily: settings.fontFamily,
                      }}
                    >
                      Primary Button
                    </div>
                    <div
                      style={{
                        padding: "8px 16px",
                        background: settings.accentColor,
                        color: "#fff",
                        borderRadius: 6,
                        fontSize: settings.fontSize + "px",
                        fontFamily: settings.fontFamily,
                      }}
                    >
                      Success Button
                    </div>
                    <div
                      style={{
                        padding: "8px 16px",
                        background: settings.dangerColor,
                        color: "#fff",
                        borderRadius: 6,
                        fontSize: settings.fontSize + "px",
                        fontFamily: settings.fontFamily,
                      }}
                    >
                      Danger Button
                    </div>
                  </div>
                  <p
                    style={{
                      marginTop: 12,
                      fontSize: settings.fontSize + "px",
                      fontFamily: settings.fontFamily,
                      color: "#374151",
                    }}
                  >
                    This is sample text using your selected font family and size.
                  </p>
                </div>
              </div>

              {/* Application Settings */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: 20,
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  📋 Application Settings
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Site Name
                    </label>
                    <input
                      type="text"
                      value={settings.siteName}
                      onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Items Per Page
                    </label>
                    <select
                      value={settings.itemsPerPage}
                      onChange={(e) => setSettings({ ...settings, itemsPerPage: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Date Format
                    </label>
                    <select
                      value={settings.dateFormat}
                      onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Time Format
                    </label>
                    <select
                      value={settings.timeFormat}
                      onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="12h">12-hour (AM/PM)</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: 20,
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  🔔 Notification Settings
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, emailNotifications: e.target.checked })
                      }
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                        Email Notifications
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Receive email notifications for important updates
                      </div>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settings.orderNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, orderNotifications: e.target.checked })
                      }
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                        Order Notifications
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Get notified when new orders are placed
                      </div>
                    </div>
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settings.systemNotifications}
                      onChange={(e) =>
                        setSettings({ ...settings, systemNotifications: e.target.checked })
                      }
                      style={{ width: 18, height: 18, cursor: "pointer" }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                        System Notifications
                      </div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Receive system alerts and maintenance updates
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Advanced Settings */}
              <div
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 24,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                  marginBottom: 20,
                }}
              >
                <h2
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: 20,
                    color: "#1f2937",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  🔧 Advanced Settings
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        setSettings({ ...settings, sessionTimeout: e.target.value })
                      }
                      min="5"
                      max="120"
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        fontSize: 14,
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", alignItems: "flex-end" }}>
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        cursor: "pointer",
                        padding: "10px 0",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={settings.enableDebugMode}
                        onChange={(e) =>
                          setSettings({ ...settings, enableDebugMode: e.target.checked })
                        }
                        style={{ width: 18, height: 18, cursor: "pointer" }}
                      />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1f2937" }}>
                          Enable Debug Mode
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280" }}>
                          Show detailed logs (for developers)
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "flex-end",
                  marginTop: 24,
                }}
              >
                <button
                  onClick={handleResetSettings}
                  disabled={saving}
                  style={{
                    background: "#f3f4f6",
                    color: "#374151",
                    border: "1px solid #d1d5db",
                    padding: "12px 24px",
                    borderRadius: 8,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  🔄 Reset to Defaults
                </button>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  style={{
                    background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.secondaryColor} 100%)`,
                    color: "#fff",
                    border: "none",
                    padding: "12px 24px",
                    borderRadius: 8,
                    cursor: saving ? "not-allowed" : "pointer",
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: saving ? 0.6 : 1,
                  }}
                >
                  {saving ? "Saving..." : "💾 Save All Settings"}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
