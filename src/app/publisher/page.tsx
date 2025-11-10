import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Rocket } from "lucide-react";

export default function PublisherPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30">
        <div className="container py-12 text-center">
          <Rocket className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="font-headline text-4xl lg:text-5xl font-bold tracking-tight">
            Become a Publisher
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Join our community of creators and share your vision with the world.
            This page is under construction.
          </p>
          <Button asChild className="mt-8">
            <Link href="/">Back to Store</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
