# Git Push Guide for HALI Project

## 📋 Step-by-Step Commands

### Step 1: Check Current Status
First, see what files have changed:
```bash
git status
```

### Step 2: Add Files to Staging
Add all changed files:
```bash
git add .
```

Or add specific files:
```bash
git add assets/js/admin.js
git add assets/js/supabase-config.js
git add *.html
```

### Step 3: Commit Changes
Create a commit with a descriptive message:
```bash
git commit -m "Migrate Photos module to Supabase and add Supabase integration"
```

Or a more detailed message:
```bash
git commit -m "Add Supabase integration

- Convert Photos CRUD operations to use Supabase
- Add Supabase config with ESM module support
- Update all HTML pages with Supabase scripts
- Create database schema SQL file
- Add integration and migration guides"
```

### Step 4: Check Remote Repository
Verify your remote repository is set up:
```bash
git remote -v
```

If you see your repo URL (`https://github.com/jsl-joyjom/HALI.git`), skip to Step 5.

If not, add the remote:
```bash
git remote add origin https://github.com/jsl-joyjom/HALI.git
```

### Step 5: Push to GitHub
Push your commits to the main branch:
```bash
git push -u origin main
```

If your default branch is `master` instead:
```bash
git push -u origin master
```

---

## 🔐 Authentication

### Option A: Personal Access Token (Recommended)
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. When prompted for password, use the token instead

### Option B: SSH Key
If you have SSH set up:
```bash
git remote set-url origin git@github.com:jsl-joyjom/HALI.git
git push -u origin main
```

### Option C: GitHub CLI
If you have GitHub CLI installed:
```bash
gh auth login
git push -u origin main
```

---

## 📝 Complete Example Workflow

```bash
# 1. Check what changed
git status

# 2. Add all changes
git add .

# 3. Commit with message
git commit -m "Add Supabase integration and migrate Photos module"

# 4. Check remote (first time only)
git remote -v

# 5. Push to GitHub
git push -u origin main
```

---

## ⚠️ Important Notes

1. **First Time Setup:**
   - Make sure you've initialized git: `git init` (if not already done)
   - Make sure you have a `.gitignore` file (you already created this)

2. **Branch Name:**
   - Check your branch: `git branch`
   - If it says `master`, use `master` instead of `main`

3. **Authentication:**
   - GitHub no longer accepts passwords
   - Use Personal Access Token or SSH key

4. **Large Files:**
   - If you have large files (like images), consider using Git LFS
   - Or add them to `.gitignore` if they're not needed in repo

---

## 🚨 If You Get Errors

### Error: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/jsl-joyjom/HALI.git
```

### Error: "failed to push some refs"
```bash
# Pull first, then push
git pull origin main --rebase
git push -u origin main
```

### Error: "authentication failed"
- Make sure you're using a Personal Access Token, not password
- Or set up SSH keys

---

## ✅ Verify Push Success

After pushing, check GitHub:
1. Go to `https://github.com/jsl-joyjom/HALI`
2. You should see your files and commits

---

## 📦 What to Push

**DO Push:**
- ✅ All HTML files
- ✅ JavaScript files (admin.js, loaders, config)
- ✅ CSS files
- ✅ Supabase schema SQL
- ✅ Documentation files (.md)
- ✅ .gitignore

**DON'T Push:**
- ❌ node_modules/ (if you add npm packages later)
- ❌ .env files with secrets
- ❌ Large binary files
- ❌ OS-specific files (.DS_Store, Thumbs.db)

---

## 🎯 Quick Reference

```bash
# Check status
git status

# Add all files
git add .

# Commit
git commit -m "Your commit message"

# Push
git push -u origin main
```

That's it! 🚀

