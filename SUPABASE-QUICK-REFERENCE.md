# Supabase Quick Reference - Common Operations

This is a quick reference guide for common Supabase operations you'll need when updating your admin.js file.

---

## 🔧 Basic Setup

```javascript
// Initialize Supabase (in supabase-config.js)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

---

## 📝 CRUD Operations

### CREATE (Insert)

```javascript
// Insert single record
const { data, error } = await supabase
    .from('photos')
    .insert([
        {
            title: 'Photo Title',
            description: 'Description',
            url: 'https://example.com/image.jpg',
            alt: 'Alt text'
        }
    ])
    .select(); // Returns the inserted record

if (error) {
    console.error('Error:', error);
} else {
    console.log('Inserted:', data);
}
```

### READ (Select)

```javascript
// Get all records
const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false });

// Get single record by ID
const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('id', 123)
    .single();

// Filter records
const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('featured', true) // WHERE featured = true
    .gte('date', '2025-01-01') // WHERE date >= '2025-01-01'
    .order('date', { ascending: false })
    .limit(10);
```

### UPDATE

```javascript
// Update single record
const { data, error } = await supabase
    .from('photos')
    .update({ 
        title: 'New Title',
        description: 'New Description'
    })
    .eq('id', 123) // WHERE id = 123
    .select();

// Update multiple records
const { data, error } = await supabase
    .from('photos')
    .update({ featured: true })
    .in('id', [1, 2, 3]); // WHERE id IN (1, 2, 3)
```

### DELETE

```javascript
// Delete single record
const { error } = await supabase
    .from('photos')
    .delete()
    .eq('id', 123);

// Delete multiple records
const { error } = await supabase
    .from('photos')
    .delete()
    .in('id', [1, 2, 3]);
```

---

## 🔍 Common Query Patterns

### Search/Filter

```javascript
// Text search (case-insensitive)
const { data, error } = await supabase
    .from('photos')
    .select('*')
    .ilike('title', '%search term%'); // LIKE (case-insensitive)

// Multiple conditions (AND)
const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('featured', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true });

// OR conditions
const { data, error } = await supabase
    .from('news')
    .select('*')
    .or('status.eq.published,status.eq.featured');
```

### Pagination

```javascript
// Get first 10 records
const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .range(0, 9); // 0-9 (first 10)

// Get next 10 records
const { data, error } = await supabase
    .from('photos')
    .select('*')
    .order('created_at', { ascending: false })
    .range(10, 19); // 10-19 (next 10)
```

### Count Records

```javascript
// Get count
const { count, error } = await supabase
    .from('photos')
    .select('*', { count: 'exact', head: true });

console.log('Total photos:', count);
```

---

## 🔄 Real-Time Subscriptions

```javascript
// Subscribe to all changes
const channel = supabase
    .channel('photos-changes')
    .on('postgres_changes', 
        { 
            event: '*', // 'INSERT', 'UPDATE', 'DELETE', or '*' for all
            schema: 'public', 
            table: 'photos' 
        },
        (payload) => {
            console.log('Change received:', payload);
            // Reload your data
            loadPhotos();
        }
    )
    .subscribe();

// Subscribe to specific events
const channel = supabase
    .channel('photos-inserts')
    .on('postgres_changes', 
        { 
            event: 'INSERT', // Only inserts
            schema: 'public', 
            table: 'photos' 
        },
        (payload) => {
            console.log('New photo:', payload.new);
        }
    )
    .subscribe();

// Unsubscribe
channel.unsubscribe();
```

---

## 📦 Working with JSONB Fields

### Events with documents array

```javascript
// Insert event with documents
const { data, error } = await supabase
    .from('events')
    .insert([
        {
            title: 'Event Title',
            date: '2025-06-15',
            documents: [
                { name: 'doc1.pdf', url: 'https://...', size: 1024 },
                { name: 'doc2.pdf', url: 'https://...', size: 2048 }
            ]
        }
    ]);

// Query events with documents
const { data, error } = await supabase
    .from('events')
    .select('*')
    .contains('documents', [{ name: 'doc1.pdf' }]); // Check if array contains item
```

### Publications with images/videos arrays

```javascript
// Insert publication with media
const { data, error } = await supabase
    .from('publications')
    .insert([
        {
            title: 'Publication Title',
            content: 'Content here',
            images: ['https://image1.jpg', 'https://image2.jpg'],
            videos: ['https://video1.mp4']
        }
    ]);
```

---

## 🔗 Working with Relationships

### Event Registrations (with event data)

```javascript
// Get registrations with event details
const { data, error } = await supabase
    .from('event_registrations')
    .select(`
        *,
        events (
            title,
            date,
            location
        )
    `)
    .eq('event_id', 123);

