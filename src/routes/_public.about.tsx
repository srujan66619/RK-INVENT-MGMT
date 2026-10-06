import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { History, Target, Users, Award, Zap, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_public/about")({
  component: About,
});

function About() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      desc: "To provide the highest quality repair services with complete transparency and honesty.",
    },
    {
      icon: Zap,
      title: "Our Vision",
      desc: "To be the most trusted and reliable electronics repair center in Guntur and beyond.",
    },
    {
      icon: Users,
      title: "Customer First",
      desc: "Every repair is treated with the utmost care, prioritizing data security and customer satisfaction.",
    },
    {
      icon: Award,
      title: "Quality Guaranteed",
      desc: "We use only genuine or highest-grade OEM parts, backed by our service warranty.",
    },
  ];

  return (
    <div className="w-full pb-20 bg-[#ffffff] min-h-screen text-[#082f49] font-sans">
      {/* Page Header */}
      <section className="relative pt-20 md:pt-32 pb-16 overflow-hidden bg-[#ffffff]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }} 
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[50%] -right-[10%] w-[70%] h-[70%] rounded-full bg-[#f0f9ff] blur-[100px]" 
          />
        </div>
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold text-[#082f49] mb-6 tracking-tight"
          >
            About Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-[#0369a1] max-w-2xl mx-auto font-medium"
          >
            The story behind RK Repair Labs and our commitment to excellence.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-[#f0f9ff]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#082f49] mb-6 leading-tight">
                Over <span className="text-[#0284c7]">17 Years</span> of Excellence
              </h2>
              <div className="h-1.5 w-20 bg-[#0284c7] rounded-full mb-8" />
              <p className="text-[#075985] leading-relaxed text-lg font-medium">
                RK Repair Labs was founded with a single purpose: to provide professional,
                transparent, and high-quality repair services for laptops, mobiles, and electronics
                in Guntur.
              </p>
              <p className="text-[#075985] leading-relaxed text-lg font-medium">
                What started as a small repair desk has grown into a fully equipped, chip-level
                service laboratory. We pride ourselves on fixing the issues that other service
                centers declare "unrepairable".
              </p>
              <p className="text-[#075985] leading-relaxed text-lg font-medium">
                Our technicians undergo continuous training to stay updated with the latest
                micro-soldering techniques and diagnostic tools. When you hand your device to us,
                you're placing it in the hands of seasoned experts.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative rounded-3xl overflow-hidden border border-[#bae6fd] bg-[#ffffff] shadow-2xl shadow-[#0284c7]/10"
            >
              <img
                src="/rk-labs-banner.jpeg"
                alt="RK Repair Labs Workshop"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#082f49]/90 to-transparent opacity-80" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-[#0284c7] flex items-center justify-center border-4 border-[#ffffff] shadow-xl">
                    <History className="h-8 w-8 md:h-10 md:w-10 text-[#ffffff]" />
                  </div>
                  <div>
                    <div className="text-3xl md:text-5xl font-extrabold text-[#ffffff] drop-shadow-lg tracking-tight">
                      17+
                    </div>
                    <div className="text-[#bae6fd] font-bold uppercase tracking-widest text-xs md:text-sm drop-shadow-md">
                      Years Experience
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-[#ffffff]">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#082f49] mb-4">Our Core Values</h2>
            <div className="h-1.5 w-24 bg-[#0284c7] mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 10px 30px -10px rgba(2, 132, 199, 0.15)" }}
                className="flex gap-6 p-8 rounded-3xl bg-[#ffffff] border border-[#e0f2fe] transition-all"
              >
                <div className="h-16 w-16 rounded-2xl bg-[#f0f9ff] flex items-center justify-center shrink-0 text-[#0284c7] shadow-sm">
                  <val.icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[#082f49] mb-3">{val.title}</h3>
                  <p className="text-[#075985] leading-relaxed font-medium">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Are Different */}
      <section className="py-20 bg-[#082f49] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[#ffffff] mb-4">How We Stand Out</h2>
            <div className="h-1.5 w-24 bg-[#38bdf8] mx-auto rounded-full" />
          </div>
          <div className="space-y-4">
            {[
              "State-of-the-art micro-soldering and diagnostic equipment.",
              "Strict data privacy protocols — your data is safe with us.",
              "Transparent pricing with no hidden charges.",
              "Live tracking of your repair status via WhatsApp and our Track page.",
              "Fast turnaround times for most common issues.",
            ].map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex items-center gap-4 bg-[#ffffff] p-6 rounded-2xl shadow-lg"
              >
                <div className="bg-[#f0f9ff] p-2 rounded-full text-[#0284c7]">
                  <CheckCircle2 className="h-6 w-6 shrink-0" />
                </div>
                <span className="text-[#082f49] font-bold text-lg">{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
