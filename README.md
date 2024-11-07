<div align="center">

# 🚀 OneDrive File Manager with Cloudflare CDN

<img src="banner.png" alt="OneDrive Manager Banner" width="800px"/>

### A modern web application for managing OneDrive files with advanced features, Cloudflare CDN integration, and resumable downloads.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fonedrive-manager)
[![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js-000000?style=flat-square&logo=Next.js&labelColor=000)](https://nextjs.org/)
[![Powered by Cloudflare](https://img.shields.io/badge/Powered%20by-Cloudflare-F38020?style=flat-square&logo=Cloudflare&labelColor=F38020)](https://cloudflare.com/)

</div>

---

## ✨ Features

### Core Features
- 🔐 **Azure AD Authentication**
  - Secure Microsoft login
  - Token-based authentication
  - Session management

- 📁 **File Management**
  - List files and folders
  - Hierarchical navigation
  - File size and date display
  - Folder item count

- 📥 **Download Features**
  - Cloudflare CDN integration
  - Resumable downloads
  - Progress tracking
  - Download speed display

- ⬆️ **Upload Features**
  - Progress bar
  - Speed indicator
  - File size validation
  - Mime type checking

- 🛠️ **File Operations**
  - Copy download links
  - Delete files/folders
  - Rename items
  - Move items
  - Create folders

- 🔒 **Security Features**
  - Country-based access control
  - Secure file URLs
  - Token validation
  - Error handling

## 🚀 Deployment Guide

### 1️⃣ Azure AD Setup

1. **Create App Registration**
   ```bash
   1. Go to Azure Portal > Azure Active Directory
   2. App Registrations > New Registration
   3. Name your app
   4. Select "Accounts in any organizational directory"
   5. Set Redirect URI: https://your-domain.vercel.app/api/auth/callback/azure-ad
   ```

2. **Configure Permissions**
   ```bash
   1. API Permissions > Add Permission
   2. Microsoft Graph > Application Permissions
   3. Add these permissions:
      - Files.Read.All
      - Files.ReadWrite.All
      - User.Read.All
      - Sites.Read.All
   4. Grant Admin Consent
   ```

3. **Generate Client Secret**
   ```bash
   1. Certificates & Secrets > New Client Secret
   2. Add description and select expiry
   3. Copy the secret value immediately
   ```

4. **Note Important Values**
   ```bash
   Client ID: From Overview page
   Client Secret: Generated in step 3
   Tenant ID: From Overview page
   ```

### 2️⃣ Cloudflare Setup

1. **Create Worker**
   ```bash
   1. Login to Cloudflare Dashboard
   2. Workers & Pages > Create Worker
   3. Name your worker (e.g., onedrive-cdn)
   ```

2. **Deploy Worker Code**
   ```javascript
   // Copy the entire worker.js code
   // Deploy using Quick Edit

      MICROSOFT_CLIENT_ID=your_client_id
      MICROSOFT_CLIENT_SECRET=your_client_secret
   ```

### 3️⃣ MongoDB Setup

1. **Create Cluster**
   ```bash
   1. MongoDB Atlas > Create Cluster
   2. Select Free Tier
   3. Choose region closest to users
   ```

2. **Configure Database Access**
   ```bash
   1. Create database user
   2. Set password
   3. Add IP access (0.0.0.0/0 for all)
   ```

3. **Get Connection String**
   ```bash
   1. Connect > Connect your application
   2. Copy connection string
   3. Replace <password> with actual password
   ```

### 4️⃣ Vercel Deployment

1. **Fork & Deploy**
   ```bash
   1. Fork GitHub repository
   2. Go to Vercel Dashboard
   3. New Project > Import Git Repository
   4. Select forked repository
   ```

2. **Environment Variables**
   ```bash
   Add these variables:
   MONGODB_URI=mongodb+srv://...
   MICROSOFT_CLIENT_ID=your_client_id
   MICROSOFT_CLIENT_SECRET=your_client_secret
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=generated_secret_key
   ```

3. **Deploy Settings**
   ```bash
   Framework Preset: Next.js
   Build Command: next build
   Install Command: npm install
   Output Directory: .next
   ```

## 💻 Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/onedrive-manager.git

# Install dependencies
cd onedrive-manager
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

## 📈 Roadmap

<div align="center">

### Phase 1 (Current)
✅ Basic file operations
✅ Azure AD integration
✅ Cloudflare CDN
✅ Resumable downloads

### Phase 2 (Q1 2024)
🔄 Multiple file selection
🔄 Batch operations
🔄 File sharing
🔄 Search functionality

### Phase 3 (Q2 2024)
📱 Mobile optimization
🌓 Dark mode
📊 File analytics
🔐 Advanced permissions

</div>

## 🐛 Troubleshooting

<details>
<summary>Common Issues</summary>

1. **Authentication Failed**
   - Check Azure AD credentials
   - Verify redirect URIs
   - Confirm permissions

2. **Download Issues**
   - Verify Cloudflare Worker setup
   - Check environment variables
   - Confirm file permissions

3. **Upload Problems**
   - Check file size limits
   - Verify network connection
   - Confirm write permissions

</details>

## 📄 License

MIT License - see [LICENSE.md](LICENSE.md)

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

<div align="center">

### Need Help?

🐛 [Report a bug](issues/new)
💡 [Request a feature](issues/new)
📧 [Send us an email](mailto:support@example.com)
💬 [Join our Discord](discord-link)

</div>

---

<div align="center">

Made with ❤️ by Mr.Formula

</div>
