import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { globalSearchFn } from "@/lib/api/search";
import { Wrench, User, Loader2, Link2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const openGlobalSearch = () => document.dispatchEvent(new CustomEvent("openGlobalSearch"));

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const handleOpen = () => setOpen(true);
    
    document.addEventListener("keydown", down);
    document.addEventListener("openGlobalSearch", handleOpen as EventListener);
    
    return () => {
      document.removeEventListener("keydown", down);
      document.removeEventListener("openGlobalSearch", handleOpen as EventListener);
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["globalSearch", query],
    queryFn: () => globalSearchFn({ data: query }),
    enabled: query.trim().length >= 2,
  });

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const repairs = data?.repairs || [];
  const customers = data?.customers || [];
  
  const showAdminLinks = user?.role === "admin" || user?.role === "manager";

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Type a command or search..." 
        value={query} 
        onValueChange={setQuery} 
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </div>
          ) : (
            "No results found."
          )}
        </CommandEmpty>

        {repairs.length > 0 && (
          <CommandGroup heading="Repairs & Tickets">
            {repairs.map((r) => (
              <CommandItem
                key={r.id}
                value={`ticket ${r.ticket_no} ${r.device_model}`}
                onSelect={() => {
                  runCommand(() => {
                    router.navigate({ to: "/staff/repairs", search: { ticket: r.ticket_no } as any });
                  });
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                <span>{r.ticket_no}</span>
                <span className="ml-2 text-muted-foreground text-xs">
                  {r.device_brand} {r.device_model}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {customers.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Customers">
              {customers.map((c) => (
                <CommandItem
                  key={c.id}
                  value={`customer ${c.name} ${c.phone}`}
                  onSelect={() => {
                    runCommand(() => {
                      router.navigate({ to: "/staff/customers" });
                    });
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>{c.name}</span>
                  <span className="ml-2 text-muted-foreground text-xs">{c.phone}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {query.length === 0 && (
          <>
            <CommandGroup heading="Quick Links">
              <CommandItem onSelect={() => runCommand(() => router.navigate({ to: showAdminLinks ? "/management/dashboard" : "/technician/dashboard" as any }))}>
                <Link2 className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.navigate({ to: "/staff/repairs" }))}>
                <Wrench className="mr-2 h-4 w-4" />
                <span>Repairs</span>
              </CommandItem>
              <CommandItem onSelect={() => runCommand(() => router.navigate({ to: "/staff/customers" }))}>
                <User className="mr-2 h-4 w-4" />
                <span>Customers</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
