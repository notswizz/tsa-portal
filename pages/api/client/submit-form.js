import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variable
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// Pricing map for services
const PRICE_MAP = {
  consultation: 9900, // $99.00 in cents
  basic: 19900, // $199.00 in cents
  premium: 39900, // $399.00 in cents
  custom: 10000, // $100.00 in cents (placeholder for custom pricing)
};

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const formData = req.body;

    // Validate the form data
    if (!formData.firstName || !formData.lastName || !formData.email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the price based on the selected service
    const price = PRICE_MAP[formData.service] || PRICE_MAP.consultation;
    const serviceName = getServiceName(formData.service);
    
    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: serviceName,
              description: `The Smith Agency - ${serviceName}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        clientName: `${formData.firstName} ${formData.lastName}`,
        clientEmail: formData.email
      },
      mode: 'payment',
      success_url: `${req.headers.origin}/client/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/client?canceled=true`,
    });

    // Return the Stripe session ID to the client
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to get the service name
function getServiceName(serviceCode) {
  switch (serviceCode) {
    case 'consultation':
      return 'Initial Consultation';
    case 'basic':
      return 'Basic Package';
    case 'premium':
      return 'Premium Package';
    case 'custom':
      return 'Custom Service';
    default:
      return 'Service';
  }
} 