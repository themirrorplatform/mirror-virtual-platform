import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handle = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handle);
    return () => window.removeEventListener("scroll", handle);
  }, []);

  const navClass = scrolled ? "bg-black/95" : "bg-transparent";

  return (
    <nav className={navClass}>
      <Link href="/">
        <Sparkles />
      </Link>
    </nav>
  );
}
