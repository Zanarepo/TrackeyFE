import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

const features = {
  free: [
    '✅ Add up to 50 products',
    '✅ Access to basic sales tracking',
    '✅ Manage inventory, products, and pricing',
    '✅ Track expenses and debts',
    '✅ Access to sales history (last 30 days)',
    '❌ Team collaboration',
    '❌ Multi-store management',
    '❌ Staff training resources',
    '❌ Priority support',
    '❌ Printable receipts',
  ],
  premium: [
    '✅ Everything in Free Plan',
    '✅ Sales analytics',
    '✅ Full sales history & reports',
    '✅ Staff training materials',
    '✅ Priority customer support',
    '✅ Receipts printing',
    '❌ Multi-store management',
  ],
  business: [
    '✅ Everything in Free + Premium Plan',
    '✅ Multi-store management',
    '✅ Product insights & analysis',
    '✅ Product Admin Dashboard & Monitoring',
  ],
};

const SubscriptionPlansComponent = () => {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase.from('subscription_plans').select('*').order('price');
      if (error) console.error('Error fetching plans:', error);
      else setPlans(data);
    };
    fetchPlans();
  }, []);

  const handleUpgrade = (planName, planPrice) => {
    localStorage.setItem('selected_plan', planName.toLowerCase());
    localStorage.setItem('selected_price', planPrice.toString());
    navigate(`/payment?plan=${planName.toLowerCase()}`);
  };

  return (
    <div className="p-4 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {/* Free Plan */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all p-6 flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold text-green-600 mb-1 flex items-center gap-2">
            🟢 Free Plan
          </h2>
          <p className="text-3xl font-extrabold text-gray-900 mb-4">₦0<span className="text-base font-medium text-gray-500">/month</span></p>
          <ul className="space-y-2 text-sm text-gray-700">
            {features.free.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <button className="mt-6 py-2 px-4 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition">
          Current Plan
        </button>
      </div>

      {/* Paid Plans */}
      {plans.map((plan) => (
        plan.price > 0 && (
          <div
            key={plan.id}
            className={`bg-white rounded-2xl border-t-[6px] ${
              plan.name === 'Premium' ? 'border-blue-500' : 'border-purple-500'
            } shadow-lg hover:shadow-xl transition-all p-6 flex flex-col justify-between`}
          >
            <div>
              <h2
                className={`text-2xl font-bold mb-1 flex items-center gap-2 ${
                  plan.name === 'Premium' ? 'text-blue-600' : 'text-purple-700'
                }`}
              >
                {plan.name === 'Premium' ? '🔵 Premium Plan' : '🟣 Business Plan'}
              </h2>
              <p className="text-3xl font-extrabold text-gray-900 mb-4">
                ₦{plan.price.toLocaleString()}
                <span className="text-base font-medium text-gray-500">/month</span>
              </p>
              <ul className="space-y-2 text-sm text-gray-700">
                {features[plan.name.toLowerCase()].map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade(plan.name, plan.price)}
              className={`mt-6 py-2 px-4 text-white font-semibold rounded-xl transition ${
                plan.name === 'Premium' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-700 hover:bg-purple-800'
              }`}
            >
              Upgrade to {plan.name}
            </button>
          </div>
        )
      ))}
    </div>
  );
};

export default SubscriptionPlansComponent;
