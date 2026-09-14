(function () {
  "use strict";

  if (!window.gsap || !window.ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------
   * Navbar: solid/blurred background once the user leaves the hero.
   * onEnter/onLeaveBack (not toggleClass) so it stays solid for the
   * rest of the page instead of switching off again at the very
   * bottom, where a start/end range would otherwise go inactive.
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

  /* ---------------------------------------------------------------
   * Hero entrance — plays once on load, independent of scroll.
   * ------------------------------------------------------------- */
  gsap.timeline({ delay: 0.15, defaults: { ease: "power3.out" } })
    .to("#navbar", { autoAlpha: 1, y: 0, duration: 0.7 }, 0)
    .to(".hero__eyebrow", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.1)
    .to(".hero__title-row", { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power4.out" }, 0.2)
    .to(".hero__subtitle", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.6)
    .to(".hero__actions", { autoAlpha: 1, y: 0, duration: 0.6 }, 0.72);

  /* ---------------------------------------------------------------
   * Menu cards: image first, then name/description/price. Each card
   * gets its own trigger, so the reveal cascades as the grid scrolls
   * into view.
   * ------------------------------------------------------------- */
  gsap.utils.toArray(".menu-card").forEach(function (card, i) {
    var image = card.querySelector(".menu-card__image");
    var texts = card.querySelectorAll(".menu-card__text > *");
    var meta = card.querySelector(".menu-card__meta");

    gsap.timeline({ scrollTrigger: { trigger: card, start: "top 88%" } })
      .to(image, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "power3.out", delay: (i % 2) * 0.08 })
      .to(texts, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power3.out" }, 0.15)
      .to(meta, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power3.out" }, 0.3);
  });

  /* ---------------------------------------------------------------
   * Final CTA: calmer, single reveal — no scrub, no parallax.
   * ------------------------------------------------------------- */
  gsap.timeline({ scrollTrigger: { trigger: "#cta", start: "top 80%" } })
    .to([".cta__title", ".cta .button", ".cta__note"], {
      autoAlpha: 1,
      y: 0,
      duration: 0.7,
      stagger: 0.12,
      ease: "power2.out",
    });

  /* ---------------------------------------------------------------
   * Impact section: pin + soft scroll-zoom on the photo, title and
   * subtitle rise into place. Shared between breakpoints; only the
   * pin distance and zoom amount change.
   * ------------------------------------------------------------- */
  function impactScene(isDesktop) {
    var zoomTo = isDesktop ? 1.18 : 1.12;
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
      .to(".impact__photo", { scale: zoomTo, ease: "none", duration: 1 }, 0)
      .to(".impact__title-row", { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12, ease: "none" }, 0.05)
      .to(".impact__subtitle", { autoAlpha: 1, y: 0, duration: 0.5, ease: "none" }, 0.4);
  }

  /* ---------------------------------------------------------------
   * Hero exit: the background photo pushes in slightly (a soft
   * camera-zoom), the scrim darkens further for legibility, and the
   * headline/copy lift and fade as the menu scrolls into place — a
   * continuous scrub instead of a hard cut between sections.
   * ------------------------------------------------------------- */
  ScrollTrigger.matchMedia({
    "(min-width: 800px)": function () {
      gsap
        .timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "+=70%", scrub: true } })
        .to(".hero__photo", { scale: 1.24, ease: "none", duration: 1 }, 0)
        .to([".hero__eyebrow", ".hero__title", ".hero__subtitle", ".hero__actions"], {
          y: -80,
          autoAlpha: 0,
          stagger: 0.06,
          ease: "none",
          duration: 0.8,
        }, 0)
        .to(".hero__note", { autoAlpha: 0, ease: "none", duration: 0.5 }, 0);

      impactScene(true);
    },

    "(max-width: 799px)": function () {
      gsap
        .timeline({ scrollTrigger: { trigger: "#hero", start: "top top", end: "+=50%", scrub: true } })
        .to(".hero__photo", { scale: 1.2, ease: "none", duration: 1 }, 0)
        .to([".hero__eyebrow", ".hero__title", ".hero__subtitle", ".hero__actions"], {
          y: -40,
          autoAlpha: 0,
          stagger: 0.05,
          ease: "none",
          duration: 0.8,
        }, 0);

      impactScene(false);
    },
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      ScrollTrigger.refresh();
    });
  }
})();
