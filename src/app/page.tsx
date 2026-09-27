import { Hero, Nav } from "@/components/landing/Hero";
import { Pipeline } from "@/components/landing/Pipeline";
import { Capabilities, FinalCTA, Footer, Metrics, Security } from "@/components/landing/Sections";

export default function Landing() {
  return (
    <main>
      <Nav />
      <Hero />
      <Pipeline />
      <Capabilities />
      <Security />
      <Metrics />
      <FinalCTA />
      <Footer />
    </main>
  );
}
