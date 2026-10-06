import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Laptop,
  Smartphone,
  Wrench,
  CheckCircle2,
  Watch,
  Tablet,
  Database,
  Cpu,
  ArrowRight
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
    <div className="w-full pb-20 bg-[#ffffff] min-h-screen font-sans">
      {/* Page Header */}
      <section className="relative pt-20 md:pt-32 pb-16 overflow-hidden bg-[#ffffff]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], rotate: [0, -45, 0] }} 
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-[#e0f2fe]/60 blur-[100px]" 
          />
        </div>
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold text-[#082f49] mb-6 tracking-tight"
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-[#0369a1] max-w-2xl mx-auto font-medium"
          >
            Comprehensive laptop and mobile repair services in Guntur. Chip-level repairs, screen
            replacement, software solutions, and more.
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-[#f0f9ff]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="bg-[#ffffff] rounded-3xl p-8 border border-[#e0f2fe] shadow-xl shadow-[#082f49]/5 relative overflow-hidden group"
              >
                <div className="absolute -top-6 -right-6 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <service.icon className="h-48 w-48 text-[#0284c7]" />
                </div>

                <h3 className="text-2xl font-bold text-[#082f49] mb-4 relative z-10 flex items-center gap-4">
                  <span className="p-3 bg-[#f0f9ff] text-[#0284c7] rounded-xl shadow-sm">
                    <service.icon className="h-7 w-7" />
                  </span>
                  {service.title}
                </h3>
                
                <p className="text-[#075985] mb-8 relative z-10 font-medium min-h-[48px] leading-relaxed">
                  {service.description}
                </p>

                <div className="space-y-4 relative z-10 border-t border-[#e0f2fe] pt-6">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#0284c7] shrink-0 mt-0.5" />
                      <span className="text-[#0369a1] text-sm font-bold">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-[#ffffff]">
        <div className="container mx-auto px-6">
          <div className="bg-[#0284c7] rounded-[3rem] p-8 md:p-16 text-center max-w-5xl mx-auto shadow-2xl shadow-[#0284c7]/30 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-[#ffffff] mb-6 tracking-tight">Need a repair?</h2>
              <p className="text-xl text-[#e0f2fe] mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                Bring your device to our lab for a free diagnosis. We'll give you an honest quote
                before proceeding with any repairs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link
                  to="/contact"
                  className="w-full sm:w-auto bg-[#ffffff] hover:bg-[#f0f9ff] text-[#0284c7] px-10 py-4 rounded-2xl font-extrabold text-lg transition-colors shadow-lg hover:-translate-y-1 transform duration-200"
                >
                  Contact Us
                </Link>
                <a
                  href="tel:+919666984949"
                  className="w-full sm:w-auto bg-transparent hover:bg-[#ffffff]/10 border-2 border-[#ffffff] text-[#ffffff] px-10 py-4 rounded-2xl font-extrabold text-lg transition-colors hover:-translate-y-1 transform duration-200 flex items-center justify-center gap-2"
                >
                  Call Now <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
