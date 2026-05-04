'use client';

import React, { useState, useEffect } from 'react';
import { Leaf, Waves, Home, BarChart3, ShieldAlert, Settings, Download, Loader2 } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';

interface SidebarProps {
    analysisData?: Record<string, unknown> | null;
    currentYear?: number;
}

const Counter = ({ value, prefix = "" }: { value: number; label?: string; prefix?: string }) => {
    const count = useMotionValue(0);
    const [displayValue, setDisplayValue] = useState(prefix + "0.0");

    useEffect(() => {
        const controls = animate(count, value, {
            duration: 2,
            ease: "easeOut",
            onUpdate: (latest) => {
                setDisplayValue(prefix + latest.toLocaleString(undefined, {
                    minimumFractionDigits: 1,
                    maximumFractionDigits: 1
                }));
            }
        });
        return controls.stop;
    }, [value, prefix, count]);

    return <span>{displayValue}</span>;
};

const Sidebar = ({ analysisData, currentYear = 2022 }: SidebarProps) => {
    const [isDownloading, setIsDownloading] = useState(false);

    const generatePDF = async () => {
        if (isDownloading) return;
        setIsDownloading(true);

        try {
            const response = await fetch('http://localhost:8000/api/report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    hectares_lost: analysisData?.hectares_lost || 158.4,
                    carbon_tons: analysisData?.total_carbon_emitted || 2400.0,
                    year: currentYear,
                    coordinates: "88.85°E, 21.9°N"
                }),
            });

            if (!response.ok) throw new Error('Failed to generate report');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Sundarbans_Impact_Report_${currentYear}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Report download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const carbonValue = analysisData?.total_carbon_emitted || 2400;
    const erosionValue = analysisData?.hectares_lost || 158.4;

    return (
        <div className="w-80 h-screen bg-slate-950 text-slate-200 flex flex-col border-r border-slate-800 z-10 relative">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Sundarbans Sentinel
                </h1>
                <p className="text-xs text-slate-500 mt-1">Ecosystem Monitoring Dashboard</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {/* Carbon Loss Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Leaf className="w-5 h-5 text-emerald-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Carbon Loss (Tons)</h2>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    <Counter value={carbonValue} label="carbon" />
                                </p>
                                <p className="text-xs text-emerald-400 mt-1">↑ 12% vs last year</p>
                            </div>
                            <BarChart3 className="w-10 h-10 text-slate-700" />
                        </div>
                        <div className="mt-4 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                className="h-full bg-emerald-500"
                            />
                        </div>
                    </div>
                </section>

                {/* Erosion Rate Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Waves className="w-5 h-5 text-cyan-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Erosion Rate (Hectares)</h2>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    <Counter value={erosionValue} label="erosion" />
                                </p>
                                <p className="text-xs text-red-400 mt-1">Critical status</p>
                            </div>
                            <Waves className="w-10 h-10 text-slate-700" />
                        </div>
                        <div className="mt-4 grid grid-cols-5 gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className={`h-8 rounded-sm ${i < 4 ? 'bg-cyan-500/60' : 'bg-slate-800'}`} />
                            ))}
                        </div>
                    </div>
                </section>

                {/* Village Vulnerability Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Village Vulnerability</h2>
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: 'Satkhira', risk: 'High', color: 'text-red-400' },
                            { name: 'Gosaba', risk: 'Moderate', color: 'text-amber-400' },
                            { name: 'Kultali', risk: 'Low', color: 'text-emerald-400' },
                        ].map((village) => (
                            <div key={village.name} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                <div className="flex items-center gap-3">
                                    <Home className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-medium">{village.name}</span>
                                </div>
                                <span className={`text-xs font-bold ${village.color}`}>{village.risk}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Download Section */}
                <section className="px-2">
                    <button
                        onClick={generatePDF}
                        disabled={isDownloading}
                        className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDownloading ? (
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                        ) : (
                            <Download className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="text-sm font-bold text-emerald-400">
                            {isDownloading ? 'Generating...' : 'Download PDF Report'}
                        </span>
                    </button>
                </section>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button className="flex items-center gap-3 w-full p-3 hover:bg-slate-900 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <Settings className="w-5 h-5" />
                    <span className="text-sm font-medium">Settings</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
