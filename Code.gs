const SHEET_NAME = 'Orders';
const PRODUCTS_SHEET_NAME = 'Products';
const PRODUCTS_CACHE_KEY = 'glossary-products-v2';
const PRODUCTS_CACHE_SECONDS = 300;

function doGet(e) {
  if (!e || !e.parameter) {
    return jsonResponse({ ok: false, error: 'Unsupported GET action.' });
  }
  if (e.parameter.action === 'myorders') return getMyOrders(e.parameter.uid);
  if (e.parameter.action !== 'products') return jsonResponse({ ok: false, error: 'Unsupported GET action.' });

  const cache = CacheService.getScriptCache();
  const cachedProducts = cache.get(PRODUCTS_CACHE_KEY);
  if (cachedProducts) {
    return jsonResponse(JSON.parse(cachedProducts));
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRODUCTS_SHEET_NAME);
  if (!sheet) {
    return jsonResponse({ ok: false, error: 'Products sheet not found.' });
  }

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    cache.put(PRODUCTS_CACHE_KEY, JSON.stringify([]), PRODUCTS_CACHE_SECONDS);
    return jsonResponse([]);
  }

  const headers = values.shift().map(function (header) {
    return String(header).trim().toLowerCase();
  });
  const column = function (name) { return headers.indexOf(name.toLowerCase()); };
  const products = values.filter(function (row) {
    const active = row[column('active')];
    return active === true || String(active).trim().toLowerCase() === 'yes';
  }).map(function (row) {
    const name = String(row[column('name')] || '').trim();
    const description = String(row[column('description')] || '').trim();
    const image = String(row[column('imageurl')] || '').trim();
    const variants = String(row[column('variants')] || '').split(/[,;|\n]/).map(function (variant) {
      return variant.trim();
    }).filter(Boolean);
    return {
      id: slugify(name),
      name: name,
      category: String(row[column('category')] || '').trim().toLowerCase(),
      price: Number(row[column('price')]) || 0,
      shortDescription: description,
      description: description,
      shade: '',
      variants: variants,
      image: image,
      gallery: image ? [image] : []
    };
  }).filter(function (product) { return product.name; });

  cache.put(PRODUCTS_CACHE_KEY, JSON.stringify(products), PRODUCTS_CACHE_SECONDS);
  return jsonResponse(products);
}

function getMyOrders(uid) {
  if (!uid) return jsonResponse({ ok: false, error: 'Missing customer ID.' });
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return jsonResponse({ ok: false, error: 'Orders sheet not found.' });
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return jsonResponse([]);
  const headers = values.shift().map(function (header) { return String(header).trim().toLowerCase(); });
  const column = function (name) { return headers.indexOf(name.toLowerCase()); };
  const uidColumn = column('uid');
  if (uidColumn === -1) return jsonResponse({ ok: false, error: 'Add a UID column to the Orders sheet.' });
  return jsonResponse(values.filter(function (row) {
    return String(row[uidColumn] || '') === String(uid);
  }).map(function (row) {
    return {
      timestamp: row[column('timestamp')] || '',
      orderId: row[column('order id')] || '',
      items: row[column('items')] || '',
      total: row[column('total')] || 0,
      paymentMethod: row[column('payment method')] || '',
      status: row[column('status')] || ''
    };
  }));
}

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Missing request body.' });
    }

    const order = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME) || SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const items = (order.cart || []).map(function (item) {
      return item.name + (item.variant ? ' (' + item.variant + ')' : '') + ' x' + item.quantity;
    }).join('; ');

    sheet.appendRow([
      order.timestamp || new Date().toISOString(),
      order.orderId || '',
      order.customer?.name || '',
      order.customer?.phone || '',
      order.customer?.address || '',
      order.customer?.city || '',
      items,
      order.total || 0,
      order.paymentMethod || '',
      order.bkashTrxId || '',
      'Pending Verification',
      order.uid || '',
      order.email || ''
    ]);

    return jsonResponse({ ok: true, orderId: order.orderId });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.message });
  }
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
