import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PaystackButton } from 'react-paystack'; // Paystack button component
import { supabase } from '../../supabaseClient'; // Supabase client

const PaymentComponent = () => {
  const location = useLocation();
  const { plan } = location.state || {}; // Get plan data passed from SubscriptionPlans component
  const [storeId, setStoreId] = useState('');
  const [userId, setUserId] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [storeEmail, setStoreEmail] = useState('');
  const [paymentReady, setPaymentReady] = useState(false);

  useEffect(() => {
    const storedStoreId = localStorage.getItem('store_id');
    const storedUserId = localStorage.getItem('user_id');

    if (storedStoreId || storedUserId) {
      setStoreId(storedStoreId);
      setUserId(storedUserId);
      fetchEmails(storedUserId, storedStoreId);
    } else {
      console.error('Missing store_id or user_id');
    }
  }, []);

  // Fetch user/store email for payment processing
  const fetchEmails = async (user_id, store_id) => {
    try {
      if (user_id) {
        const { data: userData, error: userError } = await supabase
          .from('store_users')
          .select('email_address')
          .eq('id', user_id)
          .single();

        if (userError) throw userError;
        setUserEmail(userData.email_address);
      } else if (store_id) {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('email_address')
          .eq('id', store_id)
          .single();

        if (storeError) throw storeError;
        setStoreEmail(storeData.email_address);
      }

      setPaymentReady(true);
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };

  // Paystack configuration
  const paystackConfig = {
    email: userEmail || storeEmail, // Use user email or store email
    amount: plan?.price * 100, // Paystack expects amount in kobo (cents), so we multiply by 100
    publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY, // Public key from Paystack
    metadata: {
      store_id: storeId,
      user_id: userId,
      plan_id: plan?.id,
    },
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-lg shadow-xl mt-24">
      <h2 className="text-2xl font-semibold text-center mb-4">Complete Your Payment</h2>

      {paymentReady ? (
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Selected Plan: {plan?.name}</h3>
          <p className="text-gray-600 mb-4">{plan?.description}</p>
          <p className="text-lg font-bold text-gray-900">₦{plan?.price.toLocaleString()}</p>

          <div className="mt-6 text-center">
            <PaystackButton
              {...paystackConfig}
              className="bg-green-600 text-white py-3 px-6 rounded-full text-lg hover:bg-green-700 transition duration-300"
            >
              Pay Now
            </PaystackButton>
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Loading payment details...</p>
      )}
    </div>
  );
};

export default PaymentComponent;
