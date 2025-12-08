import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login
    onLogin();
  };

  return (
    <div className="fixed inset-0 bg-black overflow-hidden flex items-center justify-center">
      {/* Ambient breathing background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(203, 163, 93, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.4, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Gold shimmer particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#CBA35D]"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Main login container */}
      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* Logo/Title */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <h1 className="text-[#E5E5E5] mb-3 text-4xl lg:text-5xl">
            The Mirror Virtual Platform
          </h1>
          <motion.div
            className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#CBA35D] to-transparent"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
          />
        </motion.div>

        {/* Login form */}
        <motion.form
          onSubmit={handleSubmit}
          className="mirror-glass rounded-3xl p-8 lg:p-10 border border-[#30303A]/30 backdrop-blur-xl"
          style={{
            background: 'rgba(11, 11, 13, 0.6)',
            boxShadow: focusedField
              ? '0 0 40px rgba(203, 163, 93, 0.2)'
              : '0 0 20px rgba(0, 0, 0, 0.5)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="space-y-6">
            {/* Email field */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#C4C4CF]/60 mb-3">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4C4CF]/40 transition-colors duration-300"
                  style={{
                    color: focusedField === 'email' ? '#CBA35D' : undefined
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#0B0B0D]/50 border border-[#30303A]/40 text-[#E5E5E5] placeholder-[#C4C4CF]/30 focus:outline-none focus:border-[#CBA35D]/60 transition-all duration-300"
                  style={{
                    boxShadow: focusedField === 'email'
                      ? '0 0 20px rgba(203, 163, 93, 0.15)'
                      : 'none',
                  }}
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#C4C4CF]/60 mb-3">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C4C4CF]/40 transition-colors duration-300"
                  style={{
                    color: focusedField === 'password' ? '#CBA35D' : undefined
                  }}
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#0B0B0D]/50 border border-[#30303A]/40 text-[#E5E5E5] placeholder-[#C4C4CF]/30 focus:outline-none focus:border-[#CBA35D]/60 transition-all duration-300"
                  style={{
                    boxShadow: focusedField === 'password'
                      ? '0 0 20px rgba(203, 163, 93, 0.15)'
                      : 'none',
                  }}
                  required
                />
              </div>
            </div>

            {/* Sign in button */}
            <motion.button
              type="submit"
              className="w-full py-4 rounded-2xl bg-[#CBA35D] text-black font-medium flex items-center justify-center gap-2 group overflow-hidden relative"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                whileHover={{ x: '100%' }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              />
              <span className="relative z-10">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </span>
              <ArrowRight
                size={18}
                className="relative z-10 group-hover:translate-x-1 transition-transform duration-300"
              />
            </motion.button>
          </div>
        </motion.form>

        {/* Sign up link */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <p className="text-sm text-[#C4C4CF]/60">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#CBA35D] hover:text-[#CBA35D]/80 transition-colors duration-300 underline decoration-[#CBA35D]/30 hover:decoration-[#CBA35D]/60"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </motion.div>

        {/* Subtle hint text */}
        <motion.p
          className="text-center mt-6 text-xs text-[#C4C4CF]/30 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
        >
          Reflection over instruction
        </motion.p>
      </motion.div>
    </div>
  );
}
