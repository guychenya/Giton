import React, { useState } from 'react';
import Icon from './Icon';
import { loadStripe } from '@stripe/stripe-js';
import { useUser } from '@clerk/clerk-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface PricingPageProps {
  isDarkMode?: boolean;
  onClose: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ isDarkMode = true, onClose }) => {
  const { user } = useUser();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) {
      alert('Please sign in to upgrade');
      return;
    }

    setIsUpgrading(true);
    try {
      const response = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const stripe = await stripePromise;
      
      if (stripe && data.sessionId) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out GitOn',
      features: [
        '10 repository analyses',
        'Basic AI documentation',
        'Community support',
        'Export to Markdown',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For professional developers',
      features: [
        'Unlimited repository analyses',
        'Advanced AI with GPT-4 & Claude',
        'Priority support',
        'Architecture diagrams',
        'PRD generation',
        'Export to PDF',
        'Save unlimited projects',
      ],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Team',
      price: '$49',
      period: 'per month',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Shared project library',
        'Custom AI models',
        'API access',
        'Dedicated support',
        'SSO & advanced security',
      ],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className={`relative backdrop-blur-xl border rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-gray-800/50 border-white/20' : 'bg-white border-gray-300'}`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur-xl border-b p-6 ${isDarkMode ? 'bg-gray-800/80 border-white/10' : 'bg-white/80 border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Simple, transparent pricing
              </h2>
              <p className={`mt-2 text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose the plan that's right for you
              </p>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border p-8 transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? isDarkMode
                      ? 'border-purple-500 bg-purple-900/20 shadow-lg shadow-purple-500/20'
                      : 'border-purple-500 bg-purple-50 shadow-lg shadow-purple-500/20'
                    : isDarkMode
                    ? 'border-white/10 bg-white/5'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className={`text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {plan.price}
                    </span>
                    <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      /{plan.period}
                    </span>
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (plan.name === 'Free') {
                      onClose();
                    } else if (plan.name === 'Pro') {
                      handleUpgrade();
                    } else {
                      window.location.href = 'mailto:info@reliatrrack.org?subject=GitOn Team Plan Inquiry';
                    }
                  }}
                  disabled={isUpgrading && plan.name === 'Pro'}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 mb-6 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50'
                      : isDarkMode
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isUpgrading && plan.name === 'Pro' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </button>

                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Icon icon="check" className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-purple-400' : 'text-green-400'}`} />
                      <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* FAQ Section */}
          <div className="mt-16">
            <h3 className={`text-2xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Frequently asked questions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Can I change plans later?
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Yes, you can upgrade or downgrade at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  What payment methods do you accept?
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  We accept all major credit cards, PayPal, and bank transfers for Team plans.
                </p>
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Is there a free trial?
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Yes! Pro plan includes a 14-day free trial. No credit card required.
                </p>
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Can I cancel anytime?
                </h4>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Absolutely. Cancel anytime with no questions asked. No hidden fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
