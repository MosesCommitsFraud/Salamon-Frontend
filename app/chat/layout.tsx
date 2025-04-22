import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import Script from 'next/script';
import {NavigationBar} from "@/components/navigation-bar";
import type React from "react";

export const experimental_ppr = true;

export default async function Layout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
                strategy="beforeInteractive"
            />
            <div style={{ overflow: 'hidden', height: '100vh' }}>
                <SidebarProvider defaultOpen={!isCollapsed}>
                    <AppSidebar user={undefined} />
                    <SidebarInset>

                        <NavigationBar />
                        {children}</SidebarInset>
                </SidebarProvider>
            </div>
        </>
    );
}
