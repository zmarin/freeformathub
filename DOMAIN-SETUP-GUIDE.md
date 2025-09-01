# 🌐 Domain Setup Guide for FreeFormatHub

## ⚠️ **Important: Domain Availability**

The domain `freeformathub.com` is already in use by another application (Soloearnings). You'll need to use a different domain for your FreeFormatHub deployment.

---

## 🎯 **Domain Options**

### **Option 1: Use Your Own Domain**
If you own a domain:
```bash
# Deploy with your domain
./scripts/deploy-custom-domain.sh yourdomain.com
```

### **Option 2: Get a Free Domain**

#### **Freenom (Free Domains)**
1. Go to [Freenom.com](https://freenom.com)
2. Search for available domains (.tk, .ml, .ga, .cf)
3. Register for free (12 months)
4. Configure DNS A record to point to your server IP

#### **Other Free Options**
- **No-IP**: Dynamic DNS service
- **DuckDNS**: Free subdomain service  
- **Cloudflare**: Free DNS management

### **Option 3: Use Alternative Domain Names**
Suggestions for similar domains:
- `freeformattools.com`
- `formattools.org` 
- `devformattools.com`
- `freewebtools.net`
- `formatutilities.com`

### **Option 4: Subdomain Approach**
If you have an existing domain:
- `tools.yourdomain.com`
- `format.yourdomain.com`
- `dev.yourdomain.com`

---

## 🚀 **Easy Deployment Process**

### **Interactive Deployment**
```bash
# Run interactive deployment (prompts for domain)
./scripts/deploy-custom-domain.sh

# You'll be asked to enter:
# Domain: yourdomain.com
# Email: admin@yourdomain.com
```

### **Direct Deployment**
```bash
# Deploy with your domain directly
./scripts/deploy-custom-domain.sh yourdomain.com admin@yourdomain.com
```

### **Local Testing (No Domain Required)**
```bash
# Deploy locally on port 4600
sudo ./scripts/deploy.sh
# Access: http://localhost:4600
```

---

## 🔧 **DNS Configuration**

### **Required DNS Records**
Once you have a domain, configure these DNS records:

```dns
Type    Name    Value               TTL
A       @       your-server-ip      300
A       www     your-server-ip      300
```

### **Check DNS Propagation**
```bash
# Check if your domain resolves correctly
dig +short yourdomain.com

# Should return your server IP
curl -4 icanhazip.com
```

---

## 🌟 **Recommended Free Domain Providers**

### **1. Freenom (Completely Free)**
- **Domains**: .tk, .ml, .ga, .cf
- **Cost**: Free for 12 months
- **Setup**: 5 minutes
- **Example**: `myformattools.tk`

### **2. No-IP (Dynamic DNS)**
- **Subdomain**: yourname.ddns.net
- **Cost**: Free
- **Good for**: Testing and development

### **3. GitHub Pages (If using Git)**
- **Domain**: yourusername.github.io
- **Cost**: Free
- **Integration**: Works with GitHub repos

---

## 📋 **Step-by-Step Domain Setup**

### **Step 1: Get a Domain**
Choose one of the options above and register your domain.

### **Step 2: Configure DNS**
Set up A records pointing to your server:
```bash
# Get your server IP
curl -4 icanhazip.com
```

Add DNS records:
- `yourdomain.com` → `your-server-ip`
- `www.yourdomain.com` → `your-server-ip`

### **Step 3: Deploy FreeFormatHub**
```bash
# Wait for DNS propagation (5-30 minutes)
# Then deploy
./scripts/deploy-custom-domain.sh yourdomain.com
```

### **Step 4: Verify Deployment**
```bash
# Check HTTPS
curl -I https://yourdomain.com/health

# Test tools
curl -s https://yourdomain.com/formatters/json-formatter | grep "JSON Formatter"
```

---

## 🔍 **Troubleshooting**

### **Domain Already in Use**
```bash
# Check if domain is available
curl -I http://yourdomain.com
# Should return 404 or connection refused for available domains
```

### **DNS Not Propagating**
```bash
# Check DNS from different servers
dig @8.8.8.8 yourdomain.com
dig @1.1.1.1 yourdomain.com
nslookup yourdomain.com
```

### **SSL Certificate Issues**
```bash
# Check certificate status
sudo certbot certificates

# Manual renewal if needed
sudo certbot certonly --webroot -w /var/www/certbot -d yourdomain.com -d www.yourdomain.com
```

---

## 💡 **Quick Test Domain Suggestions**

For immediate testing, here are some patterns that are often available:

### **Format Tool Domains**
- `formattools-[yourname].tk`
- `[yourname]-devtools.ml`  
- `freetools-[random].ga`
- `webformat-[number].cf`

### **Check Availability**
```bash
# Check if domain is available
curl -s --connect-timeout 5 http://formattools-test.tk
# If connection fails/times out, domain might be available
```

---

## 🎯 **Example: Complete Setup with Free Domain**

### **1. Register Free Domain**
1. Go to Freenom.com
2. Search for `myformattools.tk` (replace with your choice)
3. Register for free

### **2. Configure DNS**
```bash
# In Freenom DNS management, add:
Type: A, Name: @, Target: your-server-ip
Type: A, Name: www, Target: your-server-ip
```

### **3. Deploy**
```bash
# Wait 10-15 minutes for DNS, then:
./scripts/deploy-custom-domain.sh myformattools.tk
```

### **4. Access**
- Site: `https://myformattools.tk`
- JSON Tool: `https://myformattools.tk/formatters/json-formatter`
- Base64 Tool: `https://myformattools.tk/encoders/base64-encoder`

---

## 🚀 **Ready to Deploy?**

Choose your deployment option:

```bash
# Option 1: Interactive (asks for domain)
./scripts/deploy-custom-domain.sh

# Option 2: Direct with your domain
./scripts/deploy-custom-domain.sh yourdomain.com

# Option 3: Local testing
sudo ./scripts/deploy.sh
```

**Your FreeFormatHub will be live with SSL in minutes!** 🎉

---

*Need help choosing a domain? The interactive script will guide you through the process and check domain availability automatically.*
