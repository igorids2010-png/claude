(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
   * Navbar: solid/blurred background once the user leaves the hero.
   * A class toggle, not a per-frame animation, so it's cheap even
   * under reduced motion.
   * ------------------------------------------------------------- */
  ScrollTrigger.create({
    start: 80,
    onEnter: function () { document.getElementById("navbar").classList.add("navbar--scrolled"); },
    onLeaveBack: function () { document.getElementById("navbar").classList.remove("navbar--scrolled"); },
  });

  if (reduceMotion) {
    gsap.set("#navbar", { autoAlpha: 1, y: 0 });
    return;
  }

  /* Percentage-based transforms (the CSS translateY(110%) mask-reveal
   * state) get resolved to pixels by the browser before GSAP can read
   * them, so GSAP would decompose them as a plain "y" offset instead
   * of "yPercent" and later yPercent tweens would silently no-op.
   * Setting it explicitly makes GSAP own yPercent from the start. */
  gsap.set(".line-inner", { yPercent: 110 });
  gsap.set("#heroBurger", { yPercent: -50 });

  /* ---------------------------------------------------------------
   * Hero entrance — plays once on load, independent of scroll.
   * ------------------------------------------------------------- */
  gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } })
    .to("#navbar", { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
    .to(".hero__title .line-inner", { yPercent: 0, duration: 1, stagger: 0.12, ease: "power4.out" }, 0.1)
    .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.05)
    .to(".hero__subtitle", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.55)
    .to(".hero__actions", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.68)
    .fromTo(
      "#heroBurger",
      { scale: 0.8, autoAlpha: 0, rotation: 6 },
      { scale: 1, autoAlpha: 1, rotation: 0, duration: 1.2, ease: "power4.out" },
      0.15
    );

  /* ---------------------------------------------------------------
   * Product cards: image first, then name/description/price with
   * a short stagger. Each card gets its own trigger, so the reveal
   * naturally cascades as the grid scrolls into view.
   * ------------------------------------------------------------- */
  gsap.utils.toArray(".product-card").forEach(function (card, i) {
    var image = card.querySelector(".product-card__image");
    var texts = card.querySelectorAll(
      ".product-card__name, .product-card__desc, .product-card__price, .product-card__badge"
    );

    gsap.timeline({ scrollTrigger: { trigger: card, start: "top 88%" } })
      .to(image, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out", delay: (i % 2) * 0.08 })
      .to(texts, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power3.out" }, 0.15);
  });

  /* ---------------------------------------------------------------
   * Final CTA: calmer, single reveal — no scrub, no parallax.
   * ------------------------------------------------------------- */
  gsap.timeline({ scrollTrigger: { trigger: "#cta", start: "top 80%" } })
    .to([".cta__title", ".cta__subtitle", ".cta .btn"], {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power2.out",
    });

  /* ---------------------------------------------------------------
   * Impact section: pin + soft scroll-zoom on the artwork, title and
   * subtitle rise into place. Shared between breakpoints; only the
   * pin distance and zoom amount change.
   * ------------------------------------------------------------- */
  function impactScene(isDesktop) {
    var zoomTo = isDesktop ? 1.2 : 1.14;
    var pinDistance = isDesktop ? "100%" : "60%";

    gsap.timeline({
      scrollTrigger: {
        trigger: "#impacto",
        start: "top top",
        end: "+=" + pinDistance,
        pin: true,
        scrub: true,
      },
    })
      .to(".impact__media", { scale: zoomTo, ease: "none", duration: 1 }, 0)
      .to(".impact__title-row", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "none" }, 0.05)
      .to(".impact__subtitle", { autoAlpha: 1, y: 0, duration: 0.5, ease: "none" }, 0.4);
  }

  /* ---------------------------------------------------------------
   * The hero burger: a single fixed element that travels, scales
   * and rotates continuously from the hero into the products
   * section, so the two sections read as one continuous scene
   * instead of independent, faded-in blocks.
   * ------------------------------------------------------------- */
  ScrollTrigger.matchMedia({
    "(min-width: 900px)": function () {
      gsap
        .timeline({
          scrollTrigger: { trigger: "#hero", start: "top top", end: "+=55%", scrub: true },
        })
        .to(".hero__bg", { opacity: 0.55, ease: "none" }, 0)
        .to([".hero__eyebrow", ".hero__title", ".hero__subtitle", ".hero__actions"], {
          y: -70,
          autoAlpha: 0,
          stagger: 0.06,
          ease: "none",
        }, 0);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            endTrigger: "#produtos",
            end: "top 55%",
            scrub: 0.4,
          },
        })
        .to("#heroBurger", { x: -30, y: -20, scale: 1.06, duration: 0.25, ease: "none" })
        .to("#heroBurger", { x: "-30vw", y: "-8vh", scale: 0.6, rotation: -18, duration: 0.4, ease: "none" })
        .to("#heroBurger", {
          x: "-36vw",
          y: "-32vh",
          scale: 0.26,
          rotation: -8,
          autoAlpha: 0,
          duration: 0.35,
          ease: "none",
        });

      impactScene(true);
    },

    "(max-width: 899px)": function () {
      gsap
        .timeline({
          scrollTrigger: { trigger: "#hero", start: "top top", end: "+=40%", scrub: true },
        })
        .to(".hero__bg", { opacity: 0.6, ease: "none" }, 0)
        .to([".hero__eyebrow", ".hero__title", ".hero__subtitle", ".hero__actions"], {
          y: -36,
          autoAlpha: 0,
          stagger: 0.05,
          ease: "none",
        }, 0);

      gsap
        .timeline({
          scrollTrigger: {
            trigger: "#hero",
            start: "top top",
            endTrigger: "#produtos",
            end: "top 75%",
            scrub: 0.4,
          },
        })
        .to("#heroBurger", { y: "-6vh", scale: 0.88, duration: 0.4, ease: "none" })
        .to("#heroBurger", { y: "-20vh", scale: 0.4, autoAlpha: 0, duration: 0.6, ease: "none" });

      impactScene(false);
    },
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
})();
