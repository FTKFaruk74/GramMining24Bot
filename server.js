const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const TelegramBot = require('node-telegram-bot-api');

const token = 'YOUR_TELEGRAM_BOT_TOKEN'; // আপনার BotFather থেকে পাওয়া টেলিগ্রাম টোকেন
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
    const startPayload = match[1]; // রেফারেল কোড ধরার জন্য যেমন: ref_12345678

    // চেক করুন ইউজার ডাটাবেজে আগে থেকেই আছে কি না
    let { data: existingUser } = await supabase.from('users').select('*').eq('id', userId).single();

    if (!existingUser) {
        let referredBy = null;
        if (startPayload && startPayload.startsWith('ref_')) {
            referredBy = startPayload.replace('ref_', '');
        }

        // নতুন ইউজার ডাটাবেজে সেভ করুন (নতুন লজিক অনুযায়ী আপডেট করা কলামসহ)
        await supabase.from('users').insert([{
            id: userId,
            username: username,
            first_name: firstName,
            gram_balance: 0.0,
            unclaimed_gram: 0.0,
            main_usd_balance: 0.0,
            tasks_completed: 0,
            referred_by: referredBy,
            referrals_json: []
        }]);

        // যদি কেউ রেফারেলের মাধ্যমে এসে থাকে, তবে যার লিংকে এসেছে তার রেফারেল লিস্টে এই ইউজারকে যুক্ত করা হবে
        if (referredBy && referredBy != userId.toString()) {
            let { data: refUser } = await supabase.from('users').select('referrals_json').eq('id', referredBy).single();
            if (refUser) {
                let list = refUser.referrals_json ? refUser.referrals_json : [];
                // ডুপ্লিকেট এন্ট্রি এড়াতে চেক করা
                if (!list.some(item => item.id == userId)) {
                    list.push({ name: firstName, id: userId });
                    await supabase.from('users').update({ referrals_json: list }).eq('id', referredBy);
                }
            }
        }
    }

    // মিনি অ্যাপ ওপেন করার বাটনসহ মেসেজ পাঠানো
    const webAppUrl = 'https://your-vercel-app-url.vercel.app'; // আপনার ভার্সেল লাইভ লিংক
    
    bot.sendMessage(chatId, `🤖 **Welcome to GRAM Mining Bot!**\n\nComplete the required tasks to unlock live mining and earn rewards.`, {
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
