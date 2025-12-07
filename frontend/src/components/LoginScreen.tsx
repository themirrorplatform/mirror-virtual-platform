import { useState } from 'react';
import svgPaths from "../imports/svg-wmrylxvfpj";
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginScreenProps {
  onLogin: () => void;
}

function BackgroundGradient() {
  return (
    <div 
      className="absolute h-[1025.84px] left-[-67.15px] opacity-[0.358] top-[-40.92px] w-[1683.29px]" 
      style={{ 
        backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1683.3 1025.8\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(0 -72.538 -119.03 0 841.65 512.92)\\'><stop stop-color=\\'rgba(203,163,93,0.15)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(102,82,47,0.075)\\' offset=\\'0.35\\'/><stop stop-color=\\'rgba(0,0,0,0)\\' offset=\\'0.7\\'/></radialGradient></defs></svg>')" 
      }} 
    />
  );
}

function FloatingDots() {
  const dots = [
    { left: '784.62px', top: '877.4px', size: '2.817px', opacity: 0.243 },
    { left: '1432.02px', top: '842.3px', size: '3.896px', opacity: 0.482 },
    { left: '172.73px', top: '326.61px', size: '3.128px', opacity: 0.287 },
    { left: '860.65px', top: '226.6px', size: '3.705px', opacity: 0.408 },
    { left: '1017.19px', top: '609.92px', size: '3.999px', opacity: 0.59 },
    { left: '118.42px', top: '125.63px', size: '3.969px', opacity: 0.534 },
    { left: '132.3px', top: '371.91px', size: '3.213px', opacity: 0.3 },
    { left: '322.17px', top: '646.31px', size: '2.007px', opacity: 0.156 },
  ];

  return (
    <>
      {dots.map((dot, index) => (
        <div
          key={index}
          className="absolute bg-[#cba35d] rounded-[3.35544e+07px]"
          style={{
            left: dot.left,
            top: dot.top,
            width: dot.size,
            height: dot.size,
            opacity: dot.opacity,
          }}
        />
      ))}
    </>
  );
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate authentication
    setTimeout(() => {
      onLogin();
    }, 500);
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
      <BackgroundGradient />
      <FloatingDots />
      
      <div className="relative z-10 w-[448px]">
        {/* Header */}
        <div className="mb-[49px]">
          <h1 className="font-['EB_Garamond:Regular',sans-serif] text-[48px] leading-[48px] text-neutral-200 text-center mb-[12px]">
            Welcome to MirrorX
          </h1>
          <div className="h-px w-[128px] mx-auto bg-gradient-to-r from-transparent via-[#cba35d] to-transparent" />
        </div>

        {/* Form */}
        <div className="bg-[rgba(11,11,13,0.6)] rounded-[24px] border border-[rgba(48,48,58,0.3)] shadow-[0px_0px_20px_0px_rgba(0,0,0,0.5)] p-[41px]">
          <form onSubmit={handleSubmit} className="space-y-[24px]">
            {/* Email Input */}
            <div className="space-y-[12px]">
              <label className="block text-[12px] leading-[16px] text-[rgba(196,196,207,0.6)] tracking-[0.6px] uppercase font-['Inter:Regular',sans-serif]">
                Email
              </label>
              <div className="relative">
                <div className="absolute left-[16px] top-[20px] text-[rgba(196,196,207,0.4)]">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full h-[58px] bg-[rgba(11,11,13,0.5)] border border-[rgba(48,48,58,0.4)] rounded-[16px] pl-[48px] pr-[16px] text-[16px] text-[rgba(196,196,207,0.9)] placeholder:text-[rgba(196,196,207,0.3)] focus:outline-none focus:border-[rgba(203,163,93,0.5)] transition-colors font-['Inter:Regular',sans-serif]"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-[12px]">
              <label className="block text-[12px] leading-[16px] text-[rgba(196,196,207,0.6)] tracking-[0.6px] uppercase font-['Inter:Regular',sans-serif]">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-[16px] top-[20px] text-[rgba(196,196,207,0.4)]">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[58px] bg-[rgba(11,11,13,0.5)] border border-[rgba(48,48,58,0.4)] rounded-[16px] pl-[48px] pr-[16px] text-[16px] text-[rgba(196,196,207,0.9)] placeholder:text-[rgba(196,196,207,0.3)] focus:outline-none focus:border-[rgba(203,163,93,0.5)] transition-colors font-['Inter:Regular',sans-serif]"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="relative w-full h-[56px] bg-[#cba35d] rounded-[16px] overflow-hidden group hover:bg-[#d6af36] transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.2)] to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="relative flex items-center justify-center gap-[8px]">
                <span className="font-['Inter:Medium',sans-serif] font-medium text-[16px] leading-[24px] text-black">
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </span>
                <ArrowRight size={18} className="text-black" />
              </div>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-[32px] text-center">
          <p className="font-['Inter:Regular',sans-serif] text-[14px] leading-[20px] text-[rgba(196,196,207,0.6)] tracking-[0.14px]">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#cba35d] underline hover:text-[#d6af36] transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="mt-[24px] text-center font-['Inter:Italic',sans-serif] italic text-[12px] leading-[16px] text-[rgba(196,196,207,0.3)] tracking-[0.12px]">
          Reflection over instruction
        </p>
      </div>
    </div>
  );
}
