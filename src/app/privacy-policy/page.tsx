import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn what information Evigo collects through its event, travel, provider, and booking services and how it is used.",
};

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "Introduction and scope",
    paragraphs: [
      "This Privacy Policy describes how Evigo handles information when you browse evigo.in, create an account, contact us, submit a provider application, use travel or tourism features, or make a booking request. It applies to customers, visitors, service providers, hotel partners, and transport partners using the website.",
      "Evigo provides online discovery, communication, and booking-request tools. Some services are supplied by independent providers or partners, who may handle information under their own notices and practices.",
    ],
  },
  {
    id: "information",
    title: "Information we collect",
    paragraphs: [
      "The information collected depends on the feature you use. Forms and service workflows in the website request or record information including:",
    ],
    bullets: [
      "Account and authentication details, including email address, account identifier, selected client or provider role, and the email one-time passcode authentication flow.",
      "Contact details such as name, email address, phone number, and details you include in a support message.",
      "Booking and travel details such as requested service, provider or partner, event or travel dates and times, guest or passenger counts, pickup and drop-off locations, city, special requests, and combo package selections.",
      "Provider application details such as owner and business names, service category, email, phone, location, starting price, experience, description, and optional image URL.",
      "Payment-related records such as amount, currency, payment method, booking reference, payment gateway, transaction identifiers, and payment or refund status. Payments are routed through external payment gateways.",
      "Website visit data: page path and title, referring page when available, device category, browser user-agent, IP address from request headers, and a browser session identifier. When you are signed in, your account email may also be associated with a visit record.",
    ],
  },
  {
    id: "collection",
    title: "How information is collected",
    paragraphs: [
      "We receive information you enter into Evigo forms and booking flows, information generated as you navigate the website, and account or transaction status returned by authentication, database, email, notification, and payment services that support a requested feature. Some information is required to submit a particular request; optional fields are identified by the relevant form or are not required to submit it.",
    ],
  },
  {
    id: "use",
    title: "How we use information",
    bullets: [
      "Create and maintain accounts and authenticate users.",
      "Create, route, and administer booking and combo-package requests, including sharing relevant details with the provider or partner selected for the request.",
      "Communicate booking updates, service responses, account messages, and support replies by available email or in-app notification features.",
      "Create payment orders, verify transaction status, and process payment or refund operations through the selected gateway.",
      "Review provider registration submissions and manage provider listings and availability information.",
      "Respond to support and contact messages, protect the website from misuse, and maintain operational records.",
      "Understand website visits and improve the operation and presentation of Evigo.",
    ],
  },
  {
    id: "sharing",
    title: "When information is shared",
    paragraphs: [
      "Evigo shares information as needed to provide a feature you request and to operate the website. The recipients and data depend on your interaction:",
    ],
    bullets: [
      "A selected service provider, hotel partner, or transport partner may receive the contact, schedule, location, service, and request details needed to respond to or fulfil a booking request.",
      "Payment processors and gateways, including the configured Razorpay or Cashfree integrations, receive payment/order details needed to process and report a transaction. Their own terms and privacy notices apply to their processing.",
      "Authentication, database, email, mapping, notification, and hosting services may process information as technical service providers supporting the corresponding feature.",
      "Information may be disclosed when required to respond to legal process, protect users or the service, address suspected fraud or misuse, or enforce applicable terms.",
    ],
  },
  {
    id: "storage-technologies",
    title: "Cookies and browser storage",
    paragraphs: [
      "The website uses browser storage for certain functions. The account flow stores a small user-session profile in local storage, the Supabase browser authentication client maintains its authentication session, and the page-visit tracker stores a session identifier in session storage. These mechanisms support authentication or visit measurement; they are not described here as advertising cookies. Your browser settings can clear or restrict browser storage, but doing so may sign you out or affect website features.",
    ],
  },
  {
    id: "security-retention",
    title: "Data storage, security, and retention",
    paragraphs: [
      "Account, booking, provider, contact, visit, and payment records are stored or processed using the website's configured database, authentication, and service integrations. Access to some account and booking actions is authenticated. Information sent over the internet or held by external services carries risks; no specific security certification or absolute security guarantee is made by this policy.",
      "The codebase does not publish a fixed retention schedule. Records may be retained while needed to operate the requested service, maintain transaction and booking history, resolve questions or disputes, and meet applicable operational or legal requirements. Retention periods and deletion procedures should be confirmed by Evigo before publication.",
    ],
  },
  {
    id: "rights",
    title: "Your choices and account requests",
    paragraphs: [
      "You can contact Evigo to ask about personal information associated with your account, request correction of inaccurate contact details, or ask for deletion. We will review and respond to requests, subject to identity checks, technical limitations, pending bookings or transactions, and any records that need to be retained. The website does not currently present a self-service privacy request or account-deletion workflow in the reviewed code.",
      "You may manage or sign out of your account using the available account controls. Clearing local or session storage in your browser may affect sign-in and session-based website features.",
    ],
  },
  {
    id: "third-party-links",
    title: "Third-party services and external links",
    paragraphs: [
      "Evigo pages may link to or load services operated by others, including payment gateways, email and authentication services, map and directions providers, and partner websites. When you follow an external link or use a third-party checkout or map, that service's own privacy policy and terms govern its handling of your information. Evigo does not control external sites or their practices.",
    ],
  },
  {
    id: "children",
    title: "Children's privacy",
    paragraphs: [
      "Evigo's booking, account, and provider tools are intended for people able to use them under applicable law. The website is not designed to knowingly collect personal information directly from children. A parent or guardian who believes a child has submitted information may contact Evigo to request review and appropriate action.",
    ],
  },
  {
    id: "policy-updates",
    title: "Changes to this policy",
    paragraphs: [
      "Evigo may update this policy as its features or practices change. The updated version will be posted on this page with a revised “Last updated” date. Please review it periodically. Where a change requires additional notice under applicable law, Evigo should provide that notice through an appropriate channel.",
    ],
  },
  {
    id: "privacy-contact",
    title: "Privacy questions and requests",
    paragraphs: [
      "For privacy questions, access or correction requests, or concerns about information handling, email support.evigo@gmail.com or call 7808807340. Please avoid sending passwords, one-time passcodes, full payment-card details, or other sensitive authentication information by email.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      introduction="This policy explains the information Evigo collects through its event, travel, tourism, provider, and transport services, how that information is used, and the choices available to you."
      lastUpdated="10 October 2026"
      sections={sections}
    />
  );
}
