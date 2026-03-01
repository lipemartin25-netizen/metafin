import { tw } from '@/lib/theme';
// src/pages/Simulators.jsx
// ================================
// Hub central dos simuladores financeiros
// ================================

import { useState } from 'react';
import {
 Flame, Clock, TrendingUp, Calculator,
 Target, BookOpen, ChevronRight, Sparkles
} from 'lucide-react';
import FIRESimulator from '../components/FIRESimulator';
import RetirementSimulator from '../components/RetirementSimulator';
import InvestmentSimulator from '../components/InvestmentSimulator';
import TaxPlanner from '../components/TaxPlanner';
import Goals from './Goals';
import FinancialEducation from '../components/FinancialEducation';
import CouplesFinance from '../components/CouplesFinance';
import FreelaMEIHub from '../components/FreelaMEIHub';
import { Users, Briefcase } from 'lucide-react';

const SIMULATORS = [
 {
 id: 'fire',
 name: 'Independência Financeira',
 subtitle: 'Descubra quando você será livre',
 icon: Flame,
 color: 'from-orange-500 to-amber-500',
 bgLight: 'bg-orange-50',
 bgDark: 'dark:bg-orange-950/20',
 textColor: 'text-orange-600 dark:text-orange-400',
 component: FIRESimulator
 },
 {
 id: 'retirement',
 name: 'Aposentadoria',
 subtitle: 'Planeje seu futuro com segurança',
 icon: Clock,
 color: 'from-blue-500 to-indigo-600',
 bgLight: 'bg-blue-50',
 bgDark: 'dark:bg-blue-950/20',
 textColor: 'text-blue-600 dark:text-blue-400',
 component: RetirementSimulator
 },
 {
 id: 'investments',
 name: 'Simulador de Investimentos',
 subtitle: 'Compare rendimentos lado a lado',
 icon: TrendingUp,
 color: 'from-brand-primary to-emerald-600',
 bgLight: 'bg-purple-50',
 bgDark: 'dark:bg-purple-950/20',
 textColor: 'text-brand-primary dark:text-brand-glow',
 component: InvestmentSimulator
 },
 {
 id: 'tax',
 name: 'Planejador Tributário',
 subtitle: 'Economize no Imposto de Renda',
 icon: Calculator,
 color: 'from-brand-primary to-violet-600',
 bgLight: 'bg-purple-50',
 bgDark: 'dark:bg-purple-950/20',
 textColor: 'text-brand-primary dark:text-brand-glow',
 component: TaxPlanner
 },
 {
 id: 'goals',
 name: 'Meus Objetivos',
 subtitle: 'Termômetro de metas financeiras',
 icon: Target,
 color: 'from-brand-500 to-teal-600',
 bgLight: 'bg-brand-50',
 bgDark: 'dark:bg-brand-950/20',
 textColor: 'text-brand-600 dark:text-brand-400',
 component: Goals
 },
 {
 id: 'education',
 name: 'Academia Financeira',
 subtitle: 'Aprenda com IA personalizada',
 icon: BookOpen,
 color: 'from-amber-500 to-yellow-600',
 bgLight: 'bg-[var(--bg-base)]mber-50',
 bgDark: 'dark:bg-[var(--bg-base)]mber-950/20',
 textColor: 'text-amber-600 dark:text-amber-400',
 component: FinancialEducation
 },
 {
 id: 'couples',
 name: 'Casais Inteligentes',
 subtitle: 'Divisão justa de despesas 50/50',
 icon: Users,
 color: 'from-pink-500 to-rose-600',
 bgLight: 'bg-pink-50',
 bgDark: 'dark:bg-pink-950/20',
 textColor: 'text-pink-600 dark:text-pink-400',
 component: CouplesFinance
 },
 {
 id: 'freela',
 name: 'Toolkit MEI & Freelas',
 subtitle: 'Gestão de caixa e imposto (DAS)',
 icon: Briefcase,
 color: 'from-cyan-500 to-sky-600',
 bgLight: 'bg-cyan-50',
 bgDark: 'dark:bg-cyan-950/20',
 textColor: 'text-cyan-600 dark:text-cyan-400',
 component: FreelaMEIHub
 }
];

