import { ViewportSize } from "./elements/viewport-size";
import { ThemeProvider } from "./theme/provider";
import { Toaster } from "./ui/sonner";

export const AppContext = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster closeButton position="bottom-right" />
      <ViewportSize />
    </ThemeProvider>
  );
};
