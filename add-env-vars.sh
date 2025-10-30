#!/bin/bash

echo "Adding environment variables to Vercel..."

# Generate a secure AUTH_SECRET
AUTH_SECRET=$(openssl rand -base64 32)
echo "Generated AUTH_SECRET: $AUTH_SECRET"

echo ""
echo "Please add these environment variables to your Vercel project:"
echo "1. Go to: https://vercel.com/ruch-blog/dira-chat"
echo "2. Click Settings → Environment Variables"
echo "3. Add these variables:"
echo ""
echo "AUTH_SECRET=$AUTH_SECRET"
echo "POSTGRES_URL=your-database-url-here"
echo "GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key-here"
echo "NEXTAUTH_URL=https://dira-chat-5lhl16ty1-ruch-blog.vercel.app"
echo ""
echo "After adding these, redeploy the app and it should work!"

