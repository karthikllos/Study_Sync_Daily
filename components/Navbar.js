"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Users, CreditCard, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user academic profile (if signed in) — cache-busting to keep it fresh
  useEffect(() => {
    if (session?.user) {
      fetch(`/api/user/academic-profile?t=${Date.now()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          console.log("Navbar - fetched academic profile:", data);
          setUserProfile(data);
        })
        .catch((err) => {
          console.error("Navbar - failed to fetch academic profile:", err);
          setUserProfile(null);
        });
    } else {
      setUserProfile(null);
    }
  }, [session]);

  const navItems = [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "FAQ", href: "/faq" },
  ].filter(Boolean);

  const authenticatedNavItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Study Groups", href: "/groups", icon: Users },
  ];

  const handleThemeToggle = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  return (
    <nav className="w-full text-[color:var(--foreground)] px-6 py-4 shadow-md bg-[var(--background)] border-b border-[color:var(--accent-border)]">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="StudySync Daily logo" width={40} height={40} />
          <h1 className="text-xl font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
              StudySync Daily
            </span>
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Navigation Links */}
          <ul className="flex items-center gap-6">
            {(session ? authenticatedNavItems : navItems).map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 transition duration-200 hover:text-[color:var(--accent-solid)] ${
                    pathname === href ? "text-[color:var(--accent-solid)]" : "text-[color:var(--muted)]"
                  }`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Authenticated user CTA / Info with Dropdown */}
          {session ? (
            <div className="flex items-center gap-3 relative">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[color:var(--muted)]">
                  {session.user?.username || session.user?.email || "Account"}
                </span>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="p-2 rounded hover:bg-gray-800 transition duration-200 flex items-center"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute top-full right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50 min-w-48">
                  <Link
                    href="/account/billing"
                    className="flex items-center gap-2 px-4 py-3 hover:bg-gray-800 transition duration-200 border-b border-gray-700"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Billing</span>
                  </Link>
                  <button
                    onClick={() => {
                      signOut({ callbackUrl: "/auth" });
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-red-400 hover:bg-gray-800 transition duration-200"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth"
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            aria-label="Toggle theme"
            onClick={handleThemeToggle}
            className="ml-4 p-2 rounded hover:bg-gray-800 dark:hover:bg-gray-700 transition duration-200 border border-[color:var(--accent-border)]"
            title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Mobile Toggle */}
        <button className="md:hidden ml-4 text-white" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="text-lg">☰</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 space-y-4">
          {/* Navigation Links */}
          <ul className="flex flex-col gap-4 text-sm font-medium">
            {(session ? authenticatedNavItems : navItems).map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 block py-1 px-2 rounded hover:bg-gray-800 transition duration-200 ${
                    pathname === href ? "text-emerald-400" : "text-gray-200"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Auth actions */}
          <div className="flex flex-col gap-3 px-2 border-t border-gray-700 pt-4">
            {session ? (
              <>
                <span className="text-gray-300 text-sm">{session.user?.username || session.user?.email}</span>
                <Link
                  href="/account/billing"
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Billing</span>
                </Link>
                <button
                  onClick={() => {
                    signOut({ callbackUrl: "/auth" });
                    setMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-teal-600 hover:to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,.35)] text-white font-medium"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-center hover:shadow-lg transition-all duration-200"
                onClick={() => setMenuOpen(false)}
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
