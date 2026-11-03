import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { clsx } from 'clsx';
import { cfg } from '../services/impostazioni';

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
      <div className="min-h-screen flex items-center justify-center bg-ink-50 ">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-signal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50  py-12 px-4 sm:px-6 lg:px-8 relative grid-texture">
      <div className="max-w-md w-full space-y-8 bg-white rounded-xl border border-ink-200 shadow-lg px-8 py-10" data-testid="login-card">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center gap-3">
              <img src={cfg().aspetto.logo || '/logo-az.png'} alt="Logo" className="h-12 w-auto object-contain" data-testid="login-logo" />
              <div className="text-left leading-tight">
                <div className="font-display text-xl font-bold text-ink-700">{cfg().aspetto.nomeCompleto}</div>
                <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-500">Studio Tecnico</div>
              </div>
            </div>
          </div>
          <h2 className="mt-8 text-2xl font-bold text-ink-700 ">
            Accesso all'area riservata
          </h2>
          <p className="mt-2 text-sm text-ink-500 ">
            Pratiche edilizie e catastali, certificazioni APE, contabilità e contatti in un unico gestionale.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-600 ">
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
                    'flex h-10 w-full rounded-md border border-ink-300 bg-white px-3 py-2 pl-10 text-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50    dark:placeholder:text-ink-400',
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
              <label htmlFor="password" className="block text-sm font-medium text-ink-600 ">
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
                    'flex h-10 w-full rounded-md border border-ink-300 bg-white px-3 py-2 pl-10 pr-10 text-sm placeholder:text-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50    dark:placeholder:text-ink-400',
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
                className="h-4 w-4 text-signal-500 focus:ring-signal-500 border-ink-300  rounded bg-white "
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-ink-600 ">
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
          <div className="flex items-center justify-end text-sm">
            <Link
              to="/reset-password"
              className="text-signal-600 hover:text-signal-500 hover:underline  "
            >
              Password dimenticata?
            </Link>
          </div>
        </form>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-4 right-4 p-3 rounded-full bg-white  shadow-lg border border-ink-200  hover:bg-ink-50  transition-colors duration-200"
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
