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
            About Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            The story behind RK Repair Labs and our commitment to excellence.
          </motion.p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Over 11 Years of Excellence
              </h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                RK Repair Labs was founded with a single purpose: to provide professional,
                transparent, and high-quality repair services for laptops, mobiles, and electronics
                in Guntur.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                What started as a small repair desk has grown into a fully equipped, chip-level
                service laboratory. We pride ourselves on fixing the issues that other service
                centers declare "unrepairable".
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
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
              className="relative rounded-3xl overflow-hidden border border-border bg-card"
            >
              <img
                src="/rk-labs-banner.jpeg"
                alt="RK Repair Labs Workshop"
                className="w-full h-auto object-contain opacity-90"
              />
              {/* Subtle gradient at the bottom so the badge is readable */}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#020617] to-transparent opacity-70" />
              <div className="absolute bottom-0 left-0 p-6 md:p-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary flex items-center justify-center border-4 border-[#020617] shadow-xl">
                    <History className="h-6 w-6 md:h-8 md:w-8 text-black" />
                  </div>
                  <div>
                    <div className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                      11+
                    </div>
                    <div className="text-primary font-bold uppercase tracking-wider text-xs md:text-sm drop-shadow-md">
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
      <section className="py-20 bg-card/50 border-y border-border/50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {values.map((val, i) => (
              <motion.div
                key={val.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-6 p-8 rounded-3xl bg-card/50 border border-border/50 hover:bg-card transition-colors"
              >
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <val.icon className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{val.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why We Are Different */}
      <section className="py-20">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">How We Stand Out</h2>
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
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-4 bg-card p-6 rounded-2xl border border-border/50"
              >
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <span className="text-muted-foreground font-medium text-lg">{point}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
