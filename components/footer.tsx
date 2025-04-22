import {
    FaApple,
    FaDiscord,
    FaRedditAlien,
    FaTelegramPlane,
    FaTwitter,
} from "react-icons/fa"
import Image from 'next/image';

import { Separator } from "@/components/ui/separator"

const sections = [
    {
        title: "Product",
        links: [
            { name: "Collection", href: "/collection" },
            { name: "Chat", href: "#" },
            { name: "Features", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { name: "About", href: "#" },
            { name: "Team", href: "#" },
            { name: "Blog", href: "#" },
            { name: "Careers", href: "#" },
            { name: "Contact", href: "#" },
            { name: "Privacy", href: "#" },
        ],
    },
    {
        title: "Resources",
        links: [
            { name: "Help", href: "#" },
        ],
    },
]

const Footer1 = () => {
    return (
        <section className="py-32">
            <div className="container">
                <footer>
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                        <Image
                            src="/salamon-icon-white-1000.png" // Note the leading slash
                            alt="logo"
                            width={75} // Specify width (height of 7 is approximately 28px)
                            height={75}
                            className="mb-8 mr-auto md:mb-0"
                        />
                    </div>
                    <Separator className="my-14" />
                    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                        {sections.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h3 className="mb-4 font-bold">{section.title}</h3>
                                <ul className="text-muted-foreground space-y-4">
                                    {section.links.map((link, linkIdx) => (
                                        <li
                                            key={linkIdx}
                                            className="hover:text-primary font-medium"
                                        >
                                            <a href={link.href}>{link.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                        <div>
                            <h3 className="mb-4 font-bold">Legal</h3>
                            <ul className="text-muted-foreground space-y-4">
                                <li className="hover:text-primary font-medium">
                                    <a href="#">Term of Services</a>
                                </li>
                                <li className="hover:text-primary font-medium">
                                    <a href="#">Privacy Policy</a>
                                </li>
                            </ul>
                            <h3 className="mb-4 mt-8 font-bold">Social</h3>
                            <ul className="text-muted-foreground flex items-center space-x-6">
                                <li className="hover:text-primary font-medium">
                                    <a href="#">
                                        <FaDiscord className="size-6" />
                                    </a>
                                </li>
                                <li className="hover:text-primary font-medium">
                                    <a href="#">
                                        <FaRedditAlien className="size-6" />
                                    </a>
                                </li>
                                <li className="hover:text-primary font-medium">
                                    <a href="#">
                                        <FaTwitter className="size-6" />
                                    </a>
                                </li>
                                <li className="hover:text-primary font-medium">
                                    <a href="#">
                                        <FaTelegramPlane className="size-6" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                    <Separator className="my-14" />
                    <p className="text-muted-foreground text-sm">
                        © {new Date().getFullYear()} Salamon. All rights reserved.
                    </p>
                    <Separator className="my-4" />
                    <p className="text-muted-foreground text-sm">
                        Disclaimer:

                        This website is a purely fictional mock‑up created for an academic project. All company names, logos, page links, and footer items are imaginary and do not correspond to real businesses or live web pages. Any resemblance to actual organizations, entities, or websites is entirely coincidental. This mock site has been developed solely for university coursework and is not intended for commercial use or public deployment.









                    </p>
                </footer>
            </div>
        </section>
    )
}

export default Footer1