"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";

const Navbar = () => {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user profile to determine if they're a creator
  useEffect(() => {
    if (session?.user) {
      // Add cache-busting parameter to ensure fresh data
      fetch(`/api/creator/profile?t=${Date.now()}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          console.log('Navbar - Fetched user profile:', data);
          console.log('isCreator:', data?.isCreator, 'profileSetupComplete:', data?.profileSetupComplete);
          setUserProfile(data);
        })
        .catch(err => {
          console.error('Navbar - Failed to fetch user profile:', err);
          setUserProfile(null);
        });
    } else {
      setUserProfile(null);
    }
  }, [session]);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact" },
  ].filter(Boolean);


  return (
    <nav className="w-full text-[color:var(--foreground)] px-6 py-4 shadow-md bg-[var(--background)] border-b border-[color:var(--accent-border)]">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={40} height={40} />
          <h1 className="text-xl font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">
              Get Me A Coffee
            </span>
          </h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Navigation Links */}
          <ul className="flex items-center gap-6">
            {[{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "FAQ", href: "/faq" }, ...navItems].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`transition duration-200 hover:text-[color:var(--accent-solid)] ${
                    pathname === href
                      ? "text-[color:var(--accent-solid)]"
                      : "text-[color:var(--muted)]"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Logged-in user info */}
          {session && (
            <div className="flex items-center gap-3">
              {/* Show different options based on user type */}
              {userProfile?.isCreator && userProfile?.profileSetupComplete ? (
                /* Creator - Show Dashboard Link */
                <Link
                  href="/dashboard"
                  className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                >
                  Dashboard
                </Link>
              ) : (
                /* Regular User - Show Options */
                <div className="flex items-center gap-2">
                  <Link
                    href="/find-creators"
                    className="px-3 py-2 rounded-lg font-medium bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-sm"
                  >
                    Find Creators
                  </Link>
                  <Link
                    href="/creator-setup"
                    className="px-3 py-2 rounded-lg font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-sm"
                  >
                    Create Page
                  </Link>
                </div>
              )}
              
              {/* User Info */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[color:var(--muted)]">
                  {session.user?.email || "Logged in"}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth" })} // ✅ redirect to /auth
                  className="px-3 py-1 text-sm rounded bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] shadow-[0_0_12px_var(--accent-shadow)]"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        {mounted && (
          <button
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="ml-4 p-2 rounded hover:bg-gray-800 transition duration-200 border border-[color:var(--accent-border)]"
            title={
              resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"
            }
          >
            {resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}

        {/* Mobile Toggle */}
        <button
          className="md:hidden ml-4 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="text-lg">☰</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 space-y-4">
          {/* Navigation Links */}
          <ul className="flex flex-col gap-4 text-sm font-medium">
            {[{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "FAQ", href: "/faq" }, ...navItems].map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className={`block py-1 px-2 rounded hover:bg-gray-800 transition duration-200 ${
                    pathname === href ? "text-pink-400" : "text-gray-200"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Mobile Logged-in user info */}
          {session && (
            <div className="flex flex-col gap-3 px-2 border-t border-gray-700 pt-4">
              {/* Show different options based on user type */}
              {userProfile?.isCreator && userProfile?.profileSetupComplete ? (
                /* Creator - Show Dashboard Link */
                <Link
                  href="/dashboard"
                  className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium text-center hover:shadow-lg transition-all duration-200"
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                /* Regular User - Show Both Options */
                <>
                  <Link
                    href="/find-creators"
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-center hover:shadow-lg transition-all duration-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Find Creators
                  </Link>
                  <Link
                    href="/creator-setup"
                    className="px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium text-center hover:shadow-lg transition-all duration-200"
                    onClick={() => setMenuOpen(false)}
                  >
                    Create My Page
                  </Link>
                </>
              )}
              
              {/* User Info */}
              <span className="text-gray-300 text-sm">
                {session.user?.email || "Logged in"}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/auth" })} // ✅ redirect to /auth
                className="px-4 py-3 rounded-lg bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-pink-600 hover:to-fuchsia-600 shadow-[0_0_12px_rgba(236,72,153,.35)] text-white font-medium"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
