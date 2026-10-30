import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowLeft, FileText, Mail } from "lucide-react";
import { useStoreSettings } from "../lib/store";

/**
 * Shared shell for the Privacy Policy and Terms pages. The prose follows the
 * storefront's plain, short style. Bracketed placeholders are for the owner
 * to fill in (reviewed in the phase 5 report, not marked on the page itself).
 */

function LegalShell({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-10 sm:py-16">
      <nav className="flex items-center gap-2 text-[11px] text-ink-soft">
        <Link to="/" className="transition hover:text-ink">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-ink">{title}</span>
      </nav>
      <header className="mt-6 flex items-start gap-3">
        <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl bg-forest/[0.07] text-forest">
          <FileText className="size-4" />
        </span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-1 text-4xl leading-tight text-ink sm:text-5xl">{title}</h1>
          <p className="mt-2 text-[11px] text-ink-soft">Last updated: {updated}</p>
        </div>
      </header>
      <div className="mt-10 max-w-2xl space-y-8 pb-10 text-[14px] leading-relaxed text-ink-soft">
        {children}
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-[12px] text-forest underline underline-offset-4"
      >
        <ArrowLeft className="size-3.5" /> Back to the store
      </Link>
    </div>
  );
}

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium text-ink">{heading}</h2>
      {children}
    </section>
  );
}

/** Store contact line, filled from admin settings where they exist. */
function useContactLine(): string {
  const { settings } = useStoreSettings();
  const phone = settings.phone?.trim() || "[Store phone number]";
  const address = settings.address?.trim() || "[Shop address, Nimbahera, Rajasthan 312601]";
  return `${address}. Call us at ${phone}.`;
}

export function PrivacyPolicy() {
  const contact = useContactLine();

  return (
    <LegalShell eyebrow="Legal" title="Privacy Policy" updated="[Owner should set the date]">
      <p>
        This page explains what L MART ONLINE collects, why, and what we do with it. We are a
        single neighbourhood shop in Nimbahera, Rajasthan, not a large company, so this is written
        in plain words. If anything is unclear, call us.
      </p>

      <Section heading="Who we are">
        <p>
          Business name: [Owner name, trading as L MART]. Address: {contact} FSSAI licence number:
          [FSSAI licence number]. GST number, if registered: [GST number].
        </p>
      </Section>

      <Section heading="What we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Your name, phone number and delivery address, entered at checkout.</li>
          <li>Your order history: items, quantities, totals, delivery slot.</li>
          <li>Any note you write for the shop on an order.</li>
          <li>Your email address, if you create an account to sign in.</li>
        </ul>
        <p>
          We do not collect card details, bank details or location data. Payment is cash on
          delivery, so no payment information ever reaches this website.
        </p>
      </Section>

      <Section heading="Why we collect it">
        <p>
          Only to run the shop: to confirm your order, to deliver it to your door, to call you if
          something on your shelf is out of stock, and to let you see your past orders when you
          sign in. Your phone number is used by the shop or the delivery person to reach you about
          your order and to collect the cash amount.
        </p>
      </Section>

      <Section heading="How long we keep it">
        <p>
          Orders and account details are kept while the shop runs, because past orders are how we
          look up your address and resolve disputes about a delivery. This is usually a few years.
          You can ask for it to be deleted sooner and we will do it.
        </p>
      </Section>

      <Section heading="Who can see it">
        <p>
          The shop owner and the admin panel, and the delivery person who brings your order (they
          see your name, address, phone and the amount to collect). Our website host and our
          database service (Supabase) technically store the data; details are in the Terms. We do
          not sell or share your data with advertisers.
        </p>
      </Section>

      <Section heading="How to see or delete your data">
        <p>
          Call or message us with the phone number you ordered from. You can ask for a copy of what
          we have, a correction, or a full deletion. Deletion removes your orders, address and
          account. We may keep a minimal record of an unpaid order if it is needed to settle it.
        </p>
      </Section>

      <Section heading="Cookies and storage">
        <p>
          The site keeps a small amount of data in your browser (your basket, your half-filled
          checkout form, your scroll position) so returning to the page works. This stays on your
          device and never leaves it. We use no advertising or tracking cookies.
        </p>
      </Section>

      <Section heading="Questions">
        <p>{contact}</p>
      </Section>
    </LegalShell>
  );
}

