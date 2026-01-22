"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@lib/utils";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Badge } from "@components/ui/badge";
import { VisuallyHidden } from "@components/ui/visually-hidden";

type FilterOption = {
    value: string;
    label: string;
    description: string;
};

const filterOptions: FilterOption[] = [
    { value: "most-popular", label: "Most Popular", description: "Sort by number of views" },
    { value: "most-liked", label: "Most Liked", description: "Sort by number of likes" },
    { value: "recently-updated", label: "Recently Updated", description: "Sort by last update date" },
    { value: "recently-uploaded", label: "Recently Uploaded", description: "Sort by upload date" }
];

interface DropdownFilterProps {
    onChange: (value: string) => void;
    className?: string;
    defaultValue?: string;
    label?: string;
}

export function DropdownFilter({ onChange, className, defaultValue = "", label = "Sort by" }: DropdownFilterProps) {
    const [open, setOpen] = React.useState(false);
    const [value, setValue] = React.useState(defaultValue);
    const [searchQuery, setSearchQuery] = React.useState("");
    const commandRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    const selectedOption = filterOptions.find((option) => option.value === value);
    const filterId = React.useId();

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setValue("");
        onChange("");
        setSearchQuery("");
        const announcement = document.getElementById(`${filterId}-announcement`);
        if (announcement) {
            announcement.textContent = "Selection cleared";
        }
        triggerRef.current?.focus();
    };

    const handleSelect = (currentValue: string) => {
        const newValue = currentValue === value ? "" : currentValue;
        setValue(newValue);
        setOpen(false);
        onChange(newValue);
        setSearchQuery("");

        const selectedLabel = filterOptions.find((option) => option.value === newValue)?.label || "No selection";
        const announcement = document.getElementById(`${filterId}-announcement`);
        if (announcement) {
            announcement.textContent = newValue ? `Selected: ${selectedLabel}` : "Selection cleared";
        }
    };

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (open && e.key === "Escape") {
                setOpen(false);
                triggerRef.current?.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div id={`${filterId}-announcement`} aria-live="polite" className="sr-only" />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button 
                        ref={triggerRef} 
                        id={`${filterId}-trigger`} 
                        variant="outline" 
                        role="combobox" 
                        aria-expanded={open} 
                        aria-haspopup="listbox" 
                        aria-controls={`${filterId}-listbox`} 
                        aria-label={label} 
                        aria-describedby={`${filterId}-description`} 
                        className="w-full justify-between h-12 bg-card border-border hover:bg-card hover:border-primary text-foreground transition-all duration-200 rounded-2xl"
                    >
                        <span className="flex items-center gap-2 truncate">
                            {value ? (
                                <>
                                    <Badge variant="secondary" className="font-medium text-xs px-2 py-1 rounded-lg">
                                        {selectedOption?.label}
                                    </Badge>
                                </>
                            ) : (
                                <span className="text-muted-foreground">{label}</span>
                            )}
                        </span>
                        <div className="flex items-center gap-2">
                            {value && (
                                <X 
                                    className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" 
                                    onClick={handleClear} 
                                    aria-label="Clear selection" 
                                />
                            )}
                            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border/50 bg-background/95 backdrop-blur-md rounded-2xl shadow-lg" align="start" sideOffset={4}>
                    <Command ref={commandRef}>
                        <CommandInput 
                            placeholder="Search filters..." 
                            value={searchQuery} 
                            onValueChange={setSearchQuery} 
                            className="h-10 border-b border-border/30" 
                            aria-label="Search filters" 
                        />
                        <CommandList>
                            <CommandEmpty className="p-4 text-sm text-muted-foreground text-center">No filters found.</CommandEmpty>
                            <CommandGroup 
                                className="max-h-[320px] overflow-y-auto p-2" 
                                aria-labelledby={`${filterId}-trigger`} 
                                id={`${filterId}-listbox`}
                            >
                                {filterOptions.map((option) => (
                                    <CommandItem 
                                        key={option.value} 
                                        value={option.value} 
                                        onSelect={handleSelect} 
                                        className="group flex items-center gap-3 px-3 py-3 cursor-pointer rounded-lg hover:bg-transparent hover:border-2 hover:border-primary/30 border-2 border-transparent data-[selected=true]:bg-muted/30 text-foreground transition-colors" 
                                        aria-selected={value === option.value} 
                                        role="option" 
                                        data-selected={value === option.value}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md border-2 border-muted-foreground/30 hover:border-primary transition-colors">
                                                {value === option.value && <Check className="h-4 w-4 text-primary" />}
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-medium text-sm group-hover:text-primary">{option.label}</span>
                                                <span className="text-xs text-muted-foreground leading-tight group-hover:text-primary/70">{option.description}</span>
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            
            <VisuallyHidden id={`${filterId}-description`}>Select a sorting option from the dropdown list. Use arrow keys to navigate, Enter to select, and Escape to close the dropdown.</VisuallyHidden>
        </div>
    );
}

export default DropdownFilter;
