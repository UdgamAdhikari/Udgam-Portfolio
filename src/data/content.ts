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
    "I'm a frontend developer with over two years of hands-on professional experience building responsive, production-ready web applications with React and Next.js.",
    "Since July 2024 I've been a Frontend Developer at Baseline Net Pvt. Ltd., where I build responsive, interactive interfaces and reusable UI components, integrate REST APIs, troubleshoot technical issues, and optimize application performance. I work closely with my team to deliver new features and improve the user experience of existing systems — and I care about the details: clean code, smooth performance, and interfaces that feel effortless to use.",
    "I'm a quick learner who adapts easily to new technologies, tools, and changing requirements. When I'm not coding, I'm exploring new technologies, building personal projects, and sharing knowledge with the developer community.",
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
    period: "July 2024 — Present",
    title: "Frontend Developer",
    place: "Baseline Net Pvt. Ltd.",
    description:
      "Contribute to software development projects by building responsive, user-friendly web interfaces and reusable UI components, integrating REST APIs, resolving technical issues, and optimizing application performance. Collaborate with the team to deliver new features and improve existing systems, adapting quickly to new technologies and changing project requirements.",
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
