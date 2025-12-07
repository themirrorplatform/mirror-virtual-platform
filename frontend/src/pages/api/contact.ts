import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ContactFormData {
  name: string;
  email: string;
  message: string;
  subject?: string;
  phone?: string;
}

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { name, email, message, subject, phone }: ContactFormData = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, email, and message are required.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format.',
      });
    }

    // Validate message length
    if (message.length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long.',
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: 'Message must be less than 5000 characters.',
      });
    }

    // Get client IP and user agent for tracking
    const ip_address = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
                       (req.headers['x-real-ip'] as string) || 
                       'unknown';
    const user_agent = req.headers['user-agent'] || 'unknown';

    // Insert into contact_submissions table
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert([
        {
          name,
          email,
          subject: subject || 'General Inquiry',
          message,
          phone,
          status: 'new',
          ip_address,
          user_agent,
          metadata: {
            referrer: req.headers.referer || null,
            timestamp: new Date().toISOString(),
          },
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit contact form. Please try again later.',
        error: error.message,
      });
    }

    // Optional: Trigger email notification (can be done via Supabase function or separate service)
    // await sendEmailNotification(data);

    return res.status(200).json({
      success: true,
      message: 'Thank you for your message. We will get back to you soon.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
