import React from 'react';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Github size={20} />, href: "https://github.com/", label: "GitHub" },
    { icon: <Linkedin size={20} />, href: "https://www.linkedin.com/feed/", label: "LinkedIn" },
    { icon: <Twitter size={20} />, href: "https://x.com/home", label: "Twitter" },
    { icon: <Mail size={20} />, href: "mailto:udgamadhikari26@gmail.com", label: "Email" }
  ];

  const quickLinks = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Skills", href: "#skills" },
    { label: "Projects", href: "#projects" },
    { label: "Contact", href: "#contact" }
  ];

  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black text-white py-16 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12">

          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Udgam Adhikari
              </h3>
              <p className="text-gray-400 mt-2">
                Frontend Developer
              </p>
            </div>
            <p className="text-gray-300 leading-relaxed">
              Passionate frontend developer dedicated to creating beautiful, functional, and user-centered 
              web experiences that make a positive impact.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 text-gray-400 rounded-lg flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors duration-200"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

     
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(link.href)}
                    className="text-gray-400 hover:text-purple-400 transition-colors duration-200"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-6 text-white">Get In Touch</h4>
            <div className="space-y-3">
              <p className="text-gray-400">
                <span className="text-white font-medium">Email:</span><br />
                udgamadhikari26@gmail.com
              </p>
              <p className="text-gray-400">
                <span className="text-white font-medium">Phone:</span><br />
                +977 9841164256
              </p>
              <p className="text-gray-400">
                <span className="text-white font-medium">Location:</span><br />
                Nepal
              </p>
            </div>
          </div>
        </div>


        <div className="border-t border-gray-800 pt-8 mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} Udgam Adhikari. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
