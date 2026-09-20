import Link from "next/link";

// NOTE: This was originally animated with framer-motion's initial-opacity-0
// + animate-to-1 pattern. In practice that left the whole hero permanently
// invisible for some users — if client JS hydration is even slightly
// delayed or interrupted, an element that starts at opacity:0 and depends
// on React running to reach opacity:1 can get stuck invisible forever.
// Real content should never be hidden behind a JS-dependent animation.
// This uses the pure-CSS `animate-fade-up` keyframe (globals.css) instead:
// it runs the moment the browser paints the element, needs no JS at all,
// and its `forwards` fill-mode guarantees it ends at opacity:1 and stays
// there — so the hero is visible immediately even before hydration, and
// still gets the same subtle entrance motion.
//
// The background is a CSS gradient rather than a hotlinked photo — the
// original build referenced Unsplash photo IDs that were never actually
// verified as live (the build sandbox couldn't reach images.unsplash.com
// to check), and one of them was dead. A gradient can't 404.
export function HeroSection() {
  return (
    <section
      className="relative flex min-h-[82vh] items-center overflow-hidden bg-charcoal text-ivory"
      style={{
        backgroundImage:
          "radial-gradient(circle at 78% 20%, rgba(224,185,120,.35), transparent 20%), radial-gradient(ellipse at 15% 85%, #8D3040 0%, transparent 48%), linear-gradient(120deg, #171717 0%, #163D35 100%)",
      }}
    >
      <div className="absolute right-[12%] top-[18%] h-32 w-32 animate-float rounded-full border border-gold/30" />
      <div className="absolute -bottom-24 right-[8%] h-80 w-80 rounded-full border border-ivory/10" />
      <div className="container-luxe relative z-10">
        <p className="eyebrow animate-fade-up text-gold-soft">
          Where Heritage Meets Modern Elegance
        </p>
        <h1
          className="animate-fade-up mt-4 max-w-3xl font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl"
          style={{ animationDelay: "0.1s" }}
        >
          Heritage, cut for the present.
        </h1>
        <p
          className="animate-fade-up mt-5 max-w-md text-sm text-ivory/75 sm:text-base"
          style={{ animationDelay: "0.2s" }}
        >
          Hand-embroidered kurtas, Pashmina shawls and festive suits, crafted
          with heritage technique, styled for modern life.
        </p>
        <div
          className="animate-fade-up mt-8 flex flex-wrap gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <Link href="/shop?gender=WOMEN" className="luxe-button bg-ivory text-charcoal hover:bg-gold-soft">
            Shop Women
          </Link>
          <Link href="/shop?gender=MEN" className="rounded-full border border-ivory/40 px-6 py-3 text-sm text-ivory transition duration-300 hover:-translate-y-0.5 hover:border-ivory hover:bg-ivory/10">
            Shop Men
          </Link>
          <Link href="/shop?collection=Kashmiri" className="rounded-full border border-ivory/40 px-6 py-3 text-sm text-ivory transition duration-300 hover:-translate-y-0.5 hover:border-ivory hover:bg-ivory/10">
            Explore Kashmiri Collection
          </Link>
        </div>
      </div>
    </section>
  );
}
