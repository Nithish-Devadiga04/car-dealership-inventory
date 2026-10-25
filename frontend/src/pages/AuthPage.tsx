import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ApiError } from '../api/client';
import { CarIllustration } from '../components/Icons';
import { useAuth } from '../context/AuthContext';

type Mode = 'login' | 'register';

export function validateAuthForm(mode: Mode, values: { name: string; email: string; password: string }): Record<string, string> {
  const errors: Record<string, string> = {};
  if (mode === 'register' && values.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) errors.email = 'Enter a valid email address';
  if (mode === 'register') {
    if (values.password.length < 8) errors.password = 'Password must be at least 8 characters';
    else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) errors.password = 'Use at least one letter and one number';
  } else if (!values.password) {
    errors.password = 'Password is required';
  }
  return errors;
}

export function AuthPage({ mode }: { mode: Mode }) {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLogin = mode === 'login';
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');
    const found = validateAuthForm(mode, values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      if (isLogin) await login(values.email.trim(), values.password);
      else await register(values.name.trim(), values.email.trim(), values.password);
    } catch (err) {
      if (err instanceof ApiError && err.details.length) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.path, d.message])));
      } else {
        setFormError(err instanceof Error ? err.message : 'Something went wrong');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [key]: event.target.value }));

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-slate-900 via-brand-900 to-violet-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-violet-500/30 blur-3xl" />
        <div className="relative flex items-center gap-2.5 text-xl font-extrabold">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 text-xl">🚗</span>
          Auto<span className="text-brand-300">Vault</span>
        </div>
        <div className="relative">
          <CarIllustration className="mb-8 h-40 w-auto text-brand-300/90 drop-shadow-2xl" />
          <h1 className="text-4xl font-extrabold leading-tight">Find your next ride,<br />in real time.</h1>
          <p className="mt-4 max-w-md text-slate-300">Browse live dealership inventory, filter by make, category and price, and reserve a vehicle in one click.</p>
        </div>
        <p className="relative text-sm text-slate-400">Live stock · Secure sign-in · Admin inventory tools</p>
      </section>

      {/* Form panel */}
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <span className="text-2xl font-extrabold text-slate-900">🚗 Auto<span className="text-brand-600">Vault</span></span>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-slate-500">{isLogin ? 'Sign in to browse the inventory.' : 'Register to start browsing and purchasing.'}</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input id="name" autoComplete="name" className={`input ${errors.name ? 'input-error' : ''}`} value={values.name} onChange={set('name')} />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" type="email" autoComplete="email" className={`input ${errors.email ? 'input-error' : ''}`} value={values.email} onChange={set('email')} />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input id="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} className={`input ${errors.password ? 'input-error' : ''}`} value={values.password} onChange={set('password')} />
              {errors.password && <p className="field-error">{errors.password}</p>}
              {!isLogin && !errors.password && <p className="mt-1 text-xs text-slate-400">At least 8 characters, with a letter and a number.</p>}
            </div>

            {formError && <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{formError}</p>}

            <button type="submit" className="btn-primary w-full !py-3" disabled={submitting}>
              {submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? "Don't have an account? " : 'Already registered? '}
            <Link to={isLogin ? '/register' : '/login'} className="font-semibold text-brand-600 hover:underline">
              {isLogin ? 'Create one' : 'Sign in'}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
