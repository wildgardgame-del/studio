'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  title: z.string().min(2, "O título do jogo deve ter pelo menos 2 caracteres."),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  description: z.string().min(10, "A descrição curta deve ter pelo menos 10 caracteres."),
  longDescription: z.string().min(30, "A descrição longa deve ter pelo menos 30 caracteres."),
  genres: z.string().min(3, "Introduza pelo menos um género."),
  coverImage: z.string().url("Introduza um URL de imagem válido."),
  screenshots: z.string().min(10, "Introduza pelo menos um URL de captura de ecrã, separado por vírgulas se houver mais do que um."),
});


export default function SubmitGamePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, firestore } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            price: 0,
            description: "",
            longDescription: "",
            genres: "",
            coverImage: "",
            screenshots: "",
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

        setIsSubmitting(true);
        
        const gamesRef = collection(firestore, `games`);
        
        const newGameData = {
            ...values,
            genres: values.genres.split(',').map(g => g.trim()),
            screenshots: values.screenshots.split(',').map(ss => ss.trim()),
            developerId: user.uid,
            status: 'pending',
            submittedAt: serverTimestamp(),
            rating: 0, // Initial rating
            reviews: [], // Initial empty reviews
        }

        addDoc(gamesRef, newGameData)
          .then((docRef) => {
              toast({
                  title: "Jogo Submetido!",
                  description: "Obrigado por submeter o seu jogo. Ele será revisto em breve.",
              });
              router.push('/dev/dashboard');
          })
          .catch((error) => {
              const permissionError = new FirestorePermissionError({
                  path: gamesRef.path,
                  operation: 'create',
                  requestResourceData: newGameData,
              });
              errorEmitter.emit('permission-error', permissionError);
          })
          .finally(() => {
              setIsSubmitting(false);
          });
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

                                <FormField control={form.control} name="price" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preço (USD)</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="description" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição Curta</FormLabel>
                                        <FormControl><Textarea placeholder="Uma breve sinopse para o cartão do jogo." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="longDescription" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição Completa</FormLabel>
                                        <FormControl><Textarea rows={5} placeholder="Descreva o seu jogo em detalhe para a página da loja." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="genres" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Géneros</FormLabel>
                                        <FormControl><Input placeholder="Ação, RPG, Estratégia" {...field} /></FormControl>
                                        <FormDescription>Separe os vários géneros por vírgulas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                
                                <FormField control={form.control} name="coverImage" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL da Imagem de Capa</FormLabel>
                                        <FormControl><Input placeholder="https://exemplo.com/capa.jpg" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <FormField control={form.control} name="screenshots" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URLs das Capturas de Ecrã</FormLabel>
                                        <FormControl><Textarea placeholder="https://exemplo.com/ss1.jpg, https://exemplo.com/ss2.jpg" {...field} /></FormControl>
                                         <FormDescription>Separe os vários URLs por vírgulas.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            A Submeter...
                                        </>
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
