'use client';

import { Suspense } from 'react';
import { ArrowLeft, CheckCircle, UploadCloud, Tag, BookOpen, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function GitHubReleasesGuidePageContent() {

  const Step = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: React.ReactNode }) => (
    <div className="flex gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-secondary/30 py-16">
        <div className="container max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline text-3xl md:text-4xl flex items-center gap-3">
                        <Rocket className="h-8 w-8 text-accent"/>
                        Using GitHub Releases
                    </CardTitle>
                    <CardDescription>
                        Automate your game updates on Forge Gate Hub with GitHub Releases. It's the recommended, most professional way to distribute your game.
                    </CardDescription>
                     <Button asChild variant="link" className="p-0 -ml-1 self-start text-accent">
                        <Link href="/dev/submit">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Submission
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-8">
                    <div className="prose prose-invert max-w-none text-muted-foreground">
                        <p>
                            Instead of manually uploading your game to a file-hosting service and pasting the link, you can connect your GitHub repository. Our system will automatically find the download link from your latest release, ensuring your players always get the most up-to-date version of your game.
                        </p>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-6">
                        <Step
                            icon={<BookOpen />}
                            title="Step 1: Go to Your Repository's Releases Page"
                            description="Navigate to your game's repository on GitHub. On the right-hand sidebar, click on the 'Releases' link."
                        />
                         <Step
                            icon={<Tag />}
                            title="Step 2: Create a New Release"
                            description={<>Click on <strong>'Draft a new release'</strong>. You'll be taken to a page to create a new version tag (e.g., <code className="bg-muted text-muted-foreground p-1 rounded-sm">v1.0.1</code>) and a title for your release.</>}
                        />
                         <Step
                            icon={<UploadCloud />}
                            title="Step 3: Attach Your Game File"
                            description={<>This is the most important step. In the section labeled <strong>'Attach binaries by dropping them here or selecting them'</strong>, upload the <code className="bg-muted text-muted-foreground p-1 rounded-sm">.zip</code> file of your game.</>}
                        />
                         <Step
                            icon={<CheckCircle />}
                            title="Step 4: Publish and Copy URL"
                            description={<>Click <strong>'Publish release'</strong>. After that, simply copy your repository's main URL (e.g., <code className="bg-muted text-muted-foreground p-1 rounded-sm">https://github.com/your-name/your-repo</code>) and paste it into the 'GitHub Repository' field on our submission form.</>}
                        />
                    </div>
                    
                     <Separator />
                     
                     <div className="bg-background/50 border p-4 rounded-lg">
                        <h4 className="font-bold">That's It!</h4>
                        <p className="text-sm text-muted-foreground">We handle the rest. Every time you publish a new release on GitHub, we'll automatically point players to the new download link. No need to edit your game submission on our site!</p>
                     </div>

                </CardContent>
            </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function GitHubReleasesGuidePage() {
    return (
        <Suspense>
            <GitHubReleasesGuidePageContent />
        </Suspense>
    )
}
