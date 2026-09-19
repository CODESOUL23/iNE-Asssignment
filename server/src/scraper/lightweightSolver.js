/**
 * Lightweight Challenge Solver for INE Mock Storefront
 * 
 * Reconstructed from client-side challenge verification:
 * 1. Fetch challenge parameters: salt, difficulty, WebAssembly binary
 * 2. Generate client telemetry attestation
 * 3. Perform Proof-of-Work (PoW) nonce search matching difficulty
 * 4. Execute WebAssembly bytecode in Node.js V8 runtime
 * 5. Derive key & obtain session JWT token from /api/session
 * 6. Fetch encrypted price payload from /api/products/:id/price
 * 7. XOR decrypt payload with derived session key
 */

function vr() {
  let e = `t1jqtvG.yNvMzMvY.yw0G.AgfSBgvU.mJaWodrJAKfgC3m.D2fZBu91.sfjTvfa.yw1bve8.CMuTC2HH.uNDXEMu.zgvYAxzL.wuPzCNe.C2v0vwLU.qvb1DNy.DgLHDgu.D0TAz1O.s2Dez1C.t3fsDM4.AxPHDgLV.shjzsKy.BgvUz3rO.B3jPEMvK.Aw5Llw1V.zMXVB3i.y2HHCKnV.zgLMzMLJ.mJiXnti5EvjfAhnm.C2v0.u25Iuw0.B3rwDwy.CgfYC2u.mJmWu3r0tNny.C3rHDhvZ.l2fWAs9J.CgfKu3rH.C2fSDa.t3zvveK.tLvzwgS.tg5HD1O.zw5JB2rL.wNv6sLC.zerXrgq.DxbZDhjL.AgvHzgvY.qNfLqKS.z0LXz1m.AwXLza.Be1jq0S.weLdvvm.C3rYAw5N.nZC1nJuWy29qrMrH.D1HYsxu.l2fWAs9W.qMvHCMvY.zxHWB3j0.l2fWAs9Z.mta4otmWnuTly2vRua.u0fjtLC.Dw5HDxrO.AMfmBgC.mZq4nJeXneTlv2H6za.y29TCgLS.zNjVBq.tLPdtha.BLDwuhq.CMvWzwf0.y2HHBgXL.rvj5B2O.BMPXA2C.FgvUy3W.DdmY.CK5Wqxe.DeLK.whHuvNu.ww14uhK.DfzVELG.s0vREKS.zxnZAw9U.zgvJB2rL.FgrLCML2.B1jMA0C.BwrLs3i.nxPduKvuza.DwX0Eq.ywfpEwy.yxr0.q2DQyuS.zM9YrwfJ.D2fZBq.BMDLx2zH.mJC4mtC5yKrHwMn6.nhPNtgTTqW.EgTUDNi.mZa4ndyYneTXEM9gtq.z2v0vwLU.CMvKlwSZ.qxv0Ag9Y.ChjVzhvJ.Aw5ZDgfU.tuXrt1q.C2XPy2u.y2STC3rV.yxrPB24V.y0H1quS.CerVA24.yxbWBgLJ.Awz5.ANnVBG.BM9Uy2u.A2jIu0y.zgvbDa.CM9KDwn0.FhnLzwr8.wwPkr0S.l3bYAwnL.AM9PBG.Dg9tDhjP.mtrOtgLPsLy.ue9tva.Exvrv3u.yunnrfa`.split(`.`);
  return vr = function() { return e; }, vr();
}

