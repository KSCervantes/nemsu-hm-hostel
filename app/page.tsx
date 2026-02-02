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

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Sticky Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 transition-all duration-300 pointer-events-none">
        {/* Dual Logos - NEMSU & BSHM Collaboration */}
        <div className="animate-fade-in pointer-events-auto flex items-center gap-3">
          {/* NEMSU Logo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-purple-500/30 blur-2xl rounded-full scale-150 group-hover:bg-purple-500/40 transition-all duration-300"></div>
            <img
              src="/img/NEMSU.png"
              alt="NEMSU Logo"
              className="relative h-16 w-16 object-contain drop-shadow-[0_0_20px_rgba(168,85,247,0.5)] hover:scale-110 hover:rotate-3 transition-all duration-300"
            />
          </div>
          {/* BSHM Logo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-pink-500/30 blur-2xl rounded-full scale-150 group-hover:bg-pink-500/40 transition-all duration-300"></div>
            <img
              src="/img/BSHM LOGO.jpg"
              alt="BSHM Logo"
              className="relative h-16 w-16 object-contain rounded-full drop-shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:scale-110 hover:-rotate-3 transition-all duration-300"
            />
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-3 animate-fade-in pointer-events-auto">
          <a
            href="https://hospitality-management-operation.vercel.app/"
            className="px-6 py-3 bg-purple-600 rounded-full text-white font-bold text-sm shadow-button transition-all duration-300 hover:scale-105 hover:shadow-2xl btn-hero-primary relative overflow-hidden group hover:bg-purple-700"
          >
            <span className="relative z-10">Home</span>
          </a>
          <a
            href="https://www.nemsu-unitel.devworkstudios.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-purple-600 rounded-full text-white font-bold text-sm shadow-button transition-all duration-300 hover:scale-105 hover:shadow-2xl btn-hero-primary hover:bg-purple-700"
          >
            Book Rooms
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Elegant Overlay */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/img/Back.jpg"
            alt="Hostel Restaurant"
            className="w-full h-full sm:object-contain md:object-cover object-center brightness-[0.2] scale-105 transition-transform duration-1000"
          />
          {/* Elegant Multi-layer Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-fuchsia-900/20" />
          {/* Vignette Effect */}
          <div className="absolute inset-0 hero-vignette" />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="particle particle-1"></div>
          <div className="particle particle-2"></div>
          <div className="particle particle-3"></div>
          <div className="particle particle-4"></div>
          <div className="particle particle-5"></div>
          <div className="particle particle-6"></div>
        </div>

        {/* Decorative Corner Ornaments */}
        <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 opacity-30 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400/40">
            <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" fill="currentColor" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>
        <div className="absolute bottom-0 right-0 w-32 h-32 md:w-48 md:h-48 opacity-30 pointer-events-none rotate-180">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400/40">
            <path d="M0 0 L100 0 L100 10 L10 10 L10 100 L0 100 Z" fill="currentColor" />
            <circle cx="20" cy="20" r="3" fill="currentColor" />
          </svg>
        </div>

        {/* Content Container with Refined Layout */}
        <div className="relative z-20 text-center px-6 max-w-6xl">
          {/* Decorative Top Line */}
          <div className="flex items-center justify-center gap-4 mb-8 animate-fade-in">
            <div className="w-16 md:w-24 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
            <span className="text-purple-300/90 text-xs md:text-sm tracking-[0.3em] uppercase font-light drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]">Est. 1949</span>
            <div className="w-16 md:w-24 h-px bg-gradient-to-l from-transparent via-purple-400/60 to-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          </div>

          {/* Main Heading with Elegant Typography */}
          <h1 className="mb-8 leading-tight animate-slide-up">
            <span className="block text-2xl sm:text-3xl md:text-4xl font-light tracking-[0.15em] text-purple-200/90 mb-4 drop-shadow-[0_2px_10px_rgba(168,85,247,0.3)]">
              Welcome to
            </span>
            <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-serif font-bold tracking-wide">
              <span className="hero-text-gradient bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(168,85,247,0.6)]">NEMSU</span>
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-serif font-light tracking-[0.1em] text-white mt-2 drop-shadow-[0_4px_20px_rgba(255,255,255,0.3)]">
              Hostel
            </span>
          </h1>

          {/* Decorative Divider */}
          <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-purple-400/50"></div>
            <svg className="w-6 h-6 text-purple-400/70" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-purple-400/50"></div>
          </div>

          {/* Subtitle with Refined Styling */}
          <p className="text-xl sm:text-2xl md:text-3xl text-white/95 mb-6 max-w-4xl mx-auto leading-relaxed font-light tracking-wide animate-fade-in drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]" style={{ animationDelay: '0.2s' }}>
            Your home away from home at <span className="text-fuchsia-300 font-medium">NEMSU - Lianga Campus</span>
          </p>

          {/* Feature Tags */}
          <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <span className="flex items-center gap-2 text-purple-100/90 text-sm md:text-base">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
              Comfortable accommodations
            </span>
            <span className="flex items-center gap-2 text-purple-100/90 text-sm md:text-base">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-pulse" style={{ animationDelay: '0.3s' }}></span>
              Delicious meals
            </span>
            <span className="flex items-center gap-2 text-purple-100/90 text-sm md:text-base">
              <span className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.6s' }}></span>
              Student-friendly
            </span>
          </div>

          {/* Elegant CTA Buttons */}
          <div className="flex gap-5 sm:gap-8 justify-center flex-wrap items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-3 text-white font-bold py-4 px-10 sm:px-14 rounded-full shadow-button transition-all duration-300 text-base sm:text-lg bg-purple-600 hover:scale-105 hover:shadow-2xl hover:bg-purple-700 btn-hero-primary"
            >
              <span>Visit Us Now</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>

            <button
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              className="group inline-flex items-center gap-3 text-white font-bold py-4 px-10 sm:px-14 rounded-full shadow-button transition-all duration-300 text-base sm:text-lg bg-purple-600 hover:scale-105 hover:shadow-2xl hover:bg-purple-700 btn-hero-secondary"
            >
              <span>Explore Menu</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>
      {/* Menu Preview Section (moved to component) */}
      <FoodMenu />

      {/* Contact Section */}
      <section id="contact" className="py-24 px-6 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-fuchsia-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-semibold tracking-wide uppercase">Get In Touch</span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-black dark:text-white">
              Ready to Start Your <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">Journey?</span>
            </h2>
            <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
              Hungry? Browse our delicious menu and place your order now. Fresh meals delivered or ready for pickup at our location.
            </p>
            <button
              onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-3 text-white font-bold py-4 px-10 sm:px-12 rounded-full shadow-button transition-all duration-300 text-base sm:text-lg bg-purple-600 hover:scale-105 hover:shadow-2xl active:scale-95 hover:bg-purple-700"
            >
              <span>Order Now</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>

          {/* Location Card - Full Width */}
          <div className="rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Map */}
              <div className="h-[300px] lg:h-[400px] relative">
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
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-start gap-4 mb-6">
                  <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center">
                    <img src="/img/icons/location.svg" alt="Location" className="w-14 h-14" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold mb-3 text-black dark:text-white">Visit Us</h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-4">
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
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 text-white font-bold py-4 px-10 sm:px-12 rounded-full shadow-button transition-all duration-300 text-base sm:text-lg bg-purple-600 hover:scale-105 hover:shadow-2xl active:scale-95 hover:bg-purple-700"
                    >
                      <span>Get Directions</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </a>
                    <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                      <span>🎉</span> No entrace fee required - Everyone welcome!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-zinc-800">
        {/* Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="/img/Back.jpg"
            alt="Footer Background"
            className="w-full h-full object-cover brightness-[0.15]"
          />
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/85" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              {/* Philippine Flag with Time and Day */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🇵🇭</span>
                <div className="text-zinc-400 text-sm">
                  <div className="font-semibold text-white">{mounted ? formatTime(currentTime) : 'Loading...'}</div>
                  <div className="text-xs">{mounted ? formatDay(currentTime) : 'Loading...'}</div>
                </div>
              </div>

              <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">NEMSU-Hostel</h3>
              <p className="text-zinc-400 mb-6 max-w-md leading-relaxed">
                Your trusted accommodation and dining destination at NEMSU - Lianga Campus. We provide comfortable stays and delicious meals for students and visitors.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-purple-500 flex items-center justify-center text-white transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-purple-500 flex items-center justify-center text-white transition-all duration-300 hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" /></svg>
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Contact Us</h4>
              <ul className="space-y-4">
                <li>
                </li>
                <li>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">✆</span>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Phone</p>
                      <a href="tel:+15551234567" className="text-white hover:text-purple-400 transition-colors font-medium">+1 (555) 123-4567</a>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">✉</span>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Gmail</p>
                      <a href="mailto:hello@hostel.com" className="text-white hover:text-purple-400 transition-colors font-medium break-all">hello@hostel.com</a>
                      <p className="text-xs text-zinc-500 mt-1">We reply within 24 hours</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 text-lg">⏲</span>
                    <div>
                      <p className="text-zinc-400 text-sm mb-1">Operating Hours</p>
                      <p className="text-white font-medium">Mon - Sun</p>
                      <p className="text-zinc-400 text-sm">10:00 AM – 10:00 PM</p>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-zinc-800">
            {/* Quick Links */}
            <div className="flex justify-center mb-6">
              <ul className="flex gap-8 text-sm">
              </ul>
            </div>

            <div className="flex justify-center items-center">
              <p className="text-zinc-500 text-sm text-center">
                &copy; 2026 Hostel at NEMSU - Lianga. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
