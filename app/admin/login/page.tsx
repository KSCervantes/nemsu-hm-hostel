"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Image from "next/image";

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
          confirmButtonColor: '#f97316'
        });
        return;
      }

      const data = await res.json();

      // Store JWT token in localStorage (in production, use httpOnly cookies)
      if (data.token) {
        try {
          localStorage.setItem("admin_token", data.token);
        } catch (e) {
          console.error("Failed to save token:", e);
        }
      }

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
        confirmButtonColor: '#f97316'
      });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-100 px-4 py-8">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Logo Section */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-10 flex flex-col items-center">
            <div className="relative w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-white shadow-lg">
              <Image
                src="/img/Back.jpg"
                alt="Hostel Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Admin Portal</h1>
            <p className="text-orange-100 text-sm">Sign in to continue</p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-8">
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Username or Email
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username or email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all text-gray-900 placeholder-gray-400"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Sign In
            </button>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Use your admin credentials to access the dashboard
              </p>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} Hostel Management System
          </p>
        </div>
      </div>
    </div>
  );
}
