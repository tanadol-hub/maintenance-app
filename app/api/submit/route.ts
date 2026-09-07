import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. ส่งข้อมูลไปยัง Google Apps Script
    const gasResponse = await fetch(process.env.GOOGLE_SCRIPT_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const gasResult = await gasResponse.json();

    if (gasResult.status !== "success") {
      throw new Error(gasResult.message || "Google Apps Script Error");
    }

    const { ticketId, imageUrl } = gasResult;

    // 2. กำหนดสีการ์ดและข้อความตามระดับผลกระทบ
    let headerBgColor = "#16a34a"; // สีเขียว
    let impactText = "🟢 ปกติ (Low)";

    if (body.impact === "Critical") {
      headerBgColor = "#dc2626"; // สีแดง
      impactText = "🔴 วิกฤต (Critical)";
    } else if (body.impact === "High") {
      headerBgColor = "#ea580c"; // สีส้ม
      impactText = "🟡 ด่วน (High)";
    }

    // ตรวจสอบ URL รูปภาพ และบังคับให้เป็น String เสมอ
    const validUrl = typeof imageUrl === "string" ? imageUrl : "";
    const isValidImageUrl = validUrl.startsWith("https://") && validUrl.length < 1000;

    // คลีนเบอร์โทรให้เหลือแค่ตัวเลข ป้องกัน LINE API Error เวลาเจอช่องว่างหรือตัวอักษร
    const cleanPhone = typeof body.phone === "string" ? body.phone.replace(/[^0-9+]/g, "") : "0000000000";

    // 3. ประกอบร่าง LINE Flex Message (แก้บั๊ก Layout แล้ว)
    const flexMessage = {
      to: process.env.LINE_USER_ID,
      messages: [
        {
          type: "flex",
          altText: `🛠️ แจ้งซ่อมใหม่: ${ticketId} (${body.room})`,
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
                  type: "box",
                  layout: "horizontal",
                  contents: [
                    {
                      type: "text",
                      text: "🛠️ แจ้งซ่อมใหม่",
                      weight: "bold",
                      color: "#ffffff",
                      size: "sm",
                    },
                    {
                      type: "text",
                      text: impactText,
                      color: "#ffffff",
                      size: "sm",
                      align: "end",
                      weight: "bold",
                    },
                  ],
                },
                {
                  type: "text",
                  text: ticketId || "Ticket ID",
                  weight: "bold",
                  size: "xl",
                  color: "#ffffff",
                  margin: "md",
                },
              ],
            },
            ...(isValidImageUrl
              ? {
                  hero: {
                    type: "image",
                    url: validUrl,
                    size: "full",
                    aspectRatio: "16:9",
                    aspectMode: "cover",
                    backgroundColor: "#f3f4f6",
                  },
                }
              : {}),
            body: {
              type: "box",
              layout: "vertical",
              paddingAll: "20px",
              contents: [
                {
                  type: "text",
                  text: "รายการอาการเสีย:",
                  weight: "bold",
                  color: "#6b7280",
                  size: "sm"
                },
                {
                  type: "text",
                  text: body.issuesList || "ไม่ได้ระบุ",
                  wrap: true,
                  color: "#ef4444",
                  weight: "bold",
                  size: "md",
                  margin: "sm" // เปลี่ยนมาใช้ margin แทน
                },
                ...(body.description
                  ? [
                      {
                        type: "text",
                        text: `เพิ่มเติม: ${body.description}`,
                        wrap: true,
                        color: "#4b5563",
                        size: "xs",
                        margin: "md",
                      },
                    ]
                  : []),
                {
                  type: "separator",
                  margin: "xl",
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
                        { type: "text", text: `${body.room} (${body.pcNumber})`, weight: "bold", color: "#1f2937", size: "sm", flex: 7, wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        { type: "text", text: "💻 ครุภัณฑ์", color: "#6b7280", size: "sm", flex: 3 },
                        { type: "text", text: body.assetId || "-", weight: "bold", color: "#1f2937", size: "sm", flex: 7, wrap: true },
                      ],
                    },
                    {
                      type: "box",
                      layout: "baseline",
                      spacing: "sm",
                      contents: [
                        { type: "text", text: "👤 ผู้แจ้ง", color: "#6b7280", size: "sm", flex: 3 },
                        { type: "text", text: `${body.name} (${body.userRole})`, weight: "bold", color: "#1f2937", size: "sm", flex: 7, wrap: true },
                      ],
                    },
                  ],
                },
              ],
            },
            footer: {
              type: "box",
              layout: "vertical",
              spacing: "sm",
              paddingAll: "20px",
              contents: [
                {
                  type: "button",
                  style: "primary",
                  height: "sm",
                  color: "#2563eb",
                  action: {
                    type: "uri",
                    label: `📞 โทรหาผู้แจ้ง`,
                    uri: `tel:${cleanPhone}`, // ใช้เบอร์ที่ล้างตัวหนังสือออกแล้ว
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
      // โค้ดนี้จะช่วยให้คุณเห็น Error ของ LINE ในหน้า Console (Terminal) ของโปรแกรมคุณ
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (error) {
    console.error("Submit API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}