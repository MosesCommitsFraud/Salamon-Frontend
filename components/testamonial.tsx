import { Avatar, AvatarImage } from "@/components/ui/avatar"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

const testimonials = [
    {
        name: "Alex “DragonMaster” Lee",
        role: "Pro Duelist",
        avatar: "./seto.png",
        content:
            "The AI suggested a combo I’d never thought of—my win rate jumped 30%! Importing my old YDK and getting fresh, tournament‑ready builds has never been this easy.",
    },
    {
        name: "Sophie “Spellcaster” Nguyen",
        role: "TCG Champion",
        avatar: "./typ.png",
        content:
            "Association Rule Mining + guardrails means every deck is both creative and legal. I love exporting straight to YDK and jumping into duels without manual tweaks.",
    },
    {
        name: "Carlos “TrapLord” Ruiz",
        role: "Casual Player",
        avatar: "./käfer.png",
        content:
            "As someone who hates deck‑building, this tool is a lifesaver. It’s friendly enough for beginners and still gives seasoned players serious synergy options.",
    },
    {
        name: "Mia “MetaQueen” Schmidt",
        role: "Deck Analyst",
        avatar: "./joe.png",
        content:
            "Daily updates keep me ahead of the meta. The AI’s export feature makes it trivial to share lists with my discord community.",
    },
    {
        name: "Oliver “CodeMage” Kim",
        role: "Developer & Duelist",
        avatar: "./yugi.png",
        content:
            "I love that I can tweak the guardrails settings under the hood. As a dev, it’s fascinating to see the rules‑based mining in action.",
    },
    {
        name: "Emma “CardCrafter” Rossi",
        role: "Designer",
        avatar: "./opa.png",
        content:
            "The UI is sleek, the dark gradient theme is on point, and the carousel makes it feel like a pro site. Highly recommend!",
    },
];

const TestimonialSection = () => {
    return (
        <section>
            <div className="container">
                <Carousel className="w-full">
                    <div className="mb-8 flex justify-between px-1 lg:mb-12">
                        <div className="mb-12 flex flex-col  gap-4">
                            <h2 className="text-3xl font-bold lg:text-5xl">
                                What Duelists Are Saying
                            </h2>
                            <p className="max-w-lg  text-lg text-muted-foreground">
                                Real feedback from players who've taken their decks to the next level.
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <CarouselPrevious className="static translate-y-0"/>
                            <CarouselNext className="static translate-y-0"/>
                        </div>
                    </div>
                    <CarouselContent>
                        {testimonials.map((testimonial, idx) => (
                            <CarouselItem
                                key={idx}
                                className="basis-full md:basis-1/2 lg:basis-1/3"
                            >
                                <div className="h-full p-1 ">
                                    <div className="flex h-full flex-col justify-between rounded-lg border p-6 bg-slate-900/50 border-blue-900/20">
                                        <q className="text-foreground/70 leading-7">
                                            {testimonial.content}
                                        </q>
                                        <div className="mt-6 flex gap-4 leading-5">
                                            <Avatar className="ring-input size-9 rounded-full ring-1">
                                                <AvatarImage
                                                    src={testimonial.avatar}
                                                    alt={testimonial.name}
                                                />
                                            </Avatar>
                                            <div className="text-sm">
                                                <p className="font-medium">{testimonial.name}</p>
                                                <p className="text-muted-foreground">
                                                    {testimonial.role}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>
    )
}

export default TestimonialSection