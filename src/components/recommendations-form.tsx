'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { z } from 'zod';
import {
  getPersonalizedGameRecommendations,
  type PersonalizedGameRecommendationsOutput,
} from '@/ai/flows/personalized-game-recommendations';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const FormSchema = z.object({
  purchaseHistory: z.string().min(1, 'Please list at least one game.'),
  playStyle: z.string().min(10, 'Please describe your play style in at least 10 characters.'),
});

type FormValues = z.infer<typeof FormSchema>;

export function RecommendationsForm() {
  const [recommendations, setRecommendations] = useState<PersonalizedGameRecommendationsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      purchaseHistory: '',
      playStyle: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);

    const input = {
      ...data,
      purchaseHistory: data.purchaseHistory.split(',').map((s) => s.trim()),
    };

    try {
      const result = await getPersonalizedGameRecommendations(input);
      setRecommendations(result);
    } catch (e) {
      setError('Sorry, we couldn\'t get recommendations at this time. Please try again later.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-12">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Wand2 className="text-accent" />
            Find Your Next Game
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="purchaseHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favorite Games</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., The Witcher 3, Stardew Valley, Hades"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      List some games you've enjoyed, separated by commas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="playStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Play Style</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., I love open-world RPGs with strong stories, but I also enjoy relaxing simulation games. I usually play for a few hours in the evenings."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what you look for in a game.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Get Recommendations'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <div className="space-y-6">
        {isLoading && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Our AI is analyzing your taste...</p>
          </div>
        )}
        {error && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-12 text-center h-full">
                <p className="text-destructive-foreground">{error}</p>
            </div>
        )}
        {recommendations ? (
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <Sparkles className="text-accent" />
                Recommended For You
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold">Games to Check Out:</h4>
                <ul className="list-disc list-inside text-muted-foreground">
                  {recommendations.recommendedGames.map((game, index) => (
                    <li key={index}>{game}</li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold">Reasoning:</h4>
                <p className="text-muted-foreground">{recommendations.reasoning}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
            !isLoading && !error && (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-12 text-center h-full">
                    <p className="text-muted-foreground">Your personalized game recommendations will appear here.</p>
                </div>
            )
        )}
      </div>
    </div>
  );
}
