import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TickerTape from "../components/TickerTape";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Watchlist {
  id: number;
  ticker: string;
  name: string;
  type: string;
}

export default function SettingsPage() {
  const [eli5Mode, setEli5Mode] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("stock");
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: watchlist = [] } = useQuery<Watchlist[]>({ queryKey: ["/api/watchlist"] });
  const { data: health } = useQuery({ queryKey: ["/api/health"] });
  const h = health as any;

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", "./api/watchlist", { ticker: newTicker, name: newName, type: newType }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      setNewTicker(""); setNewName("");
      toast({ title: "Added to watchlist" });
    },
    onError: () => toast({ title: "Failed to add", variant: "destructive" }),
  });

  const removeMutation = useMutation({
    mutationFn: (ticker: string) => apiRequest("DELETE", `./api/watchlist/${ticker}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({ title: "Removed from watchlist" });
    },
  });

  return (
    <div className="dashboard-grid app-shell">
      <Sidebar eli5Mode={eli5Mode} onToggleEli5={() => setEli5Mode(!eli5Mode)} />
      <div className="main-content flex flex-col items-center justify-center min-h-screen">
        <div className="max-w-xl w-full p-8 mt-16 bg-background rounded-2xl shadow-lg border border-border text-center">
          <h1 className="theme-title text-2xl mb-2">Market Pulse (Private App)</h1>
          <p className="text-muted-foreground mb-4">
            This application is private and for personal use only.<br />
            Data is provided for informational purposes.<br />
            <strong>Created by Aliasist developer Blake Hooper.</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
