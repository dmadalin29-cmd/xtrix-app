# 💳 Viva Payments - Setup Instructions

## 🎯 Ce credențiale îmi trebuie de la tine:

Pentru a activa sistemul de plată Viva Payments, am nevoie de următoarele:

### 1. VIVA_MERCHANT_ID
- Unde găsești: Viva Dashboard → Settings → API Access
- Format: Un număr lung (ex: `1234567890`)

### 2. VIVA_API_KEY  
- Unde găsești: Viva Dashboard → Settings → API Access → Generate API Key
- Format: Un string alfanumeric lung

### 3. VIVA_SOURCE_CODE
- Unde găsești: Viva Dashboard → Sales → Online Payments → Websites/Apps
- Trebuie să creezi un "Payment Source" (vezi pașii de mai jos)
- Format: Cod de 4 cifre (ex: `8362`)

### 4. VIVA_WEBHOOK_SECRET (opțional dar recomandat)
- Acesta îl generezi tu - poate fi orice string random de 32+ caractere
- Exemplu: `viva_webhook_secret_kdm_2026_xyz123abc`
- Folosit pentru a verifica că webhook-urile vin de la Viva

---

## 📝 Pași pentru a obține credențialele:

### STEP 1: Creează cont Viva Payments
1. Mergi la: https://www.viva.com/en-ro/onboarding
2. Completează onboarding-ul ghidat (durează ~5-10 minute)
3. Alege între **Demo** (pentru testing) sau **Production** (pentru live)
   - **Recomandare**: Începe cu **Demo** pentru testing

### STEP 2: Obține Merchant ID și API Key
1. Login la dashboard: 
   - Demo: https://demo.vivapayments.com/
   - Production: https://www.vivapayments.com/
2. Du-te la **Settings** → **API Access**
3. Copiază **Merchant ID** (număr lung)
4. Click **Generate API Key** (dacă nu există deja)
5. Copiază **API Key** (NU împărtăși acest key cu nimeni!)

### STEP 3: Creează Payment Source
1. În dashboard, du-te la **Sales** → **Online Payments** → **Websites/Apps**
2. Click **Add Website/App**
3. Completează:
   - **Source Name**: KdM Wallet Top-up
   - **Source Code**: (se generează automat - ex: 8362) - copiază-l!
   - **Protocol**: HTTPS (sau HTTP pentru testing local)
   - **Domain Name**: domeniul tău (ex: `pulse-feed-6.preview.emergentagent.com`)
   - **Integration Method**: Redirection/Native Checkout v2
   - **Success URL**: `https://pulse-feed-6.preview.emergentagent.com/payment-success`
   - **Failure URL**: `https://pulse-feed-6.preview.emergentagent.com/payment-failure`
   - **Company Logo**: (opțional - 128x128px PNG)
4. Salvează și copiază **Source Code**

### STEP 4: Configurează Webhook (Recomandat)
1. În Payment Source settings, găsește **Webhook URL**
2. Setează: `https://pulse-feed-6.preview.emergentagent.com/api/wallet/topup/webhook`
3. Salvează
4. Generează un **Webhook Secret** (string random de 32+ caractere)
   - Ex: `kdm_viva_webhook_2026_abc123xyz789secret`

---

## 🚀 După ce ai credențialele:

**Trimite-mi aceste 4 valori:**
```
VIVA_MERCHANT_ID=...
VIVA_API_KEY=...
VIVA_SOURCE_CODE=...
VIVA_WEBHOOK_SECRET=...
```

**Voi:**
1. Adăuga în `/app/backend/.env`
2. Restart backend
3. Testa flow-ul complet de plată
4. Verifica webhook-ul funcționează

---

## 💡 Note Importante:

### Pentru Testing (Demo Environment)
- Folosește **demo.vivapayments.com**
- Test cards: `4111 1111 1111 1111` (orice CVV, orice dată viitoare)
- Nu se percep taxe reale
- Poți testa toate scenariile (success, failure, etc.)

### Pentru Production
- Migrează credențialele către **Production** environment
- Schimbă `VIVA_API_URL` la `https://api.vivapayments.com`
- Schimbă `VIVA_CHECKOUT_URL` la `https://www.vivapayments.com/web/checkout`
- Configurează webhook URL cu domeniul tău production
- Testează cu tranzacții mici înainte de launch

### Securitate
- ❌ **NU** împărtăși API Key-ul public
- ❌ **NU** commite `.env` în Git
- ✅ Folosește **HTTPS** în production
- ✅ Verifică webhook signature întotdeauna

---

## 🧪 Test Flow (după configurare):

1. User autentificat → Click pe wallet balance (78 coins)
2. Wallet modal se deschide
3. Tab "Top-Up" → Input 10 EUR
4. Click "Continuă cu Plata"
5. **Redirect către Viva payment page**
6. User completează cardui (test card sau card real)
7. După plată → Viva trimite webhook
8. Backend procesează webhook → Adaugă coins în wallet
9. User redirected înapoi → Wallet updated cu noii coins!

**Expected Result:**
- 10 EUR → ~769 coins adăugați în wallet (10 / 0.013 ≈ 769)

---

**Status**: ⏳ Aștept credențiale Viva Payments de la tine!
