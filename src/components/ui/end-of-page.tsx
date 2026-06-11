import { PackageSearch } from "lucide-react";
import Link from "next/link";

export default function End() {
    return (
        <div className="end-of-page-fade-in flex flex-col items-center justify-center p-8 text-center">
            <style>{`
                @keyframes end-of-page-fade-in {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes end-of-page-wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-10deg); }
                    50% { transform: rotate(10deg); }
                    75% { transform: rotate(-10deg); }
                }
                .end-of-page-fade-in { animation: end-of-page-fade-in 0.5s ease-out both; }
                .end-of-page-wiggle { animation: end-of-page-wiggle 2s ease-in-out infinite; }
            `}</style>
            <div className="end-of-page-wiggle">
                <PackageSearch className="w-16 h-16 text-muted-foreground mb-4" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">so uhh..</h3>
            <p className="text-sm text-muted-foreground max-w-md">you've explored all available themes.. check back later for more!</p>
            <div className="transition-transform duration-200 hover:-translate-y-[5px]">
                <Link href="#top" className="text-primary mt-4">
                    bring me back up!
                </Link>
            </div>
        </div>
    );
}
