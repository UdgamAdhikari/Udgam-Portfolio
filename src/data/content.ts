// ─────────────────────────────────────────────────────────────
// SEED content. The live site reads from the database and is edited in the
// dashboard at /admin; this file (with src/content/work/<slug>.md for the
// case studies) is what `npm run db:seed` loads into an empty database, and
// the fallback for any setting that has never been saved.
// Anything still marked TO_CONFIRM renders as a visible placeholder.
// ─────────────────────────────────────────────────────────────

export const TO_CONFIRM = "TO_CONFIRM";

export const profile = {
  name: "Udgam Adhikari",
  role: "Frontend Developer",
  email: "udgamadhikari26@gmail.com",
  phone: "+977 9841164256",
  location: "Kathmandu, Nepal",
  photo: "/hero-photo.jpg",
  website: "https://udgamadhikari.com.np",
  resumeUrl: "/UdgamAdhikari_CV.pdf",
  social: [
    { label: "GitHub", href: "https://github.com/UdgamAdhikari" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/udgam-adhikari-6412b8321/" },
  ],
};

export const sections = [
  { id: "parts", number: "01", label: "Home" },
  { id: "about", number: "02", label: "About" },
  { id: "services", number: "03", label: "Services" },
  { id: "assembly", number: "04", label: "Process" },
  { id: "stack", number: "05", label: "Stack" },
  { id: "work", number: "06", label: "Work" },
  { id: "contact", number: "07", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

// The hero introduces the person first: the name is the headline, fitted to
// the full column by the display face's width axis.
export const hero = {
  name: ["Udgam Adhikari."],
  eyebrow: "Frontend Developer · Kathmandu",
  tagline: "Interfaces, built from parts that fit.",
  intro:
    "Since July 2024 I've been building responsive interfaces professionally: the reusable components they're made of, and the API wiring that makes them useful.",
};

// 04 — Process (section id "assembly"). Each step lights up as the bench
// assembles; the copy describes the day-to-day work the parts stand for.
export const assembly = {
  title: "How I build",
  lede: "Five stages. One evolving system.",
  hint: "Scroll, pick a stage, or drag the model",
  notes: [
    {
      part: "Understand",
      title: "Read the brief",
      body: "Who uses it, what they need to get done, and what the design and the existing APIs already give me.",
    },
    {
      part: "Break down",
      title: "Split it into parts",
      body: "Screens become a short list of reusable components and clear interfaces, each small enough to build well.",
    },
    {
      part: "Build",
      title: "Connect real data",
      body: "Typed React components wired to the API, with loading, empty and error states, not just the happy path.",
    },
    {
      part: "Refine",
      title: "Make it exact",
      body: "Every screen size checked, slow paths profiled, accessibility fixed. The details stop drifting.",
    },
    {
      part: "Ship",
      title: "Ship and listen",
      body: "Reviewed, merged and deployed. Then feedback from real use shapes the next pass.",
    },
  ],
};



export interface SkillGroup {
  title: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  { title: "Languages", skills: ["JavaScript (ES6+)", "TypeScript", "HTML5", "CSS3"] },
  {
    title: "Frameworks & libraries",
    skills: ["React", "Next.js", "Tailwind CSS", "shadcn/ui", "Node.js", "Express.js (beginner)"],
  },
  {
    title: "State & data",
    skills: ["React Context API", "Zustand", "REST APIs", "SQL", "PostgreSQL", "MongoDB"],
  },
  {
    title: "Tools & practice",
    skills: [
      "Responsive design",
      "Component architecture",
      "Performance optimisation",
      "Git & GitHub",
      "Docker",
      "Linux",
      "Vercel",
      "Postman",
    ],
  },
];

// 03 — Stack. The logo carousel. `icon` is a simple-icons slug; leave it
// out when there's no official mark, and the name is set as type instead.
export interface StackItem {
  name: string;
  icon?: string;
}

export const stack: StackItem[] = [
  { name: "HTML5", icon: "html5" },
  { name: "CSS", icon: "css" },
  { name: "JavaScript", icon: "javascript" },
  { name: "TypeScript", icon: "typescript" },
  { name: "React", icon: "react" },
  { name: "Next.js", icon: "nextdotjs" },
  { name: "Tailwind CSS", icon: "tailwindcss" },
  { name: "shadcn/ui", icon: "shadcnui" },
  { name: "Zustand" },
  { name: "Node.js", icon: "nodedotjs" },
  { name: "Express", icon: "express" },
  { name: "PostgreSQL", icon: "postgresql" },
  { name: "MongoDB", icon: "mongodb" },
  { name: "Docker", icon: "docker" },
  { name: "Linux", icon: "linux" },
  { name: "Git", icon: "git" },
  { name: "GitHub", icon: "github" },
  { name: "npm", icon: "npm" },
  { name: "Vercel", icon: "vercel" },
  { name: "Postman", icon: "postman" },
];

export interface Project {
  slug: string;
  title: string;
  /** One line for the work index. */
  summary: string;
  /**
   * A real screenshot of the project. Leave it out rather than using stock
   * or third-party art: without one, the project is pictured by the logos
   * of its technologies instead.
   */
  image?: { src: string; width: number; height: number };
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  /** Featured projects have a case study at /work/<slug>. */
  featured: boolean;
}

export const projects: Project[] = [
  {
    slug: "garud-security",
    title: "Garud Security",
    summary:
      "Security operations and management platform — system testing, API validation, load testing and performance work.",
    image: { src: "/projects/garud.png", width: 1440, height: 900 },
    technologies: ["Postman", "API testing", "Load & stress testing", "Benchmarking"],
    liveUrl: "https://garudsecurities.com.np",
    featured: true,
  },
  {
    slug: "heart-disease-prediction",
    title: "Heart Disease Prediction",
    summary:
      "CardioCare, a team project: a React app with sign-in that predicts heart-disease risk from 13 clinical measurements using a Random Forest model.",
    image: { src: "/projects/heart.png", width: 1440, height: 900 },
    technologies: ["React", "Firebase", "Python", "Flask", "scikit-learn"],
    githubUrl: "https://github.com/UdgamAdhikari/Heart-Diseases-System",
    featured: true,
  },
  {
    slug: "fielddesk",
    title: "FieldDesk",
    summary:
      "A support-ticket dashboard for multiple organisations, with role-based access that re-scopes every view to the signed-in user.",
    image: { src: "/projects/fielddesk.png", width: 1440, height: 900 },
    technologies: ["React", "TypeScript", "Tailwind CSS", "TanStack Query", "Zustand"],
    githubUrl: "https://github.com/UdgamAdhikari/Ticket-Management-System",
    liveUrl: "https://ticket-management-system-lake.vercel.app",
    featured: false,
  },
  {
    slug: "ecommerce",
    title: "Ecommerce Store",
    summary: "A storefront with category filtering, product options, a cart and dark mode.",
    image: { src: "/projects/ecommerce.png", width: 1440, height: 900 },
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "Zustand"],
    githubUrl: "https://github.com/UdgamAdhikari/Ecommerce",
    featured: false,
  },
];

export interface RecordEntry {
  period: string;
  title: string;
  place: string;
  kind: "Work" | "Study";
  points: string[];
}

export const record: RecordEntry[] = [
  {
    period: "Jul 2024 — Present",
    title: "Frontend Developer",
    place: "Kathmandu, Nepal",
    kind: "Work",
    points: [
      "Build responsive, interactive web interfaces for software projects.",
      "Develop reusable UI components and integrate them with REST APIs.",
      "Troubleshoot technical issues and optimise application performance.",
      "Work with the team to ship new features and improve existing systems.",
    ],
  },
];

// About. Written only from facts Udgam has provided. By request, the site
// names neither the current employer nor education.
export const about = {
  title: "The person at the bench",
  paragraphs: [
    "I've worked as a frontend developer since July 2024. Day to day I build interfaces, the reusable components behind them, and the connections to the APIs that feed them.",
    "I care about the details: clean code, smooth performance, and interfaces that feel effortless to use. I pick up new tools quickly and adapt when a project's requirements change.",
    "When I'm not at work I'm usually exploring new technologies, building personal projects, or sharing what I've learned with other developers.",
  ],
};

// What I do. Each service is something Udgam has shipped at work or in a
// listed project; `tools` are slugs from the stack below.
export interface Service {
  title: string;
  summary: string;
  points: string[];
  tools: string[];
}

export const services: { title: string; lede: string; items: Service[] } = {
  title: "What I do",
  lede: "The work I take on, from the first screen to the database behind it. Each one is something I do every week, not a line from a course.",
  items: [
    {
      title: "Frontend development",
      summary: "Production web apps in React and Next.js, written in TypeScript, that stay fast as they grow.",
      points: ["React & Next.js apps", "Typed, maintainable code", "Server & client rendering"],
      tools: ["react", "nextdotjs", "typescript", "javascript"],
    },
    {
      title: "Responsive UI",
      summary: "Interfaces that recompose for every screen size, built from reusable components instead of one-off pages.",
      points: ["Reusable component libraries", "Mobile-first layouts", "Accessible interactions"],
      tools: ["tailwindcss", "shadcnui", "html5", "css"],
    },
    {
      title: "API & database integration",
      summary: "Connecting interfaces to real data, so screens show live information and handle every state between request and response.",
      points: ["REST API integration", "PostgreSQL & MongoDB", "Node.js & Express routes"],
      tools: ["postgresql", "mongodb", "nodedotjs", "express"],
    },
    {
      title: "Performance & testing",
      summary: "Finding what makes an app slow or fragile and fixing it, with measurements before and after.",
      points: ["Performance profiling", "API & load testing", "Regression checks"],
      tools: ["postman", "git", "github"],
    },
    {
      title: "Shipping & deployment",
      summary: "Getting work from a branch to a live URL, and keeping it there.",
      points: ["Vercel & Linux deploys", "Docker containers", "Git workflows & reviews"],
      tools: ["vercel", "docker", "linux", "git"],
    },
  ],
};

export const contact = {
  title: ["One part", "left over."],
  lede: "If you're hiring for a frontend role, or have an interface that needs building, I'd like to hear about it.",
};
