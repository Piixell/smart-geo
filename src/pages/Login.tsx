import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { clsx } from 'clsx';

const loginSchema = z.object({
  email: z.string().email('Inserisci un email valida'),
  password: z.string().min(6, 'La password deve avere almeno 6 caratteri'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user, loading } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  useEffect(() => {
    if (user && !loading) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    const success = await signIn(data.email, data.password, data.rememberMe);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-50">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50 dark:bg-ink-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-10 h-10 text-signal-500" />
              <span className="text-2xl font-bold text-ink-700 dark:text-ink-700">Smart-Geo</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-ink-700 dark:text-ink-700">
            Accedi al tuo account
          </h2>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-500">
            Gestisci il tuo studio di geometri
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-600 dark:text-ink-600">
                Email
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-ink-400" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className={clsx(
                    'flex h-10 w-full rounded-md border border-ink-300 bg-white px-3 py-2 pl-10 text-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-100 dark:text-ink-700 dark:border-ink-300 dark:placeholder:text-ink-400',
                    errors.email && 'border-error-500 focus-visible:ring-error-500'
                  )}
                  placeholder="Inserisci la tua email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-500 dark:text-error-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink-600 dark:text-ink-600">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-ink-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={clsx(
                    'flex h-10 w-full rounded-md border border-ink-300 bg-white px-3 py-2 pl-10 pr-10 text-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-ink-100 dark:text-ink-700 dark:border-ink-300 dark:placeholder:text-ink-400',
                    errors.password && 'border-error-500 focus-visible:ring-error-500'
                  )}
                  placeholder="Inserisci la tua password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-ink-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-ink-400" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error-500 dark:text-error-500">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                {...register('rememberMe')}
                id="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-signal-500 focus:ring-signal-500 border-ink-300 dark:border-ink-300 rounded bg-white dark:bg-ink-100"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-ink-600 dark:text-ink-600">
                Ricordami
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={clsx(
                'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 disabled:pointer-events-none bg-signal-500 text-white hover:bg-signal-600 px-4 py-2 w-full',
                isSubmitting && 'opacity-50 cursor-not-allowed'
              )}
            >
              {isSubmitting ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between text-sm">
            <Link
              to="/register"
              className="text-signal-600 hover:text-signal-500 hover:underline dark:text-signal-400 dark:hover:text-signal-300"
            >
              Non hai un account? Registrati
            </Link>
            <Link
              to="/reset-password"
              className="text-signal-600 hover:text-signal-500 hover:underline dark:text-signal-400 dark:hover:text-signal-300"
            >
              Password dimenticata?
            </Link>
          </div>
        </form>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-white dark:bg-ink-100 shadow-lg border border-ink-200 dark:border-ink-300 hover:bg-ink-50 dark:hover:bg-ink-200 transition-colors duration-200"
        aria-label="Toggle theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-warning-500" />
        ) : (
          <Moon className="w-5 h-5 text-ink-600" />
        )}
      </button>
    </div>
  );
};
