import { createServerFn } from "@tanstack/react-start";

const SYSTEM_PROMPT = `You are the official representative and AI Assistant of CarrotHost, a premier web hosting company in Bangladesh.
CarrotHost offers the following high-performance services and exclusive solutions:

1. Domain Registration: Fully automated instant domain search and registration.
   - CRITICAL RULE: You must NEVER mention, guess, or output domain prices directly to the user (e.g., do not say a .com is 1190 TK or any other number). If the user asks about domain availability, registration costs, TLD extensions, renewals, or pricing, you MUST output this exact message:
     "For real-time domain pricing and instant registration, please use our official portal: [Check Domain Pricing](https://portal.carrothost.com/cart.php?a=add&domain=register)"

2. Webuzo Shared Cloud Hosting:
   - Lightweight, faster, and more modern than cPanel. Built on NVMe SSDs and Speedy Cache (enterprise acceleration).
   - Starts at ৳4,200/year and includes free migration, SSL, and business email.
   - Explore plans at: [Shared Hosting Plans](/hosting).

3. 100% Node-Free Server-Side Tracking Facility (Exclusive to CarrotHost):
   - Solves the heavy RAM leakage, expensive monthly costs, and crashing issues of Stape.io and Google Cloud Platform (GCP).
   - Stape.io and GCP cost $20–$100+/month and run heavy Node.js/Docker containers that frequently run out of memory.
   - CarrotHost uses a native C-level Nginx reverse proxy engine embedded directly in the web server: 0 MB memory leak, <10ms execution, and 100% free with CarrotHost hosting!
   - Details: [Node-Free Server-Side Tracking](/hosting).

4. Official WordPress Tracking Plugin (Carrothost Server-Side Tracker v1.3.5):
   - Download file: carrothost-server-side-tracker.zip (available directly on site or at /wordpress-plugin).
   - How to Install & Configure:
     Step 1: Download 'carrothost-server-side-tracker.zip'. In WP Admin, go to Plugins > Add New > Upload Plugin > Activate.
     Step 2: Go to 'Carrothost SST' in WP Admin sidebar > Configuration tab.
     Step 3: Enter your Meta Pixel ID and Meta Conversions API (CAPI) Access Token (generated from Facebook Events Manager > Settings > Conversions API > Generate Access Token).
     Step 4: Enter your GTM Container ID (e.g. GTM-XXXXXXX) to activate first-party proxy delivery via '/metrics/gtm.js?id=GTM-XXXXXXX'.
     Step 5: Go to 'Connection Health & Logs' tab and click '⚡ Run Test Ping Now' to verify '200 OK' for both Nginx GTM proxy and Meta CAPI.
     Step 6: WooCommerce Auto-Tracking: Automatically tracks ViewContent, AddToCart, InitiateCheckout, and Purchase events with SHA-256 customer data hashing (email, phone, IP) for 9.5+ Event Match Quality (EMQ).
   - Full setup guide: [WordPress Plugin Documentation](/wordpress-plugin).

5. 100% Free Website Migration (Zero Downtime Guarantee):
   - Senior engineers transfer full cPanel/Webuzo files, MySQL databases, professional email inboxes/history, and SSL certificates with zero downtime within 2–4 hours.
   - Free configuration of the tracking plugin and Speedy Cache after migration.
   - Request migration at: [Migrate to Us](/migrate-to-us).

6. Live System Status & Uptime Monitoring:
   - Real-time TCP socket probes across all server nodes: BDIX Dhaka Node (8ms), Email & Webmail Cluster (58ms), Xeon Cloud VPS (231ms), and Webuzo Shared Cloud (256ms).
   - 99.98% 90-day uptime track record.
   - Check live status at: [System Status](/system-status).

7. BDIX Cloud VPS:
   - KVM-based virtual servers connected directly to BDIX. Hosted in a Tier-III facility in Dhanmondi, Dhaka.
   - Sub-10ms local network latency in Bangladesh. Ideal for local e-commerce, ERP, and news portals: [BDIX VPS](/bdix-cloud-vps).

8. Xeon Cloud VPS:
   - High-compute virtual servers powered by Intel Xeon Platinum processors on global cloud networks, managed via the Webdock dashboard: [Xeon Cloud VPS](/xeon-cloud-vps).

9. Support:
   - 24/7 technical team reachable via Phone/WhatsApp (01787-882277) and Email (support@carrothost.com).
   - Support Ticket: [Submit Ticket](https://portal.carrothost.com/submitticket.php).

Conversation Rules:
- Keep your tone professional, enthusiastic, fast, helpful, and concise.
- Respond in the language the user uses (Bangla, English, or Banglish).
- Format links as standard Markdown links (e.g. [WordPress Plugin Guide](/wordpress-plugin) or [Migrate to Us](/migrate-to-us)).
- Only use standard pages:
  - Home: /
  - Shared Hosting: /hosting
  - BDIX VPS: /bdix-cloud-vps
  - Xeon VPS: /xeon-cloud-vps
  - WordPress Plugin Setup: /wordpress-plugin
  - Migrate to Us: /migrate-to-us
  - System Status: /system-status
  - WHOIS Tool: /whois
  - About Us: /about-us
  - Contact / Submit Ticket: https://portal.carrothost.com/submitticket.php
  - Client Login: https://portal.carrothost.com/login
- Never guess domain prices! Always direct to the official portal link above.`;

