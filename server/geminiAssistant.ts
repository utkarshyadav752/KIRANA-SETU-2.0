import { Request, Response } from "express";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { db } from "./db.js";

// Helper to assemble real-time context from the in-memory database
export function buildStoreContext(): string {
  const shops = db.shops.map((s) => {
    const shopProds = db.products.filter((p) => p.shopId === s.id && p.currentStock > 0);
    const activeHolds = db.reservations.filter(
      (r) => r.shopId === s.id && (r.status === "Requested" || r.status === "Confirmed" || r.status === "Ready")
    );
    const sampleItems = shopProds
      .slice(0, 10)
      .map((p) => `${p.name} (₹${p.sellingPrice}, Stock: ${p.currentStock} ${p.unit}, Barcode: ${p.barcode})`)
      .join("; ");

    const proofs = s.businessProofs?.map((b) => b.type).join(", ") || "Verified Kirana";

    return `Shop: "${s.name}" (ID: ${s.id})
Owner: ${s.ownerName} | Phone: ${s.phone} | Address: ${s.address}, ${s.area}, ${s.city}
Hours: ${s.openingHours} - ${s.closingHours} | Verified: ${proofs}
Available Products (${shopProds.length} in stock): ${sampleItems}
Active Customer Holds: ${activeHolds.length}`;
  }).join("\n\n");

  return `=== CURRENT LIVE KIRANASETU STORE NETWORK ===
${shops}

=== KIRANASETU PLATFORM CAPABILITIES & POLICIES ===
1. 30-Minute Customer Pickup Holds:
   - Customers can discover items and reserve them for a 30-minute window with countdown.
   - Customers can alert the shopkeeper: "I'm arriving in 20 mins" so goods are bagged in advance.
   - At the counter, the shopkeeper confirms with 1 click or scans, converting it to an official tax bill in 1 second.
   - Auto-cancellation occurs if the customer does not arrive before expiry, releasing items back to inventory.

2. Stock Guardian & Drift Elimination:
   - Daily shelf audit where expected vs physical counts are logged.
   - Discrepancy reason must be categorized (unrecorded counter sale, damaged/broken, expired, supplier shortage).
   - Eliminates phantom stock drift across local shelves.

3. Barcode Scanner & POS Billing:
   - Works with any smartphone/laptop camera or external USB/Bluetooth barcode guns.
   - Real-time continuous scanning with instant audio chime.
   - Dedicated business UPI QR code generated on each invoice for zero-MDR direct bank settlement.

4. Merchant Subscription & Zero Commission:
   - KiranaSetu charges 0% commission on orders and customer transactions.
   - Optional Kirana Pro plan is just ₹20/month (or ₹200/year, saving 2 months) for Gemini AI Co-pilot, Mandi wholesale price telemetry, and Stock Guardian analytics.

5. Multi-Step Troubleshooting Guidance:
   - Camera Barcode Scanner issues:
     a) Check browser camera permissions (lock icon in address bar).
     b) Ensure sufficient lighting and steady holding 10-15cm away from barcode.
     c) Standard Indian FMCG EAN-13 barcodes are supported. Manual search/input is always available as fallback.
   - Thermal Printer / Receipt issues:
     a) ESC/POS standard USB or Bluetooth printers.
     b) Digital WhatsApp/SMS invoices are also instantly generated.
   - Active Hold Issues:
     a) Check countdown timer. If expired, items return to stock.
     b) Provide customer phone number or pickup token to the shopkeeper.

6. Founder Details & Direct Support:
   - Founder & Chief Architect: Utkarsh Yadav
   - Location: Uttar Pradesh, India
   - Phone / Helpline: +91 9554460651 (WhatsApp & Calls)
   - Email: utkarshyadav752@gmail.com
   - Direct Founder Hotline available for all store owners and customers.`;
}

