import { Icons } from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="container flex flex-col items-center justify-between gap-2 py-3 md:h-16 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-2 px-8 md:flex-row md:gap-2 md:px-0">
          <Icons.Logo className="h-5 w-5 text-accent" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Forge Gate Hub Inc. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
