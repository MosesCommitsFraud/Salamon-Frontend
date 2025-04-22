"use client";

import { usePathname } from "next/navigation";
import { NavigationBar } from "@/components/navigation-bar";

export function ConditionalNavigationBar() {
    const pathname = usePathname();
    if (pathname === "/chat") return null;
    return <NavigationBar />;
}
