import { createServerFn } from "@tanstack/react-start";

const SYSTEM_PROMPT = `You are the official representative and AI Assistant of CarrotHost, a premier web hosting company in Bangladesh.
CarrotHost offers the following high-performance services:
1. Domain Registration: Fully automated instant domain search and registration.
   - NOTE: You must NEVER mention, guess, or output domain prices directly to the user (e.g., do not say a .com is 1190 TK or any other number). If the user asks about domain availability, registration costs, TLD extensions, renewals, or pricing, you MUST output this exact message:
     "For real-time domain pricing and instant registration, please use our official portal: [Check Domain Pricing](https://portal.carrothost.com/cart.php?a=add&domain=register)"
2. Shared Hosting: Fast and reliable hosting powered by the Webuzo Control Panel. Webuzo is lightweight, faster, and more affordable than cPanel. It uses LiteSpeed Enterprise Web Servers and NVMe SSDs. It supports 100% Node-Free Google Tag Manager (GTM) Server-Side tracking proxies via Nginx proxy configs to bypass adblockers and capture 100% of conversion data.
3. BDIX VPS: KVM-based virtual servers connected directly to BDIX. Hosted in a Tier-III facility in Dhanmondi, Dhaka. Delivers lightning-fast sub-10ms local network latency in Bangladesh. Ideal for local news portals and e-commerce stores.
4. Xeon Cloud VPS: High-compute virtual servers powered by Intel Xeon Platinum processors on global cloud networks, managed via the Webdock dashboard panel. Perfect for heavy compilation, dynamic tests, and backend pipelines.
5. Free Migration: Free transfer from any host (cPanel/Webuzo) with zero downtime.
6. Support: 24/7 support over phone/WhatsApp (01787-882277) and email (support@carrothost.com).

Conversation Rules:
- Keep your tone professional, fast, helpful, and concise.
- Respond in the language the user uses (Bangla, English, or Banglish).
- If you suggest a URL link, format it as a standard Markdown link (e.g., [Hosting Plans](/hosting) or [BDIX VPS](/bdix-cloud-vps)).
- Only use standard pages:
  - Home: /
  - Shared Hosting: /hosting
  - BDIX VPS: /bdix-cloud-vps
  - Xeon VPS: /xeon-cloud-vps
  - About Us: /about-us
  - Contact / Submit Ticket: https://portal.carrothost.com/submitticket.php
  - Client Login: https://portal.carrothost.com/login
- Never guess pricing for domains! Always direct to the link above.`;

function getLocalFallbackResponse(query: string): string {
  const text = query.toLowerCase();

  if (text.includes("gtm") || text.includes("tracking") || text.includes("server-side") || text.includes("pixel")) {
    return "Our Webuzo Shared Hosting supports complete Node-free [GTM Server-Side Tracking](/hosting) via direct Nginx proxies, ensuring you capture 100% of your analytics and ad campaign data.";
  }
  if (text.includes("bdix") || text.includes("local") || text.includes("dhaka") || text.includes("ping")) {
    return "CarrotHost [BDIX VPS](/bdix-cloud-vps) plans are colocated in a Tier-III Dhaka data center, offering sub-10ms latency across Bangladesh. Great for local sites and tools.";
  }
  if (text.includes("xeon") || text.includes("intel") || text.includes("webdock")) {
    return "Our [Xeon Cloud VPS](/xeon-cloud-vps) runs on high-compute Intel Xeon Platinum nodes and features the Webdock remote dashboard panel for instant OS rebuilds and snapshots.";
  }
  if (text.includes("hosting") || text.includes("shared") || text.includes("webuzo") || text.includes("litespeed")) {
    return "Our [Webuzo Shared Hosting](/hosting) is built on NVMe SSDs and LiteSpeed Enterprise Web Servers. It starts at ৳4,200/year and includes free migration and professional email accounts.";
  }
  if (text.includes("migrate") || text.includes("migration") || text.includes("transfer")) {
    return "We offer 100% free hosting migration from cPanel/Webuzo. Our engineers handle everything with zero downtime. Contact our [Support Team](https://wa.me/8801787882277) to start.";
  }
  if (text.includes("support") || text.includes("contact") || text.includes("phone") || text.includes("whatsapp") || text.includes("number")) {
    return "You can contact CarrotHost support 24/7/365 at:\n• Phone/WhatsApp: 01787-882277\n• Email: support@carrothost.com\n• [Submit a Ticket](https://portal.carrothost.com/submitticket.php)";
  }
  if (text.includes("vps") || text.includes("server")) {
    return "We offer local [BDIX VPS](/bdix-cloud-vps) (Dhaka latency <10ms) and global [Xeon Cloud VPS](/xeon-cloud-vps) (powered by Intel Xeon Platinum). Which fits your workload best?";
  }

  return "Hello! I am your CarrotHost assistant. I can guide you through our Webuzo shared hosting, local BDIX VPS, Xeon cloud servers, or server-side GTM tracking setup. How can I help you today?";
}

export const chatResponseFn = createServerFn({ method: "POST" })
  .validator((data: { messages: Array<{ role: "user" | "assistant"; content: string }> }) => data)
  .handler(async ({ data }) => {
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY;

      // 1. Prioritize Gemini API
      if (geminiKey) {
        const contents = data.messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.content }],
        }));

        const apiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: SYSTEM_PROMPT }],
              },
              contents: contents,
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 500,
              },
            }),
          }
        );

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error("Gemini API returned an error:", errorText);
          throw new Error(`Gemini error: ${apiResponse.statusText}`);
        }

        const resJson = (await apiResponse.json()) as {
          candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
        };
        const reply = resJson.candidates[0]?.content?.parts[0]?.text || "";

        return { response: reply };
      }

      // 2. Fallback to OpenAI API if no Gemini key but OpenAI key is set
      if (openaiKey) {
        const apiMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];

        const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: apiMessages,
            temperature: 0.5,
            max_tokens: 500,
          }),
        });

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error("OpenAI API returned an error:", errorText);
          throw new Error(`OpenAI error: ${apiResponse.statusText}`);
        }

        const resJson = (await apiResponse.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        const reply = resJson.choices[0]?.message?.content || "";

        return { response: reply };
      }

      // 3. Fallback to local heuristics if no keys are defined
      console.warn("No API key defined. Using local heuristics engine fallback.");
      const lastUserMessage = data.messages.filter((m) => m.role === "user").pop();
      const fallbackText = getLocalFallbackResponse(lastUserMessage?.content ?? "");
      return { response: fallbackText };
      
    } catch (error: any) {
      console.error("API Chat handler error:", error);
      throw new Error(error.message || "Internal Server Error");
    }
  });
