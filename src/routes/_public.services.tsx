import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Laptop,
  Smartphone,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  MonitorSmartphone,
  Watch,
  Tablet,
  Database,
  Cpu,
} from "lucide-react";

export const Route = createFileRoute("/_public/services")({
  component: Services,
});

function Services() {
  const services = [
    {
      title: "MacBook & Laptop Repairs",
      icon: Laptop,
      description:
        "Expert chip-level repair and component replacement for all major laptop brands.",
      features: [
        "Motherboard chip-level repair",
        "Screen and display replacement",
        "Keyboard and trackpad repair",
        "Battery replacement",
        "Liquid damage recovery",
        "Hinge and body fabrication",
        "Overheating issues resolved",
      ],
    },
    {
      title: "iPhone & Mobile Repairs",
      icon: Smartphone,
      description:
        "Fast, reliable fixes for iOS and Android devices using premium replacement parts.",
      features: [
        "Broken screen replacement",
        "Battery replacement",
        "Charging port repair",
        "Camera and lens repair",
        "Speaker and microphone fixes",
        "Face ID / Touch ID repair",
        "Software flashing and updates",
      ],
    },
    {
      title: "iPad & Tablet Repair",
      icon: Tablet,
      description: "Complete repair solutions for Apple iPads and Android tablets of all sizes.",
      features: [
        "Digitizer / Glass replacement",
        "LCD replacement",
        "Battery drain issues",
        "Charging problems",
        "Button repairs",
      ],
    },
    {
      title: "Data Recovery",
      icon: Database,
      description: "Professional data extraction from dead or damaged devices and hard drives.",
      features: [
        "Dead phone data recovery",
        "Corrupted hard drive recovery",
        "Deleted files restoration",
        "OS crash recovery",
        "Secure data transfer",
      ],
    },
    {
      title: "Smart Watch Repair",
      icon: Watch,
      description:
        "Screen, battery, and functionality repairs for Apple Watch and other smart wearables.",
      features: [
        "Screen replacement",
        "Battery replacement",
        "Water damage repair",
        "Sensor repairs",
      ],
    },
    {
      title: "Motherboard Specialists",
      icon: Cpu,
      description: "We handle the complex micro-soldering repairs that other shops reject.",
      features: [
        "Short circuit repair",
        "IC replacement",
        "Trace repair",
        "Component level diagnostics",
      ],
    },
  ];

  return (
    <div className="w-full pb-20">
      {/* Page Header */}
      <section className="relative pt-16 md:pt-24 pb-12 overflow-hidden border-b border-border bg-card/50">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-[#0f172a]/0 to-transparent" />
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-extrabold text-white mb-4"
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Comprehensive laptop and mobile repair services in Guntur. Chip-level repairs, screen
            replacement, software solutions, and more.
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-gradient-to-b from-[#1e293b] to-[#0f172a] rounded-3xl p-8 border border-border relative overflow-hidden group hover:border-primary/30 transition-colors"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <service.icon className="h-40 w-40 text-primary" />
                </div>

                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center mb-6 relative z-10">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 relative z-10">
                  {service.title}
                </h3>
                <p className="text-muted-foreground mb-8 relative z-10 min-h-[48px]">
                  {service.description}
                </p>

                <div className="space-y-3 relative z-10">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="bg-gradient-to-r from-primary/40 to-blue-900/40 border border-primary/20 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Need a repair?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bring your device to our lab for a free diagnosis. We'll give you an honest quote
              before proceeding with any repairs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="w-full sm:w-auto bg-primary hover:bg-primary text-black px-8 py-3.5 rounded-xl font-bold transition-colors"
              >
                Contact Us
              </Link>
              <a
                href="tel:+919666984949"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-border text-white px-8 py-3.5 rounded-xl font-bold transition-colors"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
