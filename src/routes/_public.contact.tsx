import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_public/contact")({
  component: Contact,
});

function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [issue, setIssue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const whatsappLink = `https://wa.me/919666984949?text=${encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nIssue: ${issue}`
    )}`;
    const mailtoLink = `mailto:info@rkrepairlabs.com?subject=New Contact Message from ${name}&body=${encodeURIComponent(
      `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nIssue: ${issue}`
    )}`;

    window.open(whatsappLink, "_blank");
    window.location.href = mailtoLink;

    setTimeout(() => {
      setIsSubmitting(false);
      setName("");
      setPhone("");
      setEmail("");
      setIssue("");
    }, 1000);
  };

  return (
    <div className="w-full pb-20 bg-[#ffffff] min-h-screen font-sans text-[#082f49]">
      {/* Page Header */}
      <section className="relative pt-20 md:pt-32 pb-16 overflow-hidden bg-[#ffffff]">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, -45, 0] }} 
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[#f0f9ff] blur-[100px]" 
          />
        </div>
        <div className="container relative z-10 mx-auto px-6 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl font-extrabold text-[#082f49] mb-6 tracking-tight"
          >
            Contact Us
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg md:text-xl text-[#0369a1] max-w-2xl mx-auto font-medium"
          >
            Have a question or need a quote? Reach out to us and our expert technicians will assist
            you immediately.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 bg-[#f0f9ff]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Info & Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <div>
                <h2 className="text-3xl font-extrabold text-[#082f49] mb-8">Get in Touch</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#ffffff] flex items-center justify-center shrink-0 border border-[#e0f2fe] shadow-sm">
                      <MapPin className="h-6 w-6 text-[#0284c7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#082f49] mb-1">Our Location</h3>
                      <p className="text-[#075985] font-medium leading-relaxed">
                        14-13, Brindavan Gardens 1st Ln,
                        <br />
                        Brindavan Gardens,
                        <br />
                        Guntur, Andhra Pradesh 522004
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#ffffff] flex items-center justify-center shrink-0 border border-[#e0f2fe] shadow-sm">
                      <Phone className="h-6 w-6 text-[#0284c7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#082f49] mb-1">Phone</h3>
                      <p className="text-[#075985] font-medium">
                        <a
                          href="tel:+919666984949"
                          className="hover:text-[#0284c7] transition-colors"
                        >
                          +91 96669 84949
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#ffffff] flex items-center justify-center shrink-0 border border-[#e0f2fe] shadow-sm">
                      <Mail className="h-6 w-6 text-[#0284c7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#082f49] mb-1">Email</h3>
                      <p className="text-[#075985] font-medium">
                        <a
                          href="mailto:info@rkrepairlabs.com"
                          className="hover:text-[#0284c7] transition-colors"
                        >
                          info@rkrepairlabs.com
                        </a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#ffffff] flex items-center justify-center shrink-0 border border-[#e0f2fe] shadow-sm">
                      <Clock className="h-6 w-6 text-[#0284c7]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#082f49] mb-1">Business Hours</h3>
                      <p className="text-[#075985] font-medium leading-relaxed">
                        Monday - Saturday: 10:00 AM - 8:30 PM
                        <br />
                        Sunday: Closed
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map */}
              <div className="rounded-3xl overflow-hidden border border-[#bae6fd] shadow-lg shadow-[#0284c7]/10 aspect-video bg-[#ffffff] relative group">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3829.4182998632616!2d80.4195551!3d16.3150446!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a4a75a4222b8609%3A0x5b8731d711a07ad8!2sRk%20repair%20labs!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="RK Repair Labs Location"
                />
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-[#ffffff] border border-[#e0f2fe] rounded-[2rem] p-8 md:p-12 shadow-2xl shadow-[#082f49]/5">
                <h2 className="text-3xl font-extrabold text-[#082f49] mb-8">Send us a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#075985]">Your Name</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full bg-[#f0f9ff] border-2 border-[#e0f2fe] rounded-xl h-14 px-4 text-[#082f49] font-medium focus:outline-none focus:border-[#7dd3fc] transition-colors placeholder:text-[#0369a1]/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#075985]">Phone Number</label>
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-[#f0f9ff] border-2 border-[#e0f2fe] rounded-xl h-14 px-4 text-[#082f49] font-medium focus:outline-none focus:border-[#7dd3fc] transition-colors placeholder:text-[#0369a1]/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#075985]">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="w-full bg-[#f0f9ff] border-2 border-[#e0f2fe] rounded-xl h-14 px-4 text-[#082f49] font-medium focus:outline-none focus:border-[#7dd3fc] transition-colors placeholder:text-[#0369a1]/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-[#075985]">Device & Issue</label>
                    <textarea
                      required
                      value={issue}
                      onChange={(e) => setIssue(e.target.value)}
                      placeholder="E.g. MacBook Pro M1 - Screen cracked"
                      className="w-full bg-[#f0f9ff] border-2 border-[#e0f2fe] rounded-xl min-h-[140px] p-4 text-[#082f49] font-medium focus:outline-none focus:border-[#7dd3fc] transition-colors placeholder:text-[#0369a1]/50 resize-y"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-xl text-lg font-extrabold bg-[#0284c7] hover:bg-[#0369a1] text-[#ffffff] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0284c7]/20 hover:-translate-y-0.5"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        <Send className="h-5 w-5" /> Send Message
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-10 pt-8 border-t border-[#e0f2fe] text-center">
                  <p className="text-[#075985] font-bold text-sm mb-5">Or reach us instantly via WhatsApp</p>
                  <a
                    href="https://wa.me/919666984949"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-[#ffffff] px-8 py-4 rounded-xl font-extrabold hover:bg-[#20bd5a] transition-all shadow-lg hover:-translate-y-0.5 w-full sm:w-auto"
                  >
                    <MessageCircle className="h-6 w-6" /> Chat on WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
