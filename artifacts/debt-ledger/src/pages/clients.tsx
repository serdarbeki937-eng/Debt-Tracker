import * as React from "react";
import { 
  useListClients, 
  useCreateClient, 
  exportClients, 
  useListTerritories,
  useGetCurrentUser
} from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Search, Download, Plus, Eye } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListClientsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

const clientSchema = z.object({
  name: z.string().min(1, "Ism kiritish majburiy"),
  territory: z.string().min(1, "Hudud kiritish majburiy"),
  phone: z.string().optional(),
  responsiblePerson: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [territory, setTerritory] = React.useState<string>("all");
  const [responsiblePerson, setResponsiblePerson] = React.useState("");
  const [debouncedResponsible, setDebouncedResponsible] = React.useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: user } = useGetCurrentUser();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce responsible person
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedResponsible(responsiblePerson), 500);
    return () => clearTimeout(timer);
  }, [responsiblePerson]);

  const queryParams = {
    search: debouncedSearch || undefined,
    territory: territory === "all" ? undefined : territory,
    responsiblePerson: debouncedResponsible || undefined,
  };

  const { data: clients, isLoading } = useListClients(queryParams);
  const { data: territories } = useListTerritories();
  
  const createClient = useCreateClient({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientsQueryKey() });
        setIsCreateModalOpen(false);
        form.reset();
        toast({
          title: "Muvaffaqiyatli!",
          description: "Yangi klient qo'shildi.",
        });
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "Xatolik!",
          description: "Klient qo'shishda xatolik yuz berdi.",
        });
      }
    }
  });

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      territory: "",
      phone: "",
      responsiblePerson: "",
    },
  });

  function onSubmit(data: ClientFormValues) {
    createClient.mutate({ data });
  }

  const handleExport = async () => {
    try {
      const blob = await exportClients(queryParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Klientlar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Eksport xatosi",
        description: "Excel faylni yuklab olish imkonsiz bo'ldi.",
      });
    }
  };

  const totalBalance = clients?.reduce((sum, client) => sum + client.balance, 0) || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Klientlar</h1>
          <p className="text-muted-foreground mt-1">
            Barcha klientlar ro'yxati va balanslari.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" /> Eksport (Excel)
          </Button>
          
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Yangi klient
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi klient qo'shish</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kompaniya / F.I.Sh</FormLabel>
                        <FormControl>
                          <Input placeholder="Klient nomi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="territory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hudud</FormLabel>
                        <FormControl>
                          <Input placeholder="Toshkent sh." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input placeholder="+998 90 123 45 67" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responsiblePerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mas'ul shaxs (ixtiyoriy)</FormLabel>
                        <FormControl>
                          <Input placeholder="Mas'ul shaxs ismi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createClient.isPending}>
                      {createClient.isPending ? "Saqlanmoqda..." : "Saqlash"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex flex-1 gap-4 items-center max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Qidiruv..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="w-[200px]">
            <Select value={territory} onValueChange={setTerritory}>
              <SelectTrigger>
                <SelectValue placeholder="Hudud" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barcha hududlar</SelectItem>
                {territories?.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-[200px]">
            <Input
              placeholder="Mas'ul shaxs..."
              value={responsiblePerson}
              onChange={(e) => setResponsiblePerson(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center px-4 py-2 bg-muted/50 rounded-md border">
          <span className="text-sm font-medium mr-2">Jami balans:</span>
          <span className={`font-bold ${totalBalance > 0 ? 'text-success' : totalBalance < 0 ? 'text-destructive' : ''}`}>
            {formatCurrency(totalBalance)}
          </span>
        </div>
      </div>

      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Mijoz Nomi</TableHead>
                <TableHead>Hududi</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-right">Joriy Balans</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell align="right"><Skeleton className="h-5 w-24 ml-auto" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : clients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Mijozlar topilmadi
                  </TableCell>
                </TableRow>
              ) : (
                clients?.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50 cursor-default transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{client.id}</TableCell>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.territory}</TableCell>
                    <TableCell>{client.phone || "—"}</TableCell>
                    <TableCell className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        client.balance > 0 
                          ? 'bg-success/15 text-success' 
                          : client.balance < 0 
                            ? 'bg-destructive/15 text-destructive' 
                            : 'bg-muted text-muted-foreground'
                      }`}>
                        {formatCurrency(client.balance)}
                        {client.balance > 0 ? " (Haq)" : client.balance < 0 ? " (Qarz)" : ""}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild className="h-8 gap-1 w-full justify-center">
                        <Link href={`/clients/${client.id}`}>
                          <Eye className="h-4 w-4" /> <span>Ochish</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
