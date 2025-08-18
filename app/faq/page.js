export default function FAQPage() {
  const faqs = [
    { q: "How do I get paid?", a: "Connect your payment provider and funds are deposited securely." },
    { q: "Can I customize my page?", a: "Yes, upload an avatar, banner, and set your username." },
    { q: "Do you support teams?", a: "Team access is available on Elite." },
  ];
  
  return (
    <main className="relative min-h-[70vh] px-6 py-16">
      {/* Background layers */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: 'var(--background)'
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `linear-gradient(135deg, var(--background) 0%, var(--surface-2, #f1f5f9) 50%, transparent 100%)`
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, var(--accent-border, rgba(16,185,129,0.2)) 0%, transparent 70%)`
        }} 
      />
      
      <section 
        className="relative z-10 max-w-3xl mx-auto space-y-4"
        style={{ color: 'var(--foreground)' }}
      >
        {faqs.map((f, index) => (
          <details 
            key={index} 
            className="group rounded-2xl p-4 transition-all duration-300 hover:shadow-lg"
            style={{ 
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, rgba(0,0,0,0.12))',
              boxShadow: '0 2px 4px -1px rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.06)'
            }}
          >
            <summary 
              className="cursor-pointer font-semibold transition-colors duration-200 hover:opacity-80"
              style={{ 
                background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {f.q}
            </summary>
            <p 
              className="mt-3 leading-relaxed" 
              style={{ color: 'var(--muted, #64748b)' }}
            >
              {f.a}
            </p>
          </details>
        ))}
      </section>
    </main>
  );
}