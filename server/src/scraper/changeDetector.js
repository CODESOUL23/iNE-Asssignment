/**
 * Store Structure & Schema Change Detector
 * Verifies whether the mock store's API schema, challenge structure,
 * or layout endpoints remain operational and expected.
 */

export async function detectStoreChanges(storeUrl = 'https://demo.inelabteamdev.com') {
  const checks = {
    catalogApiHealthy: false,
    challengeApiHealthy: false,
    layoutApiHealthy: false,
    structuralChangesDetected: false,
    details: []
  };

  try {
    const res = await fetch(`${storeUrl}/api/catalog?page=1&pageSize=1`);
    if (res.ok) {
      const data = await res.json();
      if (typeof data.total === 'number' && Array.isArray(data.items)) {
        checks.catalogApiHealthy = true;
        const item = data.items[0];
        if (!item?.id || !item?.name || !item?.sku) {
          checks.structuralChangesDetected = true;
          checks.details.push('Catalog item properties have changed');
        }
      } else {
        checks.details.push('Catalog API payload structure mismatch');
      }
    } else {
      checks.details.push(`Catalog API returned HTTP ${res.status}`);
    }
  } catch (err) {
    checks.details.push(`Catalog API unreachable: ${err.message}`);
  }

  try {
    const res = await fetch(`${storeUrl}/api/challenge`);
    if (res.ok) {
      const data = await res.json();
      if (data.salt && typeof data.difficulty === 'number' && data.wasm) {
        checks.challengeApiHealthy = true;
      } else {
        checks.structuralChangesDetected = true;
        checks.details.push('Challenge API payload schema altered');
      }
    } else {
      checks.details.push(`Challenge API returned HTTP ${res.status}`);
    }
  } catch (err) {
    checks.details.push(`Challenge API unreachable: ${err.message}`);
  }

  try {
    const res = await fetch(`${storeUrl}/api/layout`);
    if (res.ok) {
      checks.layoutApiHealthy = true;
    }
  } catch (err) {
    checks.details.push(`Layout API unreachable: ${err.message}`);
  }

  return {
    timestamp: new Date().toISOString(),
    healthy: checks.catalogApiHealthy && checks.challengeApiHealthy,
    checks
  };
}
