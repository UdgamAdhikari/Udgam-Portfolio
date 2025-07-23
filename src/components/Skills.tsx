import React from 'react';
import { 
  Code2, 
  Database, 
  Globe,
  Server,
  Smartphone,
  Palette,
  
} from 'lucide-react';

const Skills: React.FC = () => {
  const skillCategories = [
    {
      title: "Frontend Technologies",
      icon: <Code2 className="w-8 h-8" />,
      skills: ["HTML5", "CSS3", "JavaScript", "React"],
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Backend Development",
      icon: <Server className="w-8 h-8" />,
      skills: ["Node.js", "Python", "PHP"],
      color: "from-blue-500 to-purple-500"
    },
    {
      title: "Database",
      icon: <Database className="w-8 h-8" />,
      skills: ["MongoDB", "MySQL"],
      color: "from-green-500 to-blue-500"
    },
    {
      title: "Web Technologies",
      icon: <Globe className="w-8 h-8" />,
      skills: ["Responsive Design", "Web APIs", "DOM Manipulation", "ES6+"],
      color: "from-orange-500 to-red-500"
    },
    {
      title: "Development Tools",
      icon: <Palette className="w-8 h-8" />,
      skills: ["Git", "VS Code", "Chrome DevTools", "NPM"],
      color: "from-pink-500 to-purple-500"
    },
    {
      title: "WordPress & CMS",
      icon: <Smartphone className="w-8 h-8" />, 
      skills: ["WordPress", "Elementor", "Theme Customization", "Plugin Integration"],
      color: "from-indigo-500 to-blue-500"
    }
  ];

  return (
    <section id="skills" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Skills & Expertise
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            My technical toolkit for building modern web applications.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {skillCategories.map((category, index) => (
            <div 
              key={index}
              className="relative group"
            >
              <div className="absolute -inset-0.5  rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
              <div className="relative bg-gray-900 p-8 rounded-2xl hover:bg-gray-800 transition-all duration-300">
                <div className={`inline-flex p-3 rounded-xl  ${category.color} text-white mb-6`}>
                  {category.icon}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">
                  {category.title}
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill, skillIndex) => (
                    <span 
                      key={skillIndex}
                      className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm font-medium hover:bg-purple-900 hover:text-purple-300 transition-colors duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-gray-300 mb-8">
            Always learning and exploring new technologies to stay current with industry trends.
          </p>
          
        </div>
      </div>
    </section>
  );
};

export default Skills;
