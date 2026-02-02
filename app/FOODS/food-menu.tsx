"use client";

import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { formatDate } from "@/lib/date-utils";

type MenuItem = {
  id: number;
  name: string;
  price: number;
  description: string;
  img: string;
  category: "main" | "snacks" | "desserts" | "drinks";
  code: string;
  available: boolean;
};

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  img?: string;
};

type Order = {
  id: string;
  customerName: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  date?: string;
  time?: string;
  items: OrderItem[];
  total: number;
};

export default function FoodMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [isOrderFormOpen, setIsOrderFormOpen] = useState(false);
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP' | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [newItemId, setNewItemId] = useState<string>("");
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [query, setQuery] = useState<string>("");
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const [isNavSticky, setIsNavSticky] = useState(false);
  const menuSectionRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement | null>(null);

  // Address selection states - Lianga only
  const liangaBarangays = [
    { code: "001", name: "Anibongan" },
    { code: "002", name: "Ban-as" },
    { code: "003", name: "Banahao" },
    { code: "004", name: "Baucawe" },
    { code: "005", name: "Diatagon" },
    { code: "006", name: "Ganayon" },
    { code: "007", name: "Liatimco" },
    { code: "008", name: "Manyayay" },
    { code: "009", name: "Payasan" },
    { code: "010", name: "Poblacion" },
    { code: "011", name: "Saint Christine" },
    { code: "012", name: "San Isidro" },
    { code: "013", name: "San Pedro" },
  ];
  const [selectedBarangay, setSelectedBarangay] = useState("");
  const [streetAddress, setStreetAddress] = useState("");

  // Active category for real-time hover detection
  const [activeCategory, setActiveCategory] = useState<"main" | "snacks" | "desserts" | "drinks">("main");

  useEffect(() => {
    fetch("/api/food-items")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          description: item.description || "",
          img: item.img || "/img/placeholder.webp",
          category: item.category || "main",
          code: item.code || "",
          available: item.available ?? true,
        }));
        setMenuItems(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Sticky navigation scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!menuSectionRef.current || !navRef.current) return;

      const menuSection = menuSectionRef.current;
      const menuSectionRect = menuSection.getBoundingClientRect();
      const navHeight = navRef.current.offsetHeight;

      // Check if menu section is in view and hasn't scrolled past
      const isInView = menuSectionRect.top <= 0 && menuSectionRect.bottom > navHeight;

      setIsNavSticky(isInView);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Real-time category active detection based on scroll position
  useEffect(() => {
    const handleCategoryScroll = () => {
      const categories = ['main-dishes', 'snacks', 'desserts', 'drinks'];
      const categoryMap: Record<string, "main" | "snacks" | "desserts" | "drinks"> = {
        'main-dishes': 'main',
        'snacks': 'snacks',
        'desserts': 'desserts',
        'drinks': 'drinks',
      };

      // Get the nav height to offset the detection
      const navHeight = navRef.current?.offsetHeight || 80;
      const detectionOffset = navHeight + 150; // Detection point below the sticky nav

      let currentCategory: "main" | "snacks" | "desserts" | "drinks" = 'main';
      let closestDistance = Infinity;

      // Find which category is closest to the detection offset
      for (const categoryId of categories) {
        const element = document.getElementById(categoryId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const distance = Math.abs(rect.top - detectionOffset);

          // If this section's top is closest to our detection offset, it's the active one
          if (rect.top <= detectionOffset && distance < closestDistance) {
            closestDistance = distance;
            currentCategory = categoryMap[categoryId];
          }
        }
      }

      setActiveCategory(currentCategory);
    };

    window.addEventListener('scroll', handleCategoryScroll);
    handleCategoryScroll(); // Check initial state

    return () => window.removeEventListener('scroll', handleCategoryScroll);
  }, []);

  // Load barangays when city changes
  useEffect(() => {
    // Lianga is hardcoded, no need to load from API
    return () => {};
  }, []);

  // Update address field when any location changes
  useEffect(() => {
    const parts = [];
    if (streetAddress) parts.push(streetAddress);
    if (selectedBarangay) {
      const brgy = liangaBarangays.find((b) => b.code === selectedBarangay);
      if (brgy) parts.push(brgy.name);
    }
    parts.push("Lianga, Surigao del Sur");
    setAddress(parts.join(", "));
  }, [streetAddress, selectedBarangay]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelected(null);
    }
    if (selected) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected]);

  // focus the close button when modal opens
  useEffect(() => {
    if (selected) {
      setTimeout(() => closeBtnRef.current?.focus(), 0);
    }
  }, [selected]);

  const renderCategory = (categoryName: string, categoryKey: "main" | "snacks" | "desserts" | "drinks", categoryId: string) => (
    <div id={categoryId} className="relative z-10" style={{ scrollMarginTop: '150px' }}>
      <h3 className="text-2xl font-bold text-amber-900 dark:text-amber-600 mb-6 pb-3 border-b-4 border-amber-700 dark:border-amber-500 inline-block drop-shadow-sm">{categoryName}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-6">
        {filteredMenu.filter((item) => item.category === categoryKey).map((item) => (
          <article
            key={item.id}
            className={`group bg-white dark:bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-lg hover:shadow-2xl transition-all transform hover:-translate-y-2 duration-300 flex flex-col ${
              !item.available ? 'opacity-60 grayscale' : 'hover:border-purple-300 dark:hover:border-purple-600'
            }`}
          >
            <div className="relative w-full h-56 shrink-0 overflow-hidden">
              <img src={item.img} alt={item.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              {!item.available && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
                    Not Available
                  </span>
                </div>
              )}
            </div>

            <div className="p-4 grow text-zinc-900 dark:text-zinc-100 flex flex-col">
              <h3 className={`text-lg font-semibold mb-2 line-clamp-2 text-black dark:text-white ${
                !item.available ? 'line-through' : ''
              }`}>{item.name}</h3>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-2 mb-3 grow">{item.description}</p>
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-bold ${
                  !item.available ? 'line-through' : ''
                }`}>₱{item.price}</span>
                <span className="text-purple-600 font-bold text-sm">{item.code}</span>
              </div>
              <button
                onClick={() => {
                  if (!item.available) return;
                  lastActiveRef.current = document.activeElement as HTMLElement | null;
                  setSelected(item);
                }}
                disabled={!item.available}
                className={`w-full font-bold py-2 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 relative overflow-hidden transition-all duration-200 ${
                  !item.available
                    ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                    : 'bg-purple-600 text-white hover:shadow-lg hover:bg-purple-700 transform hover:-translate-y-0.5 group-hover:shadow-purple-500/50'
                }`}
              >
                <svg className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Buy Now
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );

  // filtered list based on search query (show all items including unavailable)
  const filteredMenu = menuItems.filter((it) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (it.name + " " + it.description).toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <section id="menu" className="py-16 px-6 bg-white dot-grid-background">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <p className="text-zinc-700 dark:text-zinc-300 font-medium">Loading menu...</p>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-16 px-6 bg-white dark:bg-black dot-grid-background" ref={menuSectionRef}>
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Navigation Header */}
        <div
          ref={navRef}
          className={`mb-12 pb-8 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-lg p-4 shadow-xl transition-all duration-300 ${
            isNavSticky ? 'fixed top-0 left-0 right-0 z-40 rounded-none shadow-2xl border-b-purple-500/20 bg-white dark:bg-zinc-900 py-4 w-full' : ''
          }`}
        >
          <div className={`${isNavSticky ? 'max-w-7xl mx-auto px-6' : ''} flex items-center gap-6 pointer-events-auto`}>
            {/* Search Input */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                aria-label="Search dishes"
                placeholder="Search dishes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-300 shadow-sm"
              />
            </div>

            {/* Category Links */}
            <div className="flex gap-6 items-center overflow-x-auto pb-2 ml-4 pointer-events-auto">
              <a
                href="#main-dishes"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const element = document.getElementById('main-dishes');
                  if (element) {
                    const navHeight = navRef.current?.offsetHeight || 0;
                    const offset = element.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                  }
                }}
                className={`font-semibold whitespace-nowrap transition-all duration-300 pb-1 border-b-2 cursor-pointer ${
                  activeCategory === 'main'
                    ? 'text-purple-600 dark:text-purple-500 border-purple-600 dark:border-purple-500'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white border-transparent hover:border-purple-300'
                }`}
              >
                Main Dishes
              </a>
              <a
                href="#snacks"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const element = document.getElementById('snacks');
                  if (element) {
                    const navHeight = navRef.current?.offsetHeight || 0;
                    const offset = element.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                  }
                }}
                className={`font-semibold whitespace-nowrap transition-all duration-300 pb-1 border-b-2 cursor-pointer ${
                  activeCategory === 'snacks'
                    ? 'text-purple-600 dark:text-purple-500 border-purple-600 dark:border-purple-500'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white border-transparent hover:border-purple-300'
                }`}
              >
                Snacks
              </a>
              <a
                href="#desserts"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const element = document.getElementById('desserts');
                  if (element) {
                    const navHeight = navRef.current?.offsetHeight || 0;
                    const offset = element.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                  }
                }}
                className={`font-semibold whitespace-nowrap transition-all duration-300 pb-1 border-b-2 cursor-pointer ${
                  activeCategory === 'desserts'
                    ? 'text-purple-600 dark:text-purple-500 border-purple-600 dark:border-purple-500'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white border-transparent hover:border-purple-300'
                }`}
              >
                Desserts
              </a>
              <a
                href="#drinks"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const element = document.getElementById('drinks');
                  if (element) {
                    const navHeight = navRef.current?.offsetHeight || 0;
                    const offset = element.getBoundingClientRect().top + window.scrollY - navHeight - 20;
                    window.scrollTo({ top: offset, behavior: 'smooth' });
                  }
                }}
                className={`font-semibold whitespace-nowrap transition-all duration-300 pb-1 border-b-2 cursor-pointer ${
                  activeCategory === 'drinks'
                    ? 'text-purple-600 dark:text-purple-500 border-purple-600 dark:border-purple-500'
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white border-transparent hover:border-purple-300'
                }`}
              >
                Drinks
              </a>
            </div>
          </div>
        </div>

        {/* Spacer when nav is sticky */}
        {isNavSticky && <div style={{ height: navRef.current?.offsetHeight || 0 }} />}

        {/* Section Title */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white drop-shadow-sm">Signature Dishes</h2>
        </div>

        {/* Menu Items by Category */}
        <div className="space-y-12">
          {renderCategory("MAIN DISHES", "main", "main-dishes")}
          {renderCategory("SNACKS", "snacks", "snacks")}
          {renderCategory("DESSERTS/SWEETS", "desserts", "desserts")}
          {renderCategory("DRINKS", "drinks", "drinks")}
        </div>
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6"
        >
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelected(null)} />

              <div className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="h-64 md:h-auto">
                <img src={selected.img} alt={selected.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <h3 id="dish-title" className="text-2xl font-bold mb-2 text-black dark:text-white">{selected.name}</h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">{selected.description}</p>
                <div className="text-xl font-bold text-orange-600 mb-6">₱{selected.price}</div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Step 1: Choose Order Type before opening the form
                      Swal.fire({
                        title: 'Choose Order Type',
                        html: `
                          <div style="text-align:left;">
                            <p style="color:#6b7280;margin:0 0 12px 0;">Select how you'd like to receive your order</p>
                            <div id="order-type-options" style="display:flex;flex-direction:column;gap:12px;">
                              <button id="choose-delivery" class="swal2-styled" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:14px 16px;border:2px solid #f97316;border-radius:12px;background:#fff;color:#111827;">
                                <span style="display:flex;align-items:center;gap:10px;font-weight:700;color:#dc2626;">
                                  <img src="/img/icons/delivery.webp" alt="Delivery" style="width:32px;height:32px;" /> Delivery
                                </span>
                                <span style="font-weight:500;color:#6b7280;">Get it delivered to your door</span>
                              </button>
                              <button id="choose-pickup" class="swal2-styled" style="display:flex;align-items:center;justify-content:space-between;width:100%;padding:14px 16px;border:2px solid #e5e7eb;border-radius:12px;background:#fff;color:#111827;">
                                <span style="display:flex;align-items:center;gap:10px;font-weight:700;color:#1f2937;">
                                  <img src="/img/icons/Pickup.webp" alt="Pickup" style="width:32px;height:32px;" /> Pickup
                                </span>
                                <span style="font-weight:500;color:#6b7280;">Pick it up at the restaurant</span>
                              </button>
                            </div>
                          </div>
                        `,
                        showConfirmButton: false,
                        didOpen: () => {
                          const deliveryBtn = document.getElementById('choose-delivery');
                          const pickupBtn = document.getElementById('choose-pickup');
                          deliveryBtn?.addEventListener('click', () => {
                            // Save order type
                            setOrderType('DELIVERY');
                            try { localStorage.setItem('order_type', 'DELIVERY'); } catch {}
                            // Prefill selected item and open form
                            const existing = currentOrderItems.slice();
                            existing.push({ id: selected.id, name: selected.name, price: selected.price, quantity: 1, img: selected.img });
                            setCurrentOrderItems(existing);
                            Swal.close();
                            setIsOrderFormOpen(true);
                          });
                          pickupBtn?.addEventListener('click', () => {
                            setOrderType('PICKUP');
                            try { localStorage.setItem('order_type', 'PICKUP'); } catch {}
                            const existing = currentOrderItems.slice();
                            existing.push({ id: selected.id, name: selected.name, price: selected.price, quantity: 1, img: selected.img });
                            setCurrentOrderItems(existing);
                            Swal.close();
                            setIsOrderFormOpen(true);
                          });
                        }
                      });
                    }}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to Order
                  </button>
                  <button
                    ref={closeBtnRef}
                    onClick={() => {
                      setSelected(null);
                      setTimeout(() => lastActiveRef.current?.focus(), 0);
                    }}
                    className="border border-zinc-300 dark:border-zinc-700 px-4 py-2 rounded-md"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {isOrderFormOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center px-4 sm:px-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => {
            setIsOrderFormOpen(false);
            setCurrentOrderItems([]);
          }} />

          <div className="relative max-w-4xl w-full bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h3 className="text-2xl font-bold">Food Order Form{orderType ? ` — ${orderType === 'DELIVERY' ? 'Delivery' : 'Pickup'}` : ''}</h3>
            </div>

            <div className="overflow-y-auto p-6 flex-1">

            {orderType === 'PICKUP' && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">📍 Pickup Location Map</h4>
                <div className="rounded-lg overflow-hidden h-80 mb-3 border border-blue-200 dark:border-blue-700">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500!2d126.093306!3d8.633472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMzgnMDAuNSJOIDEyNsKwMDUnMzUuOSJF!5e0!3m2!1sen!2sph!4v1609459200000!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">
                  📌 <strong>NEMSU-Lianga Campus</strong><br />
                  Surigao - Davao Coastal Rd, Lianga, Surigao del Sur
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Full Name</label>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Contact Number</label>
                <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Email Address</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Preferred {orderType === 'PICKUP' ? 'Pickup' : 'Delivery'} Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
              {orderType === 'DELIVERY' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-1">Delivery Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Barangay</label>
                    <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} className="w-full border px-3 py-2 rounded">
                      <option value="">-- Select Barangay --</option>
                      {liangaBarangays.map((b) => (
                        <option key={b.code} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Street Address / House Number / Building Name</label>
                  <input value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} placeholder="e.g., 123 Main Street, Unit 5B" className="w-full border px-3 py-2 rounded" />
                </div>
                <div className="mt-2 p-2 bg-gray-50 rounded border text-sm text-gray-700">
                  <strong>Full Address:</strong> {address || "Please select barangay above"}
                </div>
              </div>
              )}
              <div>
                <label className="block text-sm font-semibold mb-1">Date of Order</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full border px-3 py-2 rounded" />
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold mb-2">Menu Selection</h4>

              {/* Inline selector to add more items to the order */}
              <div className="flex gap-2 items-end mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Select Item</label>
                  <select value={newItemId} onChange={(e) => setNewItemId(e.target.value)} className="w-full border px-2 py-2 rounded">
                    <option value="">-- Choose a product --</option>
                    {menuItems.map((mi) => (
                      <option key={mi.id} value={String(mi.id)}>{mi.name} — ₱{mi.price}</option>
                    ))}
                  </select>
                </div>
                <div style={{width:120}}>
                  <label className="block text-xs font-medium mb-1">Qty</label>
                  <input type="number" min={1} value={newItemQty} onChange={(e) => setNewItemQty(Math.max(1, Number(e.target.value || 1)))} className="w-full border px-2 py-2 rounded" />
                </div>
                <div>
                  <button
                    onClick={() => {
                      // Only validate that an item is selected
                      if (!newItemId) {
                        Swal.fire({ icon: 'error', title: 'No Item Selected', text: 'Please select an item from the menu.' });
                        return;
                      }

                      const id = Number(newItemId);
                      const menuItem = menuItems.find((m) => m.id === id);
                      if (!menuItem) return;

                      setCurrentOrderItems((prev) => {
                        const exists = prev.find((p) => p.id === menuItem.id);
                        if (exists) {
                          return prev.map((p) => p.id === menuItem.id ? { ...p, quantity: p.quantity + newItemQty } : p);
                        }
                        return [...prev, { id: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: newItemQty, img: menuItem.img }];
                      });

                      // reset selector
                      setNewItemId("");
                      setNewItemQty(1);
                    }}
                    className="bg-amber-600 text-white px-4 py-2 rounded font-semibold"
                  >
                    Add Item
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-64 border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-100">
                    <tr>
                      <th className="p-2 text-left">Image</th>
                      <th className="p-2 text-left">Item Name</th>
                      <th className="p-2 text-left">Quantity</th>
                      <th className="p-2 text-left">Special Instructions</th>
                      <th className="p-2 text-left">Price</th>
                      <th className="p-2">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrderItems.map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-2">
                          {it.img && (
                            <img src={it.img} alt={it.name} className="w-12 h-12 object-cover rounded" />
                          )}
                        </td>
                        <td className="p-2">{it.name}</td>
                        <td className="p-2">
                          <input type="number" min={1} value={it.quantity} onChange={(e) => {
                            const q = Math.max(1, Number(e.target.value || 1));
                            setCurrentOrderItems((prev) => prev.map((p, i) => i === idx ? { ...p, quantity: q } : p));
                          }} className="w-20 border px-2 py-1 rounded" />
                        </td>
                        <td className="p-2">
                          <input value={it.notes || ""} onChange={(e) => setCurrentOrderItems((prev) => prev.map((p, i) => i === idx ? { ...p, notes: e.target.value } : p))} className="w-full border px-2 py-1 rounded" />
                        </td>
                        <td className="p-2">₱{it.price}</td>
                        <td className="p-2 text-center">
                          <button onClick={() => setCurrentOrderItems((prev) => prev.filter((_, i) => i !== idx))} className="text-red-600">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-right font-bold">Total: ₱{currentOrderItems.reduce((s, i) => s + i.price * i.quantity, 0)}</div>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => {
                setIsOrderFormOpen(false);
                setCurrentOrderItems([]);
              }} className="px-4 py-2 rounded-lg border-2 border-zinc-300 text-zinc-700 font-semibold hover:bg-zinc-50 transition-colors duration-200">Cancel</button>
              <button onClick={async () => {
                // Validation
                if (currentOrderItems.length === 0) {
                  Swal.fire({
                    icon: 'warning',
                    title: 'No Items Selected',
                    text: 'Please add at least one item to your order',
                    confirmButtonColor: '#f97316'
                  });
                  return;
                }

                if (!customerName?.trim()) {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Name Required',
                    text: 'Please enter your name to continue',
                    confirmButtonColor: '#f97316'
                  });
                  return;
                }

                if (!contactNumber?.trim() && !email?.trim()) {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Contact Information Required',
                    text: 'Please provide either a contact number or email address',
                    confirmButtonColor: '#f97316'
                  });
                  return;
                }

                // Validate delivery address for DELIVERY orders
                if (orderType === 'DELIVERY') {
                  if (!selectedBarangay) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Incomplete Address',
                      text: 'Please select a barangay for your delivery address',
                      confirmButtonColor: '#f97316'
                    });
                    return;
                  }
                  if (!streetAddress.trim()) {
                    Swal.fire({
                      icon: 'warning',
                      title: 'Missing Street Address',
                      text: 'Please enter your street address, house number, or building name',
                      confirmButtonColor: '#f97316'
                    });
                    return;
                  }
                }

                // Show loading
                Swal.fire({
                  title: 'Placing Order...',
                  html: 'Please wait while we process your order',
                  allowOutsideClick: false,
                  didOpen: () => {
                    Swal.showLoading();
                  }
                });

                // Send order to backend API for persistence
                const payload = {
                  customer: customerName || "Guest",
                  contactNumber,
                  email,
                  address,
                  date,
                  time,
                  items: currentOrderItems.map((it) => ({
                    foodId: it.id,
                    name: it.name,
                    quantity: it.quantity,
                    unitPrice: it.price,
                    notes: it.notes,
                  })),
                };
                try {
                  const res = await fetch("/api/orders", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...payload, orderType: orderType ?? 'DELIVERY' }),
                  });
                  if (!res.ok) {
                    throw new Error("Failed to place order");
                  }
                  const saved = await res.json();
                  const total = currentOrderItems.reduce((s, i) => s + i.price * i.quantity, 0);

                  // Show order details in SweetAlert2 popup that auto-closes after 30 seconds
                  const itemsTable = currentOrderItems.map(it => `
                    <tr>
                      <td style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #e5e7eb;">${it.name}</td>
                      <td style="text-align: center; padding: 4px 8px; border-bottom: 1px solid #e5e7eb;">${it.quantity}</td>
                      <td style="text-align: left; padding: 4px 8px; border-bottom: 1px solid #e5e7eb;">${it.notes || '—'}</td>
                      <td style="text-align: right; padding: 4px 8px; border-bottom: 1px solid #e5e7eb;">₱${it.price}</td>
                    </tr>
                  `).join('');

                  // Show success message with SweetAlert2
                  await Swal.fire({
                    icon: 'success',
                    title: 'Order Placed Successfully!',
                    html: `
                      <div style="text-align: left; padding: 10px; max-width: 600px;">
                        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                          <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 8px;">${payload.customer}</div>
                          <div style="font-size: 13px; color: #6b7280;">
                            ${contactNumber || ''} • ${email || ''}
                          </div>
                          <div style="font-size: 13px; color: #6b7280; margin-top: 4px;">
                            ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div style="font-weight: 700; font-size: 14px; color: #1f2937; margin-top: 4px;">Total: ₱${total}</div>
                        </div>

                        <div style="margin-bottom: 16px;">
                          <div style="font-weight: 600; font-size: 14px; color: #1f2937; margin-bottom: 8px;">Order Items</div>
                          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                            <thead>
                              <tr style="background: #f3f4f6; text-align: left;">
                                <th style="padding: 6px 8px; font-weight: 600; color: #6b7280;">Item</th>
                                <th style="padding: 6px 8px; font-weight: 600; color: #6b7280; text-align: center;">Qty</th>
                                <th style="padding: 6px 8px; font-weight: 600; color: #6b7280;">Notes</th>
                                <th style="padding: 6px 8px; font-weight: 600; color: #6b7280; text-align: right;">Price</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${itemsTable}
                            </tbody>
                          </table>
                        </div>

                        <p style="margin-top: 12px; color: #10b981; font-weight: 600; font-size: 14px;">✓ Check your email for order confirmation!</p>
                        <p style="margin-top: 8px; font-size: 12px; color: #9ca3af;">This will close automatically in 30 seconds...</p>
                      </div>
                    `,
                    width: '650px',
                    confirmButtonColor: '#f97316',
                    confirmButtonText: 'Close',
                    timer: 30000,
                    timerProgressBar: true,
                    allowOutsideClick: true,
                    allowEscapeKey: true
                  });

                  // reset form
                  setCurrentOrderItems([]);
                  setCustomerName("");
                  setContactNumber("");
                  setEmail("");
                  setAddress("");
                  setDate("");
                  setTime("");
                  setSelectedBarangay("");
                  setStreetAddress("");
                  setIsOrderFormOpen(false);
                  setSelected(null);
                } catch (err) {
                  Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Network error. Please check your connection and try again.',
                    confirmButtonColor: '#dc2626'
                  });
                }
              }} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Place Order
              </button>
            </div>
            </div>

          </div>
        </div>
      )}


    </section>
  );
}
