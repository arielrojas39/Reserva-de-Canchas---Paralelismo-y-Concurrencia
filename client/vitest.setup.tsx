import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { vi } from "vitest";
import type React from "react";

// Sin globals de Vitest, RTL registra su propia limpieza entre tests.
afterEach(() => {
  cleanup();
});

// --- Mocks globales de Next y sonner para jsdom ---------------------------

// next/link: renderiza un <a> nativo (no hay router en jsdom).
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: React.ComponentProps<"a"> & { href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// next/navigation: hooks controlables por cada test.
const routerMock = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  usePathname: () => "/",
}));

// sonner: los toasts no existen en jsdom; se mockean para poder assertear.
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
  Toaster: () => null,
}));

// Exponer el router mock para que los tests puedan inspeccionarlo.
(globalThis as Record<string, unknown>).__routerMock = routerMock;

// --- Stubs de APIs que jsdom no implementa -------------------------------

// matchMedia para los media queries del design system.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// scrollIntoView (lo usan CourtCard y el catálogo).
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
