# Supabase Integration Guide for Hope A Life International

## 📋 Overview

This guide will help you integrate your admin dashboard with Supabase to enable real-time content updates across all users worldwide.

---

## ✅ Step 1: Create Supabase Project (If Not Done)

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: Hope A Life
   - **Database Password**: (save this securely!)
   - **Region**: Choose closest to your users
5. Wait for project to be created (~2 minutes)

---

## ✅ Step 2: Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste into the SQL Editor
5. Click **Run** (or press `Ctrl+Enter`)
6. You should see "Success. No rows returned" - this means all tables were created!

**Verify tables were created:**
- Go to **Table Editor** (left sidebar)
- You should see 12 tables:
  - `testimonials`
  - `photos`
  - `videos`
  - `events`
  - `event_registrations`
  - `news`
  - `pending_news`
  - `publications`
  - `daily_quotes`
  - `daily_verses`
  - `pending_stories`
  - `email_logs`

---

## ✅ Step 3: Get Your API Credentials

1. In Supabase Dashboard, go to **Settings** (gear icon) → **API**
2. You'll need these values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep this secret!)

3. **Save these credentials securely** - you'll need them in the next step

---

## ✅ Step 4: Install Supabase JavaScript Client

You have two options:

### Option A: Using CDN (Easiest - No Build Step)

Add this to your HTML files (before your admin.js script):

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Option B: Using npm (If you have a build process)

```bash
npm install @supabase/supabase-js
```

Then import in your JavaScript:
```javascript
import { createClient } from '@supabase/supabase-js'
```

---

## ✅ Step 5: Create Supabase Configuration File

Create a new file: `assets/js/supabase-config.js`

```javascript
// Supabase Configuration
const SUPABASE_URL = 'YOUR_PROJECT_URL_HERE'; // e.g., 'https://xxxxxxxxxxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE'; // Your anon/public key

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabase };
}
```

**⚠️ Important:** Replace `YOUR_PROJECT_URL_HERE` and `YOUR_ANON_KEY_HERE` with your actual credentials from Step 3.

---

## ✅ Step 6: Update HTML Files to Include Supabase

Add the Supabase script to these files **before** your admin.js script:

- `CPHILADMIN.html`
- All public pages that load dynamic content (index.html, events.html, gallery.html, etc.)

Add this line in the `<head>` or before closing `</body>`:

```html
<!-- Supabase Client -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/js/supabase-config.js"></script>
```

---

## ✅ Step 7: Migrate Admin Functions to Supabase

This is the main step where we'll update `assets/js/admin.js` to use Supabase instead of localStorage.

### Example: Updating `savePhoto()` function

**Before (localStorage):**
```javascript
function savePhoto(photoUrl) {
    const photo = {
        id: Date.now(),
        title: document.getElementById('photo-title').value,
        description: document.getElementById('photo-description').value,
        url: photoUrl,
        alt: document.getElementById('photo-alt').value,
        date: new Date().toISOString()
    };
    
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    photos.push(photo);
    localStorage.setItem('admin-photos', JSON.stringify(photos));
}
```

**After (Supabase):**
```javascript
async function savePhoto(photoUrl) {
    try {
        const photo = {
            title: document.getElementById('photo-title').value,
            description: document.getElementById('photo-description').value,
            url: photoUrl,
            alt: document.getElementById('photo-alt').value || document.getElementById('photo-title').value,
            date: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('photos')
            .insert([photo])
            .select();
        
        if (error) throw error;
        
        showAlert('photo-alert', '✅ Photo saved successfully!', 'success');
        loadPhotos(); // Reload the list
        
        // Trigger real-time update event
        window.dispatchEvent(new CustomEvent('admin-content-updated', { detail: { type: 'photos' } }));
        
    } catch (error) {
        console.error('Error saving photo:', error);
        showAlert('photo-alert', '❌ Error saving photo. Please try again.', 'error');
    }
}
```

### Example: Updating `loadPhotos()` function

**Before (localStorage):**
```javascript
function loadPhotos() {
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    // ... display photos
}
```

**After (Supabase):**
```javascript
async function loadPhotos() {
    try {
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Display photos (same as before)
        const list = document.getElementById('photos-list');
        if (photos.length === 0) {
            list.innerHTML = '<p>No photos added yet. Add one above!</p>';
            return;
        }
        
        list.innerHTML = photos.map((photo, index) => {
            return `
                <div class="item-card">
                    <!-- Your existing card HTML -->
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading photos:', error);
        showAlert('photo-alert', '❌ Error loading photos.', 'error');
    }
}
```

---

## ✅ Step 8: Update All Loader Scripts

Update these files to fetch from Supabase instead of localStorage:

1. `assets/js/gallery-loader.js` - Load photos from Supabase
2. `assets/js/video-loader.js` - Load videos from Supabase
3. `assets/js/events-page-loader.js` - Load events from Supabase
4. `assets/js/events-loader.js` - Load events from Supabase
5. `assets/js/news-loader.js` - Load news from Supabase
6. `assets/js/publications-loader.js` - Load publications from Supabase
7. `assets/js/testimonials-loader.js` - Load testimonials from Supabase

**Example for gallery-loader.js:**

```javascript
async function loadAdminPhotos() {
    try {
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Rest of your existing code to display photos
        // ...
        
    } catch (error) {
        console.error('Error loading photos:', error);
    }
}
```

---

## ✅ Step 9: Set Up Real-Time Subscriptions (Optional but Recommended)

This makes updates appear instantly without page refresh!

**In your loader scripts, add:**

```javascript
// Subscribe to real-time updates
supabase
    .channel('photos-changes')
    .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'photos' },
        (payload) => {
            console.log('Photos changed!', payload);
            loadAdminPhotos(); // Reload photos
        }
    )
    .subscribe();
