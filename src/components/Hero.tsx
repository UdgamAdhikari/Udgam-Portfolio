import React from 'react';
import { ArrowDown, Github, Linkedin, Mail } from 'lucide-react';

const Hero: React.FC = () => {
  const scrollToAbout = () => {
    const element = document.querySelector('#about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToProjects = () => {
    const section = document.querySelector('#projects');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative bg-black px-4 sm:px-6 lg:px-8">

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-pink-900/20"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl text-center space-y-10 pt-12 pb-28">

        <div className="flex justify-center mt-20">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gray-800">
            <img
              src="/Photo.jpg"
              alt="Udgam Adhikari"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
        </div>

    
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white">
            Hi, I'm <span className="text-purple-400">Udgam Adhikari</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Frontend Developer passionate about building beautiful and functional websites
          </p>
        </div>


        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={scrollToProjects}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg hover:scale-105 transition-transform duration-300"
          >
            View My Work
          </button>

              {/* <a
            href="/UdgamAdhikari_CV.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="border-2 border-gray-600 text-gray-300 px-8 py-3 rounded-full font-semibold hover:border-purple-400 hover:text-purple-400 transition-all duration-300"
          >
            View CV
          </a> */}
        </div>

        <div className="flex justify-center gap-4 pl-9 pt-4">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-110 transition-transform duration-300">
            <Github size={24} />
          </a>
          <a href="https://www.linkedin.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-110 transition-transform duration-300">
            <Linkedin size={24} />
          </a>
          <a href="https://mail.google.com/mail/u/0/#inbox" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-110 transition-transform duration-300">
            <Mail size={24} />
          </a>
          <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-110 transition-transform duration-300">
            <i className="fab fa-facebook-f text-lg"></i>
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-purple-400 hover:scale-110 transition-transform duration-300">
            <i className="fab fa-instagram text-lg"></i>
          </a>
        </div>


        <div className="mt-16">
          {/* <button
            onClick={scrollToAbout}
            className="text-gray-400 hover:text-purple-400 animate-bounce"
          >
            <ArrowDown size={28} />
          </button> */}
        </div>
      </div>
    </section>
  );
};

export default Hero;
