import { HeroSection } from "@/components/Home/HeroSection";
import { AudioWidget } from "@/components/Home/AudioWidget";
import { EmergencyCallButton } from "@/components/Home/EmergencyCallButton";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Fond visuel */}
      <div className="absolute inset-0 bg-black opacity-50 z-0"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-red-900/30 via-transparent to-transparent"></div>

      {/* Contenu de la page */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <AudioWidget />
        <HeroSection />
        <EmergencyCallButton />
      </div>
    </div>
  );
}