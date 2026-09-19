import React, { useState, useEffect } from 'react';
import { Search, X, Check, Loader2, Plus, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export function SearchModal({ isOpen, onClose, onTrackSuccess, trackedProductIds = [] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [trackingId, setTrackingId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const fetchProducts = async (q) => {
    setLoading(true);
    try {
      const data = await api.searchCatalog(q, 1, 15);
      setResults(data.items || []);
    } catch (err) {
      console.error('Catalog search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (product) => {
    setTrackingId(product.id);
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
      onTrackSuccess(product.id);
    } catch (err) {
      alert('Failed to track product: ' + err.message);
    } finally {
      setTrackingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-dialog-header">
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Search Storefront
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
              Find products by name, SKU, brand, or category
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-dialog-body">
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="search-input-field"
              placeholder="Search products (e.g. Solar Charger, Vantablack, VAN-10366)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{ maxWidth: '100%', paddingLeft: '36px', height: '40px', fontSize: '0.86rem' }}
            />
            {loading && (
              <Loader2 
                size={16} 
                className="spin" 
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-ink)' }} 
              />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
            {results.map((product) => {
              const isAlreadyTracked = trackedProductIds.includes(product.id);
              const isProcessing = trackingId === product.id;

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
                    transition: 'border-color var(--transition-fast)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span className="card-sku-tag mono">{product.sku}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{product.category}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {product.brand}
                    </div>
                  </div>

                  <div>
                    {isAlreadyTracked ? (
                      <span className="badge-tag badge-in-stock" style={{ padding: '5px 10px' }}>
                        <Check size={12} style={{ marginRight: '4px' }} />
                        Tracked
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTrack(product)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 size={13} className="spin" />
                        ) : (
                          <Plus size={13} />
                        )}
                        <span>{isProcessing ? 'Adding...' : 'Track SKU'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && results.length === 0 && (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                {query ? `No items found matching "${query}".` : 'Type to search products from the storefront...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
