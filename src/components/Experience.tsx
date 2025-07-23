import React from 'react';
import { Calendar, MapPin, ExternalLink } from 'lucide-react';

const Experience: React.FC = () => {
  const experiences = [
    {
      title: "Senior Full-Stack Developer",
      company: "TechCorp Solutions",
      location: "San Francisco, CA",
      period: "2022 - Present",
      description: "Lead development of scalable web applications serving 100k+ users. Architected microservices infrastructure and mentored junior developers.",
      achievements: [
        "Reduced application load time by 40% through optimization",
        "Led team of 5 developers on flagship product",
        "Implemented CI/CD pipeline reducing deployment time by 60%"
      ],
      technologies: ["React", "Node.js", "AWS", "Docker", "PostgreSQL"]
    },
    {
      title: "Full-Stack Developer",
      company: "StartupXYZ",
      location: "San Francisco, CA",
      period: "2020 - 2022",
      description: "Developed and maintained multiple web applications in a fast-paced startup environment. Collaborated closely with design and product teams.",
      achievements: [
        "Built 3 major features that increased user engagement by 25%",
        "Optimized database queries resulting in 50% faster response times",
        "Established testing practices increasing code coverage to 85%"
      ],
      technologies: ["Vue.js", "Python", "MongoDB", "Redis", "GraphQL"]
    },
    {
      title: "Frontend Developer",
      company: "Digital Agency Pro",
      location: "San Francisco, CA",
      period: "2019 - 2020",
      description: "Created responsive websites and web applications for various clients. Focused on performance optimization and user experience.",
      achievements: [
        "Delivered 15+ client projects on time and within budget",
        "Improved website performance scores by average of 30%",
        "Collaborated with designers to implement pixel-perfect UIs"
      ],
      technologies: ["JavaScript", "React", "Sass", "Webpack", "Adobe Creative Suite"]
    }
  ];

  return (
    <section id="experience" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Work Experience
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            My professional journey building innovative solutions and leading development teams.
          </p>
        </div>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 md:left-1/2 transform md:-translate-x-1/2 w-0.5 h-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>

          <div className="space-y-12">
            {experiences.map((experience, index) => (
              <div 
                key={index}
                className={`relative flex flex-col md:flex-row ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center`}
              >
                {/* Timeline Dot */}
                <div className="absolute left-8 md:left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full border-4 border-white shadow-lg z-10"></div>

                {/* Content Card */}
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:mr-auto md:pr-8' : 'md:ml-auto md:pl-8'} ml-16 md:ml-0`}>
                  <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <Calendar size={16} />
                        <span>{experience.period}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <MapPin size={16} />
                        <span>{experience.location}</span>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {experience.title}
                    </h3>
                    <h4 className="text-lg font-semibold text-indigo-600 mb-4 flex items-center">
                      {experience.company}
                      <ExternalLink size={16} className="ml-2 opacity-50" />
                    </h4>

                    <p className="text-gray-700 mb-6 leading-relaxed">
                      {experience.description}
                    </p>

                    <div className="mb-6">
                      <h5 className="font-semibold text-gray-900 mb-3">Key Achievements:</h5>
                      <ul className="space-y-2">
                        {experience.achievements.map((achievement, achievementIndex) => (
                          <li 
                            key={achievementIndex}
                            className="flex items-start space-x-2 text-gray-700"
                          >
                            <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span>{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {experience.technologies.map((tech, techIndex) => (
                        <span 
                          key={techIndex}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 text-center">
          <button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300">
            Download Full Resume
          </button>
        </div>
      </div>
    </section>
  );
};

export default Experience;