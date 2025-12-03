import React from 'react';

export default function FAQPage() {
  // Define new theme variables (Emerald/Teal) for styling consistency
  const themeVars = {
    '--background': 'var(--color-gray-50, #f9fafb)', 
    '--surface': 'var(--color-white, #ffffff)',
    '--surface-2': 'var(--color-gray-100, #f3f4f6)', 
    '--foreground': 'var(--color-gray-900, #111827)',
    '--muted': 'var(--color-gray-600, #4b5563)',
    '--border': 'rgba(16, 185, 129, 0.12)', 
    '--accent-from': '#047857', 
    '--accent-to': '#34d399',   
  };

  const faqs = [
    { 
      q: "How does the Daily Blueprint prioritize my time?", 
      a: "It intelligently combines your fixed Routine blocks (sleep, class, meals) with prioritized Academic Tasks (due date, priority, and estimated duration) and strategically schedules them into your available free time slots." 
    },
    { 
      q: "What happens if I miss a scheduled task?", 
      a: "During your Evening Reflection, if a task is marked as incomplete, the Smart Rescheduling Logic automatically raises its priority and finds the next best optimal time slot in the following days to complete the remaining work." 
    },
    { 
      q: "How do AI Credits work and what are they used for?", 
      a: "AI Credits are used for powerful features like generating custom practice quizzes, creating comprehensive study summaries, and getting personalized feedback on your progress. Pro Max subscribers get unlimited usage." 
    },
    { 
      q: "How secure is my academic data and schedule history?", 
      a: "All your data, including academic tasks and reflection history, is stored securely using Mongoose. We focus on academic optimization and never share your sensitive profile data." 
    },
    { 
      q: "What is the difference between an Academic Task and a Routine?", 
      a: "Tasks have due dates and are flexible (movable by the planner). Routines (like sleep, meals, or fixed classes) are recurring commitments that block off time and are generally not moved by the planner." 
    },
  ];
  
  return (
    <main className="relative min-h-[90vh] px-6 py-20" style={themeVars}>
      {/* --- Background layers (Emerald/Teal Theme) --- */}
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
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(52, 211, 153, 0.3) 0%, transparent 70%)`
        }} 
      />
      
      {/* --- Header Section --- */}
      <div className="relative z-10 max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-2" style={{ color: themeVars['--foreground'] }}>
          Frequently Asked Questions
        </h1>
        <p className="text-lg" style={{ color: themeVars['--muted'] }}>
          Everything you need to know about StudySync Daily's planning engine and features.
        </p>
      </div>

      {/* --- FAQ Accordion --- */}
      <section 
        className="relative z-10 max-w-3xl mx-auto space-y-6"
        style={{ color: themeVars['--foreground'] }}
      >
        {faqs.map((f, index) => (
          <details 
            key={index} 
            className="group rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl"
            style={{ 
              backgroundColor: themeVars['--surface'],
              border: `1px solid ${themeVars['--border']}`,
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)'
            }}
          >
            <summary 
              className="cursor-pointer text-xl font-bold transition-colors duration-200 list-none flex justify-between items-center"
            >
              <span 
                style={{ 
                  background: `linear-gradient(135deg, ${themeVars['--accent-from']}, ${themeVars['--accent-to']})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {f.q}
              </span>
              <span className="text-xl text-emerald-500 transform transition-transform duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p 
              className="mt-4 leading-relaxed text-base border-t pt-4" 
              style={{ color: themeVars['--muted'], borderColor: themeVars['--surface-2'] }}
            >
              {f.a}
            </p>
          </details>
        ))}
      </section>
    </main>
  );
}