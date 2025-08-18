import Image from "next/image";
import Link from "next/link";
import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main className="relative min-h-[100vh] flex flex-col items-center justify-center px-6 overflow-hidden">
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
          background: `linear-gradient(135deg, var(--background) 0%, var(--surface-2, #f1f5f9) 20%, var(--surface, #ffffff) 60%, var(--surface-2, #f8fafc) 100%)`
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, var(--accent-border, rgba(16,185,129,0.15)) 0%, transparent 70%)`
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `radial-gradient(ellipse 60% 40% at 80% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 60%)`
        }} 
      />

      {/* Animated grid pattern overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--border, rgba(0,0,0,0.08)) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border, rgba(0,0,0,0.08)) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full opacity-20 blur-xl animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-violet-600 to-blue-500 rounded-full opacity-20 blur-xl animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
      <div className="absolute bottom-32 left-20 w-28 h-28 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-20 blur-xl animate-bounce" style={{ animationDelay: '2s', animationDuration: '3.5s' }} />

      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-4xl space-y-8 mt-16 mb-12">
        {/* Main heading with enhanced styling */}
        <div className="relative">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4 flex items-center justify-center gap-4 flex-wrap transition-colors duration-500">
            <span 
              className="
                /* Light mode: blinking green text */
                text-green-600 animate-pulse drop-shadow-sm
                /* Dark mode: keep gradient + pulse */
                dark:bg-clip-text dark:text-transparent dark:animate-pulse dark:drop-shadow-lg
              "
              style={{
                background: 'linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Buy Me A Chai
            </span>
            <div className="relative">
              <img
                src="https://i0.wp.com/boingboing.net/wp-content/uploads/2016/12/decorate-1.gif?resize=370%2C172&ssl=1"
                alt="chai gif"
                className="
                  w-[5rem] h-[5rem] sm:w-[6.5rem] sm:h-[6.5rem]
                  rounded-xl shadow-md transition-all duration-300 transform hover:scale-110
                  bg-white/70 backdrop-blur-md border-2 border-white/20
                  dark:shadow-lg dark:bg-transparent
                "
                style={{
                  filter: 'drop-shadow(0 10px 25px rgba(236, 72, 153, 0.4))'
                }}
              />
              {/* Glow effect around gif */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-400 via-pink-500 to-violet-600 opacity-30 blur-md -z-10 animate-pulse" />
            </div>
          </h1>
        </div>

        {/* Enhanced descriptions */}
        <div 
          className="relative backdrop-blur-sm rounded-2xl p-6 border shadow-xl space-y-4"
          style={{ 
            backgroundColor: 'var(--surface, rgba(255,255,255,0.8))',
            borderColor: 'var(--border, rgba(0,0,0,0.1))'
          }}
        >
          <div 
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ 
              background: 'linear-gradient(135deg, #fbbf24, #ec4899, #8b5cf6)'
            }}
          />
          
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium pt-2">
            Support my work with a hot cup of chai ☕
          </p>

          <p 
            className="text-lg font-light leading-relaxed"
            style={{ color: 'var(--muted, #64748b)' }}
          >
            A crowdfunding platform for creators. Get funded by your fans and followers. 
            <span 
              className="font-semibold ml-2 bg-clip-text text-transparent"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Start now!
            </span>
          </p>
        </div>
      </div>

      {/* Dashboard for logged-in users */}
      <div className="relative z-10 w-full max-w-6xl">
        <Dashboard />
      </div>

      {/* Features Section */}
      <section className="relative z-10 mt-24 mb-12 max-w-6xl w-full">
        <div className="text-center mb-16">
          <h2 
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669, #0891b2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Why Choose Chai?
          </h2>
          <div 
            className="w-24 h-1 mx-auto rounded-full"
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)'
            }}
          />
        </div>

        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {[
            {
              img: "https://assets-v2.lottiefiles.com/a/4bac5fc2-1167-11ee-8a4a-1779c9fbd7bf/Cpx8JAjE84.gif",
              title: "Turn Ideas into Income",
              desc: "Your creativity deserves a platform. Monetize effortlessly with chai-powered support.",
              gradient: "from-yellow-400 to-orange-500"
            },
            {
              img: "https://i.pinimg.com/originals/63/89/fa/6389fa22ed7653c40570c98b03764afc.gif",
              title: "Get Discovered Globally",
              desc: "Put your work in front of the world. Let your fans fund your journey from anywhere.",
              gradient: "from-pink-400 to-violet-500"
            },
            {
              img: "https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif",
              title: "Build Your Community",
              desc: "Turn passive followers into active supporters and grow a loyal tribe.",
              gradient: "from-green-400 to-cyan-500"
            },
          ].map((card, idx) => (
            <div 
              key={idx} 
              className="group relative flex flex-col items-center text-center space-y-6 p-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-1 border backdrop-blur-sm transform hover:-translate-y-2"
              style={{ 
                backgroundColor: 'var(--surface, rgba(255,255,255,0.9))',
                borderColor: 'var(--border, rgba(0,0,0,0.1))',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
            >
              {/* Gradient top border */}
              <div 
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r ${card.gradient}`}
              />
              
              {/* Image with enhanced styling */}
              <div className="relative">
                <img
                  src={card.img}
                  className="rounded-2xl w-[120px] h-[120px] p-2 object-cover shadow-lg transition-transform duration-300 group-hover:scale-110"
                  style={{ 
                    backgroundColor: 'var(--surface-2, #f8fafc)',
                    border: '2px solid transparent',
                    backgroundImage: `linear-gradient(var(--surface-2, #f8fafc), var(--surface-2, #f8fafc)), linear-gradient(135deg, ${card.gradient.includes('yellow') ? '#fbbf24, #f59e0b' : card.gradient.includes('pink') ? '#ec4899, #8b5cf6' : '#10b981, #06b6d4'})`,
                    backgroundOrigin: 'border-box',
                    backgroundClip: 'content-box, border-box'
                  }}
                  alt={card.title}
                />
                {/* Glow effect */}
                <div 
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-30 blur-md transition-opacity duration-300 -z-10`}
                />
              </div>

              {/* Content */}
              <div className="space-y-3">
                <h3 
                  className="text-xl font-bold"
                  style={{ color: 'var(--foreground)' }}
                >
                  {card.title}
                </h3>
                <p 
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--muted, #64748b)' }}
                >
                  {card.desc}
                </p>
              </div>

              {/* Hover gradient overlay */}
              <div 
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Floating Logo with enhanced styling */}
      <div 
        className="absolute bottom-6 right-8 opacity-30 hover:opacity-80 transition-opacity duration-300 transform hover:scale-110 animate-bounce"
        style={{
          animationDuration: '4s',
          filter: 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.3))'
        }}
      >
        <div className="relative">
          <Image src="/logo.png" alt="chai cup" width={80} height={80} className="rounded-full" />
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-cyan-500 opacity-30 blur-lg -z-10 animate-pulse" />
        </div>
      </div>
    </main>
  );
}