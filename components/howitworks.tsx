// components/FAQSection.tsx
"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";

export default function FAQSection() {
    return (

            <div className="container  grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Left side: Heading + Intro */}
                <div className="flex flex-col">
                    <h2 className="text-6xl font-bold">Frequently Asked Questions</h2>
                    <p className="max-w-md text-lg text-muted-foreground">
                        Got questions about our AI‑powered Yu‑Gi‑Oh! deck builder? We’ve got
                        answers.
                    </p>
                </div>

                {/* Right side: Accordion */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="import">
                        <AccordionTrigger>
                            Can I import my own YDK file?
                        </AccordionTrigger>
                        <AccordionContent>
                            Absolutely! Upload your .ydk and our AI will analyze your existing
                            deck as a starting point for suggestions.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="association-rules">
                        <AccordionTrigger>
                            How does the AI generate deck suggestions?
                        </AccordionTrigger>
                        <AccordionContent>
                            We use Association Rule Mining with built‑in guardrails to ensure
                            card synergies are strong, legal, and competitive.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="formats">
                        <AccordionTrigger>
                            Which formats and card sets are supported?
                        </AccordionTrigger>
                        <AccordionContent>
                            Our generator covers all major formats (TCG/OCG, Advanced, Unlimited)
                            and updates daily with new sets and banlists.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="export">
                        <AccordionTrigger>
                            How do I export my final deck?
                        </AccordionTrigger>
                        <AccordionContent>
                            Once you’re happy with your build, click “Export” to download a
                            .ydk file or copy the decklist to clipboard for your duel client.
                        </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="pricing">
                        <AccordionTrigger>
                            Is there any cost or premium plan?
                        </AccordionTrigger>
                        <AccordionContent>
                            Our core features are free. In the future we’ll offer a Pro plan
                            with advanced analytics and meta‑reporting.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>


    );
}
