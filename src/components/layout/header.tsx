import Link from "next/link";
import { ThemeToggle } from "../theme/toggle";
import { Icon } from "../ui/icon";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 mt-4 flex w-full items-center justify-between px-4">
      <section>
        <Link href="/">
          <Icon className="size-8" icon="simple-icons:nextdotjs" />
        </Link>
      </section>
      <section>
        <ThemeToggle />
      </section>
    </header>
  );
};
