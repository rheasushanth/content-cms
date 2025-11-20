# CMS Collection Tool

A modern headless Content Management System built with Next.js, TypeScript, and Supabase. Define custom schemas, manage collections, and expose content through secure public APIs.

## 🚀 Features

- ✅ **Custom Schema Designer** - Create flexible content structures (blogs, products, testimonials, etc.)
- ✅ **Rich Content Editor** - TipTap-powered rich text editing with formatting
- ✅ **Image Upload** - Supabase Storage integration for media management
- ✅ **API Key Management** - Secure authentication for programmatic access
- ✅ **Public APIs** - RESTful endpoints for fetching published content
- ✅ **Mobile Responsive** - Works seamlessly on all devices
- ✅ **Type-Safe** - Built with TypeScript for reliability
- ✅ **Popup Designer** - Create rule-based marketing/email capture popups

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account ([create one free](https://supabase.com))
- Git (for version control)

## 🛠️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/content-cms.git
cd content-cms
npm install
```

### 2. Set Up Supabase

#### Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details and wait for it to initialize

#### Configure Database Tables

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schemas table (content type definitions)
CREATE TABLE schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  owner UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table (instances of schemas)
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schema_id UUID REFERENCES schemas(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  published BOOLEAN DEFAULT false,
  owner UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection items table (actual content entries)
CREATE TABLE collection_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key_hash TEXT NOT NULL UNIQUE,
  description TEXT,
  scopes TEXT[] DEFAULT ARRAY['read:collections'],
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  owner UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_schemas_owner ON schemas(owner);
CREATE INDEX idx_collections_schema ON collections(schema_id);
CREATE INDEX idx_collections_owner ON collections(owner);
CREATE INDEX idx_collection_items_collection ON collection_items(collection_id);
CREATE INDEX idx_api_keys_owner ON api_keys(owner);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Schemas policies
CREATE POLICY "Users can view own schemas" ON schemas FOR SELECT USING (auth.uid() = owner);
CREATE POLICY "Users can create schemas" ON schemas FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Users can update own schemas" ON schemas FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Users can delete own schemas" ON schemas FOR DELETE USING (auth.uid() = owner);

-- Collections policies
CREATE POLICY "Users can view own collections" ON collections FOR SELECT USING (auth.uid() = owner);
CREATE POLICY "Users can create collections" ON collections FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Users can update own collections" ON collections FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Users can delete own collections" ON collections FOR DELETE USING (auth.uid() = owner);

-- Collection items policies
CREATE POLICY "Users can view items in own collections" ON collection_items FOR SELECT 
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.owner = auth.uid()));
CREATE POLICY "Users can create items in own collections" ON collection_items FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.owner = auth.uid()));
CREATE POLICY "Users can update items in own collections" ON collection_items FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.owner = auth.uid()));
CREATE POLICY "Users can delete items in own collections" ON collection_items FOR DELETE 
  USING (EXISTS (SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.owner = auth.uid()));

-- API Keys policies
CREATE POLICY "Users can view own API keys" ON api_keys FOR SELECT USING (auth.uid() = owner);
CREATE POLICY "Users can create API keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Users can update own API keys" ON api_keys FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Users can delete own API keys" ON api_keys FOR DELETE USING (auth.uid() = owner);
```

#### Create Storage Bucket for Images

1. In Supabase Dashboard, go to **Storage**
2. Click **New Bucket**
3. Name: `images`
4. **Public bucket**: ✅ Enabled
5. Click **Create bucket**
6. Go to **Policies** tab for the `images` bucket
7. Add policy:
   - **Policy name**: "Public read access"
   - **Allowed operations**: SELECT
   - **Target roles**: public
   - **Policy definition**: `true`

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Where to find these values:**
- Go to your Supabase project settings
- Click **API** in the sidebar
- Copy:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - service_role key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your CMS!

## 📚 Usage Guide

### Creating Your First Schema

1. Navigate to **Dashboard** → **Collections** → **Create New Collection**
2. Fill in:
   - **Title**: "Blog Posts"
   - **Description**: "Articles for our blog"
3. Add fields:
   - `title` (String, required)
   - `content` (Rich Text, required)
   - `author` (String, required)
   - `publishDate` (Date, required)
   - `heroImage` (Image, optional)
4. Click **Create Schema**

### Adding Content Items

1. Go to your collection
2. Click **Add New Item**
3. Fill in the form based on your schema
4. Toggle **Published** when ready
5. Click **Save Item**

### Generating API Keys

1. Go to **Dashboard** → **API Keys**
2. Click **Create New API Key**
3. Add description: "Production Website"
4. Select scopes: `read:collections`
5. Click **Generate API Key**
6. ⚠️ **Copy the key immediately** - it won't be shown again!

### Using the Public API

```javascript
// Fetch all published collections
const response = await fetch('https://your-domain.com/api/public/collections', {
  headers: {
    'Authorization': 'Bearer cms_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const { collections } = await response.json();
```

See full API documentation at [http://localhost:3000/docs](http://localhost:3000/docs)

## 🏗️ Project Structure

```
content-cms/
├── app/
│   ├── api/              # API routes
│   │   ├── api-keys/     # API key management
│   │   ├── collections/  # Collection CRUD
│   │   ├── public/       # Public APIs (require API key)
│   │   └── schemas/      # Schema CRUD
│   ├── dashboard/        # Protected dashboard pages
│   ├── docs/            # API documentation page
│   ├── login/           # Authentication pages
│   └── signup/
├── components/          # Reusable React components
│   ├── ErrorBoundary.tsx
│   ├── ImageUpload.tsx
│   ├── RichTextEditor.tsx
│   ├── Toast.tsx
│   └── ToastContainer.tsx
└── lib/
    ├── auth/            # Supabase auth helpers
    ├── middleware/      # Auth & API key middleware
    └── supabase/        # Supabase client
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com)
3. Click **New Project**
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click **Deploy**

### Update Supabase Settings

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your Vercel domain to **Site URL** and **Redirect URLs**:
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/auth/callback`

## 🔒 Security Best Practices

- ✅ Never commit `.env.local` to version control
- ✅ Use environment variables for all secrets
- ✅ Enable Row Level Security (RLS) in Supabase
- ✅ Rotate API keys regularly
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

## 📖 API Documentation

Visit `/docs` in your deployed application for complete API documentation with code examples.

### Quick API Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/public/collections` | GET | API Key | List published collections |
| `/api/public/collections/:id` | GET | API Key | Get single collection with items |
| `/api/schemas` | GET/POST | Session | Manage schemas |
| `/api/collections` | GET/POST | Session | Manage collections |
| `/api/collections/:id/items` | GET/POST | Session | Manage collection items |
| `/api/api-keys` | GET/POST | Session | Manage API keys |
| `/api/popups` | GET/POST | Session | Manage popups |
| `/api/popups/:id` | GET/PUT/DELETE | Session | Single popup CRUD |
| `/api/public/popups` | GET | Public | Active popups for front-end |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🐛 Troubleshooting

### "Unauthorized" errors
- Check that your Supabase environment variables are correct
- Ensure you're logged in (for dashboard routes)
- Verify API key is valid (for public routes)

### Image uploads failing
- Confirm the `images` bucket exists in Supabase Storage
- Check that the bucket is set to public
- Verify storage policies allow uploads

### Database errors
- Ensure all SQL migrations have been run
- Check RLS policies are enabled
- Verify foreign key relationships

## 📞 Support

For issues or questions:
- Check the `/docs` page for API documentation
- Review Supabase logs in the dashboard
- Open an issue on GitHub

---

Built with ❤️ using Next.js, TypeScript, and Supabase

### Popups Feature

Add engaging marketing or email capture overlays with flexible display rules.

#### Database Table (SQL)

```sql
CREATE TABLE IF NOT EXISTS popups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template TEXT NOT NULL,
  html_content TEXT NOT NULL,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE popups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own popups" ON popups FOR SELECT USING (auth.uid() = owner);
CREATE POLICY "Users can create popups" ON popups FOR INSERT WITH CHECK (auth.uid() = owner);
CREATE POLICY "Users can update own popups" ON popups FOR UPDATE USING (auth.uid() = owner);
CREATE POLICY "Users can delete own popups" ON popups FOR DELETE USING (auth.uid() = owner);
CREATE INDEX IF NOT EXISTS idx_popups_owner ON popups(owner);
CREATE INDEX IF NOT EXISTS idx_popups_active ON popups(active);
```

#### Creating a Popup
1. Go to `Dashboard → Popups → New`.
2. Select a template (email-capture-basic, discount-offer, newsletter-signup) or modify content directly in the rich editor.
3. Configure Rules:
   - Trigger: `onLoad` (after delay) or `exitIntent`.
   - Pages: comma separated paths; `*` wildcard (e.g. `/blog/*`).
   - Delay Seconds: wait time before showing on load.
   - Frequency Cap: max times per user (tracked via `localStorage`).
   - Optional Start/End date limits display window.
4. Mark Active and Save.
5. The popup renders automatically via `PopupInjector` in `app/layout.tsx`.

#### Display Rules Evaluation
The client retrieves active popups via `/api/public/popups` and matches the first whose `pages` patterns include the current path. Wildcard suffix (`*`) matches prefix. Frequency capping uses `localStorage` key `popup_<id>_shownCount`.

#### Front-End Usage
Already integrated: `PopupInjector` is mounted globally. To disable globally, remove `<PopupInjector />` from `app/layout.tsx`. To pause a popup, set `active=false` or adjust date range.

#### Security Notes
Popup HTML is rendered with `dangerouslySetInnerHTML`; only trusted users should create popups. Consider sanitization if opening creation to broader roles.
