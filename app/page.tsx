"use client";

import React from "react";
import FoodMenu from "./FOODS/food-menu";
import ReservationForm from "./components/ReservationForm";

export default function Home() {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-PH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString('en-PH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black overflow-x-hidden">
      {/* Sticky Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 bg-[#0b1834]/90 backdrop-blur-md">
        {/* Dual Logos - NEMSU & BSHM Collaboration */}
        <div className="animate-fade-in flex items-center gap-2 sm:gap-3">
          {/* NEMSU Logo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl sm:blur-2xl rounded-full scale-125 sm:scale-150 group-hover:bg-orange-500/40 transition-all duration-300"></div>
            <img
              src="/img/NEMSU.png"
              alt="NEMSU Logo"
              className="relative h-10 w-10 sm:h-14 md:h-16 sm:w-14 md:w-16 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:scale-110 hover:rotate-3 transition-all duration-300"
              suppressHydrationWarning
            />
          </div>
          {/* BSHM Logo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/30 blur-xl sm:blur-2xl rounded-full scale-125 sm:scale-150 group-hover:bg-amber-500/40 transition-all duration-300"></div>
            <img
              src="/img/BSHM LOGO.jpg"
              alt="BSHM Logo"
              className="relative h-10 w-10 sm:h-14 md:h-16 sm:w-14 md:w-16 object-contain rounded-full drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-110 hover:-rotate-3 transition-all duration-300"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Navigation - Home Button */}
        <nav className="flex items-center animate-fade-in">
          <a
            href="https://hospitality-management-operation.vercel.app/"
            className="px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 bg-orange-600 rounded-full text-white font-bold text-sm shadow-button transition-all duration-300 hover:scale-105 hover:bg-orange-700 active:scale-95"
          >
            Home
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-0">
        {/* Hero video background (scaled to crop landscape source into a portrait-style view) */}
        <div className="absolute inset-0 w-full h-full bg-linear-to-br from-[#0b1834] via-[#1a1a2e] to-[#16213e]">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/ads.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-[#0b1834]/65" />
        </div>

        {/* Floating Food Icons - Decorative */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Fork & Knife - Top Left */}
          <div className="absolute top-20 left-[5%] sm:left-[10%] opacity-10 sm:opacity-15 animate-float">
            <svg viewBox="0 0 64 64" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-orange-400">
              <path fill="currentColor" d="M18 4v20c0 2.2-1.8 4-4 4s-4-1.8-4-4V4h2v20c0 1.1.9 2 2 2s2-.9 2-2V4h2zm-6 0h2v12h-2V4zm4 0h2v12h-2V4zm-4 22v34c0 2.2 1.8 4 4 4s4-1.8 4-4V26h-8z"/>
            </svg>
          </div>

          {/* Plate/Dish - Top Right */}
          <div className="absolute top-24 right-[5%] sm:right-[15%] opacity-10 sm:opacity-15 animate-float" style={{ animationDelay: '1s' }}>
            <svg viewBox="0 0 64 64" className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 text-amber-400">
              <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="3"/>
              <circle cx="32" cy="32" r="20" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.3"/>
            </svg>
          </div>

          {/* Spoon - Bottom Left */}
          <div className="absolute bottom-32 left-[8%] sm:left-[12%] opacity-10 sm:opacity-15 animate-float" style={{ animationDelay: '2s' }}>
            <svg viewBox="0 0 64 64" className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 text-red-400 rotate-45">
              <path fill="currentColor" d="M32 4c-8.8 0-16 7.2-16 16 0 7.1 4.6 13.1 11 15.2V60c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4V35.2c6.4-2.1 11-8.1 11-15.2 0-8.8-7.2-16-16-16z"/>
            </svg>
          </div>

          {/* Chef Hat - Bottom Right */}
          <div className="absolute bottom-40 right-[10%] sm:right-[18%] opacity-10 sm:opacity-15 animate-float" style={{ animationDelay: '0.5s' }}>
            <svg viewBox="0 0 64 64" className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-orange-300">
              <path fill="currentColor" d="M52 24c0-6.6-5.4-12-12-12-1.9 0-3.7.4-5.3 1.2C33.1 8.4 28.8 5 24 5c-6.6 0-12 5.4-12 12 0 1.1.2 2.1.4 3.1C7.6 21.8 4 26.4 4 32c0 7.7 6.3 14 14 14h2v14h24V46h2c7.7 0 14-6.3 14-14 0-5.6-3.6-10.2-8.4-11.9.2-1 .4-2 .4-3.1z"/>
            </svg>
          </div>

          {/* Steam/Aroma Lines */}
          <div className="absolute top-1/3 left-1/4 opacity-5 sm:opacity-10">
            <svg viewBox="0 0 40 60" className="w-8 h-12 sm:w-10 sm:h-16 text-white animate-steam">
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M20 50 Q10 40 20 30 Q30 20 20 10"/>
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M30 55 Q20 45 30 35 Q40 25 30 15" opacity="0.7"/>
              <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M10 55 Q0 45 10 35 Q20 25 10 15" opacity="0.7"/>
            </svg>
          </div>
        </div>

        {/* Decorative Corner Ornaments - Hidden on smallest screens */}
        <div className="absolute top-0 left-0 w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 opacity-20 sm:opacity-30 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-orange-400/40">
            <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" fill="currentColor" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 opacity-20 sm:opacity-30 pointer-events-none rotate-180">
          <svg viewBox="0 0 100 100" className="w-full h-full text-orange-400/40">
            <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" fill="currentColor" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Content Container with Refined Layout */}
        <div className="relative z-20 text-center px-4 sm:px-6 max-w-6xl mx-auto pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16">
          {/* Main Heading with Elegant Typography */}
          <h1 className="mb-6 sm:mb-8 leading-tight animate-slide-up">
            <span className="block text-lg sm:text-2xl md:text-3xl lg:text-4xl font-light tracking-widest sm:tracking-[0.15em] text-orange-200/90 mb-2 sm:mb-4">
              Welcome to
            </span>
            <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-bold tracking-wide">
              <span className="hero-text-gradient bg-clip-text text-transparent">NEMSU HOSTEL</span>
            </span>
          </h1>

          {/* Subtitle with Refined Styling */}
          <p className="text-base sm:text-xl md:text-2xl lg:text-3xl text-white/95 mb-4 sm:mb-6 max-w-4xl mx-auto leading-relaxed font-light tracking-wide animate-fade-in px-2" style={{ animationDelay: '0.2s' }}>
            Savor authentic home-cooked meals at{" "}
            <span className="text-amber-300 font-medium block sm:inline mt-1 sm:mt-0">
              NEMSU - Lianga Campus
            </span>
          </p>

          {/* Price Highlight */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <span className="inline-flex items-center gap-2 text-green-400 text-sm sm:text-base font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Affordable Student-Friendly Prices
            </span>
          </div>

          {/* Elegant CTA Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 md:gap-8 justify-center items-center animate-fade-in px-4 sm:px-0" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => scrollToSection('contact')}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 text-white font-bold py-3.5 sm:py-4 px-8 sm:px-10 md:px-14 rounded-full shadow-button transition-all duration-300 text-sm sm:text-base md:text-lg bg-orange-600 hover:scale-105 active:scale-95 hover:bg-orange-700 btn-hero-primary"
            >
              <span>Visit Us Now</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            <button
              onClick={() => scrollToSection('menu')}
              className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 sm:gap-3 text-white font-bold py-3.5 sm:py-4 px-8 sm:px-10 md:px-14 rounded-full shadow-button transition-all duration-300 text-sm sm:text-base md:text-lg bg-orange-600 hover:scale-105 active:scale-95 hover:bg-orange-700 btn-hero-secondary"
            >
              <span>Explore Menu</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

      </section>
      {/* Menu Preview Section (moved to component) */}
      <FoodMenu />

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-orange-500 to-transparent" />
        <div className="absolute top-10 right-0 sm:right-10 w-48 sm:w-72 h-48 sm:h-72 bg-orange-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-0 sm:left-10 w-64 sm:w-96 h-64 sm:h-96 bg-red-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <div className="inline-block mb-3 sm:mb-4">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-semibold tracking-wide uppercase">Get In Touch</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-5 text-black dark:text-white px-2">
              Ready to Start Your{" "}
              <span className="bg-linear-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Journey?</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2">
              Hungry? Browse our delicious menu and place your order now. Fresh meals delivered or ready for pickup at our location.
            </p>
          </div>

          {/* Location Card - Full Width */}
          <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xl sm:shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Map */}
              <div className="h-[250px] sm:h-[300px] lg:h-[400px] relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500!2d126.093306!3d8.633472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMzgnMDAuNSJOIDEyNsKwMDUnMzUuOSJF!5e0!3m2!1sen!2sph!4v1609459200000!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                ></iframe>
              </div>

              {/* Location Info */}
              <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="shrink-0 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center">
                    <img src="/img/icons/location.svg" alt="Location" className="w-10 h-10 sm:w-14 sm:h-14" suppressHydrationWarning />
                  </div>
                  <div className="w-full">
                    <h4 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-black dark:text-white">Visit Us</h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-4">
                      North Eastern Mindanao State University
                      <br />
                      <span className="font-semibold">Lianga - Campus</span>
                      <br />
                      Surigao - Davao Coastal Rd
                      <br />
                      Lianga, Surigao del Sur
                    </p>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=8.633472,126.093306"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-2 sm:gap-3 text-white font-bold py-3 sm:py-4 px-6 sm:px-10 lg:px-12 rounded-full shadow-button transition-all duration-300 text-sm sm:text-base lg:text-lg bg-orange-600 hover:scale-105 active:scale-95 hover:bg-orange-700"
                    >
                      <span>Get Directions</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>🎉</span> No entrance fee required - Everyone welcome!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-zinc-800 bg-[#0b1834]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-12">
            {/* Brand Section */}
            <div className="sm:col-span-2 lg:col-span-2">
              {/* Philippine Flag with Time and Day */}
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <img
                  src="/img/icons/philippine-flag.svg"
                  alt="Philippine flag"
                  className="h-6 w-9 sm:h-7 sm:w-10 rounded-sm object-cover"
                  suppressHydrationWarning
                />
                <div className="text-zinc-400 text-xs sm:text-sm">
                  <div className="font-semibold text-white">{mounted ? formatTime(currentTime) : 'Loading...'}</div>
                  <div className="text-xs">{mounted ? formatDay(currentTime) : 'Loading...'}</div>
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3 sm:mb-4">NEMSU-Hostel</h3>
              <p className="text-zinc-400 mb-4 sm:mb-6 max-w-md leading-relaxed text-sm sm:text-base">
                Your trusted accommodation and dining destination at NEMSU - Lianga Campus. We provide comfortable stays and delicious meals for students and visitors.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a href="https://web.facebook.com/bshmliangadbest?_rdc=1&_rdr#" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-orange-500 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">Contact Us</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-orange-400 text-base sm:text-lg">✆</span>
                    <div>
                      <p className="text-zinc-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Phone</p>
                      <a href="tel:09123456789" className="text-white hover:text-orange-400 transition-colors font-medium text-sm sm:text-base">+63 912 345 6789</a>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-orange-400 text-base sm:text-lg">✉</span>
                    <div>
                      <p className="text-zinc-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Gmail</p>
                      <a href="mailto:hello@hostel.com" className="text-white hover:text-orange-400 transition-colors font-medium text-sm sm:text-base break-all">hello@hostel.com</a>
                      <p className="text-xs text-zinc-500 mt-0.5 sm:mt-1">We reply within 24 hours</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-orange-400 text-base sm:text-lg">⏲</span>
                    <div>
                      <p className="text-zinc-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Operating Hours</p>
                      <p className="text-white font-medium text-sm sm:text-base">Mon - Fri</p>
                      <p className="text-zinc-400 text-xs sm:text-sm">10:00 AM – 10:00 PM</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t border-zinc-800">
            <div className="flex justify-center items-center">
              <p className="text-zinc-500 text-xs sm:text-sm text-center">
                &copy; 2026 Hostel at NEMSU - Lianga. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
