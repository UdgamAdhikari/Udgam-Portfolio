import React from "react";
import { ExternalLink, Github, ArrowRight } from "lucide-react";

const Projects: React.FC = () => {
  const projects = [
    {
      title: "Heart Disease Prediction System",
      description:
        "This is a Heart Disease Prediction System built with machine learning to predict the risk of heart disease based on user medical data. It features secure authentication for users, allowing personalized assessments. The system provides fast and accurate predictions and helps users understand their health status. It can be used as a decision-support tool for early detection and preventive care",
      image: "/heart.png",
      technologies: ["React", "Flask", "CSS", "HTML"],
      liveUrl: "#",
      githubUrl: "https://github.com/UdgamAdhikari/Heart-Diseases-System",
      featured: true,
    },

    {
      title: "Ecommerce Website",
      description:
        "A modern, responsive e-commerce website designed with a clean and visually appealing interface that enhances user engagement and usability. The platform features well-organized product listings, intuitive navigation, and a smart search system that allows users to quickly browse, filter, and discover products with ease. Its responsive design ensures a seamless shopping experience across desktops, tablets, and mobile devices. Smooth interactions, clear product presentation, and user-friendly layouts create an efficient and enjoyable purchasing journey, helping users explore products effortlessly while maintaining fast performance and accessibility.",
      image:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80", // example ecommerce image
      technologies: ["React", "CSS", "Firebase"],

      githubUrl: "https://github.com/UdgamAdhikari/Ecommerce-Website",
      featured: true,
    },
    {
      title: "Portfolio Website",
      description:
        "A responsive personal portfolio website showcasing projects, skills, and experience. Built with modern design principles and smooth animations.",
      image:
        "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
      technologies: ["React", "Tailwind CSS", "JavaScript"],
      githubUrl:
        "https://github.com/UdgamAdhikari/Udgam-Portfolio/tree/main/src",
    },

    {
      title: "Dashboard",
      description:
        "A responsive dashboard with different functional features using shadcn components",
      image: "/image.png",
      technologies: ["React", "Tailwind CSS", "JavaScript", "Shadcn"],
      githubUrl: "https://github.com/UdgamAdhikari/AdminDashboard",
    },

{
  title: "Pharmacy Management System",
  description:
    "A real-world pharmacy management system built with Next.js and TypeScript featuring role-based access, inventory management, medicine catalog workflows, dashboard analytics, and scalable API integration.",
  image: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1200&q=80",
  technologies: [
    "Next.js",
    "TypeScript",
    "React Query",
    "Tailwind CSS",
    "Shadcn UI"
  ],
  githubUrl: "https://github.com/your-repo",
  featured: true
},
  ];

  const featuredProjects = projects.filter((project) => project.featured);
  const otherProjects = projects.filter((project) => !project.featured);

  return (
    <section id="projects" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            My Projects
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A collection of projects that showcase my skills and passion for
            frontend development.
          </p>
        </div>

        <div className="space-y-20 mb-20">
          {featuredProjects.map((project, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
              } gap-12 items-center`}
            >
              <div className="lg:w-1/2">
                <div className="relative group overflow-hidden rounded-2xl">
                  <div className="absolute -inset-0.5  rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                  <div className="relative overflow-hidden rounded-2xl">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-64 lg:h-80  transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0  opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex space-x-3">
                        <a
                          target="_blank"
                          href={project.githubUrl}
                          className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold  transition-colors"
                        >
                          <Github size={16} />
                          <span>Code</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/2 space-y-6">
                <h3 className="text-3xl font-bold text-white">
                  {project.title}
                </h3>
                <p className="text-lg text-gray-300 leading-relaxed">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 text-purple-300 rounded-full text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="flex space-x-4">
                  <a
                    href={project.liveUrl}
                    className="inline-flex items-center space-x-2 text-purple-400 font-semibold transition-colors"
                  >
                    <span>View Project</span>
                    <ArrowRight size={16} />
                  </a>
                  <a
                    href={project.githubUrl}
                    className="inline-flex items-center space-x-2 text-gray-400 font-semibold  transition-colors"
                  >
                    <Github size={16} />
                    <span>Source Code</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Other Projects
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherProjects.map((project, index) => (
              <div key={index} className="relative group">
                <div className="absolute -inset-0.5  rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition-all duration-300">
                  <div className="relative group overflow-hidden">
                    <img
                      src={project.image}
                      alt={project.title}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex space-x-2">
                        <a
                          href={project.liveUrl}
                          className="p-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <ExternalLink size={16} />
                        </a>
                        <a
                          href={project.githubUrl}
                          className="p-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                          <Github size={16} />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="text-xl font-bold text-white mb-2">
                      {project.title}
                    </h4>
                    <p className="text-gray-400 mb-4 line-clamp-3">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies
                        .slice(0, 3)
                        .map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      {project.technologies.length > 3 && (
                        <span className="px-2 py-1 bg-gray-700 text-gray-400 rounded text-xs">
                          +{project.technologies.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
