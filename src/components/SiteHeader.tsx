import { ModeToggle } from "./mode-toggle"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-lg font-bold">
          <img
            src="/logo-small.png"
            alt="Logo"
            className="h-8 w-8 rounded-sm object-cover"
          />
          <span>X Downloader</span>
        </div>
        <nav className="flex items-center gap-2">
          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}
