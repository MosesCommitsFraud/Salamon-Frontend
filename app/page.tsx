

import HeroSection from "@/components/hero";


import {
  BellIcon,
  CalendarIcon,
  FileTextIcon,
  GlobeIcon,
  InputIcon,
} from "@radix-ui/react-icons"
import Bento from "@/components/bento";
import PerspectiveGrid from "@/components/grid-scroll";
import HowItWorks from "@/components/howitworks";
import FAQSection from "@/components/howitworks";
import TestimonialSection from "@/components/testamonial";

export default function Home() {
  return (

      <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-blue-950">
          {/* Circuit Pattern Overlay */}
          <div
              className="fixed inset-0 opacity-5"
              style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415L51.8 0h2.827zM5.373 0l-.83.828L5.96 2.243 8.2 0H5.374zM48.97 0l3.657 3.657-1.414 1.414L46.143 0h2.828zM11.03 0L7.372 3.657 8.787 5.07 13.857 0H11.03zm32.284 0L49.8 6.485 48.384 7.9l-7.9-7.9h2.83zM16.686 0L10.2 6.485 11.616 7.9l7.9-7.9h-2.83zM22.343 0L13.8 8.485 15.214 9.9l9.9-9.9h-2.77zM32 0l-3.486 3.485-13.9 13.9L16.03 18.8 32 2.828 47.97 18.8l1.414-1.415-13.9-13.9L32 0zm18.485 21.384l-1.414 1.414-7.9-7.9 1.415-1.414 7.9 7.9zm-34.97 0l1.414 1.414-7.9-7.9 1.415-1.414 7.9 7.9zm1.414-1.414l7.9 7.9-1.414 1.414-7.9-7.9 1.414-1.414zM32 27.314l3.485-3.485 7.9-7.9 1.414 1.414-7.9 7.9L32 30.142l-4.9-4.9-7.9-7.9 1.414-1.414 7.9 7.9L32 27.314zM53.314 32l-3.485 3.485-7.9 7.9-1.414-1.414 7.9-7.9L53.314 32l4.9 4.9 7.9 7.9-1.414 1.414-7.9-7.9L53.314 32zm-34.97 0l3.485 3.485 7.9 7.9-1.414 1.414-7.9-7.9L16.686 32l-4.9 4.9-7.9 7.9-1.414-1.414 7.9-7.9L16.686 32z' fill='%234299e1' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              }}
          />
          <section className="py-32">
              <HeroSection/>
          </section>
          {/* Feature Showcase */}
          <section className="py-32 container relative">
              <h1 className="text-6xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent text-white mb-4">
                  Our Features
              </h1>
              <Bento></Bento>
          </section>
          <section className="py-32 container relative">
              <FAQSection/>
          </section>
          <section className="py-32 container relative">
              <TestimonialSection/>
          </section>

      </div>
  )
}




