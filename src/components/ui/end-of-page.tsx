import { motion } from "framer-motion";
import { PackageSearch } from "lucide-react";
import Link from "next/link";

export default function End() {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center justify-center p-8 text-center">
            <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
                <PackageSearch className="w-16 h-16 text-muted-foreground mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-2">so uhh..</h3>
            <p className="text-sm text-muted-foreground max-w-md">you've explored all available themes.. check back later for more!</p>
            <motion.div whileHover={{ y: -5 }}>
                <Link href="#top" className="text-primary mt-4">
                    bring me back up!
                </Link>
            </motion.div>
        </motion.div>
    );
}
