# Lexora - Deployment Guide

## Deploy to Vercel (Recommended)

Vercel is the easiest and recommended way to deploy your Next.js app.

### Prerequisites
- GitHub account
- Vercel account (sign up at vercel.com)
- Completed Supabase setup

### Step 1: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial Lexora app"

# Create a repository on GitHub, then:
git remote add origin https://github.com/yourusername/lexora.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

5. Add Environment Variables:
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY = your-supabase-anon-key
   ```

6. Click "Deploy"

Your app will be live at `https://your-project-name.vercel.app`

### Step 3: Configure Supabase for Production

1. Go to your Supabase project
2. Go to Authentication > URL Configuration
3. Add your Vercel URL to:
   - Site URL: `https://your-project-name.vercel.app`
   - Redirect URLs: `https://your-project-name.vercel.app/**`

### Step 4: Test Your Deployment

1. Visit your Vercel URL
2. Test signup/login
3. Browse words
4. Take a quiz

## Alternative Deployment Options

### Deploy to Netlify

1. **Push to GitHub** (same as above)

2. **Go to Netlify**
   - Visit [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Choose your repository

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **Add Environment Variables**
   - Go to Site settings > Environment variables
   - Add your Supabase credentials

5. **Deploy**

### Self-Hosting with Docker

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Build and Run**
```bash
docker build -t lexora .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=your-url -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key lexora
```

### Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click "New Project" > "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables in the Variables tab
5. Deploy!

## Post-Deployment Checklist

### Security
- [ ] Environment variables are set correctly
- [ ] `.env.local` is NOT committed to GitHub
- [ ] Supabase Row Level Security policies are enabled
- [ ] Authentication is working properly

### Functionality
- [ ] Users can sign up and login
- [ ] Words display correctly
- [ ] Images load properly
- [ ] Audio pronunciation works
- [ ] Filters function correctly
- [ ] Quiz system works
- [ ] Progress tracking updates

### Performance
- [ ] Images are optimized
- [ ] Page load times are acceptable
- [ ] No console errors
- [ ] Mobile responsive

### SEO & Metadata
- [ ] Add proper meta tags
- [ ] Configure OpenGraph images
- [ ] Add favicon
- [ ] Set up analytics (optional)

## Custom Domain Setup

### On Vercel

1. **Buy a Domain** (from Vercel, Namecheap, GoDaddy, etc.)

2. **Add Domain in Vercel**
   - Go to your project settings
   - Click "Domains"
   - Add your custom domain

3. **Configure DNS**
   - Add A record or CNAME as instructed by Vercel
   - Wait for DNS propagation (5-48 hours)

4. **Update Supabase**
   - Add your custom domain to Supabase redirect URLs
   - Update site URL

### SSL Certificate

Vercel and Netlify automatically provide SSL certificates (HTTPS).

## Monitoring & Analytics

### Add Google Analytics

1. Get your tracking ID from Google Analytics
2. Add to `app/layout.tsx`:

```typescript
import Script from 'next/script'

// In the <head> section
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=G-YOUR-ID`}
  strategy="afterInteractive"
/>
<Script id="google-analytics" strategy="afterInteractive">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-YOUR-ID');
  `}
</Script>
```

### Add Vercel Analytics

```bash
npm install @vercel/analytics
```

In `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Continuous Deployment

### Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch = automatic deployment
- Pull requests get preview deployments
- Rollback to previous versions anytime

### Branch-Based Deployments

1. **Production**: `main` branch → production URL
2. **Staging**: `staging` branch → staging URL
3. **Features**: feature branches → preview URLs

## Troubleshooting Deployment

### "Build Failed"
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Test `npm run build` locally first

### "Environment Variables Not Working"
- Variables must start with `NEXT_PUBLIC_` for client-side
- Redeploy after adding new variables
- Check for typos in variable names

### "Database Connection Failed"
- Verify Supabase URL and key
- Check Supabase project is active
- Confirm RLS policies allow public access to words

### "Images Not Loading"
- Ensure image URLs are absolute (with https://)
- Check Cloudinary/image host allows your domain
- Verify URLs in database are correct

### "Authentication Not Working"
- Update Supabase redirect URLs
- Check site URL in Supabase settings
- Verify email confirmation settings

## Performance Optimization

### Image Optimization
- Use Next.js Image component (already implemented)
- Compress images before uploading
- Use appropriate image formats (WebP when possible)

### Caching
- Supabase responses are cached by Next.js
- Configure caching headers if needed
- Use Vercel Edge Cache for static assets

### Database Optimization
- Add indexes to frequently queried columns
- Limit query results
- Use pagination for large datasets

## Backup & Recovery

### Database Backups
- Supabase automatically backs up your database
- Download manual backups from Supabase dashboard
- Export critical data regularly

### Code Backups
- GitHub automatically versions your code
- Tag releases: `git tag v1.0.0`
- Keep README updated with changes

## Scaling Considerations

### As Your App Grows:
1. **Database**: Upgrade Supabase plan for more storage/bandwidth
2. **Hosting**: Vercel scales automatically
3. **Images**: Consider CDN for faster delivery
4. **Audio**: Use dedicated audio hosting service

## Cost Estimates

### Free Tier (Perfect for Starting)
- **Supabase Free**: 500MB database, 2GB file storage
- **Vercel Free**: Unlimited bandwidth, 100GB hours
- **Total**: $0/month

### Growing App
- **Supabase Pro**: $25/month (8GB database, 100GB storage)
- **Vercel Pro**: $20/month (better performance, analytics)
- **Cloudinary**: Free tier usually sufficient
- **Total**: ~$45/month

## Support & Updates

### Keeping Dependencies Updated

```bash
# Check for updates
npm outdated

# Update all dependencies
npm update

# Update Next.js
npm install next@latest react@latest react-dom@latest
```

### Security Updates

```bash
# Check for security vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix
```

## Going Live Checklist

Before announcing your app:

- [ ] Test all features thoroughly
- [ ] Add at least 50-100 words to database
- [ ] Get quality images for all words
- [ ] Add pronunciation audio
- [ ] Test on mobile devices
- [ ] Check performance (Lighthouse score)
- [ ] Set up error monitoring
- [ ] Create user documentation/help page
- [ ] Add contact/feedback form
- [ ] Test with real users (beta test)

## Congratulations! 🎉

Your Lexora vocabulary learning app is now deployed and accessible to the world!

**Live App URL**: `https://your-project.vercel.app`

Share it with friends, students, or language learners and start helping people learn!

---

Need help? Check the main README.md or open an issue on GitHub.
