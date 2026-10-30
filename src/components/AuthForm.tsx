import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

const copy = {
  signin: {
    title: 'Welcome back',
    subtitle: 'Sign in to continue restyling your rooms.',
    submit: 'Sign in',
    switchPrompt: 'New to ReRoom?',
    switchAction: 'Create an account',
  },
  signup: {
    title: 'Create your account',
    subtitle: 'Free to start. Takes less than a minute.',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign in',
  },
} as const;

function friendlyError(message: string) {
  if (message.includes('Invalid login credentials')) return 'That email and password don’t match. Please try again.';
  if (message.includes('User already registered')) return 'An account with this email already exists. Try signing in.';
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return 'We couldn’t reach ReRoom. Check your connection and try again.';
  }
  return message;
}

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const text = copy[mode];

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(friendlyError(signInError.message));
    } else {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(friendlyError(signUpError.message));
      } else if (data.user && data.user.identities?.length === 0) {
        setError(friendlyError('User already registered'));
      } else if (!data.session) {
        setError('We couldn’t sign you in right away. Please sign in with your new account.');
      }
    }

    setSubmitting(false);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-card sm:p-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold leading-tight text-ink">{text.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink transition focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-100"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Password</span>
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-ink transition focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-100"
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-forest-600 px-4 py-3 font-medium text-white shadow-sm transition hover:bg-forest-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-forest-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Please wait…' : text.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {text.switchPrompt}{' '}
        <button type="button" onClick={switchMode} className="font-medium text-forest-600 underline-offset-4 hover:underline">
          {text.switchAction}
        </button>
      </p>
    </div>
  );
}
