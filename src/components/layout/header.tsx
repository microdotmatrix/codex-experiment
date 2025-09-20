import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { ThemeToggle } from "../theme/toggle";
import { Icon } from "../ui/icon";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 mt-4 flex w-full items-center justify-between px-4">
      <section>
        <Link href="/">
          <Icon className="size-8" icon="simple-icons:nextdotjs" />
        </Link>
      </section>
      <section className="flex items-center gap-2">
        <SignedOut>
          <div className="flex items-center gap-2">
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </div>
        </SignedOut>
        <SignedIn>
          <nav className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className={cn(buttonVariants({ variant: "ghost" }), "h-9 px-3 text-sm")}
            >
              Documents
            </Link>
            <Link
              href="/dashboard/entries"
              className={cn(buttonVariants({ variant: "outline" }), "h-9 px-3 text-sm")}
            >
              Entries
            </Link>
            <UserButton afterSignOutUrl="/" />
          </nav>
        </SignedIn>
        <ThemeToggle />
      </section>
    </header>
  );
};
