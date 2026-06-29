"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function MobileSidebarToggle() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("sidebar-open");
    } else {
      document.body.classList.remove("sidebar-open");
    }
    return () => document.body.classList.remove("sidebar-open");
  }, [isOpen]);

  // Close sidebar on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? "✕ Fermer" : "☰ Menu"}
      </button>

      {isOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  );
}
