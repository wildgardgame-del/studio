'use client';

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Footer from "@/components/layout/footer";
import Header from "@/components/layout/header";
import { useGameStore } from "@/context/game-store-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter, FirestorePermissionError } from "@/firebase";
import type { Game } from "@/lib/types";

const formSchema = z.object({
  email: z.string().email("Por favor, insira um endereço de e-mail válido."),
})

export default function CheckoutPage() {
    const { cartItems, clearCart } = useGameStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    const { user, firestore } = useFirebase();

    const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: user?.email || "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!user || !firestore) {
            toast({
                variant: "destructive",
                title: "Você não está logado",
                description: "Por favor, faça login para completar a compra.",
            });
            router.push('/login');
            return;
        }

        setIsProcessing(true);
        console.log("Processing fake payment for:", values);
        
        // Simulate payment processing
        setTimeout(async () => {
            const containsDevLicense = cartItems.some(item => item.id === 'dev-account-upgrade');
            const batch = writeBatch(firestore);

            // Add all purchased items to the user's library
            cartItems.forEach(item => {
                const libraryRef = doc(firestore, `users/${user.uid}/library`, item.id);
                batch.set(libraryRef, item);
            });

            // If the dev license is being purchased, also update the user's role
            if (containsDevLicense) {
                const userRef = doc(firestore, `users/${user.uid}`);
                batch.update(userRef, { role: 'dev' });
            }
            
            try {
                await batch.commit();

                clearCart();
                setIsProcessing(false);

                if (containsDevLicense) {
                    toast({
                        title: "Licença Ativada!",
                        description: "Parabéns! Sua conta foi atualizada para Desenvolvedor.",
                    });
                    // Wait for role propagation before redirecting
                    setTimeout(() => router.push('/dev/dashboard'), 1000); 
                } else {
                    toast({
                        title: "Pagamento bem-sucedido!",
                        description: "Seus jogos já estão disponíveis na sua biblioteca.",
                    });
                    router.push('/library');
                }

            } catch (error) {
                console.error("Error committing purchase to Firestore:", error);
                 errorEmitter.emit('permission-error', new FirestorePermissionError({
                    path: `users/${user.uid}`,
                    operation: 'write',
                    requestResourceData: { cart: cartItems }
                }));
                 toast({
                    variant: "destructive",
                    title: "Erro na Compra",
                    description: "Não foi possível guardar a sua compra. Verifique as suas permissões e tente novamente.",
                });
                setIsProcessing(false);
            }
        }, 2000);
    }
    
    if (cartItems.length === 0 && !isProcessing) {
        return (
            <div className="flex min-h-screen flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="font-headline text-2xl font-bold">Seu carrinho está vazio</h1>
                        <p className="text-muted-foreground mt-2">Adicione alguns jogos antes de finalizar a compra.</p>
                    </div>
                </main>
                <Footer />
            </div>
        )
    }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container py-12">
            <h1 className="font-headline text-4xl font-bold tracking-tighter md:text-5xl text-center">Checkout</h1>
            <div className="mt-8 grid md:grid-cols-2 gap-12">
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Confirmar Compra</CardTitle>
                            <CardDescription>Insira seu e-mail para receber a confirmação do pedido.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="email" render={({ field }) => (
                                        <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input placeholder="voce@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    
                                    <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" size="lg" disabled={isProcessing}>
                                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isProcessing ? 'Processando...' : `Pagar $${total.toFixed(2)}`}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
                <div>
                    <Card className="bg-secondary/50">
                        <CardHeader>
                            <CardTitle>Resumo do Pedido</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {cartItems.map(item => (
                                    <div key={item.id} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Image src={item.coverImage} alt={item.title} width={45} height={60} className="rounded-sm object-cover aspect-[3/4]" />
                                            <span className="truncate font-semibold">{item.title}</span>
                                        </div>
                                        <span>${item.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-2 text-muted-foreground">
                                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Impostos</span><span>${tax.toFixed(2)}</span></div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
