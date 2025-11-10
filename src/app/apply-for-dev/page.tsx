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
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  developerName: z.string().min(2, "O nome do desenvolvedor/estúdio deve ter pelo menos 2 caracteres."),
  portfolio: z.string().url("Por favor, insira uma URL válida para o seu portfólio.").optional().or(z.literal('')),
  reason: z.string().min(30, "Por favor, explique com pelo menos 30 caracteres por que você quer ser um desenvolvedor."),
})

export default function ApplyForDevPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            developerName: "",
            portfolio: "",
            reason: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        console.log("Developer Application:", values);

        // Simulate API call
        setTimeout(() => {
            setIsSubmitting(false);
            toast({
                title: "Aplicação Enviada!",
                description: "Obrigado por se candidatar. Analisaremos sua aplicação em breve.",
            });
            form.reset();
        }, 2000);
    }

  return (
    <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
            <Card className="mx-auto max-w-2xl w-full">
                <CardHeader>
                    <CardTitle className="text-3xl font-headline text-center">Torne-se um Desenvolvedor</CardTitle>
                    <CardDescription className="text-center">
                    Preencha o formulário abaixo para se candidatar a publicar jogos na GameSphere.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="developerName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Desenvolvedor/Estúdio</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Awesome Game Studio" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="portfolio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Site/Portfólio (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://your.portfolio.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="reason"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Por que você quer publicar na GameSphere?</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Fale um pouco sobre você e os jogos que você quer criar..."
                                                className="min-h-[120px]"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Descreva sua experiência, seus projetos e seus objetivos.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />A enviar...</>
                                ) : (
                                    <><Send className="mr-2 h-4 w-4" />Enviar Aplicação</>
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