export default function Simulators({ financialData }) {
 const [activeSimulator, setActiveSimulator] = useState(null);

 if (activeSimulator) {
 const sim = SIMULATORS.find(s => s.id === activeSimulator);
 const SimComponent = sim.component;

 return (
 <div className="min-h-screen pt-4 animate-fade-in">
 {/* Header com voltar */}
 <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <button
 onClick={() => setActiveSimulator(null)}
 className="p-2 rounded-xl bg-gray-800/40 dark:bg-gray-800 text-gray-500 
 hover:text-gray-100 dark:text-gray-400 dark:hover:text-[var(--text-primary)] 
 transition-colors"
 title="Voltar aos Simuladores"
 >
 ←
 </button>
 <div className={`p-3 rounded-xl bg-[var(--bg-base)] ${sim.color}`}>
 <sim.icon className="h-6 w-6 text-[var(--text-primary)]" />
 </div>
 <div>
 <h1 className="text-2xl font-bold dark:text-[var(--text-primary)]">{sim.name}</h1>
 <p className="text-sm text-gray-500 dark:text-gray-400">{sim.subtitle}</p>
 </div>
 </div>
 </div>

 <div className="pb-20">
 <SimComponent financialData={financialData} />
 </div>
 </div>
 );
 }

 return (
 <div className="min-h-screen pt-4 pb-20 animate-fade-in relative z-0">
 {/* Background 3D Animated Layers */}
 <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
 <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob" />
 <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-brand-primary/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
 <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000" />
 </div>

 {/* Hero Section 3D Premium */}
 <div className="relative z-10 mb-12">
 <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--bg-base)] from-gray-900 via-indigo-950 to-black p-8 md:p-12 text-[var(--text-primary)] shadow-tech-card border border-[var(--border)] group">
 {/* Floating Orbs inside tech-card */}
 <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--bg-base)] from-indigo-500 to-brand-primary rounded-full mix-blend-screen filter blur-[40px] opacity-40 group-hover:-translate-y-px transition-transform transition-transform duration-1000" />
 <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[var(--bg-base)] from-blue-600 to-emerald-500 rounded-full mix-blend-screen filter blur-[60px] opacity-30 group-hover:-translate-y-px transition-transform transition-transform duration-1000 delay-100" />

 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PG1hdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBoNDBWMEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTAgMjBoNDBNMCAzMGg0ME0xMCAwdjQwTTIwIDB2NDBNMzAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-20" />

 <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
 <div className="flex-1">
 <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/40/10 border border-[var(--border)] text-xs font-bold uppercase tracking-widest text-indigo-300 mb-6 shadow-inner">
 <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" /> Nexus Wealth Lab
 </div>
 <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight leading-tight text-transparent bg-clip-text bg-[var(--bg-base)] from-white via-indigo-100 to-purple-200">
 Laboratório Mestre de Wealth
 </h1>
 <p className="text-indigo-100/80 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
 Ferramentas matemáticas poderosas para proteger e multiplicar seu patrimônio.
 Escolha um dos módulos abaixo para projetar seu futuro.
 </p>
 </div>

 {/* 3D Visual Decorative Element for desktop */}
 <div className="hidden lg:flex relative w-72 h-72 items-center justify-center">
 <div className="absolute inset-x-8 inset-y-8 bg-[var(--bg-base)] from-indigo-500/30 to-brand-primary/30 rounded-3xl animate-[spin_10s_linear_infinite] border border-[var(--border)] " />
 <div className="absolute inset-x-12 inset-y-12 bg-[var(--bg-base)] from-blue-500/30 to-emerald-500/30 rounded-full animate-[spin_15s_linear_infinite_reverse] border border-[var(--border)] " />
 <div className="relative w-32 h-32 bg-[var(--bg-base)] from-white/10 to-transparent rounded-2xl flex items-center justify-center border border-[var(--border)] shadow-tech-card transform hover:-translate-y-px transition-transform transition-transform duration-500 hover:-rotate-12 cursor-pointer z-20">
 <Target className="w-16 h-16 text-[var(--text-primary)] drop-shadow-tech-card" />
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Grid de Simuladores */}
 <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
 {SIMULATORS.map(sim => (
 <button
 key={sim.id}
 onClick={() => setActiveSimulator(sim.id)}
 className={`group relative overflow-hidden rounded-[1.5rem] ${tw.card} border-none
 ${sim.bgLight} ${sim.bgDark}
 p-4 text-left transition-all duration-500 ease-out transform-gpu
 hover:shadow-tech-card dark:hover:shadow-tech-card
 hover:-translate-y-px`}
 >
 {/* 3D Glossy Light Reflection */}
 <div className="absolute inset-0 bg-[var(--bg-base)] from-white/30 to-transparent dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

 <div className={`inline-flex p-2.5 rounded-xl bg-[var(--bg-base)] 
 ${sim.color} shadow-lg mb-3 relative z-10 transition-transform duration-500 group-hover:-translate-y-px transition-transform`}>
 <sim.icon className="h-4 w-4 text-[var(--text-primary)] drop-shadow-lg shadow-black/10" />
 </div>

 <h3 className="text-base font-black text-[var(--text-primary)] dark:text-[var(--text-primary)] mb-1 relative z-10 transition-transform duration-300 group-hover:translate-x-0.5 tracking-tight leading-tight">
 {sim.name}
 </h3>
 <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-4 relative z-10 font-bold uppercase tracking-wider transition-transform duration-300 delay-75 group-hover:translate-x-0.5">
 {sim.subtitle}
 </p>

 <div className={`flex items-center justify-between mt-auto w-full relative z-10`}>
 <div className={`flex items-center gap-2 text-[9px] font-black
 ${sim.textColor} transition-all uppercase tracking-[0.2em] group-hover:gap-3`}>
 Iniciar
 <ChevronRight className="h-3 w-3" />
 </div>
 </div>

 {/* Spinning ring decorative */}
 <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full border-2 border-dashed opacity-[0.05] dark:opacity-10 ${sim.textColor} animate-[spin_30s_linear_infinite]`} />
 </button>
 ))}
 </div>
 </div>
 );
}
