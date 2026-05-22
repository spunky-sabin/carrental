import Link from "next/link";
import Image from "next/image";

type ThemedLogoProps = {
  variant?: "light" | "dark";
};

export default function ThemedLogo({ variant = "dark" }: ThemedLogoProps) {
  const src = variant === "light" ? "/logo-dark.svg" : "/Logo.svg";

  return (
    <Link
      href="/"
      aria-label="Qent home"
      style={{ display: "inline-flex", alignItems: "center", lineHeight: 0 }}
    >
      <Image src={src} alt="Qent" width={124} height={38} priority />
    </Link>
  );
}
