import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  GraduationCap,
  Target,
  BellRing,
  Copy,
  CheckCircle2,
  PhoneCall,
  PartyPopper,
  Award,
  Check,
  HelpCircle,
  ChevronDown,
  Building2,
  Briefcase
} from 'lucide-react';
import { triggerConfetti, triggerStageCelebration } from '../lib/confetti';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/10 dark:bg-brand-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-6 shadow-2xs">
            <Sparkles size={14} className="text-brand-600 dark:text-brand-dark" />
            <span>Real-Time Job Search Intelligence </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Find the right job without{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-800 dark:from-brand-dark dark:via-indigo-400 dark:to-indigo-300">
              scrolling every portal.
            </span>
          </h1>

          {/* Subheading */}
          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop checking 10 job boards a day. We aggregate verified postings from Greenhouse, Lever, Ashby, Workable, and direct career portals—scored to your exact skills with zero spam.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              to="/signup"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
            >
              <span>Get started free</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition"
            >
              <span>Log in to your account</span>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              Direct Employer Links
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              Built for Freshers & Early Careers
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-emerald-500" />
              1-Click Cover Letter
            </span>
          </div>
        </div>

        {/* Live-looking Product Preview Showcase featuring smart-hire2.avif */}
        <div className="max-w-5xl mx-auto mt-12 sm:mt-16">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            {/* Mock browser header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs font-mono text-slate-400">smart-hire.app/search</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed Active
                </span>
              </div>
            </div>

            {/* Mock Preview Content */}
            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50 dark:bg-slate-900/50 text-left items-center">
              {/* Left Column: smart-hire2.avif Candidate Workstation Image */}
              <div className="lg:col-span-5 relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-900">
                <img
                  src="/smart-hire2.avif"
                  alt="Candidate searching and applying using smart-hire"
                  className="w-full h-64 sm:h-72 object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-brand-600 text-white w-fit mb-1.5 shadow-xs">
                    <Sparkles size={12} />
                    Sub-Second Job Discovery
                  </div>
                  <h4 className="text-white font-bold text-sm leading-snug">
                    Zero Portal Hopping
                  </h4>
                  <p className="text-slate-300 text-xs mt-0.5">
                    Search once across Greenhouse, Lever, Ashby, and verified Indian tech portals.
                  </p>
                </div>
              </div>

              {/* Right Column: Sample Match Detail Panel */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">Software Engineer (Backend)</h3>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        Example
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Razorpay • Bengaluru • Posted today</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
                    88% Match
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 font-medium text-slate-700 dark:text-slate-300">
                    Fresher / 0-2 yrs
                  </span>
                  <span>₹14,00,000 - ₹22,00,000 / yr</span>
                  <span className="ml-auto font-medium text-brand-600 dark:text-brand-300">Greenhouse ATS</span>
                </div>

                {/* Skill Gap Analysis Box */}
                <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">Skills Matched to Your Profile</p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                    Directly aligns with your resume:
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[11px] font-medium">✓ Python</span>
                    <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[11px] font-medium">✓ FastAPI</span>
                    <span className="px-2 py-0.5 bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded text-[11px] font-medium">✓ PostgreSQL</span>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded text-[11px] font-medium">+ Learn Redis next</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-600 shadow-2xs">
                    <Copy size={13} />
                    Copy cover letter
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Apply on Greenhouse ↗
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Feature Cards */}
      <section id="features" className="py-20 px-4 sm:px-6 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Designed for modern high-growth job search
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              No generic crawler noise. Built ground-up for speed, skill alignment, and transparent employer links.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-brand-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-950/70 text-brand-600 dark:text-brand-dark flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Layers size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Every job, one place</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We unify listings across Greenhouse, Lever, Ashby, Workable, SmartRecruiters, and RemoteOK without duplicates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-brand-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <GraduationCap size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Built for freshers and early careers</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Instantly filter for 0-1 years of experience, internships, and early-career roles without wading through senior positions.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-brand-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Target size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Know your chances</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                See exactly which skills on your CV match the job, what is missing, and actionable 'learn next' suggestions.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-brand-500/40 transition group">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <BellRing size={22} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">New jobs come to you</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive targeted alerts the moment a position matching &gt;70% of your stack goes live in India or remote worldwide.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works (3 Steps) */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How smart-hire works in 3 steps
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Go from searching everywhere to targeted applications in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                1
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Upload Resume or Skills</h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Drop your CV to auto-extract your skills, experience, and target roles with zero manual typing.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                2
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Review Verified Matches</h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Browse deduplicated jobs with clear match scores (&gt;70% green, 40-69% amber) and verified employer links.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-extrabold flex items-center justify-center text-lg mb-4">
                3
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">Copy Cover Letter & Apply</h4>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                1-click copy a tailored 3-paragraph cover letter and open the direct employer page to apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* From Application to Offer Milestone Section with smart-hire.avif */}
      <section className="py-20 px-4 sm:px-6 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Stage Progression & Interactive Assistant */}
            <div className="lg:col-span-6 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Real-Time interaction</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                From first application to final handshake.
              </h2>

              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                No more wondering if your application went into a black hole. smart-hire checks in at every stage with simple candidate prompts, logs your interview dates, and celebrates every milestone.
              </p>

              {/* Interactive Stage Prompt Preview */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-950 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 flex items-center gap-1.5">
                    <Sparkles size={13} />
                    Candidate Stage Assistant
                  </span>
                  <span className="text-[11px] text-slate-400">Application #104</span>
                </div>

                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  "Did you hear back from <strong>Groww</strong>? Did you get shortlisted or called for an interview?"
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => triggerStageCelebration()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 transition cursor-pointer"
                  >
                    <PhoneCall size={13} />
                    <span>📞 Got Interview Call</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => triggerStageCelebration()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition cursor-pointer"
                  >
                    <PartyPopper size={13} />
                    <span>🎉 Got Offer! </span>
                  </button>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                    👁️ Under Review
                  </span>
                </div>
              </div>

              {/* CTA link */}
              <div className="pt-2">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition active:scale-[0.98]"
                >
                  <span>Create your free tracker account</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Right Column: Handshake Image with Floating Celebration Card */}
            <div className="lg:col-span-6 relative pb-10 sm:pb-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900 group">
                <img
                  src="/smart-hire.avif"
                  alt="Candidate handshake closing offer on smart-hire"
                  className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-6 pb-16 sm:pb-20">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white w-fit mb-2 shadow-xs flex items-center gap-1.5">
                    <Award size={13} />
                    Verified Career Milestone
                  </span>
                  <p className="text-white font-bold text-base">
                    From early search to signed agreement.
                  </p>
                  <p className="text-slate-300 text-xs mt-1">
                    Smart, honest lifecycle tracking designed for engineers and professionals.
                  </p>
                </div>
              </div>

              {/* Floating Celebration Card */}
              <div
                className="absolute -bottom-6 left-4 sm:-bottom-8 sm:left-6 p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-3.5 z-10"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                  🎉
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Offer Accepted!</p>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      Example
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Software Engineer • ₹16,00,000 / yr
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sources Strip */}
      <section id="sources" className="py-12 px-4 sm:px-6 bg-slate-100/70 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6">
            Directly Connected to Verified Applicant Tracking Systems
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-600 dark:text-slate-300 font-semibold text-sm">
            <span>Greenhouse ATS</span>
            <span>•</span>
            <span>Lever</span>
            <span>•</span>
            <span>Ashby</span>
            <span>•</span>
            <span>Workable</span>
            <span>•</span>
            <span>SmartRecruiters</span>
            <span>•</span>
            <span>RemoteOK</span>
            <span>•</span>
            <span>Many more!</span>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-3 border border-brand-200/60 dark:border-brand-800/60">
              Transparent & Honest
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-400">
              Always free for job seekers. Powerful tools when you need an extra edge.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: Free Candidate Plan */}
            <div className="p-8 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border-2 border-brand-500/40 dark:border-brand-500/40 shadow-sm flex flex-col justify-between relative">
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-brand-600 text-white text-[11px] font-bold uppercase tracking-wide shadow-2xs">
                Candidate Plan
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Free for Job Seekers</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Everything you need to find, compare, and apply directly to verified roles.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ forever</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Unlimited verified job searches</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Deterministic skill-matching & gap insights</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>1-click tailored 3-paragraph cover letter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>End-to-end application tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Daily email digests and instant alerts</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Link
                  to="/signup"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 shadow-xs transition"
                >
                  <span>Start searching free</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Plan 2: Pro (Coming Soon) */}
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative opacity-90">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wide">
                Coming Soon
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro Career Suite</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Interview intelligence, resume feedback, and salary predictor.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹499</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ month</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-brand-500 shrink-0" />
                    <span>Interactive AI mock interview prep</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-brand-500 shrink-0" />
                    <span>India tech salary predictor & negotiation tips</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-brand-500 shrink-0" />
                    <span>Priority application health audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-brand-500 shrink-0" />
                    <span>Career roadmap with skill progression plan</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 cursor-not-allowed"
                >
                  <span>Notify me on launch</span>
                </button>
              </div>
            </div>

            {/* Plan 3: For Companies (Coming Soon) */}
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative opacity-90">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold uppercase tracking-wide">
                Coming Soon
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">For Companies</h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Direct candidate pipeline with verified skill badges and zero recruiter markup.
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">Custom</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">/ hiring season</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Post verified openings directly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Greenhouse, Lever & Ashby 2-way sync</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Direct candidate reach with zero spam</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check size={15} className="text-emerald-500 shrink-0" />
                    <span>Verified employer badge on search</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/signup?role=recruiter"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 transition"
                >
                  <span>Recruiter early access</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Companies Banner */}
      <section id="for-companies" className="py-16 px-4 sm:px-6 bg-slate-50/70 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 text-left max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200/60 dark:border-indigo-800/60">
              <Building2 size={13} />
              <span>For Employers & Hiring Teams</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Hire verified talent with smart-hire
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Cut through resume spam. Connect directly with freshers and early-career software engineers scored deterministically on their real skills.
            </p>
          </div>

          <div className="shrink-0 w-full md:w-auto">
            <Link
              to="/signup?role=recruiter"
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md transition active:scale-[0.98]"
            >
              <span>Hire with smart-hire</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 px-4 sm:px-6 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Everything you need to know about smart-hire's direct ATS search.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Is smart-hire really free for job seekers?",
                a: "Yes, 100% free for job seekers. There are no paywalls, hidden subscription charges, or application quotas. You get full access to verified real-time search, skill matching, cover letter generation, and our stage tracker."
              },
              {
                q: "Does smart-hire apply for me?",
                a: "No, we never auto-submit applications or scrape candidate credentials. Instead, we give you the genuine direct employer career portal link alongside a tailored 3-paragraph cover letter, giving you complete transparency and 100% control over your application."
              },
              {
                q: "Where do jobs come from?",
                a: "Directly from official company Applicant Tracking Systems (ATS) including Greenhouse, Lever, Ashby, Workable, SmartRecruiters, Adzuna India, JSearch RapidAPI, RemoteOK, and Jobicy. We do not synthesize jobs or scrape private portals."
              },
              {
                q: "How do you know links are real?",
                a: "Our automated background link health engine validates every apply URL before presenting it to you. If a role closes or a link breaks, it is immediately removed from search so you never encounter dead ends or DNS errors."
              }
            ].map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-dark transition cursor-pointer"
                  >
                    <span className="text-base">{faq.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-600 dark:text-brand-dark' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-brand-700 via-indigo-600 to-indigo-800 text-white shadow-xl relative overflow-hidden">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to find your next engineering role?
          </h2>
          <p className="mt-3 text-base text-indigo-100 max-w-xl mx-auto">
            Join candidates finding early-career and experienced roles without scrolling 10 different job boards.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-bold text-brand-700 bg-white hover:bg-indigo-50 shadow-md transition active:scale-[0.98]"
            >
              <span>Get started with smart-hire</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
