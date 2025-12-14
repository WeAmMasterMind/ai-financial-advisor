import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  TrendingUp, 
  Filter,
  Star,
  StarOff,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { 
  searchAssets, 
  fetchAllAssets,
  addToWatchlist,
  removeFromWatchlist,
  clearSearchResults 
} from '../../store/features/marketSlice';
import toast from 'react-hot-toast';

const MarketExplorer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    assets, 
    searchResults, 
    searchLoading, 
    assetsLoading,
    watchlist 
  } = useSelector((state) => state.market);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    sector: '',
    risk: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(fetchAllAssets(filters));
  }, [dispatch, filters]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 1) {
      dispatch(searchAssets(query));
    } else {
      dispatch(clearSearchResults());
    }
  };

  const handleWatchlistToggle = async (symbol, isWatched) => {
    if (isWatched) {
      dispatch(removeFromWatchlist(symbol));
      toast.success(`Removed ${symbol} from watchlist`);
    } else {
      dispatch(addToWatchlist({ symbol }));
      toast.success(`Added ${symbol} to watchlist`);
    }
  };

  const isInWatchlist = (symbol) => {
    return watchlist.some(w => w.symbol === symbol);
  };

  const displayedAssets = searchQuery.length >= 1 ? searchResults : assets;

  const assetTypes = ['stock', 'etf', 'crypto', 'bond', 'reit'];
  const sectors = ['Technology', 'Healthcare', 'Financial Services', 'Consumer Cyclical', 
                   'Consumer Defensive', 'Energy', 'Real Estate', 'Bonds', 'Broad Market'];
  const riskLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Market Explorer</h1>
        <p className="text-gray-600">Discover and research investment opportunities</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchLoading && (
              <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
              showFilters ? 'bg-blue-50 border-blue-500 text-blue-600' : 'hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="">All Types</option>
                {assetTypes.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                value={filters.sector}
                onChange={(e) => setFilters({ ...filters, sector: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="">All Sectors</option>
                {sectors.map(sector => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
              <select
                value={filters.risk}
                onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
                className="w-full border rounded-lg p-2"
              >
                <option value="">All Risk Levels</option>
                {riskLevels.map(level => (
                  <option key={level} value={level}>
                    {level} - {level <= 3 ? 'Low' : level <= 6 ? 'Medium' : 'High'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Assets Grid */}
      {assetsLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAssets.map((asset) => (
            <div
              key={asset.symbol}
              className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/market/asset/${asset.symbol}`)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{asset.symbol}</h3>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded uppercase">
                      {asset.asset_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-1">{asset.name}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWatchlistToggle(asset.symbol, isInWatchlist(asset.symbol));
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isInWatchlist(asset.symbol) ? (
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ) : (
                    <StarOff className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-4 text-sm">
                  {asset.sector && (
                    <span className="text-gray-500">{asset.sector}</span>
                  )}
                  {asset.risk_level && (
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      asset.risk_level <= 3 ? 'bg-green-100 text-green-700' :
                      asset.risk_level <= 6 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Risk: {asset.risk_level}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}

      {displayedAssets.length === 0 && !assetsLoading && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No assets found matching your criteria</p>
        </div>
      )}
    </div>
  );
};

export default MarketExplorer;