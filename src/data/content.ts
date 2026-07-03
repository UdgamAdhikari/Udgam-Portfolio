// ─────────────────────────────────────────────────────────────
// ALL site content lives here. Edit this file to update the site.
// ─────────────────────────────────────────────────────────────

export const profile = {
  name: "Udgam Adhikari",
  firstName: "Udgam",
  role: "Frontend Developer",
  tagline:
    "I build fast, beautiful, and functional web experiences with React, Next.js and TypeScript.",
  bio: [
    "I'm a frontend developer with over a year of hands-on professional experience building scalable, production-ready web applications with React and Next.js.",
    "I work daily with TypeScript, REST API integration and component-based architecture, collaborating with UI/UX designers and backend engineers to ship features on schedule. I care about the details — clean code, smooth performance, and interfaces that feel effortless to use.",
    "When I'm not coding, I'm exploring new technologies, building personal projects, and sharing knowledge with the developer community.",
  ],
  email: "udgamadhikari26@gmail.com",
  phone: "+977 9841164256",
  location: "Kathmandu, Nepal",
  photo: "/Photo.jpg",
  website: "https://udgamadhikari.com.np",
  resumeUrl: "/UdgamAdhikari_CV.pdf",
  social: {
    github: "https://github.com/UdgamAdhikari",
    linkedin: "https://www.linkedin.com/in/udgam-adhikari-6412b8321/",
    instagram: "https://www.instagram.com/",
    facebook: "https://www.facebook.com/",
  },
};

export interface SkillGroup {
  title: string;
  skills: string[];
}

export const skillGroups: SkillGroup[] = [
  {
    title: "Languages & Core",
    skills: ["JavaScript (ES6+)", "TypeScript", "HTML5", "CSS3"],
  },
  {
    title: "Frameworks & Libraries",
    skills: ["React.js", "Next.js", "Node.js", "Express.js", "Tailwind CSS", "shadcn/ui"],
  },
  {
    title: "State & Data",
    skills: ["React Context API", "Zustand", "REST API Integration", "SQL", "MongoDB"],
  },
  {
    title: "Tools & Practices",
    skills: [
      "Git & GitHub",
      "Vercel",
      "npm",
      "Responsive Design",
      "Component Architecture",
      "Performance Optimization",
      "UI/UX Principles",
    ],
  },
];

export interface Stat {
  value: number;
  suffix: string;
  label: string;
}

export const stats: Stat[] = [
  { value: 1, suffix: "+", label: "Years of Experience" },
  { value: 20, suffix: "+", label: "React Components Shipped" },
  { value: 10, suffix: "+", label: "Projects Built" },
  { value: 2, suffix: "", label: "Companies Worked With" },
];

export interface Project {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  githubUrl?: string;
  liveUrl?: string;
  featured: boolean;
}

export const projects: Project[] = [
  {
    title: "Pharmacy Management System",
    description:
      "A real-world pharmacy management system with role-based access, inventory management, medicine catalog workflows, dashboard analytics, and scalable API integration.",
    image: "/image copy.png",
    technologies: ["Next.js", "TypeScript", "React Query", "Tailwind CSS", "Shadcn UI"],
    githubUrl: "https://github.com/UdgamAdhikari",
    featured: true,
  },
  {
    title: "Mobile Inventory Management System",
    description:
      "An inventory platform for mobile phone businesses — product management, stock tracking, purchase & sales workflows, supplier and customer management, and role-based access control.",
    image: "/mobile.png",
    technologies: ["Next.js", "TypeScript", "React Query", "Tailwind CSS", "Shadcn UI"],
    githubUrl: "https://github.com/UdgamAdhikari",
    featured: true,
  },
  {
    title: "Heart Disease Prediction System",
    description:
      "A machine-learning powered system that predicts heart disease risk from medical data, with secure authentication and personalized assessments for early detection and preventive care.",
    image: "/heart.png",
    technologies: ["React", "Flask", "Python", "HTML", "CSS"],
    githubUrl: "https://github.com/UdgamAdhikari/Heart-Diseases-System",
    featured: true,
  },
  {
    title: "Ecommerce Website",
    description:
      "A responsive e-commerce UI with React Context API for global state, dynamic cart operations, product filtering, and real-time inventory display.",
    image:
      "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80",
    technologies: ["React", "Context API", "Tailwind CSS"],
    githubUrl: "https://github.com/UdgamAdhikari/Ecommerce-Website",
    featured: false,
  },
  {
    title: "Movie Search Website",
    description:
      "A movie browsing platform integrating a third-party REST API with debounced live search and dynamic rendering for a smooth, optimized experience.",
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80",
    technologies: ["React", "REST API", "JavaScript"],
    githubUrl: "https://github.com/UdgamAdhikari",
    featured: false,
  },
  {
    title: "Admin Dashboard",
    description:
      "A responsive admin dashboard with rich functional features built on Shadcn components.",
    image: "/image.png",
    technologies: ["React", "Tailwind CSS", "JavaScript", "Shadcn UI"],
    githubUrl: "https://github.com/UdgamAdhikari/AdminDashboard",
    featured: false,
  },
];

export interface TimelineItem {
  period: string;
  title: string;
  place: string;
  description: string;
  type: "work" | "education";
}

export const timeline: TimelineItem[] = [
  {
    period: "April 2026 — Present",
    title: "Frontend Developer",
    place: "Autonomous Technology · Kathmandu, Nepal",
    description:
      "Engineered and maintained 20+ reusable React components integrated with REST APIs. Collaborated with UI/UX designers and backend engineers to ship features across multiple production releases, optimizing re-renders and lazy loading for faster page loads.",
    type: "work",
  },
  {
    period: "2025",
    title: "Frontend Developer",
    place: "Muktinath iTech · Kathmandu, Nepal",
    description:
      "Built and maintained web applications with a development team — component development, UI improvements, and codebase reviews under senior developer mentorship, using Git-based workflows in a production environment.",
    type: "work",
  },
  {
    period: "2021 — 2026",
    title: "BSc. Computer Science & IT (CSIT)",
    place: "Orchid International College — Tribhuvan University",
    description:
      "Studied computer science fundamentals — data structures, databases, and software engineering — while building real-world web projects alongside my degree.",
    type: "education",
  },
  {
    period: "2018 — 2020",
    title: "Higher Secondary Education (Science)",
    place: "Trinity International College",
    description: "Completed +2 Science under the National Examinations Board (NEB).",
    type: "education",
  },
];

export const navLinks = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Projects", href: "#projects" },
  { label: "Journey", href: "#experience" },
  { label: "Contact", href: "#contact" },
];