function getLocalFallbackResponse(query: string): string {
  const text = query.toLowerCase();

  // WordPress Plugin & Tracking setup
  if (
    text.includes("plugin") ||
    text.includes("setup") ||
    text.includes("install") ||
    text.includes("configure") ||
    text.includes("carrothost-server-side-tracker") ||
    text.includes("প্লাগইন") ||
    text.includes("ইন্সটল") ||
    text.includes("সেটআপ")
  ) {
    return "CarrotHost Server-Side Tracker প্লাগইন সেটআপ করার সহজ ধাপ:\n\n1. [WordPress Plugin Guide](/wordpress-plugin) থেকে `carrothost-server-side-tracker.zip` ডাউনলোড করে WP Admin > Plugins > Add New থেকে আপলোড ও অ্যাক্টিভ করুন।\n2. WP Admin-এর 'Carrothost SST' মেনুতে গিয়ে আপনার **Meta Pixel ID** ও **CAPI Access Token** দিন।\n3. ফার্স্ট-পার্টি প্রক্সির জন্য আপনার **GTM Container ID** (যেমন: `GTM-XXXXXXX`) বসিয়ে Save করুন।\n4. 'Connection Health' ট্যাবে গিয়ে **⚡ Run Test Ping Now** দিয়ে 200 OK স্ট্যাটাস নিশ্চিত করুন।\n5. WooCommerce-এর জন্য ViewContent, AddToCart, Purchase স্বয়ংক্রিয়ভাবে ৯.৫+ EMQ স্কোর সহ ট্র্যাক হবে!\n\nবিস্তারিত গাইড ও ডাউনলোড লিংক: [WordPress Plugin Documentation](/wordpress-plugin)";
  }

  // Node-Free Tracking vs Stape / GCP / Pixel / CAPI
  if (
    text.includes("gtm") ||
    text.includes("tracking") ||
    text.includes("server-side") ||
    text.includes("node-free") ||
    text.includes("stape") ||
    text.includes("pixel") ||
    text.includes("capi") ||
    text.includes("ট্র্যাকিং")
  ) {
    return "CarrotHost-এ রয়েছে **100% Node-Free Server-Side Tracking** সুবিধা!\n\n• **কেন এটি সেরা?** Stape.io বা Google Cloud-এর মতো প্রতি মাসে $20-$100 ডলার খরচ নেই এবং কোনো হেভি Node.js মেমোরি লিক নেই।\n• **কিভাবে কাজ করে?** সরাসরি আমাদের Nginx C-ইঞ্জিনে ফার্স্ট-পার্টি প্রক্সি দিয়ে চলে (লেটেন্সি <10ms)।\n• অ্যাডব্লকার ও Safari ITP বাইপাস করে শতভাগ কনভার্সন ডাটা ট্র্যাক করে।\n\nবিস্তারিত জানুন: [Shared Hosting & Tracking Plans](/hosting) অথবা গাইড দেখুন: [WordPress Plugin Setup](/wordpress-plugin)";
  }

  // Free Migration
  if (
    text.includes("migrate") ||
    text.includes("migration") ||
    text.includes("transfer") ||
    text.includes("shift") ||
    text.includes("মাইগ্রেশন") ||
    text.includes("ট্রান্সফার")
  ) {
    return "আমরা দিচ্ছি **100% Free Website Migration with Zero Downtime Guarantee**!\n\n• আপনার cPanel/Webuzo ফাইল, MySQL ডাটাবেস, প্রফেশনাল ইমেইল ইনবক্স হিস্ট্রি এবং SSL সম্পূর্ণ অক্ষত রেখে ২-৪ ঘণ্টার মধ্যে আমাদের সিনিয়র ইঞ্জিনিয়াররা শিফট করে দেবে।\n• মাইগ্রেশনের পর ফ্রি ট্র্যাকিং প্লাগইন ও Speedy Cache কনফিগার করে দেওয়া হয়।\n\nফ্রি মাইগ্রেশন রিকোয়েস্ট পাঠাতে ভিজিট করুন: [Migrate to Us](/migrate-to-us) অথবা সরাসরি [WhatsApp করুন](https://wa.me/8801787882277)।";
  }

  // System Status / Server Health / Ping
  if (
    text.includes("status") ||
    text.includes("uptime") ||
    text.includes("health") ||
    text.includes("down") ||
    text.includes("live") ||
    text.includes("স্ট্যাটাস") ||
    text.includes("আপটাইম")
  ) {
    return "আমাদের সকল সার্ভার ক্লাস্টারের রিয়েল-টাইম লাইভ আপটাইম ও TCP পিং দেখতে পারবেন:\n\n• **BDIX Cloud Node (Dhaka)**: 8 ms (Operational)\n• **Email & Webmail Cluster**: 58 ms (Operational)\n• **Xeon Cloud VPS Node**: 231 ms (Operational)\n• **Webuzo Shared Cloud (Earth)**: 256 ms (Operational)\n• **Overall 90-Day Uptime**: 99.98%\n\nলাইভ পিং ও হেলথ চেক করুন: [System Status](/system-status)";
  }

  // BDIX VPS
  if (text.includes("bdix") || text.includes("local") || text.includes("dhaka") || text.includes("বিডিআইএক্স")) {
    return "CarrotHost [BDIX VPS](/bdix-cloud-vps) ধানমন্ডি, ঢাকা Tier-III ডাটা সেন্টারে হোস্ট করা, যার লোকাল পিং <10ms। বাংলাদেশি ভিজিটরদের ই-কমার্স ও নিউজ পোর্টালের জন্য সেরা।";
  }

  // Xeon VPS
  if (text.includes("xeon") || text.includes("intel") || text.includes("webdock") || text.includes("জিয়ন")) {
    return "আমাদের [Xeon Cloud VPS](/xeon-cloud-vps) হাই-কম্পিউট Intel Xeon Platinum প্রসেসর এবং Webdock ড্যাশবোর্ড দ্বারা চালিত। ডেডিকেটেড রিসোর্স ও স্ন্যাপশট ব্যাকআপ সহ সেরা পারফরম্যান্স পাবেন।";
  }

  // Webuzo Hosting / Speedy Cache
  if (text.includes("hosting") || text.includes("shared") || text.includes("webuzo") || text.includes("speedy") || text.includes("litespeed")) {
    return "আমাদের [Webuzo Shared Hosting](/hosting) সুপার-ফাস্ট NVMe SSD এবং Speedy Cache দ্বারা চালিত। বাৎসরিক মাত্র ৳৪,২০০ থেকে শুরু, যাতে ১০০% Node-Free সার্ভার-সাইড ট্র্যাকিং ও ফ্রি মাইগ্রেশন অন্তর্ভুক্ত!";
  }

  // Support
  if (text.includes("support") || text.includes("contact") || text.includes("phone") || text.includes("whatsapp") || text.includes("যোগাযোগ") || text.includes("নম্বর")) {
    return "CarrotHost সাপোর্ট টিম ২৪/৭ প্রস্তুত:\n• ফোন / WhatsApp: 01787-882277\n• ইমেইল: support@carrothost.com\n• [Submit a Ticket](https://portal.carrothost.com/submitticket.php)\n• [Chat on WhatsApp](https://wa.me/8801787882277)";
  }

  return "Hello! I am your CarrotHost AI Assistant 🥕। আমি আপনাকে Webuzo হোস্টিং, 100% Node-Free ট্র্যাকিং প্লাগইন সেটআপ, ফ্রি সাইট মাইগ্রেশন, BDIX বা Xeon VPS সিলেকশনে সাহায্য করতে পারি। আপনি কি জানতে চান?";
}

export const chatResponseFn = createServerFn({ method: "POST" })
  .validator((data: { messages: Array<{ role: "user" | "assistant"; content: string }> }) => data)
  .handler(async ({ data }) => {
    try {
      const geminiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

      // 1. Prioritize Gemini API
      if (geminiKey) {
        const contents = data.messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("model" as const),
          parts: [{ text: m.content }],
        }));

        const apiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
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
