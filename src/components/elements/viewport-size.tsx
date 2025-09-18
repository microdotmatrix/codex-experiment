import { cn } from "@/lib/utils";

export function ViewportSize({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div
      className={cn(
        "fixed bottom-16 z-50 flex size-9 items-center justify-center rounded-full border border-border/50 bg-black p-3 font-bold font-code text-[11px] text-gray-300 uppercase outline outline-1 outline-border transition-colors duration-200 hover:text-gray-100 hover:outline-primary/50",
        align === "left" ? "left-5" : "right-5"
      )}
      data-viewport-size=""
    >
      <div className="block sm:hidden">xs</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="3xl:hidden hidden 2xl:block">2xl</div>
      <div className="3xl:block 4xl:hidden hidden">3xl</div>
      <div className="4xl:block hidden">4xl</div>
    </div>
  );
}
