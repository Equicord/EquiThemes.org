"use client";

import React, { createContext, useContext, useState } from "react";

interface SearchContextType {
    searchQuery: string;
    setSearchQuery: (q: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [searchQuery, setSearchQuery] = useState("");
    return <SearchContext.Provider value={{ searchQuery, setSearchQuery }}>{children}</SearchContext.Provider>;
}

export function useSearch() {
    const ctx = useContext(SearchContext);
    if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
    return ctx;
}
