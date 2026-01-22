"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { Badge } from "@components/ui/badge";
import { cn } from "@lib/utils";

type FilterOption = {
    value: string;
    label: string;
    count?: number;
};

type FilterDropdownProps = {
    options: FilterOption[];
    onChange?: (selectedOptions: FilterOption[]) => void;
    className?: string;
    label?: string;
};

export function FilterDropdown({ options, onChange, className, label = "Filter" }: FilterDropdownProps) {
    const [open, setOpen] = React.useState(false);
    const [selectedValues, setSelectedValues] = React.useState<string[]>([]);

    const toggleOption = (value: string) => {
        setSelectedValues((current) => {
            const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];

            const selectedOptions = options.filter((option) => updated.includes(option.value));
            onChange?.(selectedOptions);
            return updated;
        });
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedValues([]);
        onChange?.([]);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    role="combobox" 
                    aria-expanded={open} 
                    aria-label={`Select ${label.toLowerCase()}`} 
                    className={cn("w-full justify-between h-12 bg-card border-border hover:bg-card hover:border-primary text-foreground transition-all duration-200 rounded-2xl", className)}
                >
                    <span className="flex items-center gap-2 max-w-full overflow-hidden text-ellipsis">
                        {selectedValues.length > 0 ? (
                            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                                {selectedValues.slice(0, 2).map((value) => {
                                    const option = options.find((opt) => opt.value === value);
                                    return (
                                        <Badge key={value} variant="secondary" className="font-medium text-xs px-2 py-1 rounded-lg">
                                            {option?.label || value}
                                        </Badge>
                                    );
                                })}
                                {selectedValues.length > 2 && (
                                    <Badge variant="secondary" className="font-medium text-xs px-2 py-1 rounded-lg">
                                        +{selectedValues.length - 2}
                                    </Badge>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">{label}</span>
                        )}
                    </span>
                    <div className="flex items-center gap-2">
                        {selectedValues.length > 0 && (
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
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 border-border/50 bg-background/95 backdrop-blur-md rounded-2xl shadow-lg">
                <Command>
                    <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="h-10 border-b border-border/30" />
                    <CommandList className="max-h-[320px] overflow-y-auto">
                        <CommandEmpty className="p-4 text-sm text-muted-foreground">No {label.toLowerCase()} found.</CommandEmpty>
                        <CommandGroup className="p-2">
                            {options.map((option) => (
                                <CommandItem 
                                    key={option.value} 
                                    value={option.value} 
                                    onSelect={() => toggleOption(option.value)} 
                                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg hover:bg-transparent hover:border-2 hover:border-primary/30 border-2 border-transparent data-[selected=true]:bg-muted/30 text-foreground hover:text-primary transition-colors"
                                    data-selected={selectedValues.includes(option.value)}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                            <div className={cn(
                                            "flex h-5 w-5 items-center justify-center border-2 transition-colors",
                                            selectedValues.includes(option.value) 
                                                ? "border-primary bg-primary text-primary-foreground" 
                                                : "border-muted-foreground/30 hover:border-primary"
                                        )}>
                                            {selectedValues.includes(option.value) && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                        <div className="flex items-center justify-between w-full">
                                            <span className="font-medium text-sm">{option.label}</span>
                                            {option.count !== undefined && (
                                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                                    {option.count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
