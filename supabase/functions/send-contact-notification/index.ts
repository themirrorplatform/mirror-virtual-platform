// Supabase Edge Function: Send Contact Form Notification
// Triggered when a new contact submission is created
// Sends email notification to admin

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@themirrorplatform.online";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  created_at: string;
}

serve(async (req) => {
  try {
    const { record } = await req.json() as { record: ContactSubmission };

    // Send email notification using Resend
    if (RESEND_API_KEY) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "The Mirror Platform <noreply@themirrorplatform.online>",
          to: [ADMIN_EMAIL],
          subject: `New Contact Submission: ${record.subject}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>From:</strong> ${record.name} (${record.email})</p>
            ${record.phone ? `<p><strong>Phone:</strong> ${record.phone}</p>` : ""}
            <p><strong>Subject:</strong> ${record.subject}</p>
            <p><strong>Message:</strong></p>
            <p>${record.message}</p>
            <p><strong>Submitted:</strong> ${new Date(record.created_at).toLocaleString()}</p>
            <hr>
            <p><a href="https://themirrorplatform.online/admin/contacts">View in Admin Panel</a></p>
          `,
        }),
      });

      if (!emailResponse.ok) {
        console.error("Failed to send email:", await emailResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification sent" }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-contact-notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
