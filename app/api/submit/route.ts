import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. ส่งข้อมูลไปยัง Google Apps Script เพื่อบันทึกลง Database
    const gasResponse = await fetch(process.env.GOOGLE_SCRIPT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const gasResult = await gasResponse.json();

    if (gasResult.status !== "success") {
      throw new Error(gasResult.message || "Google Apps Script Error");
    }

    const { ticketId } = gasResult; // ดึง ticketId มาใช้สร้างลิงก์

    // 2. กำหนดสีและข้อความตามระดับผลกระทบ
    let headerBgColor = "#16a34a"; // สีเขียว (Normal)
    let impactText = "ปกติ (Normal)";
    let impactTextColor = "#16a34a";

    if (body.impact === "Critical") {
      headerBgColor = "#dc2626"; // สีแดง
      impactText = "วิกฤต (Critical)";
      impactTextColor = "#dc2626";
    } else if (body.impact === "High") {
      headerBgColor = "#ea580c"; // สีส้ม
      impactText = "ด่วน (High)";
      impactTextColor = "#ea580c";
    }

    // === จุดที่แก้ไข ===
    // เปลี่ยนจาก /admin/maintenance/${ticketId} เป็น /admin?id=${ticketId} เพื่อไม่ให้ติด 404
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const adminDashboardUrl = `${baseUrl}/admin?id=${ticketId}`;

    // 3. ประกอบร่าง LINE Flex Message
    const flexMessage = {
      to: process.env.LINE_USER_ID,
      messages: [
        {
          type: "flex",
          altText: `⚠️ แจ้งซ่อมใหม่: ${ticketId} (${body.room})`,
          contents: {
            type: "bubble",
            size: "mega",
            header: {
              type: "box",
              layout: "vertical",
              backgroundColor: headerBgColor,
              paddingAll: "20px",
              contents: [
                {
                  type: "text",
                  text: "⚠️ มีแจ้งซ่อมใหม่เข้าสู่ระบบ!",
                  weight: "bold",
                  color: "#ffffff",
                  size: "md",
                }
              ]
            },
            body: {
              type: "box",
              layout: "vertical",
              paddingAll: "20px",
              spacing: "md",
              contents: [
                {
                  type: "text",
                  text: `Ticket: ${ticketId || "N/A"}`,
                  weight: "bold",
                  size: "xl",
                  color: "#1f2937",
                },
                {
                  type: "box",
                  layout: "vertical",
                  margin: "lg",
                  spacing: "sm",
                  contents: [
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        { type: "text", text: "📍 สถานที่", color: "#6b7280", size: "sm", flex: 3 },
                        { type: "text", text: body.room, weight: "bold", color: "#1f2937", size: "sm", flex: 7, wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        { type: "text", text: "🔴 ผลกระทบ", color: "#6b7280", size: "sm", flex: 3 },
                        { type: "text", text: impactText, weight: "bold", color: impactTextColor, size: "sm", flex: 7, wrap: true },
                      ],
                    },
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              paddingAll: "20px",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  color: "#2563eb",
                  action: {
                    type: "uri",
                    label: "🔍 ดูรายละเอียด / จัดการ",
                    uri: adminDashboardUrl,
                  },
                },
              ],
            },
          },
        },
      ],
    };

    // 4. ยิงข้อความไปยัง LINE Messaging API
    const lineResponse = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(flexMessage),
    });

    if (!lineResponse.ok) {
      const lineError = await lineResponse.text();
      console.error("LINE Messaging API Error:", lineError);
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (error) {
    console.error("Submit API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}