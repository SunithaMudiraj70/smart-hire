import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/app/search';
  const initialEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const isPasswordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrorCode(null);

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate(returnUrl, { replace: true });
    } catch (err: any) {
      const data = err.response?.data;
      const code = data?.code;
      setErrorCode(code || null);
      if (code === 'EMAIL_EXISTS') {
        setError('This email is already registered. Please log in.');
      } else if (code === 'RATE_LIMITED') {
        setError('Too many attempts. Try again in 15 minutes.');
      } else {
        setError(data?.error || data?.detail || 'Registration failed. Please check your details.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Logo size="lg" linkTo="/" className="items-center" />
        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create your candidate account
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Already registered?{' '}
          <Link to={`/login${returnUrl !== '/app/search' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="font-semibold text-brand-600 hover:text-brand-500 dark:text-brand-dark">
            Log in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:px-10">
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-3 text-sm text-red-700 dark:text-red-300"
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-red-500" />
              <div>
                <span>{error}</span>
                {errorCode === 'EMAIL_EXISTS' && (
                  <div className="mt-1.5">
                    <Link
                      to={`/login?email=${encodeURIComponent(email)}`}
                      className="font-bold underline text-brand-700 dark:text-brand-300 hover:text-brand-800"
                    >
                      Sign in to your account →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Thomas"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus-ring text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                {isPasswordValid ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle size={13} />
                    Minimum 8 characters met
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Must be at least 8 characters
                  </span>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 focus-ring shadow-sm transition disabled:opacity-60 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            By creating an account, you agree to our Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
};

