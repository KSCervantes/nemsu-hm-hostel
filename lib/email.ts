import nodemailer from "nodemailer";
import * as fs from "fs";
import * as path from "path";

// Get logo as base64 for embedding in emails
function getLogoBase64(): string {
  try {
    const logoPath = path.join(process.cwd(), "public", "img", "NEMSU.png");
    const logoBuffer = fs.readFileSync(logoPath);
    return logoBuffer.toString("base64");
  } catch (error) {
    console.error("Failed to read logo file:", error);
    return "";
  }
}

// Logo CID for email embedding
const LOGO_CID = "nemsu-logo";

// Format order ID to look nicer (e.g., "ORD-000001")
function formatOrderId(orderId: number): string {
  return `ORD-${String(orderId).padStart(6, "0")}`;
}

// Validate email configuration
function validateEmailConfig() {
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;

  if (!emailUser || !emailPassword) {
    console.warn("⚠️ EMAIL CONFIGURATION MISSING:");
    if (!emailUser) console.warn("  - EMAIL_USER is not set in environment variables");
    if (!emailPassword) console.warn("  - EMAIL_PASSWORD is not set in environment variables");
    console.warn("  - Please check EMAIL_SETUP.md for configuration instructions");
    return false;
  }

  return true;
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

try {
  if (validateEmailConfig()) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify connection on startup
    transporter.verify((error, success) => {
      if (error) {
        console.error("❌ EMAIL TRANSPORTER VERIFICATION FAILED:", error.message);
        console.error("   Common issues:");
        console.error("   1. Invalid Gmail App Password");
        console.error("   2. 2-Step Verification not enabled");
        console.error("   3. Incorrect EMAIL_USER or EMAIL_PASSWORD");
        console.error("   See EMAIL_SETUP.md for troubleshooting");
      } else {
        console.log("✅ Email transporter verified successfully");
      }
    });
  } else {
    console.warn("⚠️ Email transporter not initialized - emails will not be sent");
  }
} catch (error) {
  console.error("❌ Failed to create email transporter:", error);
  transporter = null;
}

interface OrderEmailData {
  customerName: string;
  email: string;
  orderId: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    notes?: string;
  }>;
  total: number;
  address: string;
  contactNumber: string;
  date?: string;
  time?: string;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const logoBase64 = getLogoBase64();

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
    ${item.notes ? `<tr><td colspan="4" style="padding: 5px 10px; font-size: 12px; color: #6b7280; font-style: italic;">Note: ${item.notes}</td></tr>` : ""}
  `
    )
    .join("");

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: `Order Confirmation ${formatOrderId(data.orderId)} - Thank You! 🎉`,
    attachments: logoBase64 ? [{
      filename: "logo.png",
      content: logoBase64,
      encoding: "base64",
      cid: LOGO_CID,
    }] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Thank you for your order at NEMSU Hostel</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Order Info -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Details</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 5px 0; text-align: right;"><span style="background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px;">${formatOrderId(data.orderId)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Customer Name:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Contact Number:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.contactNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Delivery Address:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.address}</td>
                </tr>
                ${data.date ? `
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Date:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.date}</td>
                </tr>
                ` : ""}
                ${data.time ? `
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Time:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.time}</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <!-- Order Items -->
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; text-align: right;">
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">TOTAL AMOUNT</p>
              <p style="margin: 5px 0 0 0; color: white; font-size: 32px; font-weight: bold;">₱${data.total.toFixed(2)}</p>
            </div>

            <!-- Next Steps -->
            <div style="margin-top: 30px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">📋 What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.6;">
                <li>We've received your delivery order and will review it shortly</li>
                <li>You'll receive an acceptance email once your order is confirmed</li>
                <li>Your order will be prepared and delivered to your address</li>
                <li>Estimated delivery time: 45-60 minutes after acceptance</li>
                <li>For urgent inquiries, please contact us at 09222222222</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 40px; height: 40px; margin-bottom: 10px; border-radius: 50%;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">NEMSU Hostel - North Eastern Mindanao State University</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Thank you for choosing our service. Contact: 09222222222</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.error("❌ Cannot send email: Email transporter not configured");
      console.error("   Please set EMAIL_USER and EMAIL_PASSWORD in .env file");
      return { success: false, error: "Email transporter not configured" };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation email sent to ${data.email} for order ${formatOrderId(data.orderId)}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Email sending failed:", error.message || error);
    if (error.code === "EAUTH") {
      console.error("   Authentication failed - check EMAIL_USER and EMAIL_PASSWORD");
      console.error("   Make sure you're using a Gmail App Password, not your regular password");
    } else if (error.code === "ECONNECTION") {
      console.error("   Connection failed - check your internet connection");
    }
    return { success: false, error: error.message || String(error) };
  }
}

