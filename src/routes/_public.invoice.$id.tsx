import { createFileRoute } from '@tanstack/react-router'
import { getPublicInvoiceFn } from "@/lib/api/invoices";
import { Logo } from "@/components/logo";

export const Route = createFileRoute("/_public/invoice/$id")({
  loader: async ({ params }) => {
    try {
      return await getPublicInvoiceFn({ data: params.id });
    } catch (e) {
      return { invoice: null };
    }
  },
  component: PublicInvoicePage,
});

function PublicInvoicePage() {
  const { invoice, customer, shop, items } = Route.useLoaderData();

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
        <p className="text-muted-foreground">The invoice you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-6 md:py-12">
      <div className="bg-card border rounded-2xl shadow-sm p-8 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-6 border-b pb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">INVOICE</h1>
            <p className="text-muted-foreground mt-1">#{invoice.invoice_no}</p>
            <div className="mt-4 space-y-1">
              <p className="text-sm">
                <span className="text-muted-foreground">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className={`capitalize font-medium ${invoice.payment_status === "paid" ? "text-green-500" : "text-amber-500"}`}>
                  {invoice.payment_status}
                </span>
              </p>
            </div>
          </div>
          
          <div className="text-left sm:text-right">
            <Logo className="h-12 w-auto mb-4 sm:ml-auto object-contain" />
            <h2 className="font-semibold text-lg">{shop?.shop_name || "RK Repair Labs"}</h2>
            {shop?.shop_address && <p className="text-sm text-muted-foreground whitespace-pre-line">{shop.shop_address}</p>}
            {shop?.shop_phone && <p className="text-sm text-muted-foreground mt-1">Ph: {shop.shop_phone}</p>}
            {shop?.gst_number && <p className="text-sm text-muted-foreground">GSTIN: {shop.gst_number}</p>}
          </div>
        </div>

        <div className="mt-8 mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Billed To</h3>
          <p className="font-medium text-base">{customer?.name || "Walk-in Customer"}</p>
          {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
          {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
          {customer?.address && <p className="text-sm text-muted-foreground">{customer.address}</p>}
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Unit Price</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items?.map((item: any) => (
                <tr key={item.id} className="bg-card">
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                  <td className="px-4 py-3 text-right">₹{item.unit_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr className="bg-card">
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border-t pt-6 w-full max-w-sm ml-auto space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.discount && invoice.discount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span className="text-destructive">-₹{invoice.discount.toFixed(2)}</span>
            </div>
          ) : null}
          {invoice.tax_amount && invoice.tax_amount > 0 ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({invoice.tax_rate}%)</span>
              <span>₹{invoice.tax_amount.toFixed(2)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-bold border-t pt-3">
            <span>Total</span>
            <span>₹{invoice.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1">
            <span className="text-muted-foreground">Amount Paid</span>
            <span>₹{(invoice.amount_paid || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-[var(--neon)] pt-1">
            <span>Balance Due</span>
            <span>₹{Math.max(0, invoice.total - (invoice.amount_paid || 0)).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center space-y-2">
          {invoice.notes && <p className="text-sm">{invoice.notes}</p>}
          <p className="text-sm font-medium">Thank you for your business!</p>
          <button 
            onClick={() => window.print()}
            className="mt-4 px-6 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-full print:hidden hover:opacity-90 transition"
          >
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
