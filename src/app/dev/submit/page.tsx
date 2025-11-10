
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react";
import { Loader2, Send } from "lucide-react";

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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  title: z.string().min(2, "O título do jogo deve ter pelo menos 2 caracteres."),
  description: z.string().min(30, "A descrição curta deve ter pelo menos 30 caracteres."),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  genre: z.string().min(2, "Por favor, insira pelo menos um género."),
  imageUrl: z.string().url("Por favor, insira uma URL válida para a imagem de capa."),
  longDescription: z.string().optional(),
  trailerUrl: z.string().url().optional(),
  screenshots: z.string().url().optional(),
})

export default function SubmitGamePage() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            price: 0,
            genre: "",
            imageUrl: "",
            longDescription: "",
            trailerUrl: "",
            screenshots: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        // Ação simplificada: apenas atualiza o estado para indicar que foi submetido.
        console.log("Form values:", values);
        setIsSubmitted(true);
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
                                 <FormField control={form.control} name="longDescription" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descrição Longa</FormLabel>
                                        <FormControl><Textarea placeholder="Descreva em detalhe o seu jogo, a sua história, mecânicas, etc." {...field} rows={6} /></FormControl>
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
                                <FormField control={form.control} name="screenshots" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URLs de Screenshots</FormLabel>
                                        <FormControl><Textarea placeholder="https://exemplo.com/ss1.png, https://exemplo.com/ss2.png" {...field} /></FormControl>
                                        <FormDescription className="text-xs">URLs separadas por vírgula.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                 <FormField control={form.control} name="trailerUrl" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>URL do Trailer (YouTube, etc.)</FormLabel>
                                        <FormControl><Input placeholder="https://youtube.com/watch?v=..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <Button type="submit" className="w-full" disabled={isSubmitted}>
                                    {isSubmitted ? (
                                        "Submetido"
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
