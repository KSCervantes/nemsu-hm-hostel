"use client";

import React from "react";
import FoodMenu from "./FOODS/food-menu";
import ReservationForm from "./components/ReservationForm";

export default function Home() {
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [mounted, setMounted] = React.useState(false);
  const [scrollY, setScrollY] = React.useState(0);
  const [showDeliveryModal, setShowDeliveryModal] = React.useState(false);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const [deliveryTime, setDeliveryTime] = React.useState('~ 30 Mins');

  // New pop-ups
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [showOffer, setShowOffer] = React.useState(false);
  const [showRating, setShowRating] = React.useState(false);
  const [rating, setRating] = React.useState(0);

  React.useEffect(() => {
    setMounted(true);

    // Show welcome popup after 1 second
    const welcomeTimer = setTimeout(() => setShowWelcome(true), 1000);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      clearInterval(timer);
      clearTimeout(welcomeTimer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const showNotification = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeliveryTimeSelect = (time: string) => {
    setDeliveryTime(time);
    showNotification(`Delivery time updated to ${time}`);
    setShowDeliveryModal(false);
  };

  const handleRatingSubmit = () => {
    if (rating > 0) {
      showNotification(`Thank you! You rated us ${rating} ⭐`);
      setRating(0);
      setShowRating(false);
    }
  };

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
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 bg-[#0b1834]/90 backdrop-blur-md ${scrollY > 50 ? 'shadow-xl shadow-black/30' : ''}`}>
        {/* Dual Logos - NEMSU & BSHM Collaboration */}
        <div className="animate-fade-in flex items-center gap-2 sm:gap-3">
          {/* NEMSU Logo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-orange-500/30 blur-xl sm:blur-2xl rounded-full scale-125 sm:scale-150 group-hover:bg-orange-500/40 transition-all duration-300"></div>
            <img
              src="/img/NEMSU.png"
              alt="NEMSU Logo"
              className="relative h-10 w-10 sm:h-14 md:h-16 sm:w-14 md:w-16 object-contain drop-shadow-[0_0_15px_rgba(249,115,22,0.5)] hover:scale-110 hover:rotate-3 transition-all duration-300 cursor-pointer"
              suppressHydrationWarning
            />
          </div>
          {/* BSHM Logo */}
          <div className="relative group">
            <div className="absolute inset-0 bg-amber-500/30 blur-xl sm:blur-2xl rounded-full scale-125 sm:scale-150 group-hover:bg-amber-500/40 transition-all duration-300"></div>
            <img
              src="/img/BSHM LOGO.jpg"
              alt="BSHM Logo"
              className="relative h-10 w-10 sm:h-14 md:h-16 sm:w-14 md:w-16 object-contain rounded-full drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-110 hover:-rotate-3 transition-all duration-300 cursor-pointer"
              suppressHydrationWarning
            />
          </div>
        </div>

        {/* Navigation - Home Button */}
        <nav className="flex items-center animate-fade-in delay-200">
          <a
            href="https://hospitality-management-operation.vercel.app/"
            className="group inline-flex rounded-[0.75em] bg-[#7c2d12] p-0 text-white font-bold text-sm leading-none no-underline"
          >
            <span className="inline-flex items-center justify-center rounded-[0.75em] border-2 border-[#7c2d12] bg-orange-600 px-4 py-2 text-white transition-transform duration-100 ease-linear translate-y-[-0.2em] group-hover:translate-y-[-0.33em] group-active:translate-y-0 group-hover:bg-orange-700 sm:px-5 sm:py-2.5 lg:px-6">
              Home
            </span>
          </a>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 sm:pt-0">
        {/* Hero video background */}
        <div className="absolute inset-0 w-full h-full">
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
            <span className="block text-lg sm:text-xl md:text-2xl font-outfit tracking-[0.2em] text-orange-200/90 mb-3 sm:mb-5 uppercase font-medium drop-shadow-md animate-float-up delay-100">
              Savor the flavors of
            </span>
            <span className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-[7.5rem] font-playfair font-bold leading-tight tracking-tight drop-shadow-2xl animate-slide-up delay-200">
              <span className="hero-text-gradient bg-clip-text text-transparent pb-2 inline-block">NEMSU HOSTEL</span>
            </span>
          </h1>

          {/* Subtitle with Refined Styling */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/95 mb-4 sm:mb-6 max-w-3xl mx-auto leading-relaxed font-outfit tracking-wide animate-fade-in px-4 drop-shadow-md delay-300">
            Authentic home-cooked meals & refreshing drinks at{" "}
            <span className="text-amber-400 font-playfair font-bold italic text-xl sm:text-2xl md:text-3xl lg:text-4xl block sm:inline mt-2 sm:mt-0 drop-shadow-lg">
              NEMSU - Lianga Campus
            </span>
          </p>

          {/* Price Highlight */}
          <div className="mb-8 animate-scale-in delay-400">
            <span className="inline-flex items-center gap-2 text-green-400 text-sm sm:text-base font-outfit font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-green-500/20 hover:border-green-400/50 hover:bg-black/30 transition-all duration-300 cursor-default group">
              <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Delicious & Affordable Student Meals
            </span>
          </div>

          {/* Elegant CTA Buttons - Stack on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 md:gap-8 justify-center items-center animate-fade-in px-4 sm:px-0 delay-500">
            <button
              type="button"
              onClick={() => scrollToSection('contact')}
              className="group inline-flex w-full rounded-[0.75em] bg-[#7c2d12] p-0 text-white font-bold font-outfit text-sm sm:w-auto sm:text-base md:text-lg leading-none"
            >
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-[0.75em] border-2 border-[#7c2d12] bg-orange-600 px-8 py-3.5 text-white transition-transform duration-100 ease-linear translate-y-[-0.2em] group-hover:translate-y-[-0.33em] group-active:translate-y-0 group-hover:bg-orange-700 sm:w-auto sm:gap-3 sm:px-10 sm:py-4 md:px-14">
                <span>Visit Us Now</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                scrollToSection('menu');
                showNotification('Browse our delicious menu!');
              }}
              className="group inline-flex w-full rounded-[0.75em] bg-[#7c2d12] p-0 text-white font-bold font-outfit text-sm sm:w-auto sm:text-base md:text-lg leading-none"
            >
              <span className="inline-flex w-full items-center justify-center gap-2 rounded-[0.75em] border-2 border-[#7c2d12] bg-orange-600 px-8 py-3.5 text-white transition-transform duration-100 ease-linear translate-y-[-0.2em] group-hover:translate-y-[-0.33em] group-active:translate-y-0 group-hover:bg-orange-700 sm:w-auto sm:gap-3 sm:px-10 sm:py-4 md:px-14">
                <span>Explore Menu</span>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </button>
          </div>
        </div>

      </section>

      {/* Menu Preview Section (moved to component) */}
      <FoodMenu />

      {/* Modern Asymmetric Delivery Ad */}
      <section className="py-20 sm:py-32 bg-white dark:bg-black relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">

            {/* Left Content */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold font-outfit text-sm tracking-widest uppercase mb-8 shadow-sm border border-orange-200 dark:border-orange-800/50 animate-slide-in-left hover:scale-105 transition-transform duration-300">
                <svg className="w-4 h-4 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Fast Delivery
              </div>

              <h2 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5rem] font-playfair font-black text-zinc-900 dark:text-white mb-6 leading-[1.1] tracking-tight animate-slide-in-left delay-100">
                Hungry? <br />
                <span className="text-orange-600 dark:text-orange-500 animate-glow-pulse">We Deliver.</span>
              </h2>

              <p className="text-xl sm:text-2xl text-zinc-600 dark:text-zinc-400 font-outfit leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0 font-light animate-fade-in delay-200 hover:text-zinc-500 dark:hover:text-zinc-300 transition-colors duration-300">
                Enjoy your favorite home-cooked meals without leaving your seat. Delivering exclusively around <strong className="text-zinc-900 dark:text-white font-semibold border-b-2 border-orange-400/50 pb-1 animate-pulse">LIANGA, Surigao del Sur</strong>.
              </p>
            </div>

            {/* Right Image */}
            <div className="w-full lg:w-1/2 relative mt-8 lg:mt-0 flex justify-center items-center">
              <div className="relative w-full max-w-2xl group">
                <img
                  src="/img/nemsu-delivery-logo.svg"
                  alt="NEMSU Hostel Kitchen delivery poster"
                  className="w-full h-auto object-contain transform transition-all duration-1000 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-linear-to-t from-orange-500/0 via-transparent to-orange-500/0 opacity-0 group-hover:opacity-20 transition-opacity duration-1000 rounded-3xl"></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-linear-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-orange-500 to-transparent" />
        <div className="absolute top-10 right-0 sm:right-10 w-48 sm:w-72 h-48 sm:h-72 bg-orange-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-10 left-0 sm:left-10 w-64 sm:w-96 h-64 sm:h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in">
            <div className="inline-block mb-3 sm:mb-4 animate-scale-in">
              <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-semibold tracking-wide uppercase hover:scale-105 transition-transform duration-300 cursor-default">Get In Touch</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-3 sm:mb-5 text-black dark:text-white px-2 animate-slide-up delay-100">
              Ready to Start Your{" "}
              <span className="bg-linear-to-r from-orange-500 to-red-500 bg-clip-text text-transparent animate-glow-pulse">Journey?</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8 px-2 animate-fade-in delay-200">
              Hungry? Browse our delicious menu and place your order now. Fresh meals delivered or ready for pickup at our location.
            </p>
          </div>

          {/* Location Card - Full Width */}
          <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xl sm:shadow-2xl animate-scale-in delay-300 hover:shadow-2xl dark:hover:shadow-2xl transition-all duration-500 dark:hover:shadow-orange-500/10">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Map */}
              <div className="h-[250px] sm:h-[300px] lg:h-[400px] relative overflow-hidden group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1500!2d126.093306!3d8.633472!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOMKwMzgnMDAuNSJOIDEyNsKwMDUnMzUuOSJF!5e0!3m2!1sen!2sph!4v1609459200000!5m2!1sen!2sph"
                  width="100%"
                  height="100%"
                  title="NEMSU Lianga Campus Location Map"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale group-hover:grayscale-0 transition-all duration-500 group-hover:scale-110 border-0"
                ></iframe>
              </div>

              {/* Location Info */}
              <div className="p-5 sm:p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-4 sm:mb-6 group">
                  <div className="shrink-0 w-10 h-10 sm:w-14 sm:h-14 flex items-center justify-center animate-rotate-in group-hover:scale-110 transition-transform duration-300">
                    <img src="/img/icons/location.svg" alt="Location" className="w-10 h-10 sm:w-14 sm:h-14" suppressHydrationWarning />
                  </div>
                  <div className="w-full">
                    <h4 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-black dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">Visit Us</h4>
                    <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base lg:text-lg leading-relaxed mb-3 sm:mb-4 group-hover:text-zinc-500 dark:group-hover:text-zinc-300 transition-colors duration-300">
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
                      className="group/btn inline-flex rounded-[0.75em] bg-[#7c2d12] p-0 text-white font-bold text-sm sm:text-base lg:text-lg leading-none no-underline"
                    >
                      <span className="inline-flex items-center justify-center gap-2 rounded-[0.75em] border-2 border-[#7c2d12] bg-orange-600 px-6 py-3 text-white transition-transform duration-100 ease-linear translate-y-[-0.2em] group-hover/btn:translate-y-[-0.33em] group-active/btn:translate-y-0 group-hover/btn:bg-orange-700 sm:gap-3 sm:px-10 sm:py-4 lg:px-12">
                        <span>Get Directions</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </a>
                    <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors duration-300 cursor-default">
                      <span className="animate-bounce">🎉</span> No entrance fee required - Everyone welcome!
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
            <div className="sm:col-span-2 lg:col-span-2 animate-fade-in">
              {/* Philippine Flag with Time and Day */}
              <div className="flex items-center gap-3 mb-3 sm:mb-4 hover:translate-x-1 transition-transform duration-300">
                <img
                  src="/img/icons/philippine-flag.svg"
                  alt="Philippine flag"
                  className="h-6 w-9 sm:h-7 sm:w-10 rounded-sm object-cover animate-bounce-slow"
                  suppressHydrationWarning
                />
                <div className="text-zinc-400 text-xs sm:text-sm">
                  <div className="font-semibold text-white">{mounted ? formatTime(currentTime) : 'Loading...'}</div>
                  <div className="text-xs">{mounted ? formatDay(currentTime) : 'Loading...'}</div>
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-3 sm:mb-4">NEMSU-Hostel</h3>
              <p className="text-zinc-400 mb-4 sm:mb-6 max-w-md leading-relaxed text-sm sm:text-base hover:text-zinc-300 transition-colors duration-300">
                Your trusted accommodation and dining destination at NEMSU - Lianga Campus. We provide comfortable stays and delicious meals for students and visitors.
              </p>
              <div className="flex gap-3 sm:gap-4">
                <a href="https://web.facebook.com/bshmliangadbest?_rdc=1&_rdr#" title="Visit our Facebook page" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-orange-500 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 hover:-translate-y-1 animate-float-up">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                </a>
              </div>
            </div>

            {/* Contact Info */}
            <div className="animate-fade-in delay-200">
              <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">Contact Us</h4>
              <ul className="space-y-3 sm:space-y-4">
                <li>
                  <div className="flex items-start gap-2 sm:gap-3 group hover:translate-x-1 transition-transform duration-300">
                    <span className="text-orange-400 text-base sm:text-lg group-hover:scale-125 transition-transform duration-300">✆</span>
                    <div>
                      <p className="text-zinc-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Phone</p>
                      <a href="tel:09123456789" className="text-white hover:text-orange-400 transition-colors font-medium text-sm sm:text-base">+63 912 345 6789</a>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-2 sm:gap-3 group hover:translate-x-1 transition-transform duration-300">
                    <span className="text-orange-400 text-base sm:text-lg group-hover:scale-125 transition-transform duration-300">✉</span>
                    <div>
                      <p className="text-zinc-400 text-xs sm:text-sm mb-0.5 sm:mb-1">Gmail</p>
                      <a href="mailto:hello@hostel.com" className="text-white hover:text-orange-400 transition-colors font-medium text-sm sm:text-base break-all">hello@hostel.com</a>
                      <p className="text-xs text-zinc-500 mt-0.5 sm:mt-1">We reply within 24 hours</p>
                    </div>
                  </div>
                </li>
                <li>
                  <div className="flex items-start gap-2 sm:gap-3 group hover:translate-x-1 transition-transform duration-300">
                    <span className="text-orange-400 text-base sm:text-lg group-hover:scale-125 transition-transform duration-300">⏲</span>
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
              <p className="text-zinc-500 text-xs sm:text-sm text-center hover:text-zinc-400 transition-colors duration-300">
                &copy; 2026 Hostel at NEMSU - Lianga. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Delivery Modal */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeliveryModal(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 sm:p-8 max-w-md w-full animate-scale-in border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setShowDeliveryModal(false)}
              title="Close delivery options modal"
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold text-black dark:text-white mb-2">Delivery Options</h3>
              <p className="text-zinc-600 dark:text-zinc-400">Select your preferred delivery time</p>
            </div>

            <div className="space-y-3">
              {[
                { time: '~ 15 Mins', desc: 'Express Delivery', icon: '⚡' },
                { time: '~ 30 Mins', desc: 'Standard Delivery', icon: '🚗' },
                { time: '~ 45 Mins', desc: 'Economy Delivery', icon: '🚲' },
                { time: '~ 1 Hour', desc: 'Scheduled Delivery', icon: '📅' }
              ].map((option) => (
                <button
                  key={option.time}
                  onClick={() => handleDeliveryTimeSelect(option.time)}
                  className="w-full p-4 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-orange-500 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{option.icon}</span>
                    <div>
                      <p className="font-bold text-black dark:text-white">{option.time}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{option.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 sm:w-80 z-50 animate-slide-in-left">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-orange-200 dark:border-orange-800 p-4 flex items-center gap-3 backdrop-blur-sm">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <p className="text-sm font-medium text-black dark:text-white">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Welcome Pop-up */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowWelcome(false)}></div>
          <div className="relative bg-linear-to-br from-orange-50 to-white dark:from-zinc-800 dark:to-zinc-900 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in border border-orange-200 dark:border-orange-800">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4 animate-bounce">
                <span className="text-4xl">👋</span>
              </div>
              <h2 className="text-3xl font-bold text-black dark:text-white mb-3">Welcome!</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
                Welcome to NEMSU-Hostel! Enjoy authentic home-cooked meals with fast delivery. Let&apos;s get started! 🍽️
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowWelcome(false);
                    setShowOffer(true);
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105"
                >
                  See Special Offer
                </button>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="w-full bg-transparent border-2 border-orange-600 text-orange-600 dark:text-orange-400 font-bold py-3 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all duration-300"
                >
                  Browse Menu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Special Offer Pop-up */}
      {showOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowOffer(false)}></div>
          <div className="relative bg-linear-to-br from-amber-50 to-orange-50 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in border-2 border-amber-400 dark:border-orange-600 overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/20 rounded-full -mr-8 -mt-8"></div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full mb-4 text-sm font-bold">
                <span>🔥 LIMITED TIME</span>
              </div>
              <h2 className="text-3xl font-bold text-black dark:text-white mb-2">Special Offer!</h2>
              <p className="text-5xl font-black text-transparent bg-linear-to-r from-orange-600 to-red-600 bg-clip-text mb-3">20% OFF</p>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                Use code <span className="font-bold text-orange-600 dark:text-orange-400 text-lg">NEMSU20</span> on your first order!
              </p>
              <div className="bg-white dark:bg-zinc-700 rounded-lg p-4 mb-6 text-sm text-zinc-700 dark:text-zinc-300">
                ✓ Valid for all menu items<br/>
                ✓ Minimum order: ₱500<br/>
                ✓ Expires in 7 days
              </div>
              <button
                onClick={() => {
                  setShowOffer(false);
                  showNotification('Code copied: NEMSU20');
                }}
                className="w-full bg-linear-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all duration-300 hover:scale-105"
              >
                Claim Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Pop-up */}
      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowRating(false)}></div>
          <div className="relative bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 max-w-md w-full animate-scale-in border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setShowRating(false)}
              title="Close rating popup"
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full mb-4">
                <span className="text-4xl">⭐</span>
              </div>
              <h2 className="text-2xl font-bold text-black dark:text-white mb-2">Rate Your Experience</h2>
              <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                How would you rate your visit to NEMSU-Hostel?
              </p>
              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-all duration-200 ${
                      star <= rating ? 'scale-125' : 'scale-100 opacity-40'
                    } hover:scale-125`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <button
                onClick={handleRatingSubmit}
                disabled={rating === 0}
                className={`w-full font-bold py-3 rounded-lg transition-all duration-300 ${
                  rating > 0
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white hover:scale-105'
                    : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
                }`}
              >
                {rating > 0 ? `Submit ${rating}⭐ Rating` : 'Select a rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Buttons to trigger modals - positioned in bottom right for easy access */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-40">
        <button
          onClick={() => setShowRating(true)}
          title="Rate your experience"
          className="bg-yellow-500 hover:bg-yellow-600 text-white rounded-full p-4 shadow-lg hover:scale-110 transition-all duration-300 hover:shadow-xl"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