export async function sendOrderPickupConfirmationEmail(data: OrderEmailData) {
  const logoBase64 = getLogoBase64();

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
    ${item.notes ? `<tr><td colspan="4" style="padding: 5px 10px; font-size: 12px; color: #6b7280; font-style: italic;">Note: ${item.notes}</td></tr>` : ""}
  `
    )
    .join("");

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: `Pickup Confirmation ${formatOrderId(data.orderId)} - See You Soon! 👜`,
    attachments: logoBase64 ? [{
      filename: "logo.png",
      content: logoBase64,
      encoding: "base64",
      cid: LOGO_CID,
    }] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); padding: 30px; text-align: center;">
            <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Pickup Confirmed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your order will be ready for pickup at NEMSU Hostel</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Pickup Info -->
            <div style="background-color: #fff7ed; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #fb923c;">
              <h2 style="margin: 0 0 10px 0; color: #9a3412; font-size: 18px;">📍 Pickup Location</h2>
              <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                Hostel Restaurant<br/>
                 North Eastern Mindanao State University (NEMSU) Lianga Campus, Poblacion, Lianga, Surigao del Sur, Philippines, 8307<br/>
                Open daily: 8:00 AM – 9:00 PM
              </p>
              ${data.time ? `<p style="margin: 8px 0 0 0; color: #374151; font-size: 14px;">Preferred pickup time: <strong>${data.time}</strong></p>` : ""}
            </div>

            <!-- Order Info -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Details</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;"><span style="background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px;">${formatOrderId(data.orderId)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Customer Name:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Contact Number:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.contactNumber}</td>
                </tr>
              </table>
            </div>

            <!-- Order Items -->
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background: linear-gradient(135deg, #fb923c 0%, #f97316 100%); padding: 20px; border-radius: 8px; text-align: right;">
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">TOTAL AMOUNT</p>
              <p style="margin: 5px 0 0 0; color: white; font-size: 32px; font-weight: bold;">₱${data.total.toFixed(2)}</p>
            </div>

            <!-- Important Notice -->
            <div style="margin-top: 30px; padding: 20px; background-color: #fff7ed; border-left: 4px solid #fb923c; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; color: #9a3412; font-size: 16px;">⏳ Please Wait for Confirmation</h3>
              <p style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; line-height: 1.6; font-weight: 600;">
                Your order is pending review. Please do not proceed to the restaurant yet.
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.6;">
                <li>We've received your pickup order and will review it shortly</li>
                <li>You'll receive an acceptance email once your order is confirmed</li>
                <li><strong>Only come to pick up after receiving the acceptance notification</strong></li>
                <li>Estimated preparation time: 30-45 minutes after acceptance</li>
                <li>For urgent inquiries, please contact us at 09222222222</li>
              </ul>
            </div>

            <!-- Pickup Instructions -->
            <div style="margin-top: 20px; padding: 20px; background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">ℹ️ When You Come to Pick Up</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.6;">
                <li>Bring a valid ID and mention your Order ID <strong>${formatOrderId(data.orderId)}</strong></li>
                <li>Go to the cashier counter for pickup</li>
                <li>If someone else will pick up, please inform us via call</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 40px; height: 40px; margin-bottom: 10px; border-radius: 50%;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">NEMSU Hostel - North Eastern Mindanao State University</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">See you soon! Contact: 09222222222</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.error("❌ Cannot send email: Email transporter not configured");
      return { success: false, error: "Email transporter not configured" };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Pickup confirmation email sent to ${data.email} for order ${formatOrderId(data.orderId)}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Pickup confirmation email failed:", error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function sendOrderAcceptedEmail(data: OrderEmailData) {
  const logoBase64 = getLogoBase64();

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
    ${item.notes ? `<tr><td colspan="4" style="padding: 5px 10px; font-size: 12px; color: #6b7280; font-style: italic;">Note: ${item.notes}</td></tr>` : ""}
  `
    )
    .join("");

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: `Order ${formatOrderId(data.orderId)} Accepted - Preparing Your Order! ✅`,
    attachments: logoBase64 ? [{
      filename: "logo.png",
      content: logoBase64,
      encoding: "base64",
      cid: LOGO_CID,
    }] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
            <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Accepted!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">We're preparing your order now at NEMSU Hostel</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Status Update -->
            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
              <h2 style="margin: 0 0 10px 0; color: #1e40af; font-size: 20px;">🎉 Great News!</h2>
              <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">
                Your order has been <strong>accepted</strong> and is now being prepared by our team.
                We'll notify you once your order is ready for delivery/pickup.
              </p>
            </div>

            <!-- Order Info -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Details</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 5px 0; text-align: right;"><span style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px;">${formatOrderId(data.orderId)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Status:</td>
                  <td style="padding: 5px 0; text-align: right;">
                    <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">ACCEPTED</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Customer Name:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Contact Number:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.contactNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Delivery Address:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.address}</td>
                </tr>
                ${data.date ? `
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Scheduled Date:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.date}</td>
                </tr>
                ` : ""}
                ${data.time ? `
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Scheduled Time:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.time}</td>
                </tr>
                ` : ""}
              </table>
            </div>

            <!-- Order Items -->
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 20px; border-radius: 8px; text-align: right;">
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">TOTAL AMOUNT</p>
              <p style="margin: 5px 0 0 0; color: white; font-size: 32px; font-weight: bold;">₱${data.total.toFixed(2)}</p>
            </div>

            <!-- What's Next -->
            <div style="margin-top: 30px; padding: 20px; background-color: #dcfce7; border-left: 4px solid #10b981; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">📦 What Happens Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #1f2937; font-size: 14px; line-height: 1.6;">
                <li>Our kitchen team is now preparing your order</li>
                <li>Estimated preparation time: 30-45 minutes</li>
                <li>You'll receive another notification when your order is ready</li>
                <li>For any changes or urgent matters, please call us immediately at 09222222222</li>
              </ul>
            </div>

            <!-- Contact Info -->
            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 600;">
                📞 Need to make changes? Contact us now!
              </p>
              <p style="margin: 5px 0 0 0; color: #92400e; font-size: 13px;">
                We're here to help ensure your order is perfect.
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 40px; height: 40px; margin-bottom: 10px; border-radius: 50%;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">NEMSU Hostel - North Eastern Mindanao State University</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">We appreciate your business. Contact: 09222222222</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.error("❌ Cannot send email: Email transporter not configured");
      return { success: false, error: "Email transporter not configured" };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Order accepted email sent to ${data.email} for order ${formatOrderId(data.orderId)}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Order accepted email sending failed:", error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function sendOrderCompletedEmail(data: OrderEmailData) {
  const logoBase64 = getLogoBase64();

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
    ${item.notes ? `<tr><td colspan="4" style="padding: 5px 10px; font-size: 12px; color: #6b7280; font-style: italic;">Note: ${item.notes}</td></tr>` : ""}
  `
    )
    .join("");

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: `Order ${formatOrderId(data.orderId)} Completed - Thank You! 🎉`,
    attachments: logoBase64 ? [{
      filename: "logo.png",
      content: logoBase64,
      encoding: "base64",
      cid: LOGO_CID,
    }] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Completed!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Your order has been successfully delivered from NEMSU Hostel</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Success Message -->
            <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981; text-align: center;">
              <h2 style="margin: 0 0 10px 0; color: #065f46; font-size: 24px;">✨ Thank You!</h2>
              <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">
                Your order has been <strong>completed</strong> and delivered successfully.
                We hope you enjoyed your meal!
              </p>
            </div>

            <!-- Order Info -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Summary</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 5px 0; text-align: right;"><span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px;">${formatOrderId(data.orderId)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Status:</td>
                  <td style="padding: 5px 0; text-align: right;">
                    <span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 700;">COMPLETED</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Customer Name:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Contact Number:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.contactNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Delivery Address:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.address}</td>
                </tr>
              </table>
            </div>

            <!-- Order Items -->
            <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left; font-size: 13px; color: #6b7280; font-weight: 600;">Item</th>
                  <th style="padding: 10px; text-align: center; font-size: 13px; color: #6b7280; font-weight: 600;">Qty</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Price</th>
                  <th style="padding: 10px; text-align: right; font-size: 13px; color: #6b7280; font-weight: 600;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; text-align: right;">
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 600;">TOTAL AMOUNT</p>
              <p style="margin: 5px 0 0 0; color: white; font-size: 32px; font-weight: bold;">₱${data.total.toFixed(2)}</p>
            </div>

            <!-- Feedback Request -->
            <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; text-align: center;">
              <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 18px;">⭐ We'd Love Your Feedback!</h3>
              <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.6;">
                Your opinion matters to us. How was your experience?
                Please let us know how we can serve you better next time.
              </p>
            </div>

            <!-- Thank You Message -->
            <div style="margin-top: 20px; padding: 20px; background-color: #eff6ff; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px; font-weight: 600;">
                🙏 Thank you for choosing us!
              </p>
              <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                We appreciate your business and look forward to serving you again soon.
                For any concerns or future orders, feel free to contact us at 09222222222
              </p>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 40px; height: 40px; margin-bottom: 10px; border-radius: 50%;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">NEMSU Hostel - North Eastern Mindanao State University</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Your satisfaction is our priority. Contact: 09222222222</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.error("❌ Cannot send email: Email transporter not configured");
      return { success: false, error: "Email transporter not configured" };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Order completed email sent to ${data.email} for order ${formatOrderId(data.orderId)}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Order completed email sending failed:", error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}

export async function sendOrderCancelledEmail(data: OrderEmailData) {
  const logoBase64 = getLogoBase64();

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₱${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>
    ${item.notes ? `<tr><td colspan="4" style="padding: 5px 10px; font-size: 12px; color: #6b7280; font-style: italic;">Note: ${item.notes}</td></tr>` : ""}
  `
    )
    .join("");

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
    to: data.email,
    subject: `Order Cancelled ${formatOrderId(data.orderId)} - We're Sorry`,
    attachments: logoBase64 ? [{
      filename: "logo.png",
      content: logoBase64,
      encoding: "base64",
      cid: LOGO_CID,
    }] : [],
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center;">
            <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 80px; height: 80px; margin-bottom: 15px; border-radius: 50%; opacity: 0.7;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Order Cancelled</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">We're sorry to inform you from NEMSU Hostel</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px;">
            <!-- Notice -->
            <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
              <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                <strong>Dear ${data.customerName},</strong><br><br>
                We regret to inform you that your order <strong>${formatOrderId(data.orderId)}</strong> has been cancelled by our team.
                This could be due to various reasons such as item availability, delivery constraints, or other operational issues.
              </p>
            </div>

            <!-- Order Info -->
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Cancelled Order Details</h2>
              <table style="width: 100%; font-size: 14px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Order ID:</td>
                  <td style="padding: 5px 0; text-align: right;"><span style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 4px 12px; border-radius: 6px; font-weight: 700; font-size: 13px;">${formatOrderId(data.orderId)}</span></td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Customer Name:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.customerName}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Contact Number:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.contactNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-weight: 600;">Delivery Address:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${data.address}</td>
                </tr>
              </table>
            </div>

            <!-- Order Items -->
            <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Items in Cancelled Order</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 10px; text-align: left; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Item</th>
                  <th style="padding: 10px; text-align: center; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Qty</th>
                  <th style="padding: 10px; text-align: right; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Price</th>
                  <th style="padding: 10px; text-align: right; color: #6b7280; font-weight: 600; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Total -->
            <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 20px; font-weight: 600; color: #1f2937;">Total Amount:</span>
                <span style="font-size: 24px; font-weight: 700; color: #dc2626;">₱${data.total.toFixed(2)}</span>
              </div>
            </div>

            <!-- Contact Info -->
            <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; text-align: center;">
              <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 14px; font-weight: 600;">We apologize for any inconvenience</p>
              <p style="margin: 0 0 15px 0; color: #6b7280; font-size: 14px;">Please feel free to place a new order or contact us for assistance</p>
              <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #fee2e2;">
                <p style="margin: 0; color: #6b7280; font-size: 13px;">📞 Contact us at:</p>
                <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 16px; font-weight: 600;">09222222222</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <img src="cid:${LOGO_CID}" alt="NEMSU Logo" style="width: 40px; height: 40px; margin-bottom: 10px; border-radius: 50%; opacity: 0.7;">
              <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 14px;">NEMSU Hostel - North Eastern Mindanao State University</p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">We hope to serve you better next time. Contact: 09222222222</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (!transporter) {
      console.error("❌ Cannot send email: Email transporter not configured");
      return { success: false, error: "Email transporter not configured" };
    }

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Order cancelled email sent to ${data.email} for order ${formatOrderId(data.orderId)}`);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("❌ Order cancelled email sending failed:", error.message || error);
    return { success: false, error: error.message || String(error) };
  }
}