```

**Do this for each content type:**
- Photos: `photos-changes`
- Videos: `videos-changes`
- Events: `events-changes`
- News: `news-changes`
- Publications: `publications-changes`
- Testimonials: `testimonials-changes`

---

## ✅ Step 10: Migrate Existing Data (If Any)

If you have existing data in localStorage, you can migrate it:

1. Open browser console on your admin page
2. Run this migration script:

```javascript
// Migration script - run in browser console
async function migrateLocalStorageToSupabase() {
    // Migrate Photos
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    if (photos.length > 0) {
        const { data, error } = await supabase
            .from('photos')
            .insert(photos.map(p => ({
                title: p.title,
                description: p.description,
                url: p.url,
                alt: p.alt,
                date: p.date || new Date().toISOString()
            })));
        console.log('Photos migrated:', data);
    }
    
    // Repeat for other content types...
    // Videos, Events, News, Publications, Testimonials, etc.
}

// Run migration
migrateLocalStorageToSupabase();
```

---

## ✅ Step 11: Test Everything

1. **Test Admin Panel:**
   - Add a new photo → Check if it appears in gallery
   - Add a new event → Check if it appears on events page
   - Add a news article → Check if it appears on news page

2. **Test Real-Time Updates:**
   - Open admin panel in one browser tab
   - Open gallery page in another tab
   - Add a photo in admin panel
   - Photo should appear in gallery tab automatically (if real-time is set up)

3. **Test Public Pages:**
   - Visit all public pages
   - Verify content loads from Supabase
   - Check browser console for errors

---

## 🔒 Step 12: Secure Your Admin Panel (Important!)

Currently, RLS policies allow all operations. For production:

1. **Set up Supabase Authentication:**
   - Go to Authentication → Policies
   - Create admin users
   - Use Supabase Auth for login

2. **Update RLS Policies:**
   - Restrict write operations to authenticated admin users only
   - Keep read access public for website visitors

3. **Example Secure Policy:**
```sql
-- Only authenticated admins can insert/update/delete
CREATE POLICY "Admin only write" ON photos
    FOR INSERT, UPDATE, DELETE
    USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'is_admin' = 'true');

-- Public can read
CREATE POLICY "Public read" ON photos
    FOR SELECT
    USING (true);
```

---

## 📝 Content Type Mapping Reference

| localStorage Key | Supabase Table | Fields |
|-----------------|----------------|--------|
| `admin-testimonials` | `testimonials` | name, role, quote, tags |
| `admin-photos` | `photos` | title, description, url, alt, date |
| `admin-videos` | `videos` | title, description, url, thumbnail, date |
| `admin-events` | `events` | title, date, time, location, description, venue, contact_name, contact_email, contact_phone, image, registration_link, featured, max_attendees, max_attendees_per_organization, documents |
| `event-registrations` | `event_registrations` | event_id, registration_type, registrant_name, organization_name, number_of_attendees, attendee_details |
| `admin-news` | `news` | title, content, image, link, source, author, date |
| `pending-news` | `pending_news` | title, content, image, link, source, author, status |
| `admin-publications` | `publications` | title, content, author, date, images, videos |
| `dailyQuotes` | `daily_quotes` | text, author, date |
| `dailyVerses` | `daily_verses` | text, reference, date |
| `pending-stories` | `pending_stories` | name, role, quote, tags, status |

---

## 🚀 Next Steps After Integration

1. **Set up Supabase Storage** for images/videos (better than base64)
2. **Implement proper authentication** for admin panel
3. **Add error handling** and loading states
4. **Set up backups** in Supabase
5. **Monitor usage** in Supabase Dashboard

---

## 🆘 Troubleshooting

### Issue: "Failed to fetch" errors
- **Solution:** Check your Supabase URL and API key are correct
- **Solution:** Check CORS settings in Supabase Dashboard → Settings → API

### Issue: RLS policy errors
- **Solution:** Temporarily disable RLS or adjust policies
- **Solution:** Make sure you're using the correct API key (anon key for public, service_role for admin)

### Issue: Real-time not working
- **Solution:** Check that Realtime is enabled in Supabase Dashboard → Database → Replication
- **Solution:** Make sure you're subscribed to the correct channel

### Issue: Images not displaying
- **Solution:** For large base64 images, consider using Supabase Storage
- **Solution:** Check image URLs are valid

---

## 📚 Resources

- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist

- [ ] Created Supabase project
- [ ] Ran `supabase-schema.sql` in SQL Editor
- [ ] Got API credentials (URL and anon key)
- [ ] Created `supabase-config.js` with credentials
- [ ] Added Supabase script to HTML files
- [ ] Updated `admin.js` functions to use Supabase
- [ ] Updated all loader scripts to fetch from Supabase
- [ ] Set up real-time subscriptions (optional)
- [ ] Migrated existing localStorage data (if any)
- [ ] Tested admin panel functionality
- [ ] Tested public pages
- [ ] Set up authentication and secured RLS policies (for production)

---

**Need help?** Check the Supabase documentation or review the example code patterns above.

