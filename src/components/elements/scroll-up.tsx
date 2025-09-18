"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Icon } from "../ui/icon";

export const ScrollUp = ({ size = "size-6" }: { size?: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down
  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Add scroll event listener
    window.addEventListener("scroll", toggleVisibility);

    // Initial check
    toggleVisibility();

    // Clean up event listener on component unmount
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      aria-label="Scroll to top"
      className={cn(
        "fixed right-6 bottom-6 z-50 flex items-center justify-center rounded-full bg-primary/0 text-primary-foreground shadow-lg transition-all duration-300 hover:bg-primary/50 focus:outline-none focus:ring-2 focus:ring-ring/50 active:ring-2 active:ring-primary active:ring-offset-2",
        isVisible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-10 opacity-0"
      )}
      onClick={scrollToTop}
      type="button"
    >
      <Icon
        className={size}
        icon="line-md:arrow-up"
        key={isVisible ? "visible" : "hidden"}
      />
    </button>
  );
};

export default ScrollUp;
