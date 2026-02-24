import Link from "next/link";
import SearchBar from "./SearchBar";
import {
  Timer,
  ShieldCheck,
  Users,
  Unlock,
  Bot,
  Sparkles,
  LayoutTemplate,
  Briefcase,
  Paintbrush,
} from "lucide-react";

const categories = [
  {
    icon: Unlock,
    title: "Unchained Freedom",
    slug: "unchained-freedom",
    description: "Course access, enrollment, and content playback issues",
    iconBg: "bg-[var(--color-blue-50)]",
    iconColor: "text-[var(--color-blue)]",
  },
  {
    icon: Bot,
    title: "InfoSuperAgent",
    slug: "infosuperagent",
    description:
      "Setup, configuration, and troubleshooting for your AI agent",
    iconBg: "bg-[var(--color-green-50)]",
    iconColor: "text-[var(--color-green-500)]",
  },
  {
    icon: Sparkles,
    title: "Advanced AI Monetization",
    slug: "advanced-ai-monetization",
    description:
      "Help with AI monetization strategies, tools, and course content",
    iconBg: "bg-[var(--color-orange-50)]",
    iconColor: "text-[var(--color-orange-500)]",
  },
  {
    icon: LayoutTemplate,
    title: "Origami Sites",
    slug: "origami-sites",
    description:
      "Website builder support for templates, domains, and publishing",
    iconBg: "bg-[var(--color-purple-50)]",
    iconColor: "text-[var(--color-purple-500)]",
  },
  {
    icon: Briefcase,
    title: "Cyber Staffing Agency",
    slug: "cyber-staffing-agency",
    description:
      "Staffing platform issues with profiles, matching, and contracts",
    iconBg: "bg-[var(--color-red-50)]",
    iconColor: "text-[var(--color-red-500)]",
  },
  {
    icon: Paintbrush,
    title: "Consistent Characters",
    slug: "consistent-characters",
    description:
      "AI art character consistency tools, settings, and image generation",
    iconBg: "bg-[var(--color-cyan-50)]",
    iconColor: "text-[var(--color-cyan-500)]",
  },
];

const steps = [
  {
    num: "1",
    title: "Choose a Product",
    description: "Select the product you need help with",
  },
  {
    num: "2",
    title: "Describe Your Issue",
    description: "Tell us what's happening and we'll create your account",
  },
  {
    num: "3",
    title: "Get a Response",
    description: "Our team will respond within 24 hours",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--color-white)]">
      {/* Header */}
      <header className="flex h-[72px] w-full items-center justify-between border-b border-[var(--color-gray-200)] px-20">
        <span className="text-[22px] font-bold tracking-[-0.5px] text-[var(--color-navy)]">
          JonathanSupport
        </span>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-[15px] font-medium text-[var(--color-gray-500)] hover:text-[var(--color-navy)] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/support"
            className="rounded-full bg-[var(--color-blue)] px-6 py-2.5 text-[14px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Submit a Ticket
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex w-full flex-col items-center gap-8 bg-gradient-to-b from-[var(--color-gray-100)] to-white px-20 py-20">
        <h1 className="text-center text-[52px] font-extrabold tracking-[-1.5px] text-[var(--color-navy)]">
          How can we help you today?
        </h1>
        <p className="max-w-[600px] text-center text-[18px] leading-[1.6] text-[var(--color-gray-500)]">
          Get support for any of our digital products. Submit a ticket and our
          team will get back to you quickly.
        </p>

        {/* Search Bar */}
        <SearchBar />

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/support"
            className="rounded-full bg-[var(--color-blue)] px-8 py-3.5 text-[15px] font-semibold text-white hover:opacity-90 transition-opacity"
          >
            Submit a Ticket
          </Link>
          <Link
            href="/login"
            className="rounded-full border-[1.5px] border-[var(--color-gray-200)] bg-white px-8 py-3.5 text-[15px] font-medium text-[var(--color-navy)] hover:bg-[var(--color-gray-50)] transition-colors"
          >
            Check Ticket Status
          </Link>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="flex w-full items-center justify-around bg-[var(--color-gray-50)] px-20 py-6">
        {[
          { icon: Timer, text: "Average response time: under 24 hours" },
          { icon: ShieldCheck, text: "Secure & private support" },
          { icon: Users, text: "Dedicated support team" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[var(--color-blue-50)]">
              <item.icon className="h-5 w-5 text-[var(--color-blue)]" />
            </div>
            <span className="text-[14px] font-medium text-[var(--color-gray-600)]">
              {item.text}
            </span>
          </div>
        ))}
      </section>

      {/* Product Categories */}
      <section className="flex w-full flex-col items-center gap-12 px-[120px] py-20">
        <h2 className="text-center text-[36px] font-bold tracking-[-0.5px] text-[var(--color-navy)]">
          What product do you need help with?
        </h2>
        <div className="grid w-full grid-cols-3 gap-5">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={`/support/${cat.slug}`}
              className="group flex flex-col gap-4 rounded-[16px] border-[1.5px] border-[var(--color-gray-200)] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-[12px] ${cat.iconBg}`}
              >
                <cat.icon className={`h-6 w-6 ${cat.iconColor}`} />
              </div>
              <span className="text-[18px] font-semibold text-[var(--color-navy)]">
                {cat.title}
              </span>
              <p className="text-[14px] leading-[1.5] text-[var(--color-gray-500)]">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
        <Link
          href="/support"
          className="text-[15px] font-medium text-[var(--color-blue)] hover:underline"
        >
          View all 16 products &rarr;
        </Link>
      </section>

      {/* How It Works */}
      <section className="flex w-full flex-col items-center gap-12 bg-[var(--color-gray-50)] px-[120px] py-20">
        <h2 className="text-center text-[36px] font-bold tracking-[-0.5px] text-[var(--color-navy)]">
          Getting help is easy
        </h2>
        <div className="flex w-full gap-8">
          {steps.map((step) => (
            <div
              key={step.num}
              className="flex flex-1 flex-col items-center gap-5 rounded-[16px] bg-white p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-blue)]">
                <span className="text-[24px] font-bold text-white">
                  {step.num}
                </span>
              </div>
              <span className="text-center text-[20px] font-semibold text-[var(--color-navy)]">
                {step.title}
              </span>
              <p className="text-center text-[15px] leading-[1.5] text-[var(--color-gray-500)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="flex w-full flex-col items-center gap-4 bg-[var(--color-navy)] px-20 py-10">
        <div className="flex items-center gap-8">
          <a
            href="#"
            className="text-[14px] text-[var(--color-slate-400)] hover:text-white transition-colors"
          >
            Privacy Policy
          </a>
          <span className="text-[14px] text-[var(--color-slate-500)]">
            &middot;
          </span>
          <a
            href="#"
            className="text-[14px] text-[var(--color-slate-400)] hover:text-white transition-colors"
          >
            Terms of Service
          </a>
        </div>
        <span className="text-[13px] text-[var(--color-slate-500)]">
          &copy; 2026 Dragon God, Inc.
        </span>
      </footer>
    </div>
  );
}
