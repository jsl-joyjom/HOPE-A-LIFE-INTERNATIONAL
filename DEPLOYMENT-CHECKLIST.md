# Deployment Checklist - Event Registration Fix

## ✅ Pre-Deployment Verification

### Code Verification
- [x] **No global `registrations` variable** - Verified: Only `existingRegistrations` (local variables from Supabase)
- [x] **All functions use explicit parameters** - Verified: `buildAttendeesFromDOM()`, `validateAttendeesArray(attendees)`, `updateAttendeeDetails(formData)`
- [x] **Safety checks implemented** - Verified: Script clears cached functions and detects conflicts
- [x] **Cache-busting added** - Added: `?v=2.0.1` version parameter to script tag

### Files Modified
- ✅ `assets/js/event-registration.js` - Fixed all hidden dependencies
- ✅ `events.html` - Added cache-busting version parameter (`?v=2.0.1`)

### Testing Checklist
- [ ] Test organization registration on local machine
- [ ] Test individual registration on local machine
- [ ] Verify console shows: `✅ event-registration.js loaded`
- [ ] Verify console shows: `typeof registrations: undefined (correct - no global dependency)`
- [ ] Test with browser cache disabled (DevTools → Network → Disable cache)

## 🚀 Deployment Steps

### 1. Commit Changes
```bash
git add assets/js/event-registration.js events.html
git commit -m "Fix: Remove hidden registrations dependency, add cache-busting"
git push
```

### 2. Deploy to Server
- [ ] Push changes to production
- [ ] Verify files are updated on server
- [ ] Check file timestamps match deployment time

### 3. Clear CDN Cache (if applicable)
- [ ] Clear CDN cache for `assets/js/event-registration.js`
- [ ] Clear CDN cache for `events.html`

### 4. Post-Deployment Verification
- [ ] Test on development device (hard refresh: Ctrl+F5)
- [ ] Test on previously broken device (hard refresh: Ctrl+F5)
- [ ] Verify console logs show correct version
- [ ] Test organization registration end-to-end
- [ ] Test individual registration end-to-end

## 🔍 Verification Commands

### Check for any remaining registrations references
```bash
# Should only show existingRegistrations (local variables)
grep -r "registrations" assets/js/event-registration.js
```

### Verify cache-busting is in place
```bash
# Should show ?v=2.0.1
grep "event-registration.js" events.html
```

## 📋 User Instructions (if issues persist)

If users still experience issues after deployment, ask them to:

1. **Hard Refresh**: 
   - Windows/Linux: `Ctrl + F5` or `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

2. **Clear Browser Cache**:
   - Chrome: Settings → Privacy → Clear browsing data → Cached images and files
   - Firefox: Settings → Privacy → Clear Data → Cached Web Content
   - Edge: Settings → Privacy → Clear browsing data → Cached images and files

3. **Test in Incognito/Private Mode**:
   - This bypasses cache completely
   - If it works in incognito, it's a cache issue

4. **Check Console**:
   - Open DevTools (F12)
   - Check Console tab
   - Should see: `✅ event-registration.js loaded`
   - Should NOT see: `ReferenceError: registrations is not defined`

## 🎯 Expected Console Output (After Fix)

```
✅ event-registration.js loaded
✅ Supabase available: true
=== REGISTRATIONS DEBUG ===
typeof registrations: undefined
registrations value: undefined (correct - no global dependency)
=== END DEBUG ===
```

## ❌ What to Look For (Before Fix)

```
event-registration.js:331 Uncaught ReferenceError: registrations is not defined
```

## 📝 Version History

- **v2.0.1** (Current) - Fixed hidden dependencies, added cache-busting, added safety checks
- **v1.0.0** (Previous) - Had hidden `registrations` dependency causing device-specific failures

## 🔄 Future Updates

When making changes to `event-registration.js`:
1. Increment version number in `events.html` (e.g., `?v=2.0.2`)
2. Update this checklist with new version number
3. Test thoroughly before deployment

