import Sandbox from "@/components/Sandbox";
import { LaptopMinimalIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="h-full">
      <div className="h-full flex items-center justify-center px-8 md:hidden">
        <div className="text-center">
          <LaptopMinimalIcon className="size-16 mx-auto mb-4 text-gray-400" />
          <h1 className="text-xl font-bold mb-4">Desktop Only</h1>
          <p className="text-gray-400">
            This application is not available on mobile devices. Please use a
            desktop browser with a larger screen.
          </p>
        </div>
      </div>
      <div className="hidden md:block h-full">
        <Sandbox />
      </div>
    </div>
  );
}
