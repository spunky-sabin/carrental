import Image from "next/image";

export default function ThemedSvgLogo() {
    return (
        <Image
            src="Logo.svg"
            alt="Company Logo"
            width={500}
            height={100}
            className="logo-path"
        />
    );
}