import PricingFeatures from './PricingFeatures';

const PricingPlans = () => {
  return (
    <div className="bg-gradient-to-r from-blue-100 to-blue-50 py-20 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-6">
          Choose Your Perfect Plan
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Whether you're just starting or looking to expand, we offer flexible plans to meet your needs. 
          Select from our Free, Premium, and Business Plans to find the one that's right for you.
        </p>
        <p className="text-lg text-gray-600 mb-12">
          Every plan is designed to help you grow, with scalable features and advanced tools.
        </p>
        
        {/* Explore Plans Button */}
        <div className="flex justify-center">
          <button className="px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-full hover:bg-blue-700 transition-all transform hover:scale-105">
            Explore Plans
          </button>
        </div>
      </div>

      {/* Pricing Features Section */}
      <div className="max-w-7xl mx-auto mt-16">
        <PricingFeatures />
      </div>
    </div>
  );
};

export default PricingPlans;
