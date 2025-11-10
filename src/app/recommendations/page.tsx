import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { RecommendationsForm } from "@/components/recommendations-form";

export default function RecommendationsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
          <div className="text-center">
            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl">
              AI Game Recommender
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
              Tell us what you like, and our AI will find your next obsession. The more details you provide, the better the recommendations.
            </p>
          </div>

          <div className="mt-8">
            <RecommendationsForm />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
