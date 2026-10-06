"use client";

import { motion, useReducedMotion } from "framer-motion";

// Botão fixo do WhatsApp: entra com mola depois do carregamento e pulsa (ping) para chamar atenção.
export function WhatsAppFloat() {
  const reduced = useReducedMotion();
  return (
    <motion.a
      href="https://wa.me/5571999261967"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar no WhatsApp"
      initial={reduced ? false : { scale: 0, opacity: 0, y: 40 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 18, delay: 1.8 }}
      whileHover={reduced ? undefined : { scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 max-md:bottom-5 max-md:right-5 z-[60] grid place-items-center w-14 h-14 rounded-full"
      style={{ background: "#25D366", boxShadow: "0 10px 30px rgba(0,0,0,.35)" }}
    >
      {!reduced && (
        <span aria-hidden className="absolute inset-0 rounded-full animate-ping" style={{ background: "#25D366", opacity: 0.35 }} />
      )}
      <svg viewBox="0 0 24 24" width="26" height="26" fill="#fff" aria-hidden className="relative">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.24 9.42-9.44 9.42m8.03-17.45A11.3 11.3 0 0 0 12.05.72C5.79.72.7 5.8.7 12.06c0 2 .52 3.95 1.52 5.67L.6 23.6l6.01-1.58a11.3 11.3 0 0 0 5.43 1.38h.01c6.25 0 11.34-5.09 11.35-11.34 0-3.03-1.18-5.88-3.32-8.02" />
      </svg>
    </motion.a>
  );
}
