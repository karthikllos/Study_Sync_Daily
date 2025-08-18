"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [username, setUsername] = useState("");

  return (
    <main className="relative min-h-[80vh] flex items-center justify-center px-6 py-16">
      {/* Background layers using CSS variables */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: 'var(--background)'
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `linear-gradient(135deg, var(--background) 0%, var(--surface-2, #f1f5f9) 30%, var(--surface, #ffffff) 100%)`
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `radial-gradient(ellipse 70% 50% at 50% 30%, var(--accent-border, rgba(16,185,129,0.1)) 0%, transparent 60%)`
        }} 
      />
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border, rgba(0,0,0,0.08)) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border, rgba(0,0,0,0.08)) 1px, transparent 1px)
          `,
          backgroundSize: '14px 24px'
        }}
      />

      <section 
        className="relative z-10 max-w-md w-full backdrop-blur-sm p-8 rounded-2xl shadow-xl space-y-4 border"
        style={{ 
          backgroundColor: 'var(--surface, #ffffff)',
          borderColor: 'var(--border, rgba(0,0,0,0.12))',
          color: 'var(--foreground)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Gradient accent bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ 
            background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`
          }}
        />
        
        <div className="pt-2">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ 
              background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Create your page
          </h1>
          <p 
            className="text-sm"
            style={{ color: 'var(--muted, #64748b)' }}
          >
            Pick a unique username to receive support.
          </p>
        </div>
        
        <div className="space-y-3">
          <label 
            className="text-sm font-medium"
            style={{ color: 'var(--muted, #64748b)' }}
          >
            Username
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s+/g, "").toLowerCase())}
            className="w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2"
            style={{ 
              backgroundColor: 'var(--input-bg, #ffffff)',
              borderColor: 'var(--border, rgba(0,0,0,0.12))',
              color: 'var(--foreground)',
              '--tw-ring-color': 'var(--accent-ring, rgba(16,185,129,0.4))'
            }}
            placeholder="e.g. johndoe"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 pt-4">
          <button 
            onClick={() => signIn("google")} 
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border"
            style={{ 
              background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
              color: 'white',
              borderColor: 'transparent',
              boxShadow: '0 4px 6px -1px var(--accent-shadow, rgba(16,185,129,0.25))'
            }}
          >
            Continue with Google
          </button>
          
          <button 
            onClick={() => signIn("github")} 
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] border"
            style={{ 
              backgroundColor: 'var(--surface-2, #f1f5f9)',
              color: 'var(--foreground)',
              borderColor: 'var(--border, rgba(0,0,0,0.12))'
            }}
          >
            Continue with GitHub
          </button>
          
          <button 
            onClick={() => signIn("linkedin")} 
            className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-md hover:scale-[1.01] border"
            style={{ 
              backgroundColor: 'var(--surface-2, #f1f5f9)',
              color: 'var(--foreground)',
              borderColor: 'var(--border, rgba(0,0,0,0.12))'
            }}
          >
            Continue with LinkedIn
          </button>
        </div>
      </section>
    </main>
  );
}