// Intelligent contextual fallback generator when API key is pending or network error occurs
export function generateContextualReply(
  message: string,
  context: { userRole?: string; userName?: string; userPhone?: string; shopId?: string } = {}
): { reply: string; actions: Array<{ label: string; actionType: string; payload?: any }> } {
  const lower = message.toLowerCase();
  const isHindi = /[\u0900-\u097F]/.test(message) || lower.includes("kya") || lower.includes("kaise") || lower.includes("batao") || lower.includes("namaste") || lower.includes("aata") || lower.includes("bikri");

  const actions: Array<{ label: string; actionType: string; payload?: any }> = [];

  // 0. Founder & Leadership Queries (Utkarsh Yadav)
  if (lower.includes("founder") || lower.includes("utkarsh") || lower.includes("yadav") || lower.includes("owner") || lower.includes("malik") || lower.includes("contact founder")) {
    const reply = isHindi
      ? `👑 **किरानासेतु के संस्थापक - उत्कर्ष यादव (Utkarsh Yadav)**:
• **भूमिका**: संस्थापक एवं मुख्य वास्तुकार (Founder & Lead Architect)
• **स्थान**: उत्तर प्रदेश, भारत
• **फोन नंबर**: +91 9554460651 (कॉल व व्हाट्सएप)
• **ईमेल आईडी**: utkarshyadav752@gmail.com

उत्कर्ष जी ने किरानासेतु को भारतीय किराना दुकानों को 0% कमीशन, 5-सेकंड बारकोड बिलिंग और जीरो स्टॉक ड्रिफ्ट तकनीक से सशक्त करने के लिए बनाया है। यदि आप दुकानदार हैं या सहायता चाहते हैं, तो आप सीधे संपर्क कर सकते हैं!`
      : `👑 **Meet KiranaSetu Founder - Utkarsh Yadav**:
• **Role**: Founder & Lead Platform Architect
• **Location**: Uttar Pradesh, India
• **Direct Phone / WhatsApp**: +91 9554460651
• **Official Email**: utkarshyadav752@gmail.com

Utkarsh built KiranaSetu with a personal commitment to protect India's 12+ million kirana merchants with 0% commission, lightning 5-second barcode billing, and zero silent stock drift. Every shopkeeper has a direct hotline to him.`;

    actions.push(
      { label: "📞 Call Utkarsh (9554460651)", actionType: "call_founder" },
      { label: "✉️ Email Utkarsh", actionType: "email_founder" }
    );
    return { reply, actions };
  }

  // 1. MSME / B2B Verification Queries
  if (lower.includes("msme") || lower.includes("udyam") || lower.includes("verification") || lower.includes("supersale") || lower.includes("cashify") || lower.includes("b2b")) {
    const reply = isHindi
      ? `🏢 **MSME B2B सत्यापन (Cashify SuperSale मॉडल)**:
1. **दस्तावेज़ संख्या दर्ज करें**: लॉगिन के बाद अपने सेलर डैशबोर्ड या प्रोफ़ाइल पर 'MSME सत्यापन' सेक्शन में अपना उद्यम नंबर (उदा. UDYAM-KR-03-0044521) और फर्म का नाम दर्ज करें।
2. **हमारी टीम द्वारा सत्यापन**: सबमिट करने के बाद आपकी फ़ाइल 'सत्यापन टीम' के पास जाएगी। हमारी अनुपालन टीम सरकारी एमएसएमई पोर्टल से इसका सत्यापन करेगी (2-4 घंटे)।
3. **थोक B2B लाभ**: सत्यापन पूरा होते ही आपको 'सत्यापित B2B पार्टनर' का बैज मिलेगा, जिससे थोक मूल्य (Wholesale Margins) और व्यावसायिक टैक्स इनवॉइस अनलॉक हो जाएंगे।`
      : `🏢 **MSME B2B Verification (Cashify SuperSale Tier)**:
1. **Enter Document Number**: After merchant login, go to the 'MSME B2B Verification' section and enter your Government Udyam Registration Number (e.g. UDYAM-KR-03-0044521) along with your business category.
2. **Team Verification**: Once submitted, status becomes 'Pending Review'. Our internal verification team manually cross-references the details against the Government MSME portal.
3. **B2B Unlocked**: Once our team approves, you get the 'Verified B2B Partner' badge, unlocking wholesale distributor pricing (15-30% margins) and commercial GST tax invoicing.`;

    actions.push(
      { label: "🏢 Open MSME Verification", actionType: "navigate_msme" },
      { label: "🛠️ Open Team Review Desk", actionType: "navigate_team_desk" }
    );
    return { reply, actions };
  }

  // 2. 30-Minute Pickup Holds
  if (lower.includes("reserve") || lower.includes("hold") || lower.includes("pickup") || lower.includes("book") || lower.includes("30 min")) {
    const reply = isHindi
      ? `⏱️ **30-मिनट पिकअप होल्ड प्रणाली**:
1. ग्राहक किराना मार्केटप्लेस से सामान चुनकर '30-Min Hold' दबाते हैं।
2. दुकानदार के पास तुरंत अलर्ट जाता है और सामान अलग बैग में पैक हो जाता है।
3. ग्राहक रास्ते से 'मैं 20 मिनट में आ रहा हूँ' का अलर्ट भेज सकते हैं।
4. काउंटर पर शून्य-कमीशन UPI QR स्कैन करके 1 सेकंड में बिल का भुगतान करें।`
      : `⏱️ **30-Minute Pickup Hold Process**:
1. Customers discover neighborhood shelf stock and click 'Hold for 30 Min'.
2. The kirana store bags the items in advance with an active countdown timer.
3. Customers can send 'I am arriving in 20 mins' alerts on the way.
4. At the counter, 1-tap confirmation generates the final GST bill with zero-commission UPI payment.`;

    actions.push(
      { label: "🛒 Customer Marketplace", actionType: "navigate_customer" },
      { label: "⏱️ Active Holds Manager", actionType: "view_holds" }
    );
    return { reply, actions };
  }

  // 3. Barcode Scanner Troubleshooting
  if (lower.includes("scanner") || lower.includes("barcode") || lower.includes("camera") || lower.includes("scan")) {
    const reply = isHindi
      ? `📷 **बारकोड स्कैनर सहायता**:
1. ब्राउज़र एड्रेस बार में लॉक (Lock) आइकन पर क्लिक करके कैमरा अनुमति (Camera Permission) चालू करें।
2. बारकोड को कैमरे से 10-15 सेमी दूर और अच्छी रोशनी में रखें।
3. यदि कैमरा अनुपलब्ध है, तो आप सीधे 13-अंकों का EAN-13 नंबर टाइप कर सकते हैं या 'सरल पिक्चर ग्रिड' से सामान चुन सकते हैं।`
      : `📷 **Barcode Scanner Troubleshooting Steps**:
1. Verify browser camera permissions (click the lock icon in the URL bar).
2. Ensure adequate lighting and hold barcode 10-15cm away from camera lens.
3. If scanning fails, you can type the 13-digit EAN barcode or use the Visual Fast Product Grid directly.`;

    actions.push(
      { label: "📷 Open Barcode Scanner", actionType: "open_scanner" },
      { label: "⚡ Fast Picture POS", actionType: "navigate_seller" }
    );
    return { reply, actions };
  }

  // 4. Kirana Pro Subscription & Pricing
  if (lower.includes("pro") || lower.includes("subscri") || lower.includes("price") || lower.includes("cost") || lower.includes("20")) {
    const reply = isHindi
      ? `⭐ **किराना प्रो प्लान (Kirana Pro)**:
- किरानासेतु पर सभी सामान्य बिक्री और बिलिंग **0% कमीशन** पर पूरी तरह निःशुल्क है।
- उन्नत एआई व्यापार सलाहकार (Gemini Shop AI), थोक मंडी भाव राडार, और स्टॉक गार्जियन के लिए प्लान केवल **₹20/माह** या **₹200/वर्ष** (2 महीने मुफ्त) है।`
      : `⭐ **Kirana Pro & Zero Commission Policy**:
- KiranaSetu charges 0% commission on orders and customer counter transactions.
- Optional Kirana Pro suite is available at just ₹20/month or ₹200/year (save ₹40 with 2 months free), unlocking Gemini Shop AI, Mandi Wholesale Radar, and Stock Guardian telemetry.`;

    actions.push({ label: "⭐ View Pro Plans", actionType: "explain_pro" });
    return { reply, actions };
  }

  // 5. Stock & Today's Sales
  if (lower.includes("sale") || lower.includes("bikri") || lower.includes("stock") || lower.includes("aaj") || lower.includes("galla")) {
    const reply = isHindi
      ? `📊 **दुकान की वर्तमान स्थिति**:
- आज का गल्ला (Cash Drawer) और डिजिटल बही-खाता सक्रिय है।
- आप 'आज का गल्ला' में नकद और खर्च दर्ज कर सकते हैं और 'बही-खाता' से ग्राहकों को सीधे व्हाट्सएप पर यूपीआई पेमेंट लिंक भेज सकते हैं।`
      : `📊 **Store Analytics & Galla**:
- Real-time billing and shelf inventory are live.
- Track daily cash in 'Aaj Ka Galla', audit shelf drift in 'Stock Guardian', or view customer credit ledgers in 'Bahi-Khata'.`;

    actions.push(
      { label: "📖 Bahi-Khata Ledger", actionType: "navigate_seller" },
      { label: "💵 Aaj Ka Galla", actionType: "navigate_seller" }
    );
    return { reply, actions };
  }

  // Default helpful response
  const defaultReply = isHindi
    ? `नमस्ते ${context.userName || "जी"}! मैं आपका किरानासेतु AI सहायक हूँ। आप मुझसे MSME सत्यापन, 30-मिनट पिकअप होल्ड, बारकोड स्कैनर ट्रबलशूटिंग, थोक मंडी भाव या दुकान बिलिंग के बारे में कुछ भी पूछ सकते हैं।`
    : `Hello ${context.userName || "there"}! I am KiranaSetu Sahayak, your intelligent store advisor. You can ask me about MSME B2B verification, 30-minute grocery holds, barcode scanner help, wholesale prices, or inventory management.`;

  actions.push(
    { label: "🏢 MSME Verification", actionType: "navigate_msme" },
    { label: "🛒 Customer Marketplace", actionType: "navigate_customer" },
    { label: "📷 Barcode POS", actionType: "navigate_seller" }
  );

  return { reply: defaultReply, actions };
}

