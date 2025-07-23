import React from 'react';
import { Code, Lightbulb, Users, Trophy } from 'lucide-react';

const About: React.FC = () => {
  const highlights = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Clean Code",
      description: "Writing maintainable and scalable code"
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Creative Solutions",
      description: "Innovative approaches to web development"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "User-Focused",
      description: "Building experiences users love"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Quality Driven",
      description: "Committed to  excellency"
    }
  ];

  return (
    <section id="about" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            About Me
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Passionate frontend developer with a love for creating beautiful, functional, and user-centered digital experiences.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute -inset-1 rounded-lg blur opacity-25"></div>
              <div className="relative bg-gray-800 p-8 rounded-lg">
                <p className="text-lg text-gray-300 leading-relaxed mb-4">
                  I'm a passionate frontend developer who loves turning ideas into beautiful, interactive websites. 
                  My journey in web development started with curiosity and has grown into a deep passion for creating 
                  digital experiences that make a difference.
                </p>
                <p className="text-lg text-gray-300 leading-relaxed mb-4">
                  I specialize in modern web technologies and frameworks, always staying up-to-date with the latest 
                  trends and best practices in frontend development. I believe in writing clean, efficient code 
                  that not only works well but is also maintainable and scalable.
                </p>
                <p className="text-lg text-gray-300 leading-relaxed">
                  When I'm not coding, you can find me exploring new technologies, working on personal projects, 
                  or sharing knowledge with the developer community. I'm always excited to take on new challenges 
                  and collaborate on innovative projects.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {highlights.map((item, index) => (
              <div 
                key={index}
                className="relative group"
              >
                <div className="absolute -inset-0.5  rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-gray-800 p-6 rounded-2xl hover:bg-gray-750 transition-all duration-300">
                  <div className="text-purple-400 mb-3">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;