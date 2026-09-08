<<<<<<< HEAD
# The Glossary

A static cosmetics storefront for GitHub Pages. The site uses vanilla HTML, CSS and JavaScript, loads products from the Products tab in Google Sheets through the same Google Apps Script Web App that receives orders, persists the bag in `localStorage`, and sends orders to Google Apps Script.

## Local preview

Because browsers restrict `fetch()` from `file://`, serve this folder with any static server. For example, with Python installed:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Before accepting real orders, replace `REPLACE_ME` in `app.js` with the deployed Apps Script Web App URL, and set the real bKash number in `BKASH_NUMBER`. The product endpoint uses that same URL with `?action=products`.

## Firebase accounts

The site uses Firebase Authentication compat SDK `10.12.5` from Google's CDN. In Firebase Console, create or open a project, enable **Authentication > Sign-in method > Email/Password** and **Google**, and add your GitHub Pages domain under **Authentication > Settings > Authorized domains**. Copy the Web app configuration from **Project settings > Your apps** into the `firebaseConfig` placeholder at the top of `app.js`. Phone/OTP authentication is not used.

## Products

Products are managed in a `Products` tab in the same Google Sheet. Add this header row exactly: `Name`, `Price`, `Category`, `Description`, `ImageURL`, `Stock`, `Active`, `Variants`. Put comma-separated choices in `Variants`, for example `Rosewood, Nude, Berry` or `30 ml, 50 ml`; leave it blank for products without variants. The selected variant is preserved in the cart and order. Set `Active` to `yes` or the boolean `TRUE` to show a row in the storefront; any other value hides it. `Stock` is stored for inventory management but is not currently used to block purchases. The Apps Script maps each row to the frontend shape: `id`, `name`, `category`, `price`, `shortDescription`, `description`, `shade`, `variants`, `image`, and `gallery`. Product responses are cached by Apps Script for about five minutes and by the browser for about ten minutes.

## GitHub Pages and custom domain

1. Create a GitHub repository and push all files in this folder to its default branch.
2. In the repository, open **Settings > Pages**.
3. Choose **Deploy from a branch**, select the default branch and `/ (root)`, then save.
4. In **Custom domain**, enter your domain and save. The included `CNAME` file contains `theglossary.bd`; replace it with the exact domain you own if needed.
5. At your registrar, create these DNS records:
   - For an apex domain: `A` records for `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and `185.199.111.153`.
   - For `www`: a `CNAME` record pointing to `YOUR-GITHUB-USERNAME.github.io`.
6. Wait for DNS propagation, then enable **Enforce HTTPS** in GitHub Pages.

## Google Sheets backend

1. Create a Google Sheet for orders. Add a sheet tab named `Orders` (or change `SHEET_NAME` in `Code.gs`). Add this header row: `Timestamp`, `Order ID`, `Name`, `Phone`, `Address`, `City`, `Items`, `Total`, `Payment Method`, `bKash TrxID`, `Status`, `UID`, `Email`.
2. In that same spreadsheet, add a `Products` tab with this header row: `Name`, `Price`, `Category`, `Description`, `ImageURL`, `Stock`, `Active`, `Variants`. The `Variants` column is optional per row and uses comma-separated choices.
3. Open **Extensions > Apps Script** from that spreadsheet.
4. Replace the editor contents with `Code.gs` and save.
5. Click **Deploy > New deployment**. Select **Web app** as the type.
6. Set **Execute as** to **Me** and **Who has access** to **Anyone**. Click **Deploy**, authorize the script, and copy the Web app URL ending in `/exec`.
7. Paste that URL into `APPS_SCRIPT_URL` in `app.js`, commit, and push the update to GitHub Pages. This is the same deployment for order POSTs, product GETs, and account order history; test `WEB_APP_URL?action=products` for products and `WEB_APP_URL?action=myorders&uid=...` after a signed-in order exists.

The browser sends JSON as `text/plain;charset=utf-8`. This avoids an OPTIONS preflight, and Apps Script parses the raw body from `e.postData.contents`. The client still uses normal CORS mode because it must read the JSON response for a trustworthy success or retry state. Do not switch to `no-cors` unless you accept that the response is opaque and the client cannot distinguish a recorded order from a failed request.

## Order handling

bKash is manual verification only. The sheet receives `Pending Verification` for every order. Confirm the transaction ID and payment in bKash before changing the status. COD orders send `bkashTrxId: null` and do not include any bKash form field in the submitted payload.
=======
# theglossary
>>>>>>> 60978c8645f65c206cf2413d0e32d6a199617ce8