// Multi-turn context-aware support chatbot endpoint handler
export async function handleChatAssistant(
  req: Request,
  res: Response,
  getGenAI: () => GoogleGenAI | null
) {
  try {
    const { message, history = [], context = {} } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    const ai = getGenAI();

    // If Gemini client is available, attempt real GenAI generation
    if (ai) {
      try {
        const storeContext = buildStoreContext();
        const role = context.userRole || "visitor";
        const userName = context.userName || "Valued User";
        const userPhone = context.userPhone || "";
        const activeShopId = context.shopId;

        const systemInstruction = `You are "KiranaSetu Sahayak" (किरानासेतु सहायक), an intelligent, context-aware support agent and reservation concierge for the KiranaSetu retail platform.
You assist both neighborhood grocery customers and local kirana shopkeepers.

Current User Context:
- User Role: ${role}
- User Name: ${userName}
${userPhone ? `- User Phone: ${userPhone}` : ""}
${activeShopId ? `- Selected Active Store ID: ${activeShopId}` : ""}

Live Platform & Store Data:
${storeContext}

CORE DIRECTIVES:
1. MSME / B2B Verification (Cashify SuperSale Model):
   - Merchants can enter their Government Udyam / MSME document number (e.g. UDYAM-KR-03-0044521) in the Seller section after login.
   - Once submitted, it enters 'Pending Review' for our internal verification team to cross-check with the Government MSME portal (2-4 hr SLA).
   - Once our team verifies, it unlocks B2B wholesale prices, bulk purchasing, and commercial GST invoices.
   - Guide merchants clearly on where to enter their document number and how our team verifies it.

2. Multi-Step Bookings / 30-Minute Holds:
   - When a customer wants to buy, hold, or reserve items:
     Step 1: Identify what items they want and which store is nearest or preferred.
     Step 2: Check live inventory in the context above (prices, stock quantity, brand).
     Step 3: Confirm quantity, calculate estimated total, and explain the 30-minute pickup hold with arrival alerts.
     Step 4: Guide them clearly on how to pick up and pay zero-commission via UPI at the counter.

3. Multi-Step Troubleshooting:
   - Provide structured, empathetic, step-by-step diagnostic guidance for POS issues, barcode camera scanning, thermal print receipts, stock discrepancy logging, or account verification (MSME/GSTIN).

4. Tone & Language:
   - Warm, respectful, clear, and professional Indian neighborhood retail tone.
   - Fluent in both English and Hindi/Hinglish (respond in the language the user speaks or prefers).
   - Keep answers concise, formatted with clear bullet points or steps when giving instructions.`;

        // Construct contents array with history
        const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

        if (Array.isArray(history)) {
          for (const h of history.slice(-8)) {
            if (h.text && (h.role === "user" || h.role === "model")) {
              contents.push({
                role: h.role,
                parts: [{ text: h.text }],
              });
            }
          }
        }

        contents.push({
          role: "user",
          parts: [{ text: message }],
        });

        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: contents as any,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const reply = response.text || "";
        if (reply.trim()) {
          const lower = message.toLowerCase();
          const actions: Array<{ label: string; actionType: string; payload?: any }> = [];

          if (lower.includes("msme") || lower.includes("udyam") || lower.includes("b2b") || lower.includes("verify")) {
            actions.push(
              { label: "🏢 MSME Verification", actionType: "navigate_msme" },
              { label: "🛠️ Verification Team Desk", actionType: "navigate_team_desk" }
            );
          }
          if (lower.includes("reserve") || lower.includes("buy") || lower.includes("milk") || lower.includes("grocery")) {
            actions.push({ label: "🛒 Browse Marketplace", actionType: "navigate_customer" });
          }
          if (lower.includes("scanner") || lower.includes("camera") || lower.includes("pos")) {
            actions.push({ label: "📷 Open Barcode Scanner", actionType: "open_scanner" });
          }
          if (lower.includes("hold") || lower.includes("order")) {
            actions.push({ label: "⏱️ View Active Holds", actionType: "view_holds" });
          }

          return res.json({
            success: true,
            reply,
            actions,
          });
        }
      } catch (geminiErr: any) {
        console.warn("[Chat Assistant] Gemini API call failed, switching to contextual NLP fallback:", geminiErr?.message);
      }
    }

    // Graceful contextual fallback if API key is not configured or temporary error occurs
    const fallback = generateContextualReply(message, context);
    return res.json({
      success: true,
      reply: fallback.reply,
      actions: fallback.actions,
      note: "Answered via KiranaSetu assistant intelligence.",
    });
  } catch (err: any) {
    console.error("Chat assistant error:", err);
    const fallback = generateContextualReply(req.body?.message || "hello", req.body?.context || {});
    return res.json({
      success: true,
      reply: fallback.reply,
      actions: fallback.actions,
    });
  }
}

