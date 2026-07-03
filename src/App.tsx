import { lazy, Suspense, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { scrollState, setLenis, prefersReducedMotion } from "./lib/motion";
import Preloader from "./components/Preloader";
import CustomCursor from "./components/CustomCursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Projects from "./components/Projects";
import Experience from "./components/Experience";
import Contact from "./components/Contact";
import Footer from "./components/Footer";

const HeroScene = lazy(() => import("./components/three/HeroScene"));

gsap.registerPlugin(ScrollTrigger);

function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const reduced = prefersReducedMotion();

    // Smooth scrolling (Lenis) driven by GSAP's ticker, wired to ScrollTrigger
    let lenis: Lenis | undefined;
    if (!reduced) {
      lenis = new Lenis({ lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis!.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      setLenis(lenis);
    }

    // Whole-page scroll progress feeds the persistent 3D scene
    const trigger = ScrollTrigger.create({
      start: 0,
      end: () => document.documentElement.scrollHeight - window.innerHeight,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
      },
    });

    return () => {
      trigger.kill();
      lenis?.destroy();
      setLenis(null);
    };
  }, []);

  return (
    <div className="grain relative min-h-screen bg-ink">
      <Preloader onDone={() => setLoaded(true)} />
      <CustomCursor />

      {/* Floating gradient auroras — ambient depth without hurting readability */}
      <div className="aurora" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {/* Persistent 3D scene behind every section */}
      {loaded && (
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      )}

      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <About />
          <Skills />
          <Projects />
          <Experience />
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default App;
