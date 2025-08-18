export default function PricingPage() {
  const plans = [
    { name: "Starter", price: "$0", features: ["Creator page", "Basic analytics"] },
    { name: "Pro", price: "$9/mo", features: ["Advanced analytics", "Priority support", "Custom branding"] },
    { name: "Elite", price: "$29/mo", features: ["Team access", "Webhooks", "API access"] },
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
        className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
        style={{ color: 'var(--foreground)' }}
      >
        {plans.map((p, index) => (
          <div 
            key={index} 
            className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
            style={{ 
              backgroundColor: 'var(--surface, #ffffff)',
              border: '1px solid var(--border, rgba(0,0,0,0.12))',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
            }}
          >
            {/* Hover overlay */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none rounded-2xl"
              style={{ 
                background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`
              }}
            />
            
            {/* Corner accent */}
            <div 
              className="absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 pointer-events-none"
              style={{ 
                background: `linear-gradient(135deg, var(--accent-from, #10b981), transparent)`
              }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              <h3 
                className="text-2xl font-bold mb-2"
                style={{ 
                  background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {p.name}
              </h3>
              
              <p 
                className="text-3xl font-bold mb-4"
                style={{ color: 'var(--foreground)' }}
              >
                {p.price}
              </p>
              
              <ul className="space-y-2 mb-6">
                {p.features.map((f, featureIndex) => (
                  <li 
                    key={featureIndex} 
                    className="flex items-center space-x-2"
                    style={{ color: 'var(--muted, #64748b)' }}
                  >
                    <span 
                      className="text-sm font-bold"
                      style={{ color: 'var(--accent-solid, #059669)' }}
                    >
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              
              <button 
                className="w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, var(--accent-from, #10b981), var(--accent-to, #059669))`,
                  color: 'white',
                  boxShadow: '0 4px 6px -1px var(--accent-shadow, rgba(16,185,129,0.25))'
                }}
              >
                Choose {p.name}
              </button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}