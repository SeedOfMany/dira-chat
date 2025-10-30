#!/bin/bash

echo "🚀 Setting up Dira Chat environment..."

# Create .env.local file
cat > .env.local << EOF
# Database - Using a simple local setup
POSTGRES_URL="postgresql://localhost:5432/dira_chat"

# NextAuth
AUTH_SECRET="dev-secret-key-$(openssl rand -hex 32)"

# Google AI (you'll need to add your API key)
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-api-key-here"

# NextAuth URL
NEXTAUTH_URL="http://localhost:3000"
EOF

echo "✅ Created .env.local file"
echo ""
echo "📝 Next steps:"
echo "1. Get a Google AI API key from: https://aistudio.google.com/"
echo "2. Replace 'your-google-ai-api-key-here' in .env.local with your actual API key"
echo "3. Set up PostgreSQL database (see instructions below)"
echo "4. Run: pnpm db:migrate"
echo "5. Run: pnpm dev"
echo ""
echo "🗄️  Database setup options:"
echo "Option A - Local PostgreSQL:"
echo "  brew install postgresql"
echo "  brew services start postgresql"
echo "  createdb dira_chat"
echo ""
echo "Option B - Cloud database (easier):"
echo "  - Get free database from Neon (https://neon.tech)"
echo "  - Replace POSTGRES_URL in .env.local with your database URL"
echo ""
echo "Option C - Use Vercel:"
echo "  npm i -g vercel"
echo "  vercel link"
echo "  vercel env pull"

