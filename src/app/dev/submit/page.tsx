
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useRole } from "@/hooks/useRole";
import { useGameStore } from "@/context/game-store-context";

const formSchema = z.object({
  title: z.string().min(2, "O título do jogo deve ter pelo menos 2 caracteres."),
  description: z.string().min(30, "A descrição curta deve ter pelo menos 30 caracteres."),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  genre: z.string().min(2, "Por favor, insira pelo menos um género."),
  imageUrl: z.string().url("Por favor, insira uma URL válida para a imagem de capa."),
})

export default function SubmitGamePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user, firestore } = useFirebase();
    const { role, isLoading: isRoleLoading } = useRole();
    const { isPurchased } = useGameStore();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            genre: "",
            imageUrl: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Não autenticado',
                description: 'Você precisa fazer login para submeter um jogo.',
            });
            return router.push('/login');
        }

        const hasDevAccess = role === 'dev' || role === 'admin' || isPurchased('dev-account-upgrade');

        if (!hasDevAccess) {
             toast({
                variant: 'destructive',
                title: 'Não autorizado',
                description: 'Você não tem permissão para submeter jogos.',
            });
            return;
        }

        setIsSubmitting(true);
        const gamesRef = collection(firestore, 'games');
        const newGameData = {
            ...values,
            developerId: user.uid,
            status: 'pending',
            // Mocking some data that is not in the form yet
            longDescription: values.description,
            screenshots: [values.imageUrl],
            rating: 0,
            reviews: [],
        }

        addDoc(gamesRef, newGameData)
          .then(() => {
              toast({
                  title: "Jogo Submetido!",
                  description: "Obrigado por submeter o seu jogo. Ele será revisto em breve.",
              });
              router.push('/dev/dashboard');
          })
          .catch((error) => {
              console.error("Error submitting game:", error); // Keep console for generic errors
              const permissionError = new FirestorePermissionError({
                  path: gamesRef.path,
                  operation: 'create',
                  requestResourceData: newGameData,
              });
              errorEmitter.emit('permission-error', permissionError);
              toast({
                  variant: 'destructive',
                  title: 'Erro de Permissão',
                  description: 'Não foi possível submeter o jogo. Verifique as permissões.',
              });
          })
          .finally(() => {
              setIsSubmitting(false);
          });
    }

    if (isRoleLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center py-12">
                <Card className="mx-auto max-w-2xl w-full">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline text-center">Submeter um Novo Jogo</CardTitle>
                        <CardDescription className="text-center">
                            Preencha os detalhes abaixo para adicionar o seu jogo à GameSphere.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título do Jogo</FormLabel>
                                        <FormControl><Input placeholder="Meu Jogo Incrível" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição Curta</FormLabel>
                                        <FormControl><Textarea placeholder="Uma breve e cativante descrição do seu jogo." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="price" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Preço (USD)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="genre" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Género(s)</FormLabel>
                                            <FormControl><Input placeholder="Ação, RPG, Indie" {...field} /></FormControl>
                                            <FormDescription className="text-xs">Separados por vírgula.</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                </div>
                                <FormField control={form.control} name="imageUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL da Imagem de Capa</FormLabel>
                                        <FormControl><Input placeholder="https://exemplo.com/imagem.png" {...field} /></FormControl>
                                        <FormDescription className="text-xs">Use um serviço como Imgur para alojar a sua imagem.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A Submeter...</>
                                    ) : (
                                        <><Send className="mr-2 h-4 w-4" />Submeter Jogo para Revisão</>
                                    )}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    )
}
