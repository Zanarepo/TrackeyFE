import React from 'react';
import { Link } from 'react-router-dom';
import Features from './LandingPageFeatures/Features';
import HowItWorks from './LandingPageFeatures/HowItWorks';
import UseCases from './LandingPageFeatures/UseCases'
import Reviews from './LandingPageFeatures/Reviews'
import WhosIsSellyticsFor from './LandingPageFeatures/WhosIsSellyticsFor'
//import PricingFeatures from './Payments/PricingFeatures'
import PricingPlans from './Payments/PricingPlans'
export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col-reverse md:flex-row items-center justify-between bg-white dark:bg-gray-900 px-6 md:px-20 py-16 gap-10">
        <div className="max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold text-indigo-900 dark:text-white leading-tight mb-6">
            Track Inventory, Sales & Expenses Effortlessly
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-8">
            Sellytics empowers SMEs  businesses to manage stock, monitor sales, set pricing, track expenses & more while improving business operations — all in one simple, mobile-friendly dashboard.
          </p>
          <Link to="/register">
            <button className="bg-indigo-700 hover:bg-indigo-600 text-white px-6 py-3 text-lg rounded-xl">
              Start for Free
            </button>
          </Link>
        </div>
        <div className="w-full md:w-[500px] h-[350px] flex items-center justify-center">
          <img
            src="images/welcome.jpg"
            alt="Nigerian shop owner managing inventory"
            className="w-full h-full object-cover rounded-xl shadow-lg"
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features">
        <Features />
      </section>


      <section id="features">
        <HowItWorks />
      </section>

 
      <section id="reviews">
        <PricingPlans/> 
      </section>
     




      <section id="features">
        < UseCases />
      </section>




      <section id="features"> 
        <  WhosIsSellyticsFor />
      </section> <br/>
     
      



      
      <section id="reviews">
        <  Reviews />
      </section>
     
     
    </>
  );
}
