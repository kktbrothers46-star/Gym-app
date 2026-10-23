/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  Building2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  auth,
  firebaseProjectId,
} from '../../lib/firebase';
import { setPendingSignupDetails } from '../../lib/firestoreSync';
import { LegalModal } from '../modals/LegalModal';

interface AuthScreenProps {
  initialMode?: 'login' | 'signup';
  onAuthSuccess: (user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    gymName?: string;
    isNewUser?: boolean;
  }) => void;
  onBackToRoles: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  initialMode = 'signup',
  onAuthSuccess,
  onBackToRoles,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [ownerName, setOwnerName] = useState('');
  const [gymName, setGymName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{
    ownerName?: string;
    gymName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Legal Modal (Terms / Privacy)
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('terms');
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);

  // Helper validation
  const validateEmailFormat = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrors({});
    setSuccessMessage(null);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (mode === 'signup') {
      if (!ownerName.trim()) {
        newErrors.ownerName = 'Please enter your name.';
      }
      if (!gymName.trim()) {
        newErrors.gymName = 'Please enter your gym or fitness center name.';
      }
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!validateEmailFormat(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }

    if (mode === 'signup') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Confirm your password.';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        setPendingSignupDetails({
          ownerName: ownerName.trim(),
          gymName: gymName.trim(),
        });

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        if (ownerName.trim()) {
          try {
            await updateProfile(userCredential.user, {
              displayName: ownerName.trim(),
            });
          } catch (profileErr) {
            console.warn('Profile name update notice:', profileErr);
          }
        }

        setSuccessMessage('Account created successfully! Preparing your gym workspace...');
        setTimeout(() => {
          onAuthSuccess({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: ownerName.trim() || userCredential.user.displayName,
            gymName: gymName.trim(),
            isNewUser: true,
          });
        }, 500);
      } else {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        setSuccessMessage('Login successful! Loading your gym data...');
        setTimeout(() => {
          onAuthSuccess({
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            isNewUser: false,
          });
        }, 400);
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      const code = err?.code || '';
      let message = 'An unexpected error occurred. Please try again.';

      if (code === 'auth/operation-not-allowed') {
        message =
          'Email/Password sign-in is not enabled in Firebase Console. Please enable Email/Password provider under Authentication > Sign-in method.';
      } else if (code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        message = 'Invalid email or password. Please verify your credentials.';
      } else if (code === 'auth/weak-password') {
        message = 'Password is too weak. Please use at least 6 characters.';
      } else if (code === 'auth/invalid-email') {
        message = 'The provided email address is invalid.';
      } else if (code === 'auth/network-request-failed') {
        message = 'Network error. Please check your internet connection and retry.';
      } else if (err?.message) {
        message = err.message;
      }

      setErrors({ general: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Please enter your account email address.');
      return;
    }
    if (!validateEmailFormat(forgotEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);
    setForgotError(null);

    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      const code = err?.code;
      if (code === 'auth/operation-not-allowed') {
        setForgotError(
          'Email/Password sign-in is disabled in Firebase Console. Please enable it in project settings.'
        );
      } else if (code === 'auth/user-not-found') {
        setForgotError('No account found with this email address.');
      } else if (code === 'auth/invalid-email') {
        setForgotError('Invalid email format.');
      } else {
        setForgotError('Failed to send reset link. Please check the email and try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <main
      className="relative w-full min-h-[100dvh] bg-[#F2EFE8] flex flex-col items-center justify-center p-4 sm:p-6"
      role="main"
      aria-label="Gym Business OS Authentication"
    >
      {/* Back to Role Selection Button */}
      <button
        type="button"
        onClick={onBackToRoles}
        className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#102A71] hover:text-[#0A1D54] transition-colors p-2 rounded-xl hover:bg-white/60 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Role Selection</span>
      </button>

      {/* Auth Card Container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#EAE5DC] p-6 sm:p-8 relative mt-10 sm:mt-0">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#204CBF] to-[#0F2566] text-white shadow-md mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#191919] tracking-tight">
            {mode === 'signup' ? 'Create Gym Owner Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            {mode === 'signup'
              ? 'Start managing members, attendance, and dues.'
              : 'Sign in to access your gym dashboard.'}
          </p>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div
            className="mb-5 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-start gap-2.5 text-xs text-[#DC2626] animate-in fade-in"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#DC2626]" />
            <div className="leading-snug min-w-0 flex-1">
              <p className="font-medium">{errors.general}</p>
              {errors.general.includes('Firebase Console') && (
                <a
                  href={`https://console.firebase.google.com/project/${firebaseProjectId}/authentication/providers`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-1.5 rounded-lg bg-white border border-[#FECACA] text-[#102A71] hover:bg-[#FAF8F5] text-[11.5px] font-bold shadow-2xs transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Firebase Console (Sign-in method)</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Success Message Banner */}
        {successMessage && (
          <div
            className="mb-5 p-3 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] flex items-start gap-2.5 text-xs text-[#16A34A] animate-in fade-in"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug font-medium">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Sign Up Specific Fields */}
          {mode === 'signup' && (
            <>
              {/* Owner Name */}
              <div>
                <label
                  htmlFor="ownerName"
                  className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1"
                >
                  Owner Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A1A1AA]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="ownerName"
                    type="text"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      if (errors.ownerName) setErrors((prev) => ({ ...prev, ownerName: undefined }));
                    }}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border text-xs sm:text-sm rounded-xl text-[#191919] placeholder-[#A1A1AA] focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                      errors.ownerName
                        ? 'border-[#EF4444] focus:ring-[#EF4444]/30'
                        : 'border-[#EAE5DC] focus:ring-[#102A71]/30 focus:border-[#102A71]'
                    }`}
                  />
                </div>
                {errors.ownerName && (
                  <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.ownerName}</p>
                )}
              </div>

              {/* Gym Name */}
              <div>
                <label
                  htmlFor="gymName"
                  className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1"
                >
                  Gym / Fitness Center Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A1A1AA]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    id="gymName"
                    type="text"
                    value={gymName}
                    onChange={(e) => {
                      setGymName(e.target.value);
                      if (errors.gymName) setErrors((prev) => ({ ...prev, gymName: undefined }));
                    }}
                    placeholder="e.g. Iron Pulse Fitness"
                    className={`w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border text-xs sm:text-sm rounded-xl text-[#191919] placeholder-[#A1A1AA] focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                      errors.gymName
                        ? 'border-[#EF4444] focus:ring-[#EF4444]/30'
                        : 'border-[#EAE5DC] focus:ring-[#102A71]/30 focus:border-[#102A71]'
                    }`}
                  />
                </div>
                {errors.gymName && (
                  <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.gymName}</p>
                )}
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A1A1AA]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="name@example.com"
                className={`w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border text-xs sm:text-sm rounded-xl text-[#191919] placeholder-[#A1A1AA] focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                  errors.email
                    ? 'border-[#EF4444] focus:ring-[#EF4444]/30'
                    : 'border-[#EAE5DC] focus:ring-[#102A71]/30 focus:border-[#102A71]'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#191919] uppercase tracking-wider"
              >
                Password
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setForgotSuccess(false);
                    setForgotError(null);
                    setIsForgotPasswordOpen(true);
                  }}
                  className="text-[11px] font-semibold text-[#102A71] hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A1A1AA]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full pl-9 pr-10 py-2.5 bg-[#FAF8F5] border text-xs sm:text-sm rounded-xl text-[#191919] placeholder-[#A1A1AA] focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                  errors.password
                    ? 'border-[#EF4444] focus:ring-[#EF4444]/30'
                    : 'border-[#EAE5DC] focus:ring-[#102A71]/30 focus:border-[#102A71]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A1A1AA] hover:text-[#191919] cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-[#DC2626] mt-1 font-medium">{errors.password}</p>
            )}
            {mode === 'signup' && !errors.password && (
              <p className="text-[10.5px] text-[#71717A] mt-1">Minimum 6 characters required.</p>
            )}
          </div>

          {/* Confirm Password (Sign Up only) */}
          {mode === 'signup' && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-bold text-[#191919] uppercase tracking-wider mb-1"
              >
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#A1A1AA]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2.5 bg-[#FAF8F5] border text-xs sm:text-sm rounded-xl text-[#191919] placeholder-[#A1A1AA] focus:outline-hidden focus:ring-2 focus:bg-white transition-all ${
                    errors.confirmPassword
                      ? 'border-[#EF4444] focus:ring-[#EF4444]/30'
                      : 'border-[#EAE5DC] focus:ring-[#102A71]/30 focus:border-[#102A71]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#A1A1AA] hover:text-[#191919] cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-[11px] text-[#DC2626] mt-1 font-medium">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Terms & Privacy Links */}
          {mode === 'signup' && (
            <div className="text-[11px] text-[#71717A] leading-relaxed pt-1">
              By creating an account, you agree to our{' '}
              <button
                type="button"
                onClick={() => {
                  setLegalModalTab('terms');
                  setIsLegalModalOpen(true);
                }}
                className="text-[#102A71] font-semibold underline hover:text-[#0A1D54] cursor-pointer"
              >
                Terms of Service
              </button>{' '}
              and acknowledge our{' '}
              <button
                type="button"
                onClick={() => {
                  setLegalModalTab('privacy');
                  setIsLegalModalOpen(true);
                }}
                className="text-[#102A71] font-semibold underline hover:text-[#0A1D54] cursor-pointer"
              >
                Privacy Policy
              </button>
              .
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 rounded-xl bg-[#102A71] hover:bg-[#0A1D54] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'signup' ? 'Creating Account...' : 'Signing In...'}</span>
              </>
            ) : (
              <>
                <span>{mode === 'signup' ? 'Create Owner Account' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Toggle Login / Sign Up */}
        <div className="mt-6 pt-5 border-t border-[#EAE5DC] text-center text-xs text-[#71717A]">
          {mode === 'signup' ? (
            <p>
              Already have an owner account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="font-bold text-[#102A71] hover:underline cursor-pointer ml-1"
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              New gym owner?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="font-bold text-[#102A71] hover:underline cursor-pointer ml-1"
              >
                Register your Gym
              </button>
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotPasswordOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-[#EAE5DC] p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-[#191919]">Reset Password</h3>
            </div>
            <p className="text-xs text-[#71717A] mb-4">
              Enter your registered account email. We will send a secure password reset link to your
              inbox.
            </p>

            {forgotError && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[11.5px] text-[#DC2626]">
                {forgotError}
              </div>
            )}

            {forgotSuccess ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#86EFAC] text-xs text-[#16A34A] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Password reset link sent to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(false)}
                  className="w-full py-2.5 bg-[#102A71] text-white text-xs font-semibold rounded-xl hover:bg-[#0A1D54] cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label htmlFor="forgotEmailInput" className="block text-xs font-bold text-[#191919] mb-1">
                    Your Email
                  </label>
                  <input
                    id="forgotEmailInput"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3 py-2 text-xs border border-[#EAE5DC] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#102A71]"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(false)}
                    className="px-3 py-2 text-xs font-medium text-[#71717A] hover:text-[#191919] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="px-4 py-2 bg-[#102A71] text-white text-xs font-semibold rounded-xl hover:bg-[#0A1D54] flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Reset Email</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Legal Modal (Terms / Privacy) */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
      />
    </main>
  );
};
