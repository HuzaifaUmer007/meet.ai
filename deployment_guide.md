# 🚀 Vercel Deployment Guide

Follow these steps to deploy **Meet.AI** to production.

## 1. Prepare Environment Variables
Copy all keys from your `.env` file. You will need to add these to the **Vercel Dashboard > Project Settings > Environment Variables**.

> [!IMPORTANT]
> Change `NEXT_PUBLIC_APP_URL` from `http://localhost:3000` to your actual Vercel URL (e.g., `https://meet-ai-yourname.vercel.app`).

## 2. Connect to GitHub
1. Go to [vercel.com](https://vercel.com).
2. Click **New Project** and import your GitHub repository.
3. Add all your environment variables.
4. Click **Deploy**.

## 3. Update External Services (Webhooks)
Once your app is live on Vercel, you MUST update the webhook URLs in your service dashboards:

### 📽️ Stream Video Dashboard
Update the **Webhook URL** to:
`https://your-app-name.vercel.app/api/webhook`

### 💳 Stripe Dashboard
Update the **Webhook URL** to:
`https://your-app-name.vercel.app/api/webhook/stripe`
*(Make sure to copy the new `STRIPE_WEBHOOK_SECRET` and update it in Vercel settings).*dasd

### ⚡ Inngest Cloud
1. Go to [Inngest.com](https://inngest.com) and create a production environment.
2. Add your **Vercel Endpoint**: `https://your-app-name.vercel.app/api/inngest`
3. Copy the `INNGEST_SIGNING_KEY` and add it to Vercel.

## 4. Supabase Auth Settings
In the Supabase Dashboard:
1. Go to **Authentication > URL Configuration**.
2. Update **Site URL** to your Vercel URL.
3. Add your Vercel URL to **Redirect URLs**.

## 5. Build Command Tip
If you face issues with React 19 types, ensure your build command in Vercel is:
`npm run build`
(Vercel handles peer dependencies automatically usually, but keep an eye on the logs).

---
**Your SaaS is now live! 🚀**
