"use client";
import { useState, useEffect } from "react";

export default function ContactPage() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
  };

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
        className="relative z-10 max-w-3xl w-full backdrop-blur-sm p-8 rounded-2xl shadow-xl space-y-6 border"
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
            style={isHydrated ? { 
              background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            } : {
              color: '#10b981'
            }}
          >
            Get in touch
          </h1>
          <p 
            className="text-sm mb-4"
            style={{ color: 'var(--muted, #64748b)' }}
          >
            We'd love to hear from you. Fill out the form and we'll get back soon.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <label 
              htmlFor="name"
              className="text-sm font-medium"
              style={{ color: 'var(--muted, #64748b)' }}
            >
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--input-bg, #ffffff)',
                borderColor: 'var(--border, rgba(0,0,0,0.12))',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--accent-ring, rgba(16,185,129,0.4))'
              }}
              placeholder="Your name"
              required
            />
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="email"
              className="text-sm font-medium"
              style={{ color: 'var(--muted, #64748b)' }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2"
              style={{ 
                backgroundColor: 'var(--input-bg, #ffffff)',
                borderColor: 'var(--border, rgba(0,0,0,0.12))',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--accent-ring, rgba(16,185,129,0.4))'
              }}
              placeholder="Email address"
              required
            />
          </div>

          <div className="space-y-2">
            <label 
              htmlFor="message"
              className="text-sm font-medium"
              style={{ color: 'var(--muted, #64748b)' }}
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              value={formData.message}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 transition-all duration-200 focus:outline-none focus:ring-2 resize-vertical"
              style={{ 
                backgroundColor: 'var(--input-bg, #ffffff)',
                borderColor: 'var(--border, rgba(0,0,0,0.12))',
                color: 'var(--foreground)',
                '--tw-ring-color': 'var(--accent-ring, rgba(16,185,129,0.4))'
              }}
              placeholder="Your message..."
              required
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border"
              style={{ 
                background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                color: 'white',
                borderColor: 'transparent',
                boxShadow: '0 4px 6px -1px var(--accent-shadow, rgba(16,185,129,0.25))'
              }}
            >
              Send message
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}