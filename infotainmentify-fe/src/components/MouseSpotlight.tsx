import { useEffect, useRef } from "react";

export function MouseSpotlight() {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!divRef.current) return;
      // Mouse kordinatlarını CSS değişkenlerine ata
      divRef.current.style.setProperty("--x", `${e.clientX}px`);
      divRef.current.style.setProperty("--y", `${e.clientY}px`);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      ref={divRef}
      className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-300 overflow-hidden"
      style={{
        background: `radial-gradient(800px circle at var(--x) var(--y), rgba(99, 102, 241, 0.06), transparent 40%)`,
      }}
    />
  );
}
