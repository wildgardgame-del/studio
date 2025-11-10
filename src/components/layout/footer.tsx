import { Icons } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-t from-background to-secondary">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.Logo className="h-6 w-6 text-accent" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by your friendly neighborhood AI.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Forge Gate Hub Inc.
        </p>
      </div>
    </footer>
  );
}
