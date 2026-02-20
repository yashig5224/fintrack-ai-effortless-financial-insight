import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import AIDemoSection from "@/components/landing/AIDemoSection";
import AbilitiesSection from "@/components/landing/AbilitiesSection";
import FloatingTiles from "@/components/landing/FloatingTiles";
import ProblemSolution from "@/components/landing/ProblemSolution";
import DashboardPreview from "@/components/landing/DashboardPreview";
import CTASection from "@/components/landing/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <HeroSection />
      <AIDemoSection />
      <AbilitiesSection />
      <FloatingTiles />
      <ProblemSolution />
      <DashboardPreview />
      <CTASection />
    </div>
  );
};

export default Index;
