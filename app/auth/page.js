"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

// Password validation helpers
const validatePassword = (password) => {
  const requirements = {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&]/.test(password),
  };
  
  const isValid = Object.values(requirements).every(req => req);
  return { requirements, isValid };
};

const validateUsername = (username) => {
  const requirements = {
    minLength: username.length >= 3,
    maxLength: username.length <= 30,
    validChars: /^[a-zA-Z0-9_]*$/.test(username),
  };
  
  const isValid = Object.values(requirements).every(req => req) && username.length > 0;
  return { requirements, isValid };
};

export default function AuthPage() {
  // Form state
  const [mode, setMode] = useState("login");
  const [isHydrated, setIsHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    name: "",
  });
  
  // Validation states
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [showUsernameRules, setShowUsernameRules] = useState(false);
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  const searchParams = useSearchParams();
  
  // Validation results
  const passwordValidation = validatePassword(formData.password);
  const usernameValidation = validateUsername(formData.username);
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSignup = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          name: formData.name,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Account created successfully!');
        setMode('login');
        setFormData(prev => ({ ...prev, password: '', name: '', username: '' }));
      } else {
        toast.error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogin = async () => {
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      
      if (result?.error) {
        if (result.error.includes('Invalid password')) {
          toast.error('❌ Wrong password. Please check your password and try again.');
        } else if (result.error.includes('No account found')) {
          toast.error('❌ No account found with this email. Please sign up first.');
        } else if (result.error.includes('Account temporarily locked')) {
          toast.error('🔒 Account locked due to too many failed attempts. Please try again later.');
        } else if (result.error.includes('Please sign in using your social account')) {
          toast.error('🔗 This account uses social login. Please use Google, GitHub, or LinkedIn.');
        } else {
          toast.error(result.error);
        }
      } else if (result?.ok) {
        toast.success('🎉 Welcome back!');
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('❌ Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleForgotPassword = async (email) => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('📧 Password reset email sent! Check your inbox.');
      } else {
        toast.error(data.error || 'Failed to send reset email');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Failed to send reset email. Please try again.');
    }
  };
  
  const handleResendVerification = async (email) => {
    if (!email || !email.includes('@')) {
      const userEmail = prompt('Enter your email address:');
      if (!userEmail) return;
      email = userEmail;
    }
    
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('📧 Verification email sent! Check your inbox.');
      } else {
        toast.error(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      toast.error('Failed to send verification email. Please try again.');
    }
  };

  useEffect(() => {
    setIsHydrated(true);
    const error = searchParams.get("error");
    const verified = searchParams.get("verified");
    const modeParam = searchParams.get("mode");
    
    // Set mode based on URL parameter
    if (modeParam === "signup" || modeParam === "login") {
      setMode(modeParam);
    }
    
    if (verified === "true") {
      toast.success("✅ Email verified successfully! You can now sign in.");
    } else if (error) {
      const message =
        error === "AccessDenied"
          ? "Access denied by provider. Please ensure you granted email access."
          : error === "OAuthAccountNotLinked"
          ? "This email is already linked with another provider. Please use the original provider."
          : error === "InvalidToken"
          ? "Invalid verification link. Please request a new one."
          : error === "ExpiredToken"
          ? "Verification link expired. Please request a new one."
          : error === "VerificationError"
          ? "Email verification failed. Please try again."
          : "Sign-in failed. Please try again.";
      toast.error(message);
    }
  }, [searchParams]);

  return (
    <main className="relative min-h-screen flex items-center justify-center px-6 py-12 overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.03)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      </div>

      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-start px-16 relative z-10 max-w-2xl">
        <div className="space-y-8">
          {/* Main Heading with Gradient Animation */}
          <div className="space-y-4 overflow-hidden">
            <h1
              className="text-9xl font-black uppercase tracking-tighter leading-none animate-gradient bg-gradient-to-r from-emerald-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-300% hover:scale-105 transition-transform duration-500 cursor-default"
            >
              {mode === "login" ? "WELCOME" : "JOIN US"}
            </h1>
            <div className="text-7xl font-black uppercase tracking-tight text-white/40 transform translate-x-4">
              {mode === "login" ? "BACK" : "TODAY"}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-2 gap-4 mt-12">
            <div className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-2">🚀</div>
              <h3 className="text-white font-semibold mb-1">Fast Setup</h3>
              <p className="text-white/60 text-sm">Get started in minutes</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="text-white font-semibold mb-1">Secure</h3>
              <p className="text-white/60 text-sm">Enterprise-grade security</p>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="border-l-4 border-emerald-400 pl-6 py-4 text-white/80 text-lg italic backdrop-blur-sm">
            "The best time to start was yesterday. The next best time is now."
          </blockquote>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full max-w-md relative z-10">
        <div
          className="relative backdrop-blur-2xl bg-white/10 p-10 rounded-3xl shadow-2xl border border-white/20 transition-all duration-500 hover:shadow-emerald-500/20 hover:shadow-3xl"
        >
          {/* Top Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-purple-400 to-pink-400 rounded-t-3xl"></div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-8">
            <div className="relative flex bg-white/5 backdrop-blur-lg rounded-2xl p-1.5 border border-white/10">
              <div
                className={`absolute top-1.5 bottom-1.5 left-1.5 w-[calc(50%-6px)] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl transition-transform duration-300 ease-out ${
                  mode === "signup" ? "translate-x-full" : "translate-x-0"
                }`}
              ></div>
              <button
                onClick={() => setMode("login")}
                className={`relative z-10 px-8 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ${
                  mode === "login" ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`relative z-10 px-8 py-3 rounded-xl font-semibold text-sm transition-colors duration-300 ${
                  mode === "signup" ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-white">
              {mode === "login" ? "Welcome Back!" : "Create Account"}
            </h2>
            <p className="text-white/60 text-sm">
              {mode === "login"
                ? "Enter your credentials to continue"
                : "Fill in your details to get started"}
            </p>
          </div>

          {/* Signup Form */}
          <div
            className="transition-all duration-500 overflow-hidden space-y-5"
            style={{
              maxHeight: mode === "signup" ? "1000px" : "0px",
              opacity: mode === "signup" ? 1 : 0,
            }}
          >
            {/* Name Field */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Full Name <span className="text-white/40">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                placeholder="John Doe"
              />
            </div>
            
            {/* Email Field */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                placeholder="john@example.com"
                required
              />
            </div>
            
            {/* Username Field */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Username *
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 text-lg">@</div>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\s+/g, "").toLowerCase();
                    handleInputChange('username', value);
                  }}
                  onFocus={() => setShowUsernameRules(true)}
                  onBlur={() => setShowUsernameRules(false)}
                  className={`w-full bg-white/10 backdrop-blur-sm border rounded-xl pl-10 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    formData.username && !usernameValidation.isValid
                      ? 'border-red-400/50 focus:ring-red-400'
                      : formData.username && usernameValidation.isValid
                      ? 'border-emerald-400/50 focus:ring-emerald-400'
                      : 'border-white/20 focus:ring-emerald-400'
                  }`}
                  placeholder="johndoe"
                  required
                />
                {formData.username && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {usernameValidation.isValid ? (
                      <span className="text-emerald-400 text-xl">✓</span>
                    ) : (
                      <span className="text-red-400 text-xl">✗</span>
                    )}
                  </div>
                )}
              </div>
              
              {(showUsernameRules || (formData.username && !usernameValidation.isValid)) && (
                <div className="mt-3 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-xs space-y-2">
                  <p className="font-semibold text-white mb-2">Username Requirements:</p>
                  {[
                    { key: 'minLength', text: 'At least 3 characters' },
                    { key: 'maxLength', text: 'Maximum 30 characters' },
                    { key: 'validChars', text: 'Only letters, numbers, and underscores' }
                  ].map(req => (
                    <div key={req.key} className={`flex items-center space-x-2 ${
                      usernameValidation.requirements[req.key] ? 'text-emerald-400' : 'text-white/60'
                    }`}>
                      <span>{usernameValidation.requirements[req.key] ? '✓' : '○'}</span>
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onFocus={() => setShowPasswordRules(true)}
                  onBlur={() => setShowPasswordRules(false)}
                  className={`w-full bg-white/10 backdrop-blur-sm border rounded-xl px-4 pr-20 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                    formData.password && !passwordValidation.isValid
                      ? 'border-red-400/50 focus:ring-red-400'
                      : formData.password && passwordValidation.isValid
                      ? 'border-emerald-400/50 focus:ring-emerald-400'
                      : 'border-white/20 focus:ring-emerald-400'
                  }`}
                  placeholder="Create a strong password"
                  required
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {/* Password Visibility Toggle */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-white/60 hover:text-white transition-colors p-1"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {/* Validation Icon */}
                  {formData.password && (
                    <div>
                      {passwordValidation.isValid ? (
                        <span className="text-emerald-400 text-lg">✓</span>
                      ) : (
                        <span className="text-red-400 text-lg">✗</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {(showPasswordRules || (formData.password && !passwordValidation.isValid)) && (
                <div className="mt-3 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-xs space-y-2">
                  <p className="font-semibold text-white mb-2">Password Requirements:</p>
                  {[
                    { key: 'minLength', text: 'At least 8 characters' },
                    { key: 'hasLowercase', text: 'One lowercase letter (a-z)' },
                    { key: 'hasUppercase', text: 'One uppercase letter (A-Z)' },
                    { key: 'hasNumber', text: 'One number (0-9)' },
                    { key: 'hasSpecial', text: 'One special character (@$!%*?&)' }
                  ].map(req => (
                    <div key={req.key} className={`flex items-center space-x-2 ${
                      passwordValidation.requirements[req.key] ? 'text-emerald-400' : 'text-white/60'
                    }`}>
                      <span>{passwordValidation.requirements[req.key] ? '✓' : '○'}</span>
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Signup Button */}
            <button
              onClick={handleSignup}
              disabled={loading || !formData.email || !formData.username || !passwordValidation.isValid || !usernameValidation.isValid}
              className="w-full mt-6 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-600 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {loading && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-950/50 text-white/60">or continue with</span>
              </div>
            </div>
          </div>
          
          {/* Login Form */}
          <div
            className="transition-all duration-500 overflow-hidden space-y-5"
            style={{
              maxHeight: mode === "login" ? "400px" : "0px",
              opacity: mode === "login" ? 1 : 0,
            }}
          >
            {/* Email/Username Field */}
            <div>
              <label className="text-sm font-medium text-white/90 mb-2 block">
                Email or Username
              </label>
              <input
                type="text"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                placeholder="john@example.com or @johndoe"
                required
              />
            </div>
            
            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white/90">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const email = formData.email || prompt('Enter your email address:');
                    if (email) {
                      handleForgotPassword(email);
                    }
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showLoginPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 pr-12 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                {/* Password Visibility Toggle */}
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors p-1"
                  title={showLoginPassword ? "Hide password" : "Show password"}
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {/* Login Button */}
            <button
              onClick={handleLogin}
              disabled={loading || !formData.email || !formData.password}
              className="w-full mt-6 py-4 px-6 rounded-xl font-semibold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {loading && (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
            
            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-slate-950/50 text-white/60">or continue with</span>
              </div>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3 mt-6">
            <button
              onClick={() => signIn("google")}
              className="w-full py-3.5 px-6 rounded-xl font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => signIn("github")}
              className="w-full py-3.5 px-6 rounded-xl font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3 group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              <span>Continue with GitHub</span>
            </button>

            <button
              onClick={() => signIn("linkedin")}
              className="w-full py-3.5 px-6 rounded-xl font-medium bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3 group"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.924 2.065-2.064 2.065zm1.781 13.019H3.555V9h3.563v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.225.792 24 1.771 24h20.451C23.2 24 24 23.225 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
              <span>Continue with LinkedIn</span>
            </button>
          </div>
          
          {/* Email Verification Link */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/50 mb-2">
              Didn't receive a verification email?
            </p>
            <button
              onClick={() => handleResendVerification()}
              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors underline decoration-dotted"
            >
              Resend Verification Email
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-gradient {
          animation: gradient 6s ease infinite;
        }

        .bg-300\% {
          background-size: 300%;
        }
      `}</style>
    </main>
  );
}