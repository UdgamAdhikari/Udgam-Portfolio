import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Hero from "@/components/hero/Hero";
import Assembly from "@/components/sections/Assembly";
import Services from "@/components/sections/Services";
import Stack from "@/components/sections/Stack";
import Work from "@/components/sections/Work";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";
import { getSite } from "@/server/content/site";

// Prerendered, then refreshed on demand when the dashboard changes content
// (revalidateTag); the hourly revalidate is only a safety net.
export const revalidate = 3600;

export default async function Home() {
  const site = await getSite();
  const { profile } = site;

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    url: profile.website,
    email: `mailto:${profile.email}`,
    image: profile.photo.startsWith("/") ? `${profile.website}${profile.photo}` : profile.photo,
    address: { "@type": "PostalAddress", addressLocality: "Kathmandu", addressCountry: "NP" },
    sameAs: profile.social.map((link) => link.href),
  };

  return (
    <>
      <Header profile={profile} />
      <main id="main">
        <Hero hero={site.hero} profile={profile} />
        <About about={site.about} />
        <Services />
        <Assembly />
        <Stack stack={site.stack} skillGroups={site.skillGroups} />
        <Work projects={site.projects} />
        <Contact contact={site.contact} profile={profile} />
      </main>
      <Footer profile={profile} projects={site.projects} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