export function TermsOfService() {
  const contact = useContactLine();

  return (
    <LegalShell eyebrow="Legal" title="Terms and Conditions" updated="[Owner should set the date]">
      <p>
        These are the terms for ordering from L MART ONLINE. By placing an order you agree to them.
        If you have a question, call us: that is genuinely the fastest way to sort anything out.
      </p>

      <Section heading="Who we are">
        <p>
          L MART ONLINE is the online ordering window of a single grocery and everyday-essentials
          shop. Business name: [Owner name, trading as L MART]. Address: {contact} FSSAI licence
          number: [FSSAI licence number]. GST number, if registered: [GST number].
        </p>
      </Section>

      <Section heading="Where and when we deliver">
        <p>
          Delivery area: PIN code 312601, Nimbahera, Rajasthan. Orders with any other PIN code are
          rejected at checkout. Delivery timing: [Opening hours, e.g. 9:00 AM to 9:00 PM daily] and
          the delivery time slot you choose at checkout. If the shop has to close for a festival or
          restock, the owner pauses checkout in the admin panel and the site will say so.
        </p>
      </Section>

      <Section heading="Prices and orders">
        <p>
          Prices are in rupees and shown with the product. The basket shows the total before you
          confirm, including any delivery fee. A minimum order value may apply and is shown on the
          checkout screen. An order is confirmed when the site shows you an order number. If the
          shop calls to change something on your order and you do not agree, you may cancel: you
          owe nothing.
        </p>
      </Section>

      <Section heading="Payment">
        <p>
          Cash on delivery only. The delivery person collects the exact amount shown on your order
          confirmation. Keep the amount ready if you can. No online payment is taken on this site
          at any point.
        </p>
      </Section>

      <Section heading="Cancellations and refunds">
        <p>
          You can cancel while the shop has not yet started packing: call us before your delivery
          slot. Once the order is out for delivery, it can still be refused at the door with no
          payment due. If an item is wrongly billed or damaged on arrival, tell the delivery person
          or call the shop the same day: we will either replace it, remove it from the bill, or
          refund it on the next order. Nothing here limits any rights you have under Indian law.
        </p>
      </Section>

      <Section heading="Substitutions">
        <p>
          If something on your shelf is out of stock when we pack, we call you before packing
          whenever it changes the order meaningfully. If you do not answer, we leave it out and
          reduce the amount you owe. We never bill you for an item we did not bring.
        </p>
      </Section>

      <Section heading="Data">
        <p>
          We collect the details needed to deliver to you (name, phone, address, order history) and
          nothing more. Full details are in the{" "}
          <Link to="/privacy" className="text-forest underline underline-offset-2">
            Privacy Policy
          </Link>
          . Our website uses our hosting provider (Cloudflare) and database provider (Supabase) to
          run; only you, the shop and the delivery person see your records.
        </p>
      </Section>

      <Section heading="Law and disputes">
        <p>These terms are governed by Indian law. {contact}</p>
      </Section>
    </LegalShell>
  );
}

export function Maintenance() {
  const contact = useContactLine();

  return (
    <div className="container-page flex flex-col items-center py-20 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-cream-2 text-forest">
        <Mail className="size-5" strokeWidth={1.6} />
      </span>
      <p className="eyebrow mt-6">Be right back</p>
      <h1 className="mt-2 max-w-lg text-balance text-4xl leading-[1.03] text-ink sm:text-5xl">
        We are restocking the shelves.
      </h1>
      <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-ink-soft">
        The store is closed for a short while. Please check back soon. {contact}
      </p>
      <Link to="/" className="btn btn-primary mt-7">
        Try the store again
      </Link>
    </div>
  );
}
