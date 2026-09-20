import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, Plus, ExternalLink, Link2, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const QUICK_TAGS = ['Solar', 'Wearables', 'Audio', 'Monitors', 'Laptops', 'Footwear'];

export function SearchModal({ isOpen, onClose, onTrackSuccess, trackedProductIds = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState(null);
  const [justTrackedId, setJustTrackedId] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setErrorMessage(null);
      setTrackingId(null);
      setJustTrackedId(null);
      return;
    }

    // Load initial catalog sample on open
    fetchProducts('');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchProducts = async (q) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.searchCatalog(q, 1, 15);
      setResults(data.items || []);
    } catch (err) {
      console.error('Catalog search failed:', err);
      setErrorMessage('Failed to search store catalog: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (product) => {
    setTrackingId(product.id);
    setErrorMessage(null);
    try {
      await api.trackProduct({
        product_id: product.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        sku: product.sku,
        slug: product.slug,
        frequency_hours: 2
      });

      setJustTrackedId(product.id);
      // Give visual checkmark feedback before closing
      setTimeout(() => {
        onTrackSuccess(product.id);
      }, 700);
    } catch (err) {
      setErrorMessage('Failed to track product: ' + err.message);
    } finally {
      setTrackingId(null);
    }
  };

  // Helper to extract product info if user pastes a direct store URL
  const handleDirectUrlTrack = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      // Try to extract ID from URL (e.g. /product/name-123 or just 123)
      let detectedId = null;
      let detectedSlug = '';
      const urlMatch = query.match(/\/product\/([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        const full = urlMatch[1];
        const idMatch = full.match(/-(\d+)$/);
        detectedId = idMatch ? parseInt(idMatch[1], 10) : null;
        detectedSlug = full;
      } else if (/^\d+$/.test(query.trim())) {
        detectedId = parseInt(query.trim(), 10);
      }

      if (!detectedId) {
        throw new Error('Please enter a valid product URL (e.g., https://demo.inelabteamdev.com/product/...-980) or product ID.');
      }

      // Try fetching specs from store
      let name = `Product #${detectedId}`;
      let brand = 'INE Store';
      let category = 'General';
      let sku = `INE-${detectedId}`;

      try {
        const specs = await api.getProductSpecs(detectedId);
        if (specs) {
          name = specs.name || name;
          brand = specs.brand || brand;
          category = specs.category || category;
          sku = specs.sku || sku;
          detectedSlug = specs.slug || detectedSlug;
        }
      } catch {
        // Fallback to basic details if spec fetch fails
      }

      await api.trackProduct({
        product_id: detectedId,
        name,
        brand,
        category,
        sku,
        slug: detectedSlug || `product-${detectedId}`,
        frequency_hours: 2
      });

      setJustTrackedId(detectedId);
      setTimeout(() => {
        onTrackSuccess(detectedId);
      }, 700);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isUrlInput = query.includes('http') || query.includes('/product/');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={17} style={{ color: 'var(--accent-ink)' }} />
              Track New Product
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
              Search by name, SKU, brand, or paste any INE store product URL
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose} title="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-dialog-body">
          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: '10px' }}>
            {isUrlInput ? (
              <Link2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-ink)' }} />
            ) : (
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            )}
            <input
              type="text"
              className="search-input-field"
              placeholder="Search by name, SKU (e.g. VAN-10478), or paste product URL..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                maxWidth: '100%',
                paddingLeft: '36px',
                paddingRight: '36px',
                height: '42px',
                fontSize: '0.88rem',
                borderColor: isUrlInput ? 'var(--accent-ink)' : 'var(--border-medium)'
              }}
            />
            {loading && (
              <Loader2 
                size={16} 
                className="spin" 
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-ink)' }} 
              />
            )}
          </div>

          {/* Quick Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginRight: '2px' }}>Quick search:</span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setQuery(tag)}
                style={{
                  height: '22px',
                  padding: '0 8px',
                  fontSize: '0.7rem',
                  background: query === tag ? 'var(--accent-ink)' : '#eee8dc',
                  color: query === tag ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-light)',
                  borderRadius: '3px'
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div style={{
              background: 'var(--status-danger-bg)',
              border: '1px solid #ef9a9a',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: 'var(--accent-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Results List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
            {results.map((product) => {
              const isAlreadyTracked = trackedProductIds.includes(product.id);
              const isProcessing = trackingId === product.id;
              const isJustDone = justTrackedId === product.id;

              return (
                <div
                  key={product.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: '#faf6ee',
                    border: '1px solid var(--border-light)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className="card-sku-tag mono">{product.sku}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{product.category}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {product.brand} · ID #{product.id}
                    </div>
                  </div>

                  <div>
                    {isJustDone ? (
                      <span className="badge-tag badge-in-stock" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                        <Check size={13} style={{ marginRight: '4px' }} />
                        Tracked!
                      </span>
                    ) : isAlreadyTracked ? (
                      <span className="badge-tag badge-in-stock" style={{ padding: '6px 12px', opacity: 0.85 }}>
                        <Check size={12} style={{ marginRight: '4px' }} />
                        Tracking
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTrack(product)}
                        disabled={isProcessing}
                        style={{ minWidth: '95px' }}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 size={13} className="spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Track SKU</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Direct URL Track Fallback */}
            {isUrlInput && results.length === 0 && !loading && (
              <div style={{
                background: '#faf6ee',
                border: '1px dashed var(--accent-ink)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                textAlign: 'center',
                margin: '10px 0'
              }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Track Direct Store URL
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Detected store link: <code className="mono">{query}</code>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleDirectUrlTrack}
                  disabled={loading}
                >
                  <Plus size={14} />
                  <span>Track This URL</span>
                </button>
              </div>
            )}

            {!loading && results.length === 0 && !isUrlInput && (
              <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                {query ? (
                  <div>
                    <div>No store products found matching &ldquo;{query}&rdquo;.</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '6px' }}>Try searching by brand (e.g. Auralite, Copperpot, Vantablack) or category.</div>
                  </div>
                ) : (
                  <div>
                    <div>Loading storefront catalog...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
