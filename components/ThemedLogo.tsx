import Image from "next/image";

export default function ThemedSvgLogo() {
    return (
        <Image
            src="/logo.svg"
            alt="Company Logo"
            width={150}
            height={50}
            className="dark:invert"
        />
    );
}