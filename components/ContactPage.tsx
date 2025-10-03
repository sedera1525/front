import React from 'react';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { MailIcon } from './icons/MailIcon';

const ContactPage: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left Column: Contact Info */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Contactez-nous
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Une question, une suggestion ou simplement envie de dire bonjour ? N'hésitez pas à nous contacter. Notre équipe est là pour vous aider.
            </p>
            <div className="mt-12 space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-3">
                  <LocationMarkerIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Adresse</h3>
                  <p className="text-gray-600">123 Adventure Lane, Explore City, World</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-3">
                  <PhoneIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Téléphone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 bg-blue-100 text-blue-600 rounded-full p-3">
                  <MailIcon />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 text-lg">Email</h3>
                  <p className="text-gray-600">contact@adventuretoday.com</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column: Image */}
          <div className="flex items-center justify-center">
            <img 
              src="https://picsum.photos/seed/contact-image/800/1000" 
              alt="A kayaker paddling in a serene lake"
              className="rounded-lg shadow-xl w-full h-full object-cover max-h-[600px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactPage;
