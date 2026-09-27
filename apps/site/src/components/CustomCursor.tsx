"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue } from "framer-motion";

const subscribeNoop = () => () => {};
const getIsTouch = () => "ontouchstart" in window;
const getIsTouchServer = () => false;

export function CustomCursor() {
  const [hovered, setHovered] = useState(false);
  const isTouch = useSyncExternalStore(subscribeNoop, getIsTouch, getIsTouchServer);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  useEffect(() => {
    if (isTouch) return;

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const addHover = () => setHovered(true);
    const removeHover = () => setHovered(false);

    window.addEventListener("mousemove", move);

    const targets = () =>
      document.querySelectorAll("a, button, [data-cursor-hover]");

    const observer = new MutationObserver(() => {
      targets().forEach((el) => {
        el.addEventListener("mouseenter", addHover);
        el.addEventListener("mouseleave", removeHover);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    targets().forEach((el) => {
      el.addEventListener("mouseenter", addHover);
      el.addEventListener("mouseleave", removeHover);
    });

    return () => {
      window.removeEventListener("mousemove", move);
      observer.disconnect();
      targets().forEach((el) => {
        el.removeEventListener("mouseenter", addHover);
        el.removeEventListener("mouseleave", removeHover);
      });
    };
  }, [cursorX, cursorY, isTouch]);

  if (isTouch) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed top-0 left-0 z-[9999] rounded-full mix-blend-difference max-md:hidden"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
          width: hovered ? 48 : 12,
          height: hovered ? 48 : 12,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          transition: "width 0.3s cubic-bezier(0.22, 1, 0.36, 1), height 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      />
      <style jsx global>{`
        @media (pointer: fine) {
          * { cursor: none !important; }
        }
      `}</style>
    </>
  );
}
