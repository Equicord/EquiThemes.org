import { Search } from "lucide-react";
import { Input } from "@components/ui/input";
import { cn } from "@lib/utils";

interface SearchBarProps {
    // eslint-disable-next-line no-unused-vars
    onSearch: (query: string) => void;
    className?: string;
    value?: string;
}

export function SearchBar({ onSearch, className, value = "" }: SearchBarProps) {
    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
                value={value}
                placeholder="Search themes and snippets..."
                className="pl-12 h-12 bg-card border-border focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all duration-200 rounded-2xl text-foreground placeholder:text-muted-foreground"
                onChange={(e) => onSearch(e.target.value)}
            />
        </div>
    );
}
