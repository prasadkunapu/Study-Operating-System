import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-strong max-w-sm rounded-3xl p-8 text-center">
        <h1 className="text-6xl font-bold text-gradient">404</h1>
        <h2 className="mt-3 text-lg font-semibold">Lost in the void</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn't exist. Let's get you home.
        </p>
        <Link to="/" className="mt-5 inline-flex rounded-2xl px-5 py-2.5 text-sm font-medium text-primary-foreground glow-primary"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="glass-strong max-w-sm rounded-3xl p-8 text-center">
        <h1 className="text-lg font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">A hiccup on our end. Try again.</p>
        <div className="mt-5 flex justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }}
            className="rounded-2xl px-4 py-2 text-sm font-medium text-primary-foreground glow-primary"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            Try again
          </button>
          <a href="/" className="glass rounded-2xl px-4 py-2 text-sm font-medium">Home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#141426" },
      { title: "Study OS — Personal Study Operating System" },
      { name: "description", content: "A luxurious, mobile-first Personal Study OS for elite engineers. Plan, focus, and master every topic." },
      { property: "og:title", content: "Study OS — Personal Study Operating System" },
      { property: "og:description", content: "A luxurious, mobile-first Personal Study OS for elite engineers. Plan, focus, and master every topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Study OS — Personal Study Operating System" },
      { name: "twitter:description", content: "A luxurious, mobile-first Personal Study OS for elite engineers. Plan, focus, and master every topic." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/58c5ddd0-ec24-441f-af3e-2a48ab407a32/id-preview-5d8c7395--bd76bfd9-4a7d-4e0d-8d6c-cbf0328acce4.lovable.app-1784271233962.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/58c5ddd0-ec24-441f-af3e-2a48ab407a32/id-preview-5d8c7395--bd76bfd9-4a7d-4e0d-8d6c-cbf0328acce4.lovable.app-1784271233962.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {/* MusicPlayer lives at root so audio never unmounts across route changes */}
      <MusicPlayerMount />
    </QueryClientProvider>
  );
}

// Lazy import so route-splitters don't touch supabase during initial SSR pass.
import { MusicPlayer } from "../components/MusicPlayer";
import { runOneTimeReset } from "../lib/reset-once";
function MusicPlayerMount() {
  useEffect(() => { runOneTimeReset(); }, []);
  return <MusicPlayer />;
}

