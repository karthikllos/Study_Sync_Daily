"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, User, Coffee, Calendar } from "lucide-react";

export default function FindCreatorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [pagination, setPagination] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  // Fetch suggestions for typeahead
  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setSuggestionLoading(true);
    try {
      const response = await fetch(
        `/api/users?q=${encodeURIComponent(query)}&limit=5`
      );
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.users);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionLoading(false);
    }
  };

  // Debounce function for suggestions
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

  const searchCreators = async (query = "", page = 1) => {
    if (!query.trim() && page === 1) {
      // Load initial creators without search query
      setCreators([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/users?q=${encodeURIComponent(query)}&page=${page}&limit=12`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (page === 1) {
          setCreators(data.users);
        } else {
          setCreators(prev => [...prev, ...data.users]);
        }
        setPagination(data.pagination);
        setHasSearched(true);
      } else {
        console.error("Failed to search creators");
        setCreators([]);
      }
    } catch (error) {
      console.error("Error searching creators:", error);
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    searchCreators(searchQuery, 1);
  };

  const handleSuggestionClick = (creator) => {
    console.log('Suggestion clicked:', creator.username);
    console.log('Navigating to:', `/${creator.username}`);
    // Hide suggestions first
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Navigate directly to the creator's profile page
    router.push(`/${creator.username}`);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    
    if (value.length >= 2) {
      debouncedFetchSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearchSubmit(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0 && searchQuery.length >= 2) {
      setShowSuggestions(true);
    }
  };

  const loadMoreCreators = () => {
    if (pagination && pagination.hasMore && !loading) {
      searchCreators(searchQuery, pagination.page + 1);
    }
  };

  // Load initial creators on page load
  useEffect(() => {
    searchCreators("", 1);
  }, []);

  return (
    <main className="relative min-h-screen px-6 py-12 bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Find Amazing Creators
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Discover talented creators and show them support. Buy them a chai and make their day!
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              placeholder="Search creators by name or username..."
              className="w-full pl-12 pr-32 py-4 text-lg bg-white/80 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800/80 dark:text-white transition-all duration-300"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Searching..." : "Search"}
            </button>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                {suggestions.map((creator, index) => (
                  <div
                    key={creator._id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                      index === selectedSuggestionIndex
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                    onClick={() => handleSuggestionClick(creator)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(creator);
                    }}
                  >
                    {/* Profile Picture */}
                    <div className="relative w-8 h-8 flex-shrink-0">
                      {creator.profilepic ? (
                        <Image
                          src={creator.profilepic}
                          alt={creator.name || creator.username}
                          fill
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {(creator.name || creator.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Creator Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {creator.name || creator.username}
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400 truncate">
                        @{creator.username}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator for suggestions */}
                {suggestionLoading && (
                  <div className="flex items-center justify-center py-3 text-gray-500 dark:text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-emerald-500 rounded-full animate-spin mr-2"></div>
                    Loading suggestions...
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Results */}
        <div className="space-y-8">
          {!hasSearched && !loading && (
            <div className="text-center py-16">
              <Coffee className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                Discover Creators
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Use the search bar above to find creators by name or username
              </p>
            </div>
          )}

          {hasSearched && creators.length === 0 && !loading && (
            <div className="text-center py-16">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                No Creators Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Try searching with different keywords
              </p>
            </div>
          )}

          {creators.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {creators.map((creator) => (
                  <Link
                    key={creator._id}
                    href={`/${creator.username}`}
                    className="group block"
                  >
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300 group-hover:border-emerald-300 dark:group-hover:border-emerald-600">
                      {/* Profile Picture */}
                      <div className="relative w-16 h-16 mx-auto mb-4">
                        {creator.profilepic ? (
                          <Image
                            src={creator.profilepic}
                            alt={creator.name || creator.username}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xl font-semibold">
                              {(creator.name || creator.username).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Creator Info */}
                      <div className="text-center space-y-2">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {creator.name || creator.username}
                        </h3>
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                          @{creator.username}
                        </p>
                        <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                          <Calendar className="h-4 w-4 mr-1" />
                          Joined {new Date(creator.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Support Button */}
                      <div className="mt-4">
                        <div className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          Buy them a chai ☕
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Load More Button */}
              {pagination && pagination.hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMoreCreators}
                    disabled={loading}
                    className="px-8 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Loading..." : "Load More Creators"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Call to Action for Creators */}
        <div className="mt-16 text-center bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Are you a creator?</h3>
          <p className="text-lg mb-6 opacity-90">
            Join our platform and start receiving support from your audience!
          </p>
          <Link
            href="/auth"
            className="inline-block px-8 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300"
          >
            Start My Page
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </main>
  );
}