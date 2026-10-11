import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Read the terms for using Evigo's event, provider, hotel, tourism, combo-package, and transport services.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Introduction and acceptance",
    paragraphs: [
      "These Terms and Conditions apply to your access to and use of evigo.in and its related booking, discovery, account, and partner features. By using the website or submitting a request, you agree to these terms. If you do not agree, do not use the relevant feature.",
      "These terms are general informational terms and have not been represented as legal advice or as reviewed by a qualified lawyer. They should be reviewed against Evigo's legal entity, operating model, and applicable law before publication.",
    ],
  },
  {
    id: "services",
    title: "Evigo services and platform role",
    paragraphs: [
      "Evigo provides online discovery, enquiry, booking-request, and related tools for services that may include catering, photography, DJs, mehendi and makeup, restaurants, hotels and venues, travel and tourism, combo packages, and transport such as inter-city trips, hourly rentals, airport transfers, and railway pickups or drops.",
      "Unless a listing or transaction expressly says otherwise, a booking request connects a customer with an independent provider or partner. Evigo is a marketplace and technology platform for those interactions; it does not itself perform every listed service or control a third party's conduct, facilities, vehicles, staff, permits, or service quality. The contract for fulfilment may be directly between the customer and the provider or partner, subject to the actual transaction terms and applicable law.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and user responsibilities",
    paragraphs: [
      "Some booking, dashboard, or payment features require an account. The current sign-in flow uses email one-time-passcode authentication and may ask you to select a client or provider role. You are responsible for providing accurate information, keeping access to your email account secure, not sharing authentication codes, and promptly reporting suspected unauthorised use.",
      "You must use the website lawfully and provide information you are authorised to submit. You are responsible for reviewing details before submitting an enquiry, booking, provider application, or payment instruction.",
    ],
  },
  {
    id: "customer-requests",
    title: "Customer booking requests, changes, and cancellations",
    paragraphs: [
      "A customer request should include accurate contact details and the relevant service, schedule, guest or passenger, and location information requested by the form. Submitting a request is not by itself a guarantee of provider availability, a reservation, or a confirmed booking. Booking records may begin in a pending state and may require a provider response or further confirmation.",
      "Availability, service scope, timing, final price, and any applicable cancellation or change terms should be confirmed with the provider or partner before you rely on a booking. The website does not establish a universal cancellation window or change entitlement. To request a change or cancellation, use the available booking controls if offered or contact Evigo and the provider; the request may be subject to the provider's response and any terms communicated for that booking.",
    ],
  },
  {
    id: "providers",
    title: "Provider applications, listings, and responsibilities",
    paragraphs: [
      "Provider registration requests information such as owner and business name, category, contact details, location, price information, experience, description, and optional imagery. A submitted application is not an approval or guarantee of a listing. New applications may be pending and not bookable until reviewed or enabled through the platform.",
      "Providers are responsible for the accuracy and currency of their listing, availability, service descriptions, prices, qualifications, licences, permissions, and responses to customer requests. A verification label or platform status, where shown, reflects only the status communicated by Evigo and is not a guarantee of future conduct, service quality, or legal compliance.",
    ],
  },
  {
    id: "partners",
    title: "Hotel, venue, and transport partners",
    paragraphs: [
      "Hotel, venue, and transport information may be supplied by partners or compiled for discovery and enquiry features. Partners are responsible for the accuracy of their amenities, location, pricing, availability, safety information, and fulfilment. Transport requests may ask for pickup and drop-off locations, travel time, date, passenger count, and service category; the partner must confirm the actual trip details and availability.",
      "Do not treat an estimate, map result, listing, or enquiry response as a confirmed service unless the relevant provider or partner expressly confirms it. Users and partners should communicate any material requirements before the service is arranged.",
    ],
  },
  {
    id: "combo",
    title: "Travel and combo packages",
    paragraphs: [
      "Travel and tourism pages provide destination information, maps, attraction details, and links to relevant services. Information may change and should be checked with local authorities or the attraction before travel. Some districts or experiences may be marked as coming soon and are not thereby opened for booking.",
      "Combo-package requests may combine services from multiple providers. The request can be recorded as pending and routed to providers; a submitted request does not guarantee every component, final itinerary, availability, or completion. Confirm each component, inclusions, dates, total price, and applicable terms before payment or travel.",
    ],
  },
  {
    id: "pricing-payments",
    title: "Pricing, payments, and refunds",
    paragraphs: [
      "Prices displayed by providers or packages may be starting prices, estimates, or prices calculated from the package details supplied in the booking flow. The amount presented for a particular order should be confirmed before you authorise payment. Taxes, fees, inclusions, and any additional charges should be checked with the provider or shown at checkout.",
      "The website integrates with external payment gateways, including Razorpay and Cashfree, and may support payment methods offered by the selected gateway. Payment instructions, card or account details, and gateway terms are handled by the gateway. Evigo may receive transaction references, payment status, and refund status to associate the transaction with a booking.",
      "A payment initiation or booking request is not proof that payment succeeded or the service was confirmed. The website supports a gateway refund request flow for eligible successful payments, but a refund is not guaranteed by these terms: eligibility, amount, processing, timing, and outcome may depend on the transaction, gateway, provider terms, and applicable law. Contact support with the payment reference for help.",
    ],
  },
  {
    id: "disputes",
    title: "Complaints, disputes, and support",
    paragraphs: [
      "For a booking, service, or payment concern, contact the provider or partner involved and Evigo at support.evigo@gmail.com or 7808807340. Include the booking or payment reference and a concise description; do not email passwords, one-time passcodes, or complete payment-card details.",
      "Evigo may help relay information or investigate issues visible to the platform, but it cannot promise a particular resolution for a dispute between a customer and an independent provider. Nothing in these terms removes rights or remedies that cannot lawfully be excluded.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use and prohibited conduct",
    paragraphs: ["You must not use Evigo to:"],
    bullets: [
      "Submit false, misleading, unauthorised, fraudulent, or abusive information or booking requests.",
      "Impersonate another person or business, misuse another user's account, or attempt to obtain another person's authentication code.",
      "Interfere with the website, probe or bypass access controls, introduce malicious code, scrape or overload services, or use the platform in violation of law.",
      "Infringe another person's intellectual-property, privacy, or other rights, or use a listing or contact detail for spam, harassment, or unrelated solicitation.",
    ],
  },
  {
    id: "content",
    title: "Website content and intellectual property",
    paragraphs: [
      "The website's branding, software, design, and Evigo-created content are owned by Evigo or its licensors unless otherwise identified. Third-party names, listings, photographs, map tiles, and other materials may belong to their respective owners and may be subject to separate terms or licences.",
      "You must have the rights and permissions needed to submit text, images, or other material. You allow Evigo to use submitted material as reasonably necessary to display or administer your listing, request, or support interaction, subject to applicable law and the Privacy Policy. No broader transfer of ownership is implied.",
    ],
  },
  {
    id: "availability-liability",
    title: "Availability and limitation of liability",
    paragraphs: [
      "Evigo may update, suspend, or discontinue website features, listings, or integrations. The website and third-party information may be unavailable, delayed, incomplete, or inaccurate. To the extent permitted by applicable law, Evigo does not warrant uninterrupted website access or the acts, omissions, availability, or services of independent providers and partners.",
      "To the extent permitted by applicable law, Evigo is not responsible for indirect or consequential loss arising from use of the platform or a third-party service. These terms do not exclude liability that cannot lawfully be excluded, including any non-waivable consumer rights or liability imposed by law. The final wording and any applicable limitation must be reviewed by qualified counsel.",
    ],
  },
  {
    id: "suspension",
    title: "Suspension and termination",
    paragraphs: [
      "Evigo may restrict or suspend access where reasonably needed to protect users, investigate suspected fraud or misuse, comply with law, or address a material breach of these terms. Where practicable, Evigo may provide notice and an opportunity to resolve the issue. Account closure or suspension does not automatically cancel an existing booking or remove records that must be retained; contact support about outstanding requests.",
    ],
  },
  {
    id: "changes",
    title: "Changes to these terms",
    paragraphs: [
      "Evigo may revise these terms as services or requirements change. The current version will be posted on this page with a revised “Last updated” date. Continued use after an update constitutes acceptance only to the extent recognised under applicable law; where additional notice or consent is required, it should be obtained.",
    ],
  },
  {
    id: "law-disputes",
    title: "Governing law and dispute resolution",
    paragraphs: [
      "These terms are intended to be interpreted subject to applicable Indian law and mandatory consumer protections. Disputes should first be raised with Evigo through the support contacts below for an attempt at resolution. The appropriate court, jurisdiction, and any formal dispute process must be determined under applicable law; Evigo should confirm the precise governing-law and venue language with qualified legal counsel before publication.",
    ],
  },
  {
    id: "terms-contact",
    title: "Contact",
    paragraphs: [
      "For questions about these terms, a booking, or a complaint, email support.evigo@gmail.com or call 7808807340. You may also use the Evigo Contact page. Contact details and the legal name and address of the operating entity should be confirmed before these terms are published as final.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      title="Terms and Conditions"
      introduction="These terms explain how Evigo's event, travel, tourism, partner discovery, booking-request, and payment features may be used, and clarify the respective roles of Evigo and third-party providers."
      lastUpdated="10 October 2026"
      sections={sections}
    />
  );
}
