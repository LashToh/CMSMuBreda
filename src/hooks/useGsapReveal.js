import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGsapReveal(ref, options = {}) {
  const {
    y = 60,
    duration = 1,
    delay = 0,
    start = 'top 85%',
    stagger = 0,
    children = false,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = children ? el.children : el;

    gsap.fromTo(
      targets,
      { opacity: 0, y },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === el) st.kill();
      });
    };
  }, [ref, y, duration, delay, start, stagger, children]);
}

export function useGsapHero(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(
      el.querySelector('.hero__brand'),
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9 },
      0.2
    )
      .fromTo(
        el.querySelector('.hero__beta'),
        { opacity: 0, y: 24, scale: 0.92 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7 },
        0.45
      )
      .fromTo(
        el.querySelectorAll('.hero__title-line'),
        { opacity: 0, y: 60 },
        { opacity: 1, y: 0, duration: 0.9, stagger: 0.12 },
        0.55
      )
      .fromTo(
        el.querySelector('.hero__subtitle'),
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.8 },
        1
      )
      .fromTo(
        el.querySelector('.hero__actions'),
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8 },
        1.2
      );

    return () => tl.kill();
  }, [ref]);
}
