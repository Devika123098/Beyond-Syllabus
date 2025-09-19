"use client";

import Link from "next/link";
import { Github, GraduationCap } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Ensure the theme value is available after hydration
    setMounted(true);
  }, []);

  // Decide background style based on theme
  const bgStyle = mounted
    ? resolvedTheme === "dark"
      ? "bg-black"
      : "bg-white"
    : "";

  return (
    <footer
      className={`relative w-full shrink-0  bg-transparent ${bgStyle} bg-no-repeat bg-cover`}
    >
      {/* Optional overlay for better text visibility */}
      <div className="absolute inset-0 "/>

      {/* Footer Content */}
      <div className="container relative z-10 mx-auto px-4 md:px-6 py-8">
        {/* Mobile Layout */}
        <div className="flex md:hidden flex-col gap-2 mb-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="font-semibold">BeyondSyllabus</span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Your AI-powered guide to the university curriculum.
          </p>
          <a
            href="https://github.com/The-Purple-Movement/WikiSyllabus"
            target="_blank"
            className="w-fit p-2 rounded-full flex  bg-black/20 hover:shadow-lg "
          >
            <Github />
          </a>
        </div>

        {/* Desktop Layout */}
        <div className="flex">
          <div className="md:flex md:visible hidden flex-col gap-2 mb-5">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg"
            >
              <span className="font-semibold">BeyondSyllabus</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your AI-powered guide to the university curriculum.
            </p>
            <a
              href="https://github.com/The-Purple-Movement/WikiSyllabus"
              target="_blank"
              className="w-fit rounded-full flex p-3 bg-black/20 hover:shadow-lg"
            >
              <Github />
            </a>
          </div>

          <div className="flex gap-5 flex-row w-full md:justify-evenly">
            <div>
              <h3 className="text-sm font-semibold mb-3">Navigation</h3>
              <nav className="flex flex-col gap-2">
                <FooterLink href="/">Home</FooterLink>
                <FooterLink href="/select">Select Course</FooterLink>
                <FooterLink href="/chat-with-file">AI Chat</FooterLink>
              </nav>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Resources</h3>
              <nav className="flex flex-col gap-2">
                <FooterLink href="https://github.com/The-Purple-Movement/Beyond-Syllabus">Contribution Guide</FooterLink>
                <FooterLink href="https://github.com/The-Purple-Movement/Beyond-Syllabus">Code of Conduct</FooterLink>
                <FooterLink href="https://github.com/The-Purple-Movement/Beyond-Syllabus">License</FooterLink>
              </nav>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <nav className="flex flex-col gap-2">
                <FooterLink href="https://github.com/The-Purple-Movement/Beyond-Syllabus">Terms of Service</FooterLink>
                <FooterLink href="https://github.com/The-Purple-Movement/Beyond-Syllabus">Privacy Policy</FooterLink>
              </nav>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground">
          <p>
            {new Date().getFullYear()} BeyondSyllabus. All rights reserved. An
            open-source project.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-muted-foreground hover:text-primary transition-colors"
      prefetch={false}
    >
      {children}
    </Link>
  );
}