// Get event with all registrations
const { data, error } = await supabase
    .from('events')
    .select(`
        *,
        event_registrations (*)
    `)
    .eq('id', 123)
    .single();
```

---

## ⚠️ Error Handling

```javascript
async function savePhoto(photoData) {
    try {
        const { data, error } = await supabase
            .from('photos')
            .insert([photoData])
            .select();
        
        if (error) {
            throw error;
        }
        
        console.log('Photo saved:', data);
        return data;
        
    } catch (error) {
        console.error('Error saving photo:', error);
        
        // Handle specific errors
        if (error.code === '23505') {
            // Unique constraint violation
            alert('This photo already exists!');
        } else if (error.code === 'PGRST116') {
            // No rows returned
            alert('Photo not found!');
        } else {
            alert('An error occurred. Please try again.');
        }
        
        throw error;
    }
}
```

---

## 🎯 Function Conversion Examples

### Before (localStorage) → After (Supabase)

#### Save Function

**Before:**
```javascript
function savePhoto(photoUrl) {
    const photo = {
        id: Date.now(),
        title: document.getElementById('photo-title').value,
        url: photoUrl,
        date: new Date().toISOString()
    };
    
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    photos.push(photo);
    localStorage.setItem('admin-photos', JSON.stringify(photos));
}
```

**After:**
```javascript
async function savePhoto(photoUrl) {
    try {
        const photo = {
            title: document.getElementById('photo-title').value,
            url: photoUrl,
            date: new Date().toISOString()
        };
        
        const { data, error } = await supabase
            .from('photos')
            .insert([photo])
            .select();
        
        if (error) throw error;
        
        showAlert('photo-alert', '✅ Photo saved!', 'success');
        loadPhotos();
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('photo-alert', '❌ Error saving photo', 'error');
    }
}
```

#### Load Function

**Before:**
```javascript
function loadPhotos() {
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    displayPhotos(photos);
}
```

**After:**
```javascript
async function loadPhotos() {
    try {
        const { data: photos, error } = await supabase
            .from('photos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        displayPhotos(photos);
        
    } catch (error) {
        console.error('Error loading photos:', error);
        showAlert('photo-alert', '❌ Error loading photos', 'error');
    }
}
```

#### Update Function

**Before:**
```javascript
function updatePhoto(index, photoUrl) {
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    photos[index] = {
        ...photos[index],
        title: document.getElementById('photo-title').value,
        url: photoUrl
    };
    localStorage.setItem('admin-photos', JSON.stringify(photos));
}
```

**After:**
```javascript
async function updatePhoto(photoId, photoUrl) {
    try {
        const updates = {
            title: document.getElementById('photo-title').value,
            url: photoUrl
        };
        
        const { data, error } = await supabase
            .from('photos')
            .update(updates)
            .eq('id', photoId)
            .select();
        
        if (error) throw error;
        
        showAlert('photo-alert', '✅ Photo updated!', 'success');
        loadPhotos();
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('photo-alert', '❌ Error updating photo', 'error');
    }
}
```

#### Delete Function

**Before:**
```javascript
function deletePhoto(index) {
    const photos = JSON.parse(localStorage.getItem('admin-photos') || '[]');
    photos.splice(index, 1);
    localStorage.setItem('admin-photos', JSON.stringify(photos));
}
```

**After:**
```javascript
async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
        const { error } = await supabase
            .from('photos')
            .delete()
            .eq('id', photoId);
        
        if (error) throw error;
        
        showAlert('photo-alert', '✅ Photo deleted!', 'success');
        loadPhotos();
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('photo-alert', '❌ Error deleting photo', 'error');
    }
}
```

---

## 🔐 Authentication (Future)

```javascript
// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@hopealife.org',
    password: 'password'
});

// Sign out
await supabase.auth.signOut();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

---

## 📊 Useful Tips

1. **Always use `.select()` after `.insert()` or `.update()`** to get the returned data
2. **Use `.single()`** when you expect exactly one row
3. **Use `.order()`** to sort results
4. **Use `.range()`** for pagination
5. **Handle errors** with try/catch blocks
6. **Use real-time subscriptions** for instant updates
7. **For large files**, use Supabase Storage instead of base64 in database

---

## 🚀 Performance Tips

1. **Select only needed columns:**
   ```javascript
   .select('id, title, url') // Instead of .select('*')
   ```

2. **Use indexes** (already created in schema.sql)

3. **Limit results:**
   ```javascript
   .limit(20)
   ```

4. **Use pagination** for large datasets

---

This reference should cover most operations you'll need! 🎉

