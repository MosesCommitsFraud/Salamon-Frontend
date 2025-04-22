import { BentoGrid, BentoCard } from "@/components/ui/bento-grid"
import { Search, BarChart3, Network, MessageSquareText, Sparkles } from "lucide-react"
import Image from "next/image"

export default function Bento() {
    return (

                <BentoGrid className="md:grid-cols-3 grid-cols-1 sm:grid-cols-2 auto-rows-[26rem] lg:auto-rows-[22rem]">
                    {/* Card Suggestions */}
                    <BentoCard
                        name="Card Suggestions"
                        className="md:col-span-1 row-span-1"
                        background={
                            <div className="relative h-full w-full">
                                <Image
                                    src="/deck.png"
                                    alt="Yu-Gi-Oh cards"
                                    fill
                                    className="object-cover opacity-80 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                            </div>
                        }
                        Icon={Sparkles}
                        description="Get personalized card recommendations based on your deck strategy and play style. Our AI analyzes thousands of successful decks to suggest the perfect cards for your strategy."
                        href="/features/card-suggestions"
                        cta="Explore Card Suggestions"
                    />

                    {/* Autocomplete */}
                    <BentoCard
                        name="Autocomplete"
                        className="col-span-1 md:col-span-1 row-span-1"
                        background={
                            <div className="relative h-full w-full">
                                <Image
                                    src="/opa.png"
                                    alt="Yu-Gi-Oh character"
                                    fill
                                    className="object-cover opacity-80 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                            </div>
                        }
                        Icon={Search}
                        description="Find cards instantly as you type with our smart search system. Predictive suggestions make deck building faster and more efficient."
                        href="/features/autocomplete"
                        cta="Try Autocomplete"
                    />

                    {/* Analytics */}
                    <BentoCard
                        name="Analytics"
                        className="col-span-1 md:col-span-1 row-span-1"
                        background={
                            <div className="relative h-full w-full">
                                <Image
                                    src="/robo.png"
                                    alt="Yu-Gi-Oh technology"
                                    fill
                                    className="object-cover opacity-80 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                            </div>
                        }
                        Icon={BarChart3}
                        description="Track your dueling performance with comprehensive statistics. Analyze win rates, card effectiveness, and identify areas for improvement."
                        href="/features/analytics"
                        cta="View Analytics"
                    />

                    {/* Graph */}
                    <BentoCard
                        name="Interactive Graph"
                        className="col-span-3 md:col-span-1 row-span-1"
                        background={
                            <div className="relative h-full w-full">
                                <Image
                                    src="/pega.png"
                                    alt="Yu-Gi-Oh character with millennium eye"
                                    fill
                                    className="object-cover opacity-80 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                            </div>
                        }
                        Icon={Network}
                        description="Discover powerful card combinations and see how they connect with our interactive graph visualization. Uncover synergies you never knew existed."
                        href="/features/graph"
                        cta="Explore Card Graphs"
                    />

                    {/* RAG Chat */}
                    <BentoCard
                        name="RAG Chat"
                        className="col-span-2 md:col-span-2 row-span-1"
                        background={
                            <div className="relative h-full w-full">
                                <Image
                                    src="/key.png"
                                    alt="Yu-Gi-Oh character with millennium item"
                                    fill
                                    className="object-cover opacity-80 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/30"></div>
                            </div>
                        }
                        Icon={MessageSquareText}
                        description="Get expert advice and answers to your Yu-Gi-Oh questions with our AI chat assistant. Powered by RAG technology, it has knowledge of all cards, rulings, and strategies to help you become a better duelist."
                        href="/features/rag-chat"
                        cta="Chat with Assistant"
                    />
                </BentoGrid>
    )
}
