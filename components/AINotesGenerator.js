// components/AINotesGenerator.js
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles } from 'lucide-react';

export default function AINotesGenerator({ onNotesGenerated }) {
  const [subject, setSubject] = useState('');
  const [rawNotes, setRawNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState('');

  const handleGenerate = async () => {
    if (!subject.trim() || !rawNotes.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/ai/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, rawNotes }),
      });

      if (response.ok) {
        const { notes } = await response.json();
        setGeneratedNotes(notes);
        if (onNotesGenerated) onNotesGenerated(notes);
      }
    } catch (error) {
      console.error('Error generating notes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Subject/Topic</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full p-2 border rounded-md"
          placeholder="e.g., Linear Algebra, World War II, Quantum Physics"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Your Notes</label>
        <Textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          placeholder="Paste your rough notes here..."
          rows={5}
        />
      </div>

      <Button 
        onClick={handleGenerate} 
        disabled={loading || !subject.trim() || !rawNotes.trim()}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Generate Enhanced Notes
      </Button>

      {generatedNotes && (
        <div className="space-y-2 mt-6">
          <label className="text-sm font-medium">Enhanced Notes</label>
          <div className="p-4 bg-muted rounded-md whitespace-pre-wrap">
            {generatedNotes}
          </div>
        </div>
      )}
    </div>
  );
}