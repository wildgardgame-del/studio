'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { useState } from "react";
import { Send, Loader2, Upload } from "lucide-react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const formSchema = z.object({
  title: z.string().min(2, "O título do jogo deve ter pelo menos 2 caracteres."),
  price: z.coerce.number().min(0, "O preço não pode ser negativo."),
  description: z.string().min(10, "A descrição curta deve ter pelo menos 10 caracteres."),
  longDescription: z.string().min(30, "A descrição longa deve ter pelo menos 30 caracteres."),
  genres: z.string().min(3, "Introduza pelo menos um género."),
  coverImage: z
    .any()
    .refine((files) => files?.length == 1, "A imagem de capa é obrigatória.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `O tamanho máximo do ficheiro é 5MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Apenas os formatos .jpg, .jpeg, .png e .webp são suportados."
    ),
  screenshots: z
    .any()
    .refine((files) => files?.length > 0, "É necessária pelo menos uma captura de ecrã.")
    .refine((files) => Array.from(files).every((file: any) => file.size <= MAX_FILE_SIZE), `O tamanho máximo de cada ficheiro é 5MB.`)
    .refine(
      (files) => Array.from(files).every((file: any) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      "Apenas os formatos .jpg, .jpeg, .png e .webp são suportados."
    ),
});


export default function SubmitGamePage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user, firestore, storage } = useFirebase();
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
            coverImage: undefined,
            screenshots: undefined,
        },
    });

    const uploadFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!storage) {
                return reject(new Error("Firebase Storage not initialized"));
            }
            const path = `games/${uuidv4()}-${file.name}`;
            const storageRef = ref(storage, path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    // Optional: handle progress updates
                },
                (error) => {
                    console.error("Upload error:", error);
                    reject(error);
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
                }
            );
        });
    };

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
        
        try {
            // 1. Prepare all file upload promises
            const coverImageFile = values.coverImage[0];
            const screenshotFiles = Array.from(values.screenshots as FileList);

            const allUploadPromises = [
                uploadFile(coverImageFile),
                ...screenshotFiles.map(file => uploadFile(file))
            ];

            // 2. Execute all uploads in parallel
            const uploadedUrls = await Promise.all(allUploadPromises);
            
            const coverImageUrl = uploadedUrls[0];
            const screenshotUrls = uploadedUrls.slice(1);
            
            // 3. Prepare data for Firestore
            const newGameData = {
                title: values.title,
                price: values.price,
                description: values.description,
                longDescription: values.longDescription,
                genres: values.genres.split(',').map(g => g.trim()),
                coverImage: coverImageUrl,
                screenshots: screenshotUrls,
                developerId: user.uid,
                status: 'pending',
                submittedAt: serverTimestamp(),
                rating: 0,
                reviews: [],
            }
            
            // 4. Add document to Firestore
            const gamesRef = collection(firestore, `games`);
            await addDoc(gamesRef, newGameData);

            toast({
                title: "Jogo Submetido!",
                description: "Obrigado por submeter o seu jogo. Ele será revisto em breve.",
            });
            router.push('/dev/dashboard');

        } catch (error: any) {
            console.error("Error submitting game: ", error);
            if (error.code?.includes('storage')) {
                 toast({
                    variant: 'destructive',
                    title: 'Erro no Upload',
                    description: 'Não foi possível carregar as imagens. Verifique as suas permissões de Storage.',
                });
            } else {
                 const permissionError = new FirestorePermissionError({
                    path: 'games',
                    operation: 'create',
                    requestResourceData: values,
                });
                errorEmitter.emit('permission-error', permissionError);
                 toast({
                    variant: 'destructive',
                    title: 'Erro na Submissão',
                    description: 'Não foi possível guardar os dados do jogo.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const { register } = form;


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
                                
                                <FormField
                                  control={form.control}
                                  name="coverImage"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Imagem de Capa</FormLabel>
                                      <FormControl>
                                         <Input type="file" accept="image/*" {...register("coverImage")} />
                                      </FormControl>
                                      <FormDescription>Ficheiro único de imagem (JPG, PNG, WEBP), máx 5MB.</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="screenshots"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Capturas de Ecrã</FormLabel>
                                      <FormControl>
                                         <Input type="file" accept="image/*" multiple {...register("screenshots")} />
                                      </FormControl>
                                      <FormDescription>Pode selecionar múltiplos ficheiros (JPG, PNG, WEBP), máx 5MB cada.</FormDescription>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

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
