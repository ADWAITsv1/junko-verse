import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as any;
    const { activity, date, time, message, guest } = data;

    const timestamp = new Date().toISOString();
    const record = {
      timestamp,
      guest: guest || '淳子',
      activity: activity || 'Practice Golf Track',
      date: date || '',
      time: time || '',
      message: message || '',
    };

    // 1. Try to save response to local JSON file if filesystem is writable
    try {
      const filePath = path.join(process.cwd(), 'hangout-responses.json');
      let responses: any[] = [];
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf8');
          responses = JSON.parse(fileContent);
        } catch (e) {
          responses = [];
        }
      }
      responses.push(record);
      fs.writeFileSync(filePath, JSON.stringify(responses, null, 2), 'utf8');
      console.log('Saved hangout response to hangout-responses.json:', record);
    } catch (fsErr) {
      console.log('Local file write skipped (worker/read-only environment):', record);
    }

    // 2. Optional: Send to Discord Webhook if configured
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhook) {
      try {
        await fetch(discordWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎉 **New Hangout Response from 淳子!**\n\n💬 **Message:** ${message}\n📅 **Date & Time:** ${date} @ ${time}\n⛳ **Activity:** ${activity}`,
          }),
        });
      } catch (err) {
        console.error('Failed to post to Discord webhook:', err);
      }
    }

    // 3. Optional: Send to Telegram Bot if configured
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    const telegramChatId = process.env.TELEGRAM_CHAT_ID;
    if (telegramBotToken && telegramChatId) {
      try {
        const tgText = `🎉 New Hangout Response from 淳子!\n\nMessage: ${message}\nDate: ${date} @ ${time}\nActivity: ${activity}`;
        await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramChatId,
            text: tgText,
          }),
        });
      } catch (err) {
        console.error('Failed to post to Telegram bot:', err);
      }
    }

    // 4. Optional: Send to ntfy.sh topic if configured (Free, zero-signup instant mobile push notifications)
    const ntfyTopic = process.env.NTFY_TOPIC || 'adwait-junko-773';
    if (ntfyTopic) {
      try {
        await fetch(`https://ntfy.sh/${ntfyTopic}`, {
          method: 'POST',
          headers: {
            'Title': 'New Hangout Confirmed by 淳子!',
            'Tags': 'tada,sparkles,cat',
            'Priority': 'high',
          },
          body: `📅 ${date} @ ${time}\n⛳ ${activity}\n💬 "${message}"`,
        });
        console.log(`Push notification sent to ntfy topic: ${ntfyTopic}`);
      } catch (err) {
        console.error('Failed to post to ntfy.sh:', err);
      }
    }

    // 5. Optional: Send Email via Resend to cadadwait@gmail.com
    const resendApiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.NOTIFICATION_EMAIL || 'cadadwait@gmail.com';
    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '淳子 Hangout <onboarding@resend.dev>',
            to: [recipientEmail],
            subject: `🎉 淳子からお返事が届きました！（${activity}）`,
            html: `
              <h2>Hey Adwait! 🎉</h2>
              <p>淳子がおでかけの約束を確定しました！</p>
              <div style="background:#f4fbf7;padding:16px 20px;border-radius:12px;border:1px solid #b7e4c7;margin:16px 0;">
                <p style="margin:6px 0;"><strong>⛳ プラン:</strong> ${activity}</p>
                <p style="margin:6px 0;"><strong>📅 日程・時間:</strong> ${date} ${time}</p>
                <p style="margin:10px 0 4px;"><strong>💬 メッセージ:</strong></p>
                <blockquote style="margin:0;padding:10px 14px;background:#ffffff;border-left:4px solid #2d6a4f;border-radius:4px;font-style:normal;">
                  “${message}”
                </blockquote>
              </div>
              <p style="color:#666;font-size:13px;">🐾 猫審議会認定：楽しい時間をお過ごしください！</p>
            `,
          }),
        });
        console.log(`Email dispatched via Resend to ${recipientEmail}`);
      } catch (err) {
        console.error('Failed to send email via Resend:', err);
      }
    }

    // 6. Optional: Send SMS via Twilio to +818091756196
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
    const targetPhone = process.env.NOTIFICATION_PHONE || '+818091756196';
    if (twilioSid && twilioToken && twilioFrom) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
        const smsParams = new URLSearchParams({
          To: targetPhone,
          From: twilioFrom,
          Body: `🎉 淳子 Confirmed Hangout!\n${activity} on ${date} @ ${time}\n"${message}"`,
        });
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: smsParams.toString(),
        });
        console.log(`SMS dispatched via Twilio to ${targetPhone}`);
      } catch (err) {
        console.error('Failed to send SMS via Twilio:', err);
      }
    }

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Failed to process notification:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
