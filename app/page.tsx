import DesktopLogin from "@/components/DesktopLogin";
import MobileLogin from "@/components/MobileLogin";

export default function Home() {
  return (
    <main>
      <div className="hidden lg:block">
        <DesktopLogin />
      </div>
      <div className="lg:hidden">
        <MobileLogin />
      </div>
    </main>
  );
}