// Text-To-Speech endpoint using gemini-3.8-flash-lite-tts
export async function handleTTS(
  req: Request,
  res: Response,
  getGenAI: () => GoogleGenAI | null
) {
  try {
    const { text, voice = "Zephyr" } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ success: false, error: "Text is required." });
    }

    // Clean text of markdown characters for natural speech
    const cleanText = text
      .replace(/[#*_`~>[\]()]/g, "")
      .replace(/\n+/g, ". ")
      .slice(0, 450);

    const ai = getGenAI();
    if (!ai) {
      // Return success with useWebSpeech flag so client plays cleanly via Web Speech API
      return res.json({
        success: true,
        useWebSpeech: true,
        text: cleanText,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash-lite-tts",
        contents: [{ parts: [{ text: cleanText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });

      const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (audioBase64) {
        return res.json({ success: true, audio: audioBase64 });
      }
    } catch (ttsErr: any) {
      console.warn("[TTS] Gemini TTS failed, using browser speech synthesis fallback:", ttsErr?.message);
    }

    // Fallback cleanly to client speech synthesis
    res.json({ success: true, useWebSpeech: true, text: cleanText });
  } catch (err: any) {
    console.error("TTS generation error:", err);
    res.json({ success: true, useWebSpeech: true, text: req.body?.text || "" });
  }
}

// Setup Gemini Live API WebSocket endpoint (/api/gemini/live)
export function setupGeminiLiveWebSocket(
  wss: WebSocketServer,
  getGenAI: () => GoogleGenAI | null
) {
  wss.on("connection", async (clientWs: WebSocket) => {
    console.log("[Gemini Live] Client connected via WebSocket");

    const ai = getGenAI();
    if (!ai) {
      // Send greeting so client voice session functions reliably even without external key
      clientWs.send(
        JSON.stringify({
          type: "connected",
          message: "Connected to KiranaSetu Live Voice Assistant (Interactive Web Speech Ready)",
        })
      );

      clientWs.on("message", (raw: any) => {
        try {
          const payload = JSON.parse(raw.toString());
          if (payload.text) {
            const result = generateContextualReply(payload.text);
            clientWs.send(JSON.stringify({ type: "transcript", text: result.reply }));
          }
        } catch {}
      });
      return;
    }

    const storeContext = buildStoreContext();

    try {
      const session = await ai.live.connect({
        model: "gemini-3.8-live",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are KiranaSetu Live Voice Assistant (किरानासेतु लाइव).
You are talking in real-time voice with Indian kirana store owners and neighborhood grocery shoppers.
Live Store Network Context:
${storeContext}

Guidelines:
- Keep answers SHORT, punchy, conversational, and direct (1-3 sentences maximum per turn).
- Help merchants with MSME B2B verification, check inventory, and troubleshoot POS.
- Help customers check grocery availability and reserve 30-minute pickup holds.
- Respond naturally in English, Hindi, or Hinglish matching the customer's language.`,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "audio", audio: audioData }));
            }

            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "interrupted", interrupted: true }));
            }

            const textPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.text)?.text;
            if (textPart && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "transcript", text: textPart }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: "session_closed" }));
              clientWs.close();
            }
          },
          onerror: (err: any) => {
            console.error("[Gemini Live] Session error:", err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(
                JSON.stringify({
                  type: "error",
                  error: err?.message || "Gemini Live session error",
                })
              );
            }
          },
        },
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "connected",
            message: "Connected to Gemini Live voice stream",
          })
        );
      }

      clientWs.on("message", (raw: any) => {
        try {
          const payload = JSON.parse(raw.toString());

          if (payload.audio) {
            session.sendRealtimeInput({
              audio: {
                data: payload.audio,
                mimeType: "audio/pcm;rate=16000",
              },
            });
          } else if (payload.text) {
            session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } catch (err) {
          console.error("[Gemini Live] Failed to parse/send client input:", err);
        }
      });

      clientWs.on("close", () => {
        try {
          session.close();
        } catch {}
      });
    } catch (err: any) {
      console.warn("[Gemini Live] Falling back to Web Speech connection:", err?.message);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "connected",
            message: "Live Voice Assistant ready (In-browser speech audio)",
          })
        );
      }
    }
  });
}
