import { Capabilities } from "@/components/landing/Capabilities";
import { Closing } from "@/components/landing/Closing";
import { Hero } from "@/components/landing/Hero";
import { Manifesto } from "@/components/landing/Manifesto";
import { Marquee } from "@/components/landing/Marquee";
import { Metrics } from "@/components/landing/Metrics";
import { Nav } from "@/components/landing/Nav";
import { Pipeline } from "@/components/landing/Pipeline";
import { Security } from "@/components/landing/Security";
import { Cursor } from "@/components/site/Cursor";
import { Preloader } from "@/components/site/Preloader";
import { SmoothScroll } from "@/components/site/SmoothScroll";

export default function Landing() {
  return (
    <SmoothScroll>
      <Preloader />
      <Cursor />
      <Nav />
      <main className="bg-void text-ivory">
        <Hero />
        <Marquee />
        <Manifesto />
        <Pipeline />
        <Capabilities />
        <Security />
        <Metrics />
        <Closing />
      </main>
    </SmoothScroll>
  );
}
