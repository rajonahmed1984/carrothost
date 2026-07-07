import { useEffect, useState } from "react";
import { Carrot } from "lucide-react";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled down past 300px
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll to top smoothly
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        type="button"
        onClick={scrollToTop}
        className={`flex items-center justify-center bg-transparent text-brand-orange hover:text-brand-green hover:scale-125 active:scale-90 transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <Carrot className="h-10 w-10 -rotate-45" strokeWidth={1.5} />
      </button>
    </div>
  );
}
