import { useState, useEffect, useRef } from "react";
import { X, Send, Carrot, Sparkles, ArrowUpRight, Bot, HelpCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";
import { chatResponseFn } from "../lib/chat";

interface Message {
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
  actionLink?: { label: string; url: string; external?: boolean };
}

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
export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [serverCache, setServerCache] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load server-side cache on mount
  useEffect(() => {
    fetch("/chat-cache.php")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error();
      })
      .then((data) => {
        if (data && typeof data === "object") {
          setServerCache(data);
        }
      })
      .catch(() => {
        console.warn("Could not load shared server-side chatbot cache.");
      });
  }, []);

  // Initialize with a welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          sender: "bot",
          text: "Hi there! 🥕 I am your CarrotHost AI Assistant. I can help you with Webuzo shared hosting, 100% Node-Free Server-Side Tracking, WordPress tracking plugin setup, free site migration, or BDIX/Xeon VPS nodes. What are you looking to host today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [messages]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const quickReplies = [
    { label: "📦 WP Plugin Setup", query: "How do I install and configure the CarrotHost Server-Side Tracker WordPress plugin?" },
    { label: "⚡ Node-Free Tracking vs Stape", query: "What is 100% Node-Free Server-Side Tracking and how does it compare to Stape.io?" },
    { label: "🔄 Free Migration", query: "How does the free website migration with zero downtime work?" },
    { label: "📊 Live Server Status", query: "Where can I check real-time server status and latency?" },
    { label: "🇧🇩 BDIX VPS Plans", query: "Tell me about your BDIX VPS plans." },
    { label: "🚀 Xeon VPS Plans", query: "What are the Xeon VPS plans?" },
  ];

  // Helper to parse markdown links: [label](url)
  const renderMessageText = (text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1];
      const url = match[2];
      const isExternal = url.startsWith("http") || url.startsWith("tel:");

      parts.push(
        isExternal ? (
          <a
            key={match.index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5"
          >
            {label} <ArrowUpRight className="h-3 w-3.5 inline shrink-0" />
          </a>
        ) : (
          <Link
            key={match.index}
            to={url as any}
            className="text-brand-orange hover:underline font-bold inline-flex items-center gap-0.5"
          >
            {label} <ArrowUpRight className="h-3 w-3.5 inline shrink-0" />
          </Link>
        )
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // Frontend interceptor for domain pricing, availability, and renewals
  const isDomainQuery = (text: string): boolean => {
    const lower = text.toLowerCase();
    
    // Domain keywords
    const domainKeywords = ["domain", "ডোমেইন", "ডোমেন", "tld", "tlds"];
    const tlds = [".com", ".net", ".org", ".info", ".xyz", ".bd", ".co", ".com.bd", ".net.bd"];
    
    // Query intent keywords
    const intentKeywords = [
      "price", "cost", "pricing", "dam", "koto", "taka", "tk", "টাকা", "দাম", "কত", 
      "register", "registration", "buy", "purchase", "renew", "renewal", "check", 
      "avail", "available", "availability", "search", "বুক", "বুকিং", "খুজ", "খোঁজ"
    ];

    // Check if user is asking about domain pricing or registration
    const hasDomainWord = domainKeywords.some(keyword => lower.includes(keyword));
    const hasTld = tlds.some(tld => lower.includes(tld));
    const hasIntent = intentKeywords.some(intent => lower.includes(intent));

    // If they ask about domain generally with pricing/registration intent
    if (hasDomainWord && hasIntent) {
      return true;
    }

    // If they mention a TLD directly with pricing/registration intent (e.g., ".com price")
    if (hasTld && hasIntent) {
      return true;
    }

    // Direct phrases like "how much for .com", "price of domain"
    if (lower.includes("how much") && (hasDomainWord || hasTld)) {
      return true;
    }

    return false;
  };

  // Legacy static AI response fallback (retained for resilience if API call fails)
  const getAIResponseFallback = (query: string): { text: string; actionLink?: { label: string; url: string; external?: boolean } } => {
    const text = query.toLowerCase().trim();

    // 1. Greetings
    if (text === "hi" || text === "hello" || text === "hey" || text === "হ্যাল" || text === "হাই" || text === "হ্যালো") {
      return {
        text: "Hello! Welcome to CarrotHost. I am your Carrot AI Assistant. How can I help you today?\n\nYou can ask me about our hosting packages, BDIX VPS, Xeon Cloud VPS, domain registration, GTM tracking, or how to contact our support.",
        actionLink: { label: "Contact Support", url: "https://wa.me/8801787882277", external: true }
      };
    }

    // 2. Nameservers
    if (text.includes("nameserver") || text.includes("dns") || text.includes("ns1") || text.includes("ns2") || text.includes("ネমসার্ভার")) {
      return {
        text: "To point your domain to CarrotHost, please update your domain's nameservers to:\n\n• **ns1.carrothost.com**\n• **ns2.carrothost.com**\n\nPropagation usually takes 2 to 24 hours.",
        actionLink: { label: "Client Portal", url: "https://portal.carrothost.com", external: true }
      };
    }

    // 3. SSL
    if (text.includes("ssl") || text.includes("https") || text.includes("secure") || text.includes("এসএসএল")) {
      return {
        text: "Yes, all CarrotHost shared hosting plans and VPS packages include **Free Unlimited Let's Encrypt SSL certificates**. It installs automatically within 24 hours of domain propagation.",
        actionLink: { label: "Hosting Plans", url: "/hosting" }
      };
    }

    // 4. Backups
    if (text.includes("backup") || text.includes("restore") || text.includes("ব্যাকআপ") || text.includes("রিস্টোর")) {
      return {
        text: "We provide automated weekly backups for all shared hosting accounts to secure your website data. For VPS nodes, you can schedule custom backups from the dashboard.",
        actionLink: { label: "Hosting Plans", url: "/hosting" }
      };
    }

    // 5. Control Panels (cPanel, Webuzo)
    if (text.includes("cpanel") || text.includes("control panel") || text.includes("panel") || text.includes("প্যানেল")) {
      return {
        text: "Our Shared Hosting plans feature the industry-standard **cPanel** control panel. Our VPS plans offer modern dashboards like Webdock or Webuzo for streamlined server management.",
        actionLink: { label: "Shared Hosting", url: "/hosting" }
      };
    }

    // 6. Latency, Speed & Location
    if (text.includes("speed") || text.includes("slow") || text.includes("location") || text.includes("server location") || text.includes("লোকেশন") || text.includes("স্পিড")) {
      return {
        text: "We offer two server locations:\n\n1. **Dhaka, Bangladesh (Dhanmondi, Tier-III)**: Perfect for Bangladeshi traffic (latency <10ms).\n2. **Germany / Europe**: Ideal for global traffic and budget-friendly setups.",
        actionLink: { label: "BDIX VPS Plans", url: "/bdix-cloud-vps" }
      };
    }

    // 7. General Pricing & Payment
    if (
      text.includes("price") ||
      text.includes("dam") ||
      text.includes("koto") ||
      text.includes("tk") ||
      text.includes("taka") ||
      text.includes("payment") ||
      text.includes("bkash") ||
      text.includes("nagad") ||
      text.includes("rocket") ||
      text.includes("card") ||
      text.includes("টাকা") ||
      text.includes("দাম") ||
      text.includes("কত") ||
      text.includes("পেমেন্ট")
    ) {
      return {
        text: "We support **bKash, Nagad, Rocket, local cards, and international payment methods**.\n\nOur starter prices:\n• **Shared Hosting**: from ৳4,200/year\n• **Xeon Cloud VPS**: from ৳607/month\n• **BDIX VPS (Dhaka)**: from ৳1,550/month\n\nFor real-time domain registration prices, please visit our domain checker.",
        actionLink: { label: "View Hosting Plans", url: "/hosting" }
      };
    }

    // 8. WordPress Plugin Setup & Tracking Guide
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
      return {
        text: "Here is how to set up the **Carrothost Server-Side Tracker** WordPress plugin:\n\n1. **Download & Install**: Download `carrothost-server-side-tracker.zip` from our guide and upload via WP Admin > Plugins > Add New > Activate.\n2. **Meta CAPI**: Enter your Meta Pixel ID and Conversions API Access Token in the 'Carrothost SST' menu.\n3. **GTM Proxy**: Enter your GTM Container ID (e.g. `GTM-XXXXXXX`) to activate first-party proxy delivery via `/metrics/gtm.js?id=GTM-XXXXXXX`.\n4. **Run Diagnostics**: Click '⚡ Run Test Ping Now' to verify 200 OK connection.\n5. **WooCommerce Auto-Tracking**: ViewContent, AddToCart, and Purchase events are tracked automatically with 9.5+ EMQ score.",
        actionLink: { label: "WordPress Plugin Guide", url: "/wordpress-plugin" }
      };
    }

    // 9. Node-Free Server-Side Tracking vs Stape.io / GCP
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
      return {
        text: "CarrotHost features **100% Node-Free Server-Side Tracking**!\n\n• **Zero Extra Monthly Cost**: Stape.io or Google Cloud Platform costs $20–$100+/mo, whereas CarrotHost includes it 100% free with Webuzo hosting.\n• **0 MB RAM Leaks**: Runs natively in Nginx C-sockets rather than crashing Node.js/Docker containers.\n• **Bypasses Ad-Blockers**: Delivers first-party GTM and Meta CAPI events with sub-10ms response times.",
        actionLink: { label: "Server-Side Hosting Plans", url: "/hosting" }
      };
    }

    // 10. Free Website Migration
    if (
      text.includes("migrate") ||
      text.includes("migration") ||
      text.includes("transfer") ||
      text.includes("shift") ||
      text.includes("মাইগ্রেশন") ||
      text.includes("ট্রান্সফার")
    ) {
      return {
        text: "We offer **100% Free Website Migration with Zero Downtime Guarantee**!\n\n• Senior engineers transfer all website files, MySQL databases, email inboxes/history, and SSL certificates in 2–4 hours.\n• After migration, we install and configure the tracking plugin and Speedy Cache for free.",
        actionLink: { label: "Request Free Migration", url: "/migrate-to-us" }
      };
    }

    // 11. Live System Status & Ping
    if (
      text.includes("status") ||
      text.includes("uptime") ||
      text.includes("health") ||
      text.includes("down") ||
      text.includes("live") ||
      text.includes("ping") ||
      text.includes("স্ট্যাটাস") ||
      text.includes("আপটাইম")
    ) {
      return {
        text: "Check real-time live TCP socket ping and uptime across all CarrotHost clusters:\n\n• **BDIX Dhaka Node**: 8 ms (Operational)\n• **Email & Webmail Cluster**: 58 ms (Operational)\n• **Xeon Cloud VPS Node**: 231 ms (Operational)\n• **Webuzo Shared Cloud (Earth)**: 256 ms (Operational)\n• **90-Day Average Uptime**: 99.98%",
        actionLink: { label: "Live System Status", url: "/system-status" }
      };
    }

    // 12. BDIX VPS
    if (text.includes("bdix") || text.includes("local") || text.includes("dhaka") || text.includes("বিডিআইএক্স")) {
      return {
        text: "Our BDIX VPS servers are hosted in a Tier-III data center in Dhanmondi, Dhaka. They feature direct connectivity to the BDIX network, providing ultra-fast speeds (<10ms ping) for visitors in Bangladesh.",
        actionLink: { label: "BDIX VPS Plans", url: "/bdix-cloud-vps" }
      };
    }

    // 13. Xeon VPS
    if (text.includes("xeon") || text.includes("intel") || text.includes("webdock") || text.includes("জিয়ন")) {
      return {
        text: "Xeon Cloud VPS plans leverage Intel Xeon Platinum processors and integrate the Webdock control panel. You get dedicated resources, root access, and automated snapshots.",
        actionLink: { label: "Xeon VPS Plans", url: "/xeon-cloud-vps" }
      };
    }

    // 14. Support / Contact
    if (text.includes("support") || text.includes("phone") || text.includes("contact") || text.includes("whatsapp") || text.includes("যোগাযোগ") || text.includes("সাহায্য") || text.includes("হেল্প")) {
      return {
        text: "Our support engineers are available 24/7/365 to assist you. Contact us:\n\n• **Phone / WhatsApp**: 01787-882277\n• **Email**: support@carrothost.com\n• **Ticket**: Submit a support ticket from our portal.",
        actionLink: { label: "Submit Ticket", url: "https://portal.carrothost.com/submitticket.php", external: true }
      };
    }

    // Default Fallback
    return {
      text: "I can help you select a hosting plan, set up GTM tracking, or explain BDIX/Xeon VPS nodes. How can I help you today?",
      actionLink: { label: "Contact Support", url: "https://wa.me/8801787882277", external: true }
    };
  };

  const respondToUser = async (currentMessages: Message[], lastMessageText: string) => {
    setIsThinking(true);

    // 1. Check frontend interception for domain queries (Real-time Domain Price Law)
    if (isDomainQuery(lastMessageText)) {
      setTimeout(() => {
        const botResponse: Message = {
          sender: "bot",
          text: "For real-time domain pricing and instant registration, please use our official portal: [Check Domain Pricing](https://portal.carrothost.com/cart.php?a=add&domain=register)",
          timestamp: new Date(),
          actionLink: {
            label: "Check Domain Pricing",
            url: "https://portal.carrothost.com/cart.php?a=add&domain=register",
            external: true,
          },
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsThinking(false);
      }, 400);
      return;
    }
    // 2. Fetch response from cache, Server Function, or direct browser fetch
    try {
      const history = currentMessages.slice(-10).map((msg) => ({
        role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.text,
      }));

      let reply = "";
      let responseActionLink: Message["actionLink"] = undefined;
      const queryKey = lastMessageText.toLowerCase().trim();

      // Check serverCache first, then client-side localStorage cache
      let cachedResponse = "";
      if (serverCache[queryKey]) {
        cachedResponse = serverCache[queryKey];
      } else {
        try {
          const localCache = JSON.parse(localStorage.getItem("carrot_chatbot_cache") || "{}");
          if (localCache[queryKey]) {
            cachedResponse = localCache[queryKey];
          }
        } catch (e) {
          console.warn("Failed to read chatbot cache:", e);
        }
      }

      if (cachedResponse) {
        reply = cachedResponse;
      } else {
        // Detect if we are on a static live site (where server functions are not available)
        const isStaticDeployment = typeof window !== "undefined" && 
          window.location.hostname !== "localhost" && 
          window.location.hostname !== "127.0.0.1" &&
          !window.location.hostname.includes("gitpod") && 
          !window.location.hostname.includes("codesandbox");

        let useServerFunction = !isStaticDeployment;

        if (useServerFunction) {
          try {
            // Try the server function first
            const data = await chatResponseFn({ data: { messages: history } });
            reply = data.response;
          } catch (rpcErr) {
            console.warn("Server function failed. Falling back to direct browser call...");
            useServerFunction = false;
          }
        }

        if (!useServerFunction) {
          // Client-side fallback variables (injected by Vite during build if prefixed with VITE_)
          const clientGeminiKey = import.meta.env.VITE_GEMINI_API_KEY;
          const clientOpenaiKey = import.meta.env.VITE_OPENAI_API_KEY;

          if (clientGeminiKey) {
            const contents = history.map((m) => ({
              role: m.role === "user" ? ("user" as const) : ("model" as const),
              parts: [{ text: m.content }],
            }));

            const apiResponse = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${clientGeminiKey}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
                  contents: contents,
                  generationConfig: { temperature: 0.5, maxOutputTokens: 500 },
                }),
              }
            );

            if (!apiResponse.ok) throw new Error("Client-side Gemini API failed");
            const resJson = await apiResponse.json() as {
              candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
            };
            reply = resJson.candidates[0]?.content?.parts[0]?.text || "";
          } else if (clientOpenaiKey) {
            const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${clientOpenaiKey}`,
              },
              body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
                temperature: 0.5,
                max_tokens: 500,
              }),
            });

            if (!apiResponse.ok) throw new Error("Client-side OpenAI API failed");
            const resJson = await apiResponse.json() as {
              choices: Array<{ message: { content: string } }>;
            };
            reply = resJson.choices[0]?.message?.content || "";
          } else {
            // If no client-side keys are compiled, use local offline heuristics
            const fallback = getAIResponseFallback(lastMessageText);
            reply = fallback.text;
            responseActionLink = fallback.actionLink;
          }
        }

        // Cache the successful Gemini/OpenAI response (only if it didn't use a fallback action link)
        if (reply && !responseActionLink) {
          // 1. Save to local cache
          try {
            const localCache = JSON.parse(localStorage.getItem("carrot_chatbot_cache") || "{}");
            localCache[queryKey] = reply;
            localStorage.setItem("carrot_chatbot_cache", JSON.stringify(localCache));
          } catch (e) {
            console.warn("Failed to write to chatbot cache:", e);
          }

          // 2. Save to server cache via PHP
          fetch("/chat-cache.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: queryKey, response: reply })
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.status === "success") {
                setServerCache((prev) => ({ ...prev, [queryKey]: reply }));
              }
            })
            .catch((e) => console.warn("Failed to update server-side chatbot cache:", e));
        }
      }

      const botResponse: Message = {
        sender: "bot",
        text: reply,
        timestamp: new Date(),
        actionLink: responseActionLink,
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      console.error("AI Chatbot API failed, falling back to heuristics:", err);
      // Local fallback
      const fallback = getAIResponseFallback(lastMessageText);
      const botResponse: Message = {
        sender: "bot",
        text: fallback.text,
        timestamp: new Date(),
        actionLink: fallback.actionLink,
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    const newUserMessage: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const updated = [...prev, newUserMessage];
      
      // Schedule response processing
      setTimeout(() => {
        respondToUser(updated, textToSend);
      }, 50);

      return updated;
    });

    setInputText("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {!isOpen && (
        <div className="absolute bottom-16 right-0 p-2 bg-brand-green/20 rounded-full shadow-soft hover:scale-105 transition-all duration-300 animate-bounce">
          <button
            onClick={() => setIsOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green text-white shadow-elegant active:scale-95 transition-all duration-200 relative group"
            aria-label="Open AI Assistant"
          >
            <Bot className="h-6 w-6" />
            <span className="absolute right-16 scale-0 group-hover:scale-100 bg-card border border-border text-foreground text-xs font-semibold px-3 py-1.5 rounded-xl shadow-soft transition-all duration-200 whitespace-nowrap">
              Need Help? Chat with AI 🤖
            </span>
          </button>
        </div>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[520px] rounded-3xl border border-border bg-card/95 backdrop-blur-md shadow-elegant flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Top Bar Header (Solid corporate accent background) */}
          <div className="bg-brand-orange px-5 py-4 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white relative">
                <Carrot className="h-6 w-6 -rotate-45" />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-brand-green border border-white" />
              </div>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  Carrot AI Assistant
                  <Sparkles className="h-3.5 w-3.5 text-brand-green animate-pulse" />
                </div>
                <div className="text-[10px] opacity-90">Always online · 24/7 Support</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
              aria-label="Close Chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Logs Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/15">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start gap-2.5`}
              >
                {msg.sender === "bot" && (
                  <div className="h-8 w-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 border border-brand-orange/20">
                    <Carrot className="h-4.5 w-4.5 -rotate-45" />
                  </div>
                )}
                <div className="max-w-[75%] space-y-2">
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft whitespace-pre-line border border-border/40 ${
                      msg.sender === "user"
                        ? "bg-brand-orange text-white rounded-tr-none border-none"
                        : "bg-card text-foreground rounded-tl-none"
                    }`}
                  >
                    {msg.sender === "bot" ? renderMessageText(msg.text) : msg.text}
                  </div>
                  {msg.actionLink && (
                    <div className="flex">
                      {msg.actionLink.external ? (
                        <a
                          href={msg.actionLink.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white text-xs font-bold px-3.5 py-2 transition"
                        >
                          {msg.actionLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      ) : (
                        <a
                          href={msg.actionLink.url}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange hover:bg-brand-orange hover:text-white text-xs font-bold px-3.5 py-2 transition"
                        >
                          {msg.actionLink.label} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing/Thinking Indicator */}
            {isThinking && (
              <div className="flex justify-start items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0 border border-brand-orange/20">
                  <Carrot className="h-4.5 w-4.5 -rotate-45" />
                </div>
                <div className="bg-card border border-border rounded-2xl rounded-tl-none px-4 py-3.5 shadow-soft flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies block */}
          {messages.length < 5 && (
            <div className="px-4 py-2 bg-secondary/15 flex flex-wrap gap-1.5 border-t border-border/40">
              {quickReplies.map((qr) => (
                <button
                  key={qr.label}
                  onClick={() => handleSendMessage(qr.query)}
                  className="rounded-full border border-border bg-card hover:border-brand-orange hover:text-brand-orange transition text-[11px] font-semibold px-2.5 py-1 cursor-pointer"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          )}

          {/* Form input area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="p-3.5 border-t border-border flex items-center gap-2 bg-card"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask anything about our services..."
              className="flex-1 bg-secondary/55 text-foreground text-sm rounded-xl px-4 py-2.5 border border-border/80 focus:outline-none focus:border-brand-orange/80 transition"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-brand-orange text-white shadow-soft hover:opacity-90 active:scale-95 transition disabled:opacity-50 disabled:pointer-events-none shrink-0 cursor-pointer"
              aria-label="Send Message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
