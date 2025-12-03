import React from 'react';
import { BookOpen, Zap, TrendingUp, Cpu, CalendarCheck } from 'lucide-react'; // Import Lucide icons for modern look

export default function FeaturesPage() {
  const features = [
    { 
      title: "Daily Blueprint Engine", 
      desc: "Get a unified, chronological plan blending fixed routines (sleep, classes) with dynamically scheduled study blocks.", 
      icon: <CalendarCheck className="h-8 w-8 text-emerald-600" /> 
    },
    { 
      title: "Adaptive Smart Scheduling", 
      desc: "Our AI breaks down large tasks into manageable micro-goals and automatically reschedules slipped work.", 
      icon: <Zap className="h-8 w-8 text-emerald-600" /> 
    },
    { 
      title: "AI Study Helper & Quizzes", 
      desc: "Generate notes, summaries, and personalized practice quizzes instantly using your AI Credits.", 
      icon: <Cpu className="h-8 w-8 text-emerald-600" /> 
    },
    { 
      title: "Performance Reflection", 
      desc: "Daily check-ins on focus and energy levels drive predictive scheduling for optimal study times.", 
      icon: <TrendingUp className="h-8 w-8 text-emerald-600" /> 
    },
    { 
      title: "Integrated Routine Management", 
      desc: "Protect your time by mapping sleep, meals, and exercise to create fixed, distraction-free study windows.", 
      icon: <BookOpen className="h-8 w-8 text-emerald-600" /> 
    },
    { 
      title: "Study Streaks & Gamification", 
      desc: "Stay motivated with streaks, badges, and optional accountability partners to reach your goals.", 
      icon: <CalendarCheck className="h-8 w-8 text-emerald-600" /> 
    },
  ];

  // Define new theme variables (Emerald/Teal)
  const themeVars = {
    '--background': 'var(--color-gray-50, #f9fafb)', 
    '--surface': 'var(--color-white, #ffffff)',
    '--surface-2': 'var(--color-gray-100, #f3f4f6)', 
    '--foreground': 'var(--color-gray-900, #111827)',
    '--muted': 'var(--color-gray-600, #4b5563)',
    '--border': 'rgba(16, 185, 129, 0.12)', // Light Emerald border
    '--accent-border': 'rgba(16, 185, 129, 0.2)', // Emerald accent border
    '--accent-from': '#047857', // Dark Teal/Emerald for gradient start
    '--accent-to': '#34d399',   // Light Emerald for gradient end
  };
  
  return (
    <main className="relative min-h-[90vh] px-6 py-20" style={themeVars}>
      {/* --- Background Layers (Updated to Emerald/Teal Theme) --- */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ background: themeVars['--background'] }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `linear-gradient(135deg, ${themeVars['--background']} 0%, ${themeVars['--surface-2']} 50%, transparent 100%)`
        }} 
      />
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${themeVars['--accent-border']} 0%, transparent 70%)`
        }} 
      />
      
      {/* --- Header Section --- */}
      <div className="relative z-10 max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl font-extrabold mb-4" style={{ color: themeVars['--foreground'] }}>
          Features that Drive Academic Success
        </h1>
        <p className="text-xl" style={{ color: themeVars['--muted'] }}>
          StudySync Daily moves beyond simple task management to become your proactive academic partner.
        </p>
      </div>

      {/* --- Features Grid --- */}
      <section 
        className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        style={{ color: themeVars['--foreground'] }}
      >
        {features.map((f, index) => (
          <div 
            key={index}
            className="group relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl"
            style={{ 
              backgroundColor: themeVars['--surface'],
              border: `1px solid ${themeVars['--border']}`,
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)'
            }}
          >
            {/* Hover overlay (Updated gradient) */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none rounded-2xl"
              style={{ 
                background: `linear-gradient(135deg, ${themeVars['--accent-from']}, ${themeVars['--accent-to']})`
              }}
            />
            
            {/* Corner accent (Updated gradient) */}
            <div 
              className="absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 pointer-events-none"
              style={{ 
                background: `linear-gradient(135deg, ${themeVars['--accent-from']}, transparent)`
              }}
            />
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 
                className="text-2xl font-bold mb-3"
                style={{ 
                  background: `linear-gradient(135deg, ${themeVars['--accent-from']}, ${themeVars['--accent-to']})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {f.title}
              </h3>
              <p 
                className="leading-relaxed text-base" 
                style={{ color: themeVars['--muted'] }}
              >
                {f.desc}
              </p>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}