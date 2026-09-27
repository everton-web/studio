/* ============================================================
   Dra. Aline Schwanck — main.js
   Vanilla JS: menu mobile + reveal on scroll + links de WhatsApp
   ============================================================ */
(function () {
  "use strict";

  var WHATSAPP = "5548991105505";

  /* ---------- 1. Links de WhatsApp ----------
     Todo elemento com [data-wa-msg] recebe o href montado com o número
     oficial + mensagem pré-preenchida. Fallback (sem JS): o href já
     aponta para wa.me/<numero> direto no HTML. */
  function wireWhatsApp() {
    var els = document.querySelectorAll("[data-wa-msg]");
    Array.prototype.forEach.call(els, function (el) {
      var msg = el.getAttribute("data-wa-msg") || "";
      var url = "https://wa.me/" + WHATSAPP;
      if (msg) url += "?text=" + encodeURIComponent(msg);
      el.setAttribute("href", url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    });
  }

  /* ---------- 2. Menu mobile ---------- */
  function wireMenu() {
    var toggle = document.getElementById("navToggle");
    var nav = document.getElementById("nav");
    if (!toggle || !nav) return;

    function close() {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menu");
    }
    function open() {
      nav.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Fechar menu");
    }

    toggle.addEventListener("click", function () {
      if (nav.classList.contains("open")) close();
      else open();
    });

    // Fecha ao clicar num link
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) close();
    });

    // Fecha com ESC
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    // Fecha ao voltar para desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) close();
    });
  }

  /* ---------- 3. Reveal on scroll ---------- */
  function wireReveal() {
    var items = document.querySelectorAll(".reveal");
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce || !("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(items, function (el) { el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- 4. Ano no rodapé ---------- */
  function setYear() {
    var y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function init() {
    wireWhatsApp();
    wireMenu();
    wireReveal();
    setYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
