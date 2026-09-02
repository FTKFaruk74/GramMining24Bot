const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // BotFather থেকে পাওয়া টোকেন
const bot = new TelegramBot(token, { polling: true });

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
app.use(express.json());

// টেলিগ্রাম /start কমান্ড হ্যান্ডলার
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const firstName = msg.from.first_name || "User";
    const username = msg.from.username || "";
    const startPayload = match[1]; // রেফারেল কোড ধরার জন্য যেমন: ref_123456

    // চেক করুন ইউজার ডাটাবেজে আছে কি না
    let { data: existingUser } = await supabase.from('users').select('*').eq('id', userId).single();

    if (!existingUser) {
        let referredBy = null;
        if (startPayload && startPayload.startsWith('ref_')) {
            referredBy = startPayload.replace('ref_', '');
        }

        // নতুন ইউজার ডাটাবেজে সেভ করুন
        await supabase.from('users').insert([{
            id: userId,
            username: username,
            first_name: firstName,
            gram_balance: 0.0,
            main_usd_balance: 0.0,
            referred_by: referredBy
        }]);
    }

    // মিনি অ্যাপ ওপেন করার বাটনসহ মেসেজ পাঠানো
    const webAppUrl = 'https://your-vercel-app-url.vercel.app'; // আপনার ভার্সেল লিংক
    
    bot.sendMessage(chatId, `🤖 **Welcome to GRAM Mining Bot!**\n\nStart mining your gems directly on Telegram with zero investment.`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Open Mining App", web_app: { url: webAppUrl } }],
                [{ text: "📢 Join Channel", url: "https://t.me/GRAMMining24Bot" }]
            ]
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Bot server is running on port ${PORT}`);
});
