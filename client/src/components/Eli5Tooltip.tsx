import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BookOpen, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface Eli5Result {
  term: string;
  explanation: string;
}

export default function Eli5Tooltip({ term }: { term: string }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery<Eli5Result>({
    queryKey: ["/api/eli5", term],
    queryFn: async () => {
      const res = await fetch(`./api/eli5/${encodeURIComponent(term)}`);
      return res.json();
    },
    enabled: open,
    staleTime: Infinity, // cached forever
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          data-testid={`button-eli5-${term.replace(/\s+/g, "-").toLowerCase()}`}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-colors border border-purple-500/20"
        >
          <BookOpen size={10} />
          {term}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-card border-purple-500/30 p-3" side="top">
        <div className="space-y-2">
          <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
            <span>🎓</span> {term}
          </div>
          {isLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 size={12} className="animate-spin" />
              Asking the teacher...
            </div>
          ) : data ? (
            <p className="text-xs text-foreground leading-relaxed">{data.explanation}</p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
