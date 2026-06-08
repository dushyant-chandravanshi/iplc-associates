export async function onRequestPost(context) {
    try {
        const { name, email, industry, service, matter } = await context.request.json();

        // Enforce strict backend validation safety
        if (!name || !email || !industry || !service || !matter) {
            return new Response("Missing required fields", { status: 400 });
        }

        // We access our secure Resend API Key saved in the Cloudflare Environment Settings
        const apiKey = context.env.RESEND_API_KEY; 

        // 1. Compile the notification email sent to the office admin
        const adminEmailBody = {
            from: "consultation@updates.iplcassociates.com",
            to: "email@iplcassociates.com",
            subject: `New Consultation Request: ${name}`,
            text: `New consultation booked.\n\nName: ${name}\nEmail: ${email}\nIndustry: ${industry}\nService: ${service}\nMatter: ${matter}`
        };

        // 2. Compile the automatic acknowledgement email confirmation sent to the client
        const clientEmailBody = {
            from: "consultation@updates.iplcassociates.com",
            to: email,
            subject: "Consultation Request Confirmed | IP & LC Associates",
            text: `Dear ${name},\n\nThank you for reaching out to IP & LC Associates. We have successfully received your consultation details regarding "${matter}" under the "${industry}" sector. Our legal team will review your message and contact you shortly.\n\nBest regards,\nIP & LC Associates`
        };

        // Dispatch email payload execution to the API cluster
        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(adminEmailBody)
        });

        await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(clientEmailBody)
        });

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
