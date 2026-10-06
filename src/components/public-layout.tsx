import { Link, useRouterState, Outlet } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Menu,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function PublicHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100 bg-white/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 md:h-20 items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <Logo className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "text-sm font-bold transition-colors hover:text-blue-600 relative py-2",
                path === link.to ? "text-blue-600" : "text-blue-900/70",
              )}
            >
              {link.label}
              {path === link.to && (
                <span className="absolute -bottom-[21px] left-0 right-0 h-0.5 bg-blue-600 rounded-t-full shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/track" className="hidden sm:inline-flex">
            <Button variant="ghost" className="text-blue-900/70 hover:text-blue-950 font-bold hover:bg-blue-50">
              Track Repair
            </Button>
          </Link>
          <Link to="/auth">
            <Button className="shadow-lg transition-transform hover:-translate-y-0.5 bg-blue-600 text-white hover:bg-blue-700 font-bold">
              Sign In
            </Button>
          </Link>

          {/* Mobile Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-blue-900 hover:text-blue-950 hover:bg-blue-50"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full sm:w-80 border-l border-blue-100 bg-white p-0 flex flex-col h-full"
            >
              <div className="p-6 border-b border-blue-100 flex items-center gap-3">
                <Logo className="h-10 w-auto" />
              </div>
              <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl text-base font-bold transition-all",
                      path === link.to
                        ? "bg-blue-50 text-blue-600"
                        : "text-blue-900/70 hover:bg-blue-50/50",
                    )}
                  >
                    {link.label}
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </Link>
                ))}
                <Link
                  to="/track"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between p-4 rounded-xl text-base font-bold text-blue-900/70 hover:bg-blue-50/50 transition-all mt-4 border border-blue-100"
                >
                  Track Repair
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-blue-100 bg-blue-50/30 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3">
              <Logo className="h-10 w-auto" />
            </Link>
            <p className="text-blue-800/70 text-sm leading-relaxed">
              Expert laptop and mobile repair services in Guntur. 17+ years of experience in
              chip-level repairs, screen replacement, and software solutions.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://wa.me/919666984949"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-[#25D366] hover:text-white transition-all"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
149:                 </svg>
150:               </a>
151:             </div>
152:           </div>
153: 
154:           <div>
155:             <h3 className="text-lg font-bold text-blue-950 mb-6">Quick Links</h3>
156:             <ul className="space-y-4">
157:               {NAV_LINKS.map((link) => (
158:                 <li key={link.to}>
159:                   <Link
160:                     to={link.to}
161:                     className="text-blue-800/70 hover:text-blue-600 transition-colors text-sm font-bold flex items-center gap-2"
162:                   >
163:                     <ChevronRight className="h-3 w-3" /> {link.label}
164:                   </Link>
165:                 </li>
166:               ))}
167:             </ul>
168:           </div>
169: 
170:           <div>
171:             <h3 className="text-lg font-bold text-blue-950 mb-6">Our Services</h3>
172:             <ul className="space-y-4">
173:               <li className="text-blue-800/70 text-sm font-bold flex items-center gap-2">
174:                 <CheckCircle2 className="h-4 w-4 text-blue-600" /> Laptop Chip-Level Repair
175:               </li>
176:               <li className="text-blue-800/70 text-sm font-bold flex items-center gap-2">
177:                 <CheckCircle2 className="h-4 w-4 text-blue-600" /> iPhone & Mobile Repair
178:               </li>
179:               <li className="text-blue-800/70 text-sm font-bold flex items-center gap-2">
180:                 <CheckCircle2 className="h-4 w-4 text-blue-600" /> Screen Replacement
181:               </li>
182:               <li className="text-blue-800/70 text-sm font-bold flex items-center gap-2">
183:                 <CheckCircle2 className="h-4 w-4 text-blue-600" /> Dead Condition Recovery
184:               </li>
185:               <li className="text-blue-800/70 text-sm font-bold flex items-center gap-2">
186:                 <CheckCircle2 className="h-4 w-4 text-blue-600" /> Software Solutions
187:               </li>
188:             </ul>
189:           </div>
190: 
191:           <div>
192:             <h3 className="text-lg font-bold text-blue-950 mb-6">Contact Us</h3>
193:             <ul className="space-y-4">
194:               <li className="flex items-start gap-3">
195:                 <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
196:                 <span className="text-blue-800/70 text-sm leading-relaxed font-medium">
197:                   14-13, Brindavan Gardens 1st Ln, Brindavan Gardens, Guntur, AP 522004
198:                 </span>
199:               </li>
200:               <li className="flex items-center gap-3">
201:                 <Phone className="h-5 w-5 text-blue-600 shrink-0" />
202:                 <a
203:                   href="tel:+919666984949"
204:                   className="text-blue-800/70 hover:text-blue-950 text-sm font-bold"
205:                 >
206:                   +91 96669 84949
207:                 </a>
208:               </li>
209:               <li className="flex items-center gap-3">
210:                 <Mail className="h-5 w-5 text-blue-600 shrink-0" />
211:                 <a
212:                   href="mailto:info@rkrepairlabs.com"
213:                   className="text-blue-800/70 hover:text-blue-950 text-sm font-bold"
214:                 >
215:                   info@rkrepairlabs.com
216:                 </a>
217:               </li>
218:               <li className="flex items-center gap-3">
219:                 <Clock className="h-5 w-5 text-blue-600 shrink-0" />
220:                 <span className="text-blue-800/70 text-sm font-medium">Mon - Sat: 10:00 AM - 8:30 PM</span>
221:               </li>
222:             </ul>
223:           </div>
224:         </div>
225: 
226:         <div className="border-t border-blue-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
227:           <p className="text-blue-800/60 text-xs text-center md:text-left font-medium">
228:             &copy; {new Date().getFullYear()} RK Repair Labs. All rights reserved.
229:           </p>
230:           <div className="flex items-center gap-6">
231:             <Link
232:               to="/track"
233:               className="text-blue-800/60 hover:text-blue-800 text-xs font-bold transition-colors"
234:             >
235:               Track Repair
236:             </Link>
237:             <Link
238:               to="/auth"
239:               className="text-blue-800/60 hover:text-blue-800 text-xs font-bold transition-colors"
240:             >
241:               Admin Sign In
242:             </Link>
243:           </div>
244:         </div>
245:       </div>
246:     </footer>
247:   );
248: }
249: 
250: export function PublicLayout({ children }: { children: ReactNode }) {
251:   return (
252:     <div className="min-h-screen flex flex-col bg-white text-blue-950 selection:bg-blue-200 font-sans">
253:       <PublicHeader />
254:       <main className="flex-1 w-full flex flex-col">{children}</main>
255:       <PublicFooter />
256:     </div>
257:   );
258: }
