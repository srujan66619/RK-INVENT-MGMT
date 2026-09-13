import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Phone,
  CheckCircle2,
  Laptop,
  Smartphone,
  Wrench,
  Microscope,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_public/")({
  component: PublicHome,
});

function PublicHome() {
  return (
    <div className="w-full pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 md:pt-24 lg:pt-32 pb-16 lg:pb-24">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-4">
                Expert Hands.{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">
                  Trusted Repairs.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
                Only at RK Repair Labs
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                MacBook & iPhone specialists. Skilled professionals with deep knowledge of all major
                brands and models. Chip-level fixes, screens, batteries, charging, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <a
                href="tel:+919666984949"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-black px-8 py-3.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                <Phone className="h-5 w-5" /> Call Now
              </a>
              <Link
                to="/track"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-card border border-border text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-secondary transition-colors"
              >
                Track Repair
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-card/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose Us</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Free Diagnosis",
                desc: "No-obligation device checkup & estimate.",
              },
              {
                icon: Laptop,
                title: "MacBook & iPhone",
                desc: "Expert in Apple repairs, with genuine quality parts.",
              },
              {
                icon: Wrench,
                title: "Any Brand, Any Problem",
                desc: "From broken screens to complex motherboard repairs.",
              },
              {
                icon: Microscope,
                title: "Advanced Tools",
                desc: "Chip-level lab, skilled technicians, clean workflow.",
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-card/50 border border-border/50 rounded-2xl p-8 hover:bg-card transition-colors"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Expert Services</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl p-8 border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Laptop className="h-32 w-32 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 relative z-10">Laptop Repairs</h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Chip-level repair",
                  "Screen replacement",
                  "DC jack repairs",
                  "Hinges repairs",
                  "Dead condition recovery",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl p-8 border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Smartphone className="h-32 w-32 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 relative z-10">Mobile Repairs</h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Screen & body damages",
                  "Slow and hanging issues",
                  "Software updates",
                  "Battery replacement",
                  "Water damage repair",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl p-8 border border-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wrench className="h-32 w-32 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-6 relative z-10">
                Accessories & Upgrades
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Genuine parts",
                  "Performance upgrades",
                  "Storage solutions",
                  "Chargers & cables",
                  "Protective cases",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-muted-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-primary hover:text-primary font-semibold transition-colors"
            >
              View all services <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="py-16 bg-card/80 border-y border-border/50 overflow-hidden">
        <div className="container mx-auto px-6 mb-8">
          <p className="text-center text-sm font-semibold tracking-widest uppercase text-muted-foreground">
            Trusted by All Major Brands
          </p>
        </div>

        <div className="flex w-full overflow-hidden">
          {/* We use two identical motion divs side-by-side to create a seamless infinite loop */}
          {[...Array(2)].map((_, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-16 md:gap-24 shrink-0 pr-16 md:pr-24"
              animate={{ x: ["0%", "-100%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
            >
              {[
                { name: "Apple", src: "https://cdn.simpleicons.org/apple/ffffff" },
                { name: "Dell", src: "https://cdn.simpleicons.org/dell/ffffff" },
                { name: "HP", src: "https://cdn.simpleicons.org/hp/ffffff" },
                { name: "Lenovo", src: "https://cdn.simpleicons.org/lenovo/ffffff" },
                { name: "Acer", src: "https://cdn.simpleicons.org/acer/ffffff" },
                { name: "Asus", src: "https://cdn.simpleicons.org/asus/ffffff" },
                { name: "OnePlus", src: "https://cdn.simpleicons.org/oneplus/ffffff" },
                { name: "Samsung", src: "https://cdn.simpleicons.org/samsung/ffffff" },
              ].map((brand) => (
                <img
                  key={brand.name}
                  src={brand.src}
                  alt={brand.name}
                  className="h-8 md:h-10 w-auto opacity-50 hover:opacity-100 transition-opacity"
                />
              ))}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
