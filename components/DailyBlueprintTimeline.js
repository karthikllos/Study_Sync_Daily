"use client";
import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, Loader2, Save, Plus, Trash2, BookOpen, Target, Edit, Calendar } from 'lucide-react';

/**
 * DailyBlueprintTimeline component (Professional Timeline Design)
 */
export default function DailyBlueprintTimeline({ blueprintData }) {
    const initialBlueprint = blueprintData?.blueprint || { routines: [], assignments: [], microGoals: [] };
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false); 

    const [routines, setRoutines] = useState(initialBlueprint.routines || []);
    const [assignments, setAssignments] = useState(initialBlueprint.assignments || []);
    const [microGoals, setMicroGoals] = useState(initialBlueprint.microGoals || []);

    const [newItem, setNewItem] = useState({
        routineName: '',
        routineStartTime: '09:00',
        routineEndTime: '10:00',
        assignmentTitle: '',
        assignmentSubject: '',
        microGoalGoal: '',
    });

    useEffect(() => {
        if (blueprintData?.blueprint) {
            setRoutines(blueprintData.blueprint.routines || []);
            setAssignments(blueprintData.blueprint.assignments || []);
            setMicroGoals(blueprintData.blueprint.microGoals || []);

            const hasPlan = 
                (blueprintData.blueprint.routines?.length || 0) > 0 ||
                (blueprintData.blueprint.assignments?.length || 0) > 0 ||
                (blueprintData.blueprint.microGoals?.length || 0) > 0;
            
            if (!hasPlan) {
                setIsEditing(true);
            }
        }
        setLoading(false);
    }, [blueprintData]);

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-emerald-500" />;
            case 'pending': return <Clock className="h-5 w-5 text-yellow-500" />;
            case 'slipped': return <XCircle className="h-5 w-5 text-red-500" />;
            default: return null;
        }
    };

    const saveBlueprint = async () => {
        setSaving(true);
        setError("");

        try {
            const res = await fetch("/api/planner/blueprint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ routines, assignments, microGoals }),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                console.log("✅ Blueprint saved successfully!");
                setError("Blueprint successfully saved!");
                setIsEditing(false); 
            } else {
                setError(data.error || "Failed to save blueprint.");
            }
        } catch (err) {
            setError("Network Error: Could not reach the server.");
        } finally {
            setSaving(false);
        }
    };

    const generateUniqueId = () => `id-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const handleCustomAddItem = (type) => {
        const id = generateUniqueId();

        if (type === 'routine' && newItem.routineName && newItem.routineStartTime && newItem.routineEndTime) {
            setRoutines(prev => [...prev, { id, name: newItem.routineName, startTime: newItem.routineStartTime, endTime: newItem.routineEndTime, status: 'pending' }]);
            setNewItem(prev => ({ ...prev, routineName: '' }));
        } 
        else if (type === 'assignment' && newItem.assignmentTitle && newItem.assignmentSubject) {
            setAssignments(prev => [...prev, { id, title: newItem.assignmentTitle, subject: newItem.assignmentSubject, status: 'pending' }]);
            setNewItem(prev => ({ ...prev, assignmentTitle: '', assignmentSubject: '' }));
        } 
        else if (type === 'microGoal' && newItem.microGoalGoal) {
            setMicroGoals(prev => [...prev, { id, goal: newItem.microGoalGoal, status: 'pending' }]);
            setNewItem(prev => ({ ...prev, microGoalGoal: '' }));
        }
    };
    
    const handleRemoveItem = (type, id) => {
        if (type === 'routine') setRoutines(prev => prev.filter(item => item.id !== id));
        if (type === 'assignment') setAssignments(prev => prev.filter(item => item.id !== id));
        if (type === 'microGoal') setMicroGoals(prev => prev.filter(item => item.id !== id));
    };

    // Simple Card Renderer (Used in Edit Mode)
    const renderItemCard = (item, type, accentColor) => {
        const isCompleted = item.status === 'completed';
        const cardClasses = isCompleted 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500' 
            : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600';
        
        return (
            <div 
                key={item.id} 
                className={`p-4 rounded-xl flex justify-between items-start transition-all duration-300 border-l-4 ${cardClasses} hover:shadow-md`}
            >
                <div className="flex items-start gap-3 flex-1">
                    <StatusIcon status={item.status} />
                    <div>
                        <p className={`font-semibold text-lg text-gray-900 dark:text-white ${isCompleted ? 'line-through text-opacity-60' : ''}`}>
                            {item.title || item.name || item.goal}
                        </p>
                        {(type === 'routine' && item.startTime && item.endTime) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                <Clock className="h-4 w-4 text-emerald-500" /> {item.startTime} - {item.endTime}
                            </p>
                        )}
                        {(type === 'assignment' && item.subject) && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                <BookOpen className="h-4 w-4 text-blue-500" /> {item.subject}
                            </p>
                        )}
                    </div>
                </div>
                
                {isEditing && (
                    <button
                        onClick={() => handleRemoveItem(type, item.id)}
                        className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                        title="Remove item"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        );
    };

    const renderListSection = (title, Icon, data, type, accentColor, addForm) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 transition-shadow duration-300 hover:shadow-2xl">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-gray-700 mb-4">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                    <Icon className={`h-6 w-6 text-${accentColor}-500`} /> 
                    {title}
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">({data.length})</span>
                </h2>
            </div>
            
            {addForm()} 

            <div className="space-y-4">
                {data.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400 border-dashed border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900/40">
                        No {title.toLowerCase()} scheduled. Use the form above to add your first item.
                    </div>
                ) : (
                    data.map((item) => renderItemCard(item, type, accentColor))
                )}
            </div>
        </div>
    );
    
    const renderAddRoutineForm = () => (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-gray-700/50 mb-4 border border-emerald-200 dark:border-gray-600">
            <h3 className="font-semibold text-emerald-700 dark:text-emerald-300 mb-2">Add New Routine (Time Slot)</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    placeholder="Routine Name (e.g., Math Study)"
                    value={newItem.routineName}
                    onChange={(e) => setNewItem(prev => ({ ...prev, routineName: e.target.value }))}
                    className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <input
                    type="time"
                    value={newItem.routineStartTime}
                    onChange={(e) => setNewItem(prev => ({ ...prev, routineStartTime: e.target.value }))}
                    className="w-full sm:w-auto p-2 border rounded dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <input
                    type="time"
                    value={newItem.routineEndTime}
                    onChange={(e) => setNewItem(prev => ({ ...prev, routineEndTime: e.target.value }))}
                    className="w-full sm:w-auto p-2 border rounded dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <button
                    onClick={() => handleCustomAddItem('routine')}
                    disabled={!newItem.routineName}
                    className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded transition-colors disabled:bg-gray-400"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>
        </div>
    );

    const renderAddAssignmentForm = () => (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-gray-700/50 mb-4 border border-blue-200 dark:border-gray-600">
            <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Add New Assignment/Task</h3>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    placeholder="Task Title (e.g., Finish Chapter 3 Quiz)"
                    value={newItem.assignmentTitle}
                    onChange={(e) => setNewItem(prev => ({ ...prev, assignmentTitle: e.target.value }))}
                    className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <input
                    type="text"
                    placeholder="Subject (e.g., Physics)"
                    value={newItem.assignmentSubject}
                    onChange={(e) => setNewItem(prev => ({ ...prev, assignmentSubject: e.target.value }))}
                    className="w-full sm:w-1/3 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <button
                    onClick={() => handleCustomAddItem('assignment')}
                    disabled={!newItem.assignmentTitle || !newItem.assignmentSubject}
                    className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors disabled:bg-gray-400"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>
        </div>
    );

    const renderAddMicroGoalForm = () => (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-gray-700/50 mb-4 border border-purple-200 dark:border-gray-600">
            <h3 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Add New Micro Goal (Quick Win)</h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    placeholder="Goal (e.g., 20 pushups, review 10 flashcards)"
                    value={newItem.microGoalGoal}
                    onChange={(e) => setNewItem(prev => ({ ...prev, microGoalGoal: e.target.value }))}
                    className="flex-1 p-2 border rounded dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-white"
                />
                <button
                    onClick={() => handleCustomAddItem('microGoal')}
                    disabled={!newItem.microGoalGoal}
                    className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded transition-colors disabled:bg-gray-400"
                >
                    <Plus className="h-5 w-5" />
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const hasNoPlan = routines.length === 0 && assignments.length === 0 && microGoals.length === 0;

    // --- READ-ONLY VIEW WITH TIMELINE DESIGN ---
    if (!isEditing) {
        // Combine all items with their times and sort
        const allItems = [
            ...routines.map(r => ({ ...r, type: 'routine', time: r.startTime })),
            ...assignments.map(a => ({ ...a, type: 'assignment', time: '12:00' })),
            ...microGoals.map(g => ({ ...g, type: 'microGoal', time: '18:00' }))
        ].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

        const getGradientByType = (type, status) => {
            if (status === 'completed') return 'from-emerald-500/90 to-teal-600/90';
            switch(type) {
                case 'routine': return 'from-blue-500/90 to-purple-600/90';
                case 'assignment': return 'from-purple-500/90 to-pink-600/90';
                case 'microGoal': return 'from-teal-500/90 to-cyan-600/90';
                default: return 'from-gray-500/90 to-gray-600/90';
            }
        };

        const getIconByType = (type) => {
            switch(type) {
                case 'routine': return Clock;
                case 'assignment': return BookOpen;
                case 'microGoal': return Target;
                default: return Clock;
            }
        };

        const getProgress = (item) => {
            if (item.status === 'completed') return 100;
            if (item.status === 'pending') return Math.floor(Math.random() * 40) + 20;
            return 0;
        };

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Daily Schedule</h1>
                            <p className="text-slate-400">Track your progress throughout the day</p>
                        </div>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-lg text-white rounded-2xl font-medium shadow-lg transition border border-white/20"
                        >
                            <Edit className="h-4 w-4" /> Edit Plan
                        </button>
                    </div>
                    
                    {hasNoPlan ? (
                        <div className="text-center py-20 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10">
                            <Calendar className="h-16 w-16 text-white/40 mx-auto mb-4" />
                            <h3 className="text-2xl font-semibold text-white mb-2">
                                Your Blueprint is empty
                            </h3>
                            <p className="text-slate-400 mb-6">
                                Start planning your day by adding routines, assignments, and goals
                            </p>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl transition"
                            >
                                Create Your First Task
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-16 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/50 via-purple-500/50 to-pink-500/50" />
                            
                            <div className="space-y-4">
                                {allItems.map((item, index) => {
                                    const ItemIcon = getIconByType(item.type);
                                    const progress = getProgress(item);
                                    const isCompleted = item.status === 'completed';
                                    
                                    return (
                                        <div key={item.id} className="flex gap-6 relative">
                                            {/* Time */}
                                            <div className="w-20 pt-3 text-right">
                                                <span className="text-sm font-medium text-slate-400">
                                                    {item.time || '--:--'}
                                                </span>
                                            </div>
                                            
                                            {/* Timeline dot */}
                                            <div className="relative flex items-start pt-3">
                                                <div className={`w-3 h-3 rounded-full border-4 ${isCompleted ? 'bg-emerald-500 border-emerald-400' : 'bg-slate-800 border-purple-500'} relative z-10`} />
                                            </div>
                                            
                                            {/* Card */}
                                            <div className="flex-1 pb-2">
                                                <div className={`relative overflow-hidden rounded-2xl backdrop-blur-xl border transition-all duration-300 hover:scale-[1.02] ${
                                                    isCompleted 
                                                        ? 'bg-emerald-500/10 border-emerald-500/30' 
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}>
                                                    {/* Gradient overlay */}
                                                    <div className={`absolute inset-0 bg-gradient-to-r ${getGradientByType(item.type, item.status)} opacity-60`} />
                                                    
                                                    <div className="relative p-5">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                                    <ItemIcon className="h-5 w-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h3 className={`text-lg font-semibold text-white ${isCompleted ? 'line-through opacity-75' : ''}`}>
                                                                        {item.title || item.name || item.goal}
                                                                    </h3>
                                                                    {item.subject && (
                                                                        <p className="text-sm text-white/70">{item.subject}</p>
                                                                    )}
                                                                    {item.endTime && (
                                                                        <p className="text-xs text-white/60">{item.startTime} - {item.endTime}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Progress circle */}
                                                            <div className="relative w-14 h-14">
                                                                <svg className="transform -rotate-90 w-14 h-14">
                                                                    <circle
                                                                        cx="28"
                                                                        cy="28"
                                                                        r="24"
                                                                        stroke="rgba(255,255,255,0.1)"
                                                                        strokeWidth="4"
                                                                        fill="none"
                                                                    />
                                                                    <circle
                                                                        cx="28"
                                                                        cy="28"
                                                                        r="24"
                                                                        stroke="white"
                                                                        strokeWidth="4"
                                                                        fill="none"
                                                                        strokeDasharray={`${2 * Math.PI * 24}`}
                                                                        strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                                                                        className="transition-all duration-500"
                                                                    />
                                                                </svg>
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <span className="text-xs font-bold text-white">{progress}%</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- EDITING VIEW ---
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white border-b-2 border-red-500/30 pb-3 flex items-center gap-3">
                <Edit className="h-7 w-7 text-red-500"/> Blueprint Editing Mode
            </h1>

            {error && (
                <div className={`p-4 rounded-xl font-medium ${error.includes("successfully saved") ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-red-500/10 text-red-600 border-red-500/30'}`}>
                    {error}
                </div>
            )}

            {renderListSection("Daily Routines", Clock, routines, 'routine', 'emerald', renderAddRoutineForm)}
            {renderListSection("Assignments", BookOpen, assignments, 'assignment', 'blue', renderAddAssignmentForm)}
            {renderListSection("Micro Goals", Target, microGoals, 'microGoal', 'purple', renderAddMicroGoalForm)}

            <button
                onClick={saveBlueprint}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-300 text-lg ${
                    saving 
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xl shadow-emerald-600/50 transform hover:scale-[1.005]'
                }`}
            >
                {saving ? (
                    <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Saving Blueprint...
                    </>
                ) : (
                    <>
                        <Save className="h-5 w-5" />
                        Commit & Save Blueprint
                    </>
                )}
            </button>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 pt-4 text-center">
                Click Commit & Save Blueprint to exit editing mode and apply changes to your schedule.
            </p>
        </div>
    );
}