import { ArrowRightIcon } from "@radix-ui/react-icons"
import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"

function BentoGrid({
                       children,
                       className,
                   }: {
    children: ReactNode
    className?: string
}) {
    return (
        <div className={"grid w-full auto-rows-[22rem] grid-cols-3 gap-4" + (className ? " " + className : "")}>
            {children}
        </div>
    )
}

function BentoCard({
                       name,
                       className,
                       background,
                       Icon,
                       description,
                       href,
                       cta,
                   }: {
    name: string
    className: string
    background: ReactNode
    Icon: any
    description: string
    href: string
    cta: string
}) {
    return (
        <div
            key={name}
            className={
                "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-xl " +
                "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] " +
                "transform-gpu dark:bg-black dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] " +
                (className ? className : "")
            }
        >
            <div className="overflow-hidden h-full w-full absolute inset-0">
                <div className="h-full w-full transform transition-transform duration-700 ease-in-out group-hover:scale-110">
                    {background}
                </div>
            </div>
            <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 absolute bottom-0 left-0 transition-all duration-300 group-hover:-translate-y-10">
                <Icon className="size-12 origin-left transform-gpu text-blue-400 transition-all duration-1600 ease-in-out group-hover:scale-75 dark:text-blue-400 [filter:drop-shadow(0_0_8px_rgba(59,130,246,0.8))] " />
                <h3 className="text-xl font-semibold text-neutral-700 dark:text-white">{name}</h3>
                <p className="max-w-lg text-neutral-300">{description}</p>
            </div>

            <div
                className={
                    "pointer-events-none absolute bottom-0 left-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                }
            >
                <Button
                    variant="ghost"
                    asChild
                    size="sm"
                    className="pointer-events-auto dark:text-blue-400 dark:hover:text-blue-300"
                >
                    <a href={href}>
                        {cta}
                        <ArrowRightIcon className="ml-2 size-4" />
                    </a>
                </Button>
            </div>
            <div
                className={
                    "pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-neutral-800/10"
                }
            />
        </div>
    )
}

export { BentoCard, BentoGrid }
