import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
//import PricingPlans from './PricingPlans';




const features = {
  free: [
    '✅ Add up to 50 products',
    '✅ Basic sales tracking',
    '✅ Manage inventory, products, and pricing',
    '✅ Track expenses and debts',
    '✅ Sales history (last 30 days)',
    '❌ Team collaboration',
    '❌ Multi-store management',
    '❌ Staff training',
    '❌ Priority support',
    '❌ Printable receipts',
  ],
  premium: [
    '✅ Everything in Free Plan',
    '✅ Sales analytics',
    '✅ Full sales history & reports',
    '✅ Staff Onboarding',
    '✅ Priority customer support',
    '✅ Receipts printing',
    '✅ Single-Store Team Collaboration',
    '❌ Multi-store management',
    '❌ Product insights & analysis',
    
  ],
  business: [
    '✅ Everything in  Free + Premium Plan',
    '✅ Access to upto 3 Multi-store management',
    '✅ Dashboard Access and Monitoring',
    '✅ Product insights & analysis',
    '✅ Multi-store Team Management',
  ],
};

const SubscriptionPlansComponent = () => {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) {
        console.error('Error fetching plans:', error);
      } else {
        setPlans(data);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = (plan) => {
    const normalizedPlan = {
      ...plan,
      nameKey: plan.name?.toLowerCase().trim(),
    };
    navigate('/payment', { state: { plan: normalizedPlan } });
  };



















  
  return (
    
    <div className="p-2 max-w-7xl mx-auto grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        
      {plans.map((plan) => {
        const planKey = plan.name?.toLowerCase().trim();
        const isFree = plan.price === 0;
  
        return (
            
          <div
            key={plan.id}
            
            className={`bg-indigo-100 rounded-2xl border-t-4 shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between ${
              plan.name === 'Premium'
                ? 'border-blue-500'
                : plan.name === 'Business'
                ? 'border-purple-500'
                : 'border-green-500'
            }`}
          >
            <div>
                
              <h2
                className={`text-xl font-semibold mb-1 capitalize ${
                  plan.name === 'Premium'
                    ? 'text-blue-600'
                    : plan.name === 'Business'
                    ? 'text-purple-700'
                    : 'text-green-600'
                }`}
              >
                {plan.name} Plan
              </h2>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                {isFree ? '₦0' : `₦${plan.price.toLocaleString()}`}
                <span className="text-sm text-gray-500 font-normal"> /month</span>
              </p>
  
              <ul className="text-sm text-gray-700 space-y-2 mb-6">
                {(features[planKey] || features['free']).map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
  
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={isFree}
              className={`mt-auto py-2 px-4 w-full font-medium rounded-xl transition ${
                isFree
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : plan.name === 'Premium'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-purple-700 text-white hover:bg-purple-800'
              }`}
            >
              {isFree ? 'Current Plan' : `Subscribe to ${plan.name}`}
            </button>
          </div>
        );
      })}
    </div>
  );
    
};

export default SubscriptionPlansComponent;
