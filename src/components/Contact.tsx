import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Github, Linkedin, Instagram, Facebook } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

    setFormErrors({
      ...formErrors,
      [e.target.name]: ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const errors = {
      name: formData.name ? '' : 'Name is required',
      email: formData.email ? '' : 'Email is required',
      subject: formData.subject ? '' : 'Subject is required',
      message: formData.message ? '' : 'Message is required',
    };

    setFormErrors(errors);

    const hasError = Object.values(errors).some(error => error !== '');
    if (hasError) return;

    console.log('Form submitted:', formData);

  };

  const contactInfo = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: "Email",
      value: "udgamadhikari26@gmail.com",
      href: "udgamadhikari26@gmail.com"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Phone",
      value: "+977 9841164256",
      href: "tel:+9779841164256"
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Location",
      value: "Nepal",
      href: "#"
    }
  ];

  const socialLinks = [
    {
      icon: <Github className="w-5 h-5" />,
      href: "https://github.com/",
      label: "GitHub"
    },
    {
      icon: <Linkedin className="w-5 h-5" />,
      href: "https://www.linkedin.com/",
      label: "LinkedIn"
    },
    {
      icon: <Instagram className='w-5 h-5' />,
      href: "https://www.instagram.com/",
      label: "Instagram"
    },
    {
      icon: <Facebook className='w-5 h-5' />,
      href: "https://www.facebook.com/",
      label: "Facebook"
    }
  ];

  return (
    <section id="contact" className="py-20 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Get In Touch
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            I'm always interested in new opportunities and collaborations. Let's discuss how we can work together.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
    
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">
                Let's Start a Conversation
              </h3>
              <p className="text-lg text-gray-300 mb-8">
                Whether you have a project in mind, want to collaborate, or just want to say hello, 
                I'd love to hear from you. I typically respond within 24 hours.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <a 
                  key={index}
                  href={info.href}
                  className="flex items-center space-x-4 p-4 rounded-xl hover:bg-gray-800 transition-colors duration-200 group"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    {info.icon}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{info.title}</h4>
                    <p className="text-gray-400">{info.value}</p>
                  </div>
                </a>
              ))}
            </div>

            <div className="pt-8">
              <h4 className="font-semibold text-white mb-4">Follow Me</h4>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-gray-800 text-gray-400 rounded-xl flex items-center justify-center hover:bg-purple-600 hover:text-white transition-colors duration-200 hover:scale-110"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>


          <div className="relative">
            <div className="absolute -inset-0.5  rounded-2xl blur opacity-25"></div>
            <div className="relative bg-gray-800 p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-white mb-6">
                Send Me a Message
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                      placeholder="Name"
                    />
                    {formErrors.name && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Your Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                      placeholder="udgam@gmail.com"
                    />
                    {formErrors.email && (
                      <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                    placeholder="Project Collaboration"
                  />
                  {formErrors.subject && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none"
                    placeholder="Tell me about your project..."
                  />
                  {formErrors.message && (
                    <p className="text-sm text-red-500 mt-1">{formErrors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Send size={20} />
                  <span>Send Message</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
