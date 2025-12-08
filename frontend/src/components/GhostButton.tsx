import { motion } from "framer-motion";

interface GhostButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function GhostButton({
  children,
  onClick,
  icon,
  active = false,
  size = "md",
  disabled = false,
}: GhostButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-5 py-2.5 text-lg",
  };

  const activeClasses = active
    ? "border-[#CBA35D]/60 bg-[#CBA35D]/10 text-[#CBA35D]"
    : "border-[#30303A]/40 text-[#BDBDBD] hover:border-[#CBA35D]/30 hover:text-[#FAFAFA]";

  const disabledClass = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 rounded-full border-2 transition-all duration-200 ${sizeClasses[size]} ${activeClasses} ${disabledClass}`}
      whileHover={disabled || active ? {} : { scale: 1.05 }}
      whileTap={disabled || active ? {} : { scale: 0.95 }}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
    </motion.button>
  );
}
