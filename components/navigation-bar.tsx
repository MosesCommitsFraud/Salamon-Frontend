"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Menu, X, Layers, Sparkles, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

// Add keyframe animations for the glowing border
const animations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes shrinkToCenter {
    0% { 
      left: 0; 
      right: 0; 
      opacity: 1;
    }
    50% { 
      left: 40%; 
      right: 40%; 
      opacity: 0.7;
    }
    100% { 
      left: 50%; 
      right: 50%; 
      opacity: 0;
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-in-out forwards;
  }
  
  .animate-shrinkToCenter {
    animation: shrinkToCenter 0.6s ease-in-out forwards;
  }
`

export function NavigationBar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [wasScrolled, setWasScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 10

      // If we're transitioning from scrolled to not scrolled, set wasScrolled to true
      if (isScrolled && !scrolled) {
        setWasScrolled(true)
        // Reset wasScrolled after animation completes
        setTimeout(() => {
          setWasScrolled(false)
        }, 600) // Match animation duration
      }

      setIsScrolled(scrolled)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isScrolled])

  const navLinks = [
    { href: "/collection", label: "Collection", icon: <Layers className="w-4 h-4 mr-2" /> },
    { href: "/cards", label: "Cards", icon: <Sparkles className="w-4 h-4 mr-2" /> },
    { href: "/chat", label: "Chat", icon: <MessageCircle className="w-4 h-4 mr-2" /> },
  ]

  return (
      <>
        <style jsx global>
          {animations}
        </style>
        {/* Spacer div to push content down */}
        <div className="h-20"></div>
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
                isScrolled ? "bg-black/80 backdrop-blur-xl border-b border-slate-800/50" : "bg-transparent",
            )}
        >
          {/* Glowing border line with animations */}
          {(isScrolled || wasScrolled) && (
              <div
                  className={cn(
                      "absolute bottom-0 h-[1px] bg-blue-500/70 shadow-[0_0_8px_1px_rgba(59,130,246,0.7)]",
                      isScrolled ? "animate-fadeIn" : wasScrolled ? "animate-shrinkToCenter" : "",
                  )}
                  style={{
                    left: 0,
                    right: 0,
                  }}
              />
          )}

          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-8 -left-8 w-24 h-24 bg-pink-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -top-4 right-1/4 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl"></div>
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/20 rounded-full blur-3xl"></div>
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="relative h-12 w-12 overflow-hidden transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Image src="/salamon-icon-white-1000.png" alt="Salamon" fill className="object-contain" priority />
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-white transition-all duration-500 group-hover:from-pink-300 group-hover:to-indigo-300">
                Salamon
              </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <Button
                          variant="ghost"
                          className={cn(
                              "relative px-4 py-2 text-base font-medium transition-all duration-200",
                              pathname === link.href
                                  ? "text-white after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1/2 after:h-0.5 after:bg-white after:rounded-full"
                                  : "text-slate-300 hover:text-white hover:bg-white/10",
                          )}
                      >
                    <span className="flex items-center">
                      {link.icon}
                      {link.label}
                    </span>
                      </Button>
                    </Link>
                ))}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 relative overflow-hidden group"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"></span>
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
              <div className="md:hidden bg-gradient-to-b from-purple-900/95 to-indigo-900/95 backdrop-blur-xl">
                <div className="px-4 pt-2 pb-6 space-y-2">
                  {navLinks.map((link) => (
                      <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)}>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start text-left text-lg py-3",
                                pathname === link.href
                                    ? "text-white bg-white/10"
                                    : "text-slate-300 hover:text-white hover:bg-white/5",
                            )}
                        >
                    <span className="flex items-center">
                      {link.icon}
                      {link.label}
                    </span>
                        </Button>
                      </Link>
                  ))}
                </div>
              </div>
          )}
        </nav>
      </>
  )
}
