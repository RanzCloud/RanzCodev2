import crypto from 'crypto';
import supabase from './db-client.js';

async function getSettingsMap(keys) {
  const { data } = await supabase.from('app_settings').select('*').in('key', keys);
  const map = {};
  (data || []).forEach((r) => { map[r.key] = r.value; });
  return map;
}

async function pteroFetch(panelUrl, apiKey, path, options = {}) {
  const res = await fetch(`${panelUrl.replace(/\/$/, '')}/api/application${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const detail = data?.errors?.[0]?.detail || `Pterodactyl error ${res.status}`;
    const err = new Error(detail);
    err.data = data;
    throw err;
  }
  return data;
}

export async function provisionPterodactylServer(order, product) {
  const settings = await getSettingsMap(['pterodactyl_panel_url', 'pterodactyl_api_key']);
  const panelUrl = settings.pterodactyl_panel_url;
  const apiKey = settings.pterodactyl_api_key;
  if (!panelUrl || !apiKey) {
    return { success: false, error: 'Pterodactyl belum dikonfigurasi. Silakan atur Panel URL & API Key di Admin > Pengaturan.' };
  }

  const cfg = (product.pterodactyl_config && typeof product.pterodactyl_config === 'object') ? product.pterodactyl_config : {};
  const email = order.customer_email || `${order.order_code.toLowerCase()}@ranzcloud.local`;
  const baseUsername = (order.customer_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user';
  const username = `${baseUsername}${Math.floor(Math.random() * 9000 + 1000)}`;
  const password = crypto.randomBytes(6).toString('hex') + 'Aa1!';

  let pteroUser;
  try {
    const search = await pteroFetch(panelUrl, apiKey, `/users?filter[email]=${encodeURIComponent(email)}`);
    if (search?.data && search.data.length) pteroUser = search.data[0].attributes;
  } catch (e) { /* ignore, fallback to create */ }

  if (!pteroUser) {
    const created = await pteroFetch(panelUrl, apiKey, '/users', {
      method: 'POST',
      body: JSON.stringify({
        email,
        username,
        first_name: order.customer_name || 'Customer',
        last_name: 'RanzCloud',
        password,
      }),
    });
    pteroUser = created.attributes;
  }

  const serverPayload = {
    name: `${product.name}-${order.order_code}`.slice(0, 60),
    user: pteroUser.id,
    egg: Number(cfg.egg_id) || 1,
    docker_image: cfg.docker_image || 'quay.io/pterodactyl/core:rust',
    startup: cfg.startup || './samp03svr',
    environment: cfg.environment || {},
    limits: {
      memory: Number(cfg.memory) || 512,
      swap: Number(cfg.swap) || 0,
      disk: Number(cfg.disk) || 1024,
      io: Number(cfg.io) || 500,
      cpu: Number(cfg.cpu) || 100,
    },
    feature_limits: {
      databases: Number(cfg.databases) || 0,
      backups: Number(cfg.backups) || 0,
      allocations: 1,
    },
    deploy: {
      locations: [Number(cfg.location_id) || 1],
      dedicated_ip: false,
      port_range: [],
    },
  };

  const createdServer = await pteroFetch(panelUrl, apiKey, '/servers', {
    method: 'POST',
    body: JSON.stringify(serverPayload),
  });
  const attrs = createdServer.attributes;

  await supabase.from('pterodactyl_servers').insert({
    order_id: order.id,
    user_id: order.user_id,
    product_id: product.id,
    server_id: String(attrs.id),
    server_identifier: attrs.identifier,
    panel_url: panelUrl,
    panel_username: pteroUser.username,
    panel_password: password,
    panel_email: email,
    status: 'active',
  });

  return { success: true, identifier: attrs.identifier, username: pteroUser.username, password, panel_url: panelUrl };
}

export async function fulfillOrder(order, product) {
  if (product.delivery_type === 'pterodactyl') {
    try {
      const result = await provisionPterodactylServer(order, product);
      if (result.success) {
        await supabase.from('orders').update({
          pterodactyl_status: 'provisioned',
          delivery_content: `Server hosting Anda sudah aktif!\nPanel: ${result.panel_url}\nUsername: ${result.username}\nPassword: ${result.password}\nIdentifier server: ${result.identifier}\n\nSilakan login ke panel Pterodactyl untuk mengelola server Anda.`,
        }).eq('id', order.id);
      } else {
        await supabase.from('orders').update({
          pterodactyl_status: 'failed',
          delivery_content: `Pembayaran diterima, namun pembuatan server otomatis gagal: ${result.error}. Tim RanzCloud akan memproses server Anda secara manual segera.`,
        }).eq('id', order.id);
      }
    } catch (e) {
      await supabase.from('orders').update({
        pterodactyl_status: 'failed',
        delivery_content: `Pembayaran diterima, namun pembuatan server otomatis gagal: ${e.message}. Tim RanzCloud akan memproses server Anda secara manual segera.`,
      }).eq('id', order.id);
    }
  } else {
    let content;
    if (product.delivery_type === 'license') {
      content = product.license_note || 'Terima kasih sudah membeli! Tim kami akan menghubungi Anda untuk detail produk.';
    } else if (product.file_url) {
      content = `Terima kasih! Unduh produk Anda melalui link berikut:\n${product.file_url}`;
    } else {
      content = 'Pembayaran diterima. Tim RanzCloud akan mengirimkan produk Anda segera.';
    }
    await supabase.from('orders').update({ delivery_content: content }).eq('id', order.id);
  }
}
