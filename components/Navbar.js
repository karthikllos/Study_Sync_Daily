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
  const { data: session } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact" },
    { label: "Login", href: "/login" },
    { label: "Signup", href: "/signup" },
  ].filter(Boolean);

  return (
    <nav className="w-full text-[color:var(--foreground)] px-6 py-4 shadow-md bg-[var(--background)] border-b border-[color:var(--accent-border)]">
      <div className="flex items-center justify-between">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="logo" width={40} height={40} />
          <h1 className="text-xl font-semibold tracking-wide">
            <span className="bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] bg-clip-text text-transparent">Get Me A Coffee</span>
          </h1>
        </div>

        {/* Desktop Menu */}
        <ul className="hidden md:flex items-center gap-6 text-sm font-medium">
          {[{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "FAQ", href: "/faq" }, ...navItems].map(({ label, href }) => {
            if (session && (label === "Login" || label === "Signup")) return null;
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`transition duration-200 hover:text-[color:var(--accent-solid)] ${
                    pathname === href ? "text-[color:var(--accent-solid)]" : "text-[color:var(--muted)]"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {session && (
            <li className="flex items-center gap-2">
              <span className="text-sm text-[color:var(--muted)]">
                {session.user?.email || "Logged in"}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1 text-sm rounded bg-gradient-to-r from-[var(--accent-from)] to-[var(--accent-to)] shadow-[0_0_12px_var(--accent-shadow)]"
              >
                Sign out
              </button>
            </li>
          )}
        </ul>

        {/* Theme Toggle */}
        {mounted && (
          <button
            aria-label="Toggle theme"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="ml-4 p-2 rounded hover:bg-gray-800 transition duration-200 border border-[color:var(--accent-border)]"
            title={resolvedTheme === "dark" ? "Switch to light" : "Switch to dark"}
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
        <ul className="md:hidden mt-4 flex flex-col gap-4 text-sm font-medium">
          {[{ label: "Features", href: "/features" }, { label: "Pricing", href: "/pricing" }, { label: "FAQ", href: "/faq" }, ...navItems].map(({ label, href }) => {
            if (session && (label === "Login" || label === "Signup")) return null;
            return (
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
            );
          })}

          {session && (
            <li className="flex flex-col gap-1 px-2">
              <span className="text-gray-300">{session.user?.email || "Logged in"}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1 rounded bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-pink-600 hover:to-fuchsia-600 shadow-[0_0_12px_rgba(236,72,153,.35)]"
              >
                Sign out
              </button>
            </li>
          )}
        </ul>
      )}
    </nav>
  );
};

export default Navbar;
