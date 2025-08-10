# Cabo Fit Pass

A production-ready, modern fitness booking platform built with Next.js 14, Supabase, and NextAuth, specifically designed for the Los Cabos market.

## 🚀 Features

- **Complete Authentication System** - Built with Supabase and NextAuth
- **Credit-Based Booking** - Scalable credit system for fitness classes
- **Responsive Design** - Modern UI built with Shadcn UI and Tailwind CSS
- **Production Ready** - Configured for immediate deployment to Vercel
- **Los Cabos Focused** - Tailored for tourism-heavy fitness market

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Backend**: Supabase (Database, Auth, Real-time)
- **Authentication**: NextAuth.js
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd cabo-fit-pass
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# NextAuth Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

**Get Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or select existing
3. Go to Settings > API
4. Copy Project URL and anon/public key

### 3. Database Setup

Run the migration in your Supabase project:

```sql
-- Check supabase/migrations/001_initial_schema.sql
-- This will create the necessary tables for classes and bookings
```

### 4. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build

```bash
npm run build
npm start
```

## 🚀 Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
5. Deploy!

## 🏗️ Project Structure

```
cabo-fit-pass/
├── app/                    # Next.js 14 app directory
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Shadcn UI components
│   └── fitness/          # Fitness-specific components
├── lib/                  # Utility libraries
├── providers/            # Context providers
├── supabase/             # Database migrations
└── utils/                # Helper functions
```

## 🔧 Configuration

### Supabase Setup

1. **Enable Row Level Security (RLS)**
2. **Set up policies** for your tables
3. **Configure authentication** settings

### NextAuth Setup

1. **Configure providers** in your auth setup
2. **Set up callbacks** for user management
3. **Configure session handling**

## 🐛 Troubleshooting

### Build Errors

- **Missing dependencies**: Run `npm install`
- **TypeScript errors**: Check for syntax issues in components
- **Environment variables**: Ensure `.env.local` is properly configured

### Runtime Errors

- **Supabase connection**: Verify environment variables
- **Authentication issues**: Check NextAuth configuration
- **Database errors**: Verify table structure and RLS policies

### Deployment Issues

- **Vercel build failures**: Check build logs for specific errors
- **Environment variables**: Ensure they're set in Vercel dashboard
- **Database access**: Verify Supabase project is accessible from production

## 📱 Features Overview

- **User Authentication**: Sign up, sign in, sign out
- **Credit Management**: Purchase and manage fitness credits
- **Class Booking**: Browse and book fitness classes
- **Responsive Dashboard**: Mobile-friendly interface
- **Real-time Updates**: Live credit and booking status

## 🔒 Security Features

- **Row Level Security** in Supabase
- **Environment variable protection**
- **Type-safe API calls**
- **Secure authentication flow**

## 📈 Performance

- **Static generation** where possible
- **Optimized images** and assets
- **Efficient database queries**
- **Minimal bundle size**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please:
1. Check the troubleshooting section
2. Review Supabase and Next.js documentation
3. Open an issue on GitHub

---

**Built with ❤️ for the Los Cabos fitness community**
