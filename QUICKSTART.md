# CMS Tool - Quick Start Guide

Welcome to your new CMS! This guide will help you get started in 5 minutes.

---

## 🎯 Your First 5 Minutes

### 1. Sign Up (30 seconds)
1. Visit [http://localhost:3000/signup](http://localhost:3000/signup)
2. Enter your email and password
3. Click "Sign Up"
4. You'll be redirected to the dashboard

### 2. Create Your First Collection (2 minutes)
1. Click **"Create New Collection"** on the dashboard
2. Choose a template:
   - **Blog Post** - For articles, news, blog content
   - **Product Catalog** - For ecommerce products
3. Or create custom fields:
   - Click **"Add Field"**
   - Enter field name (e.g., "title", "author")
   - Select type (Text, Rich Text, Date, Image, etc.)
   - Check "Required" if needed
4. Click **"Create Collection"**

### 3. Add Content (1 minute)
1. Click on your new collection
2. Click **"Add New Item"**
3. Fill in the form based on your schema
4. Toggle **"Published"** when ready
5. Click **"Save Item"**

### 4. Generate API Key (30 seconds)
1. Go to **Dashboard** → **API Keys**
2. Click **"Create New API Key"**
3. Add description: "My Website"
4. Click **"Generate API Key"**
5. **⚠️ Copy the key immediately!** You won't see it again

### 5. Fetch Your Content (1 minute)
Use this in your website:

```javascript
const response = await fetch('http://localhost:3000/api/public/collections', {
  headers: {
    'Authorization': 'Bearer cms_your_api_key_here',
    'Content-Type': 'application/json'
  }
});

const { collections } = await response.json();
console.log(collections);
```

**Done! 🎉** You now have a working headless CMS.

---

## 📚 Common Use Cases

### Use Case 1: Blog Website

**Goal**: Manage blog posts for your Next.js website

**Steps**:
1. Create collection with "Blog Post" template
2. Add posts with title, content, author, date, image
3. Generate API key
4. Fetch posts in your Next.js app:

```typescript
// app/blog/page.tsx
export default async function BlogPage() {
  const res = await fetch('https://your-cms.vercel.app/api/public/collections/YOUR_COLLECTION_ID', {
    headers: {
      'Authorization': `Bearer ${process.env.CMS_API_KEY}`,
    },
    next: { revalidate: 60 } // Cache for 60 seconds
  });
  
  const { collection } = await res.json();
  const posts = collection.items;

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.data.title}</h2>
          <p>By {post.data.author} on {post.data.publishDate}</p>
          <div dangerouslySetInnerHTML={{ __html: post.data.content }} />
        </article>
      ))}
    </div>
  );
}
```

---

### Use Case 2: Product Catalog

**Goal**: Manage products for an ecommerce site

**Steps**:
1. Create collection with "Product Catalog" template
2. Add products with name, SKU, price, description, images
3. Generate API key
4. Display products:

```typescript
// components/ProductGrid.tsx
'use client'

import { useEffect, useState } from 'react'

export default function ProductGrid() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    fetch('/api/products') // Your own API route that fetches from CMS
      .then(res => res.json())
      .then(data => setProducts(data.items))
  }, [])

  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id} className="border rounded p-4">
          <img src={product.data.productImage} alt={product.data.name} />
          <h3>{product.data.name}</h3>
          <p>${product.data.price}</p>
          <button>Add to Cart</button>
        </div>
      ))}
    </div>
  )
}
```

---

### Use Case 3: Landing Page Content

**Goal**: Manage marketing content for landing pages

**Steps**:
1. Create custom schema:
   - `hero_title` (Text)
   - `hero_description` (Rich Text)
   - `hero_image` (Image)
   - `cta_text` (Text)
   - `cta_url` (Text)
   - `features` (Rich Text)
2. Add content item
3. Fetch and display on landing page

---

## 🎨 Understanding Schemas

### What is a Schema?
A schema is like a **blueprint** or **template** for your content.

**Think of it like**:
- Schema = Class definition in programming
- Collection Item = Instance of that class

### Schema Example: Blog Post
```json
{
  "title": "Blog Posts",
  "fields": [
    { "name": "title", "type": "text", "required": true },
    { "name": "content", "type": "rich_text", "required": true },
    { "name": "author", "type": "text", "required": true },
    { "name": "publishDate", "type": "date", "required": true },
    { "name": "heroImage", "type": "image", "required": false }
  ]
}
```

### Collection Item Example:
```json
{
  "data": {
    "title": "Getting Started with Next.js",
    "content": "<p>Next.js is a React framework...</p>",
    "author": "John Doe",
    "publishDate": "2025-11-11",
    "heroImage": "https://example.com/image.jpg"
  },
  "published": true
}
```

---

## 🔑 API Key Best Practices

### ✅ DO:
- Store API keys in environment variables
- Use different keys for development and production
- Regenerate keys if compromised
- Use descriptive names ("Production Website", "Staging Server")
- Make API calls from your **backend**, not client-side

### ❌ DON'T:
- Commit API keys to Git
- Share keys publicly
- Use the same key everywhere
- Make API calls from client-side JavaScript (exposes your key!)

### Example: Secure API Call

```typescript
// ✅ GOOD: Server-side API route
// app/api/blog/route.ts
export async function GET() {
  const response = await fetch('https://cms.example.com/api/public/collections/xyz', {
    headers: {
      'Authorization': `Bearer ${process.env.CMS_API_KEY}`, // ✅ Server-side only
    }
  });
  return response.json();
}

// ❌ BAD: Client-side fetch
// components/Blog.tsx
fetch('https://cms.example.com/api/public/collections/xyz', {
  headers: {
    'Authorization': 'Bearer cms_123456' // ❌ Exposed to users!
  }
});
```

---

## 📖 Field Types Guide

| Type | Use For | Example |
|------|---------|---------|
| **Text** | Short text (titles, names) | "My Blog Post", "John Doe" |
| **Rich Text** | Formatted content (HTML) | `<p>Hello <strong>world</strong></p>` |
| **Number** | Quantities, prices | 29.99, 100 |
| **Date** | Dates and times | "2025-11-11" |
| **Boolean** | True/false flags | true, false |
| **Image** | Image URLs | "https://example.com/image.jpg" |
| **Select** | Dropdown options | "Draft", "Published", "Archived" |

---

## 🚀 Workflow Tips

### Publishing Workflow:
1. Create collection item
2. Save as **draft** (published = false)
3. Review content
4. Toggle **Published** when ready
5. Content becomes available via public API

### Content Organization:
- Use **descriptive schema names**: "Blog Posts", not "Collection1"
- Add **descriptions** to schemas for team clarity
- Use **select fields** for consistent values (status, category)
- Add **required fields** for critical data

### Performance Tips:
- Cache API responses on your website
- Use Next.js `revalidate` for ISR (Incremental Static Regeneration)
- Only fetch published items in production
- Optimize images before uploading

---

## 📱 Mobile App Integration

### React Native Example:

```typescript
import { useEffect, useState } from 'react';

export default function BlogScreen() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch('https://your-cms.vercel.app/api/public/collections/xyz', {
      headers: {
        'Authorization': 'Bearer cms_your_key',
      }
    })
      .then(res => res.json())
      .then(data => setPosts(data.collection.items))
      .catch(err => console.error(err));
  }, []);

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => (
        <View>
          <Text>{item.data.title}</Text>
          <Text>{item.data.author}</Text>
        </View>
      )}
    />
  );
}
```

---

## 🎓 Learning Path

### Week 1: Basics
- [ ] Create account
- [ ] Create first collection
- [ ] Add 5-10 items
- [ ] Generate API key
- [ ] Fetch data in Postman/cURL

### Week 2: Integration
- [ ] Integrate with your website
- [ ] Set up caching
- [ ] Create multiple collections
- [ ] Upload images
- [ ] Test published/draft workflow

### Week 3: Advanced
- [ ] Create custom schemas
- [ ] Use rich text editor fully
- [ ] Manage multiple API keys
- [ ] Deploy to production
- [ ] Monitor API usage

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't log in | Check email/password, clear browser cache |
| API returns 401 | Check API key is valid and active |
| Image upload fails | Verify Supabase storage bucket is public |
| Content not showing | Check item is marked as "Published" |
| Changes not appearing | Clear cache, wait for revalidation |

---

## 📞 Next Steps

1. **Read the full documentation**: Check `/docs` in your CMS
2. **Explore the dashboard**: Try all features
3. **Build your integration**: Connect to your website/app
4. **Join the community**: Share your use case
5. **Give feedback**: Report bugs or request features

---

**Happy content managing! 🎉**

Need help? Check the [README.md](README.md) or [SETUP.md](SETUP.md) for detailed guides.

---

**Last Updated**: November 11, 2025