function pr(e, t) {
  e -= 486;
  let n = vr(), r = n[e];
  pr.Azkpgu === void 0 && (pr.kahTKp = function(e) {
    let t = ``, n = ``;
    for (let n = 0, r, i, a = 0; i = e.charAt(a++); ~i && (r = n % 4 ? r * 64 + i : i, n++ % 4) && (t += String.fromCharCode(255 & r >> (-2 * n & 6))))
      i = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=`.indexOf(i);
    for (let e = 0, r = t.length; e < r; e++) n += `%` + (`00` + t.charCodeAt(e).toString(16)).slice(-2);
    return decodeURIComponent(n);
  }, pr.XjeQtZ = {}, pr.Azkpgu = !0);
  let i = n[0], a = e + i, o = pr.XjeQtZ[a];
  return o ? r = o : (r = pr.kahTKp(r), pr.XjeQtZ[a] = r), r;
}

(function(e, t) {
  let n = pr, r = e();
  for (;;) try {
    if (-parseInt(n(494)) / 1 * (parseInt(n(537)) / 2) + parseInt(n(559)) / 3 + parseInt(n(503)) / 4 * (parseInt(n(589)) / 5) + -parseInt(n(583)) / 6 * (-parseInt(n(529)) / 7) + -parseInt(n(505)) / 8 + -parseInt(n(593)) / 9 + parseInt(n(564)) / 10 * (parseInt(n(502)) / 11) === t) break;
    r.push(r.shift());
  } catch {
    r.push(r.shift());
  }
})(vr, 308767);

var P = pr;
var lr = P(555) + P(513) + P(541) + P(507) + `y`,
  ur = new Uint32Array([
    1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221,
    3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580,
    3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986,
    2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895,
    666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037,
    2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344,
    430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779,
    1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298
  ]),
  dr = (e, t) => e >>> t | e << 32 - t;

function fr(e) {
  let t = P,
    n = {
      SnbQm: function(e, t) { return e % t; },
      ORPMX: function(e, t) { return e - t; },
      lMICK: function(e, t) { return e % t; },
      XxTVu: function(e, t) { return e + t; },
      oRfkG: function(e, t) { return e + t; },
      NZCLp: function(e, t) { return e >>> t; },
      jaLlg: function(e, t) { return e < t; },
      BqeBK: function(e, t) { return e ^ t; },
      YmxPy: function(e, t, n) { return e(t, n); },
      pDokn: function(e, t) { return e >>> t; },
      HrYJF: function(e, t) { return e ^ t; },
      APuvv: function(e, t, n) { return e(t, n); },
      gIqgS: function(e, t, n) { return e(t, n); },
      wXrIu: function(e, t) { return e - t; },
      OqRvn: function(e, t) { return e | t; },
      nWVPt: function(e, t) { return e + t; },
      mdeKr: function(e, t) { return e ^ t; },
      ZuzJW: function(e, t) { return e ^ t; },
      YJYrq: function(e, t) { return e & t; },
      ERyoj: function(e, t) { return e + t; },
      LnawZ: function(e, t) { return e ^ t; },
      MLQOT: function(e, t) { return e ^ t; },
      CgjaK: function(e, t) { return e | t; },
      Rwqze: function(e, t) { return e | t; },
      XICUS: function(e, t) { return e | t; },
      NUYXk: function(e, t) { return e | t; }
    },
    r = 1779033703,
    i = 3144134277,
    a = 1013904242,
    o = 2773480762,
    s = 1359893119,
    c = 2600822924,
    l = 528734635,
    u = 1541459225,
    d = e[t(553)],
    f = d * 8,
    p = d + 1,
    m = n[t(561)](n[t(533)](56, n[t(580)](p, 64)) + 64, 64),
    h = n[t(606)](n[t(492)](p, m), 8),
    g = new Uint8Array(h);
  g[t(560)](e, 0), g[d] = 128;
  let _ = new DataView(g[t(534)]);
  _[t(545) + t(603)](h - 8, n[t(596)](Math[t(556)](f / 4294967296), 0), !1),
  _[t(545) + t(603)](h - 4, f >>> 0, !1);
  let v = new Uint32Array(64);
  for (let e = 0; e < h; e += 64) {
    for (let n = 0; n < 16; n++) v[n] = _[t(506) + t(603)](e + n * 4, !1);
    for (let e = 16; n[t(592)](e, 64); e++) {
      let r = n[t(577)](n[t(486)](dr, v[e - 15], 7) ^ dr(v[n[t(533)](e, 15)], 18), n[t(516)](v[e - 15], 3)),
        i = n[t(577)](n[t(552)](n[t(546)](dr, v[e - 2], 17), n[t(578)](dr, v[n[t(533)](e, 2)], 19)), n[t(596)](v[n[t(584)](e, 2)], 10));
      v[e] = n[t(550)](n[t(492)](n[t(597)](n[t(492)](v[e - 16], r), v[n[t(584)](e, 7)]), i), 0);
    }
    let d = r, f = i, p = a, m = o, h = s, g = c, y = l, b = u;
    for (let e = 0; e < 64; e++) {
      let r = n[t(577)](n[t(493)](dr(h, 6), n[t(578)](dr, h, 11)), dr(h, 25)),
        i = n[t(573)](h & g, n[t(544)](~h, y)),
        a = n[t(600)](n[t(492)](b, r) + i + ur[e], v[e]) | 0,
        o = n[t(573)](n[t(571)](dr(d, 2), dr(d, 13)), dr(d, 22)),
        s = n[t(511)](n[t(511)](n[t(544)](d, f), d & p), n[t(544)](f, p)),
        c = n[t(498)](o + s, 0);
      b = y, y = g, g = h, h = n[t(542)](n[t(600)](m, a), 0), m = p, p = f, f = d, d = n[t(492)](a, c) | 0;
    }
    r = r + d | 0, i = i + f | 0, a = n[t(550)](a + p, 0), o = n[t(606)](o, m) | 0, s = n[t(581)](s + h, 0), c = n[t(542)](c + g, 0), l = n[t(597)](l, y) | 0, u = n[t(570)](u + b, 0);
  }
  let y = new Uint8Array(32), b = new DataView(y[t(534)]);
  return [r, i, a, o, s, c, l, u][t(499) + `h`]((e, n) => b[t(545) + t(603)](n * 4, e >>> 0, !1)), y;
}

var mr = e => new TextEncoder()[P(572)](e),
  hr = e => Array[P(595)](e, e => e[P(528) + `ng`](16)[P(567) + `rt`](2, `0`))[P(527)](``),
  gr = e => hr(fr(mr(e)));

function _r(e) {
  let t = P,
    n = {
      aaOyf: function(e, t) { return e(t); },
      njqkg: function(e, t) { return e < t; }
    },
    r = n[t(496)](atob, e),
    i = new Uint8Array(r[t(553)]);
  for (let e = 0; n[t(601)](e, r[t(553)]); e++) i[e] = r[t(557) + t(522)](e);
  return i;
}

var yr = (e, t, n) => gr(lr + (P(491) + `e|`) + e + `|` + (t | 0) + `|` + n),
  br = (e, t) => parseInt(gr(lr + P(524) + e + `|` + t)[P(512)](0, 8), 16) | 0;

function xr(e, t) {
  let n = P,
    r = { otVuf: function(e, t) { return e(t); } },
    i = `0`[n(598)](t),
    a = 0;
  for (; r[n(562)](gr, e + `:` + a)[n(512)](0, t) !== i;) a++;
  return a;
}

function Sr(e) {
  let t = P,
    n = {
      tVozX: function(e, t) { return e(t); },
      kbbSF: function(e, t) { return e < t; }
    },
    r = n[t(487)](atob, e),
    i = new Uint8Array(r[t(553)]);
  for (let e = 0; n[t(521)](e, r[t(553)]); e++) i[e] = r[t(557) + t(522)](e);
  return i;
}

async function Cr(e, t) {
  let n = P,
    r = {
      HRmTP: function(e, t) { return e(t); },
      SAINW: function(e, t) { return e | t; }
    },
    i = await WebAssembly[n(594) + `e`](r[n(539)](Sr, e)),
    a = (await WebAssembly[n(510) + n(547)](i))[n(587) + `s`].f;
  return r[n(590)](a(t), 0);
}

function wr(e, t) {
  let n = P,
    r = {
      wKZgZ: function(e, t) { return e(t); },
      dDqDd: function(e, t) { return e < t; },
      xknvr: function(e, t) { return e % t; },
      OvUTI: function(e, t) { return e === t; }
    },
    i = r[n(548)](fr, mr(lr + n(602) + t)),
    a = _r(e),
    o = new Uint8Array(a[n(553)]);
  for (let e = 0; r[n(574)](e, a[n(553)]); e++) o[e] = a[e] ^ i[r[n(504)](e, i[n(553)])];
  let s = JSON[n(563)](new TextDecoder()[n(490)](o));
  return {
    shown: s.p,
    mrp: s.m,
    sale: s.n,
    badgePct: s.b,
    stock: s.s,
    currency: s.c || 'INR',
    at: s.t,
    rating: s.r,
    ratingCount: s.rc,
    seller: s.sl,
    deliveryDays: s.dd,
    variant: s.v,
    pending: r[n(569)](s.g, 1),
    format: s.f,
    triple: s.x === 1
  };
}

/**
 * Solve Challenge and Fetch Price for a Product
 */
export async function solveChallengeAndFetchPrice(productId, storeUrl = 'https://demo.inelabteamdev.com') {
  const startTime = Date.now();

  // 1. Fetch Challenge
  const chalRes = await fetch(`${storeUrl}/api/challenge`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  });

  if (!chalRes.ok) {
    throw new Error(`Challenge fetch failed with status ${chalRes.status}`);
  }

  const a = await chalRes.json();

  // 2. Synthesize Attestation passing all client validation checks
  const now = Date.now();
  const frames = [16.65, 16.71, 16.58, 16.69, 16.62, 16.74, 16.61, 16.67];
  const dwellMs = 1200;
  const hoverAt = now - dwellMs;

  const moves = [
    [100, 150, now - 1100],
    [120, 160, now - 1000],
    [140, 170, now - 900],
    [160, 180, now - 800],
    [180, 190, now - 700],
    [200, 200, now - 600],
    [220, 210, now - 500],
    [240, 220, now - 400],
    [260, 230, now - 300]
  ];

  const attObj = {
    env: {
      canvas: '39d784a961129bc8',
      gl: 'c901e149fcfc584a',
      hc: 8,
      scr: [1920, 1080, 1],
      frames: frames,
      at: now
    },
    ix: {
      hoverAt: hoverAt,
      dwellMs: dwellMs,
      moves: moves,
      clickAt: now - 30,
      trusted: true
    }
  };

  const o = JSON.stringify(attObj);
  const s = gr(o);

  // 3. Run WASM and Proof-of-Work
  const c = await Cr(a.wasm, br(a.salt, s));
  const l = xr(a.salt, a.difficulty);
  const u = yr(a.salt, c, s);

  const d = {
    ...a,
    nonce: l,
    derived: u,
    wasmOut: c,
    att: o,
    productId: Number(productId)
  };

  // 4. Request Session Token
  const sessRes = await fetch(`${storeUrl}/api/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    body: JSON.stringify(d)
  });

  if (sessRes.status === 429) {
    const err = new Error('Rate limit exceeded (429)');
    err.status = 429;
    throw err;
  }

  if (!sessRes.ok) {
    const text = await sessRes.text();
    throw new Error(`Session verification failed: ${sessRes.status} ${text}`);
  }

  const { token: p } = await sessRes.json();

  // 5. Fetch Encrypted Price Payload
  const priceRes = await fetch(`${storeUrl}/api/products/${productId}/price`, {
    headers: {
      Authorization: `Bearer ${p}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  if (priceRes.status === 401 || priceRes.status === 403) {
    throw new Error(`Unauthorized price request: ${priceRes.status}`);
  }

  if (!priceRes.ok) {
    throw new Error(`Price fetch failed with status ${priceRes.status}`);
  }

  const priceData = await priceRes.json();
  if (!priceData || !priceData.e) {
    throw new Error('Malformed price payload from store');
  }

  // 6. Decrypt Price Quote
  const quote = wr(priceData.e, p);
  const responseTimeMs = Date.now() - startTime;

  return {
    quote,
    responseTimeMs,
    token: p
  };
}
