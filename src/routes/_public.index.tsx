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
  ArrowRight
} from "lucide-react";

export const Route = createFileRoute("/_public/")({
  component: PublicHome,
});

function PublicHome() {
  return (
    <div className="w-full pb-20 bg-white min-h-screen text-blue-950 font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 md:pt-32 pb-20 lg:pb-32">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-50 blur-[100px]" 
          />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }} 
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[100px]" 
          />
        </div>

        <div className="container relative z-10 mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
            >
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-blue-950 mb-4">
                Expert Hands.{" "}
                <span className="text-blue-600">
                  Trusted Repairs.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-800 font-medium max-w-2xl mx-auto">
                Only at RK Repair Labs
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <p className="text-base md:text-lg text-blue-700/80 max-w-2xl mx-auto leading-relaxed">
                MacBook & iPhone specialists. Skilled professionals with deep knowledge of all major
                brands and models. Chip-level fixes, screens, batteries, charging, and more.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6"
            >
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="tel:+919666984949"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all hover:bg-blue-700"
              >
                <Phone className="h-5 w-5" /> Call Now
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
                <Link
                  to="/track"
                  className="w-full flex items-center justify-center gap-2 bg-white border-2 border-blue-200 text-blue-700 px-8 py-4 rounded-xl font-bold shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all"
                >
                  Track Repair <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-blue-50/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4">Why Choose Us</h2>
              <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full" />
            </motion.div>
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.2)" }}
                className="bg-white border border-blue-100 rounded-2xl p-8 transition-all"
              >
                <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6 text-blue-600">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-3">{feature.title}</h3>
                <p className="text-blue-700/70 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-blue-950 mb-4">Our Expert Services</h2>
              <div className="h-1.5 w-24 bg-blue-600 mx-auto rounded-full" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <ServiceCard 
              icon={Laptop}
              title="Laptop Repairs"
              items={[
                "Chip-level repair",
                "Screen replacement",
                "DC jack repairs",
                "Hinges repairs",
                "Dead condition recovery",
              ]}
              delay={0.1}
            />
            <ServiceCard 
              icon={Smartphone}
              title="Mobile Repairs"
              items={[
                "Screen & body damages",
                "Slow and hanging issues",
                "Software updates",
                "Battery replacement",
                "Water damage repair",
              ]}
              delay={0.2}
            />
            <ServiceCard 
              icon={Wrench}
              title="Accessories & Upgrades"
              items={[
                "Genuine parts",
                "Performance upgrades",
                "Storage solutions",
                "Chargers & cables",
                "Protective cases",
              ]}
              delay={0.3}
            />
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-16 text-center"
          >
            <Link
              to="/services"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-lg transition-colors group"
            >
              View all services 
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="h-5 w-5" />
              </motion.span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trusted Brands */}
      <section className="py-16 bg-blue-600 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] [background-size:24px_24px]"></div>
        <div className="container mx-auto px-6 mb-10 relative z-10">
          <p className="text-center text-sm font-bold tracking-widest uppercase text-blue-100">
            Trusted by All Major Brands
          </p>
        </div>

        <div className="flex w-full overflow-hidden relative z-10">
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
                  className="h-8 md:h-10 w-auto opacity-75 hover:opacity-100 transition-opacity"
                />
              ))}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, items, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-3xl p-8 border border-blue-100 shadow-xl shadow-blue-900/5 relative overflow-hidden group"
    >
      <div className="absolute -top-6 -right-6 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
        <Icon className="h-48 w-48 text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-blue-950 mb-6 relative z-10 flex items-center gap-3">
        <span className="p-3 bg-blue-50 text-blue-600 rounded-lg">
          <Icon className="h-6 w-6" />
        </span>
        {title}
      </h3>
      <ul className="space-y-4 relative z-10">
        {items.map((item: string, i: number) => (
          <li key={i} className="flex items-center gap-3 text-blue-800/80 font-medium">
            <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
