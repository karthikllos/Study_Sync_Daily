"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import PaymentForm from "../../components/PaymentForm";
import {
  MapPin,
  Globe,
  Calendar,
  Users,
  Eye,
  Heart,
  Share2,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  ExternalLink,
  Star,
  MessageSquare,
  Coffee,
  Award,
  TrendingUp,
  User,
} from "lucide-react";

export default function CreatorProfilePage() {
  const params = useParams();
  const username = params?.username;
  const { data: session } = useSession();
  
  const [creator, setCreator] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [recentSupport, setRecentSupport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [selectedWork, setSelectedWork] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Check if current user is viewing their own profile
  const isOwnProfile = session?.user?.email === creator?.email;

  useEffect(() => {
    if (username) {
      fetchCreatorProfile();
    }
  }, [username]);

  const fetchCreatorProfile = async () => {
    try {
      setLoading(true);

      // Fetch creator profile
      const profileResponse = await fetch(`/api/user?username=${username}`);
      if (!profileResponse.ok) {
        if (profileResponse.status === 404) {
          // Creator not found
          return;
        }
        throw new Error('Failed to fetch profile');
      }
      
      const creatorData = await profileResponse.json();
      setCreator(creatorData);

      // Only fetch additional data if creator exists and is a creator
      if (creatorData && creatorData.isCreator) {
        // Fetch portfolio
        const portfolioResponse = await fetch(`/api/portfolio?username=${username}`);
        if (portfolioResponse.ok) {
          const portfolioData = await portfolioResponse.json();
          setPortfolio(portfolioData.portfolio || []);
        }

        // Fetch recent payments/support
        const paymentsResponse = await fetch(`/api/payments?username=${username}`);
        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          setRecentSupport(paymentsData || []);
        }

        // Increment profile view count
        fetch(`/api/creator/increment-view?username=${username}`, {
          method: 'POST',
        }).catch(err => console.log('View count update failed:', err));
      }

    } catch (error) {
      console.error('Error fetching creator profile:', error);
      toast.error('Failed to load creator profile');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Support ${creator.name || creator.username} - Buy Me A Chai`,
          text: `Check out ${creator.name || creator.username}'s amazing work and show your support!`,
          url: url,
        });
      } catch (err) {
        // Fall back to copy to clipboard
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Profile link copied to clipboard!');
    });
  };

  const getSocialIcon = (platform) => {
    const icons = {
      instagram: Instagram,
      twitter: Twitter,
      youtube: Youtube,
      linkedin: Linkedin,
      github: Github,
      behance: Globe,
      dribbble: Globe,
    };
    return icons[platform] || Globe;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Creator Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The creator you're looking for doesn't exist or hasn't set up their profile yet.
          </p>
          <Link
            href="/find-creators"
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Find Other Creators
          </Link>
        </div>
      </div>
    );
  }

  if (!creator.isCreator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Not a Creator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This user hasn't set up a creator profile yet.
          </p>
          <Link
            href="/find-creators"
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            Find Other Creators
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Profile Image */}
            <div className="relative">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                {creator.profilepic ? (
                  <Image
                    src={creator.profilepic}
                    alt={creator.name || creator.username}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-white/20 flex items-center justify-center">
                    <User className="h-16 w-16 md:h-24 md:w-24 text-white/60" />
                  </div>
                )}
              </div>
              {creator.creatorProfile?.category && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-white text-emerald-600 px-4 py-1 rounded-full text-sm font-medium">
                    {creator.creatorProfile.category.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {creator.creatorProfile?.displayName || creator.name || creator.username}
              </h1>
              <p className="text-xl text-emerald-100 mb-4">
                @{creator.username}
              </p>
              
              {creator.creatorProfile?.tagline && (
                <p className="text-lg text-emerald-100 mb-6">
                  {creator.creatorProfile.tagline}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-emerald-100 mb-6">
                {creator.creatorProfile?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {creator.creatorProfile.location}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Joined {formatDate(creator.createdAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {creator.creatorStats?.supportersCount || 0} supporters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {/* Only show payment button if not viewing own profile */}
                {!isOwnProfile && (
                  <button
                    onClick={() => setShowPaymentForm(true)}
                    className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Coffee className="h-5 w-5" />
                    Buy me a chai
                  </button>
                )}
                {/* Show Dashboard button for creators viewing their own profile */}
                {isOwnProfile && (
                  <Link
                    href="/dashboard"
                    className="bg-white text-emerald-600 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <TrendingUp className="h-5 w-5" />
                    View Dashboard
                  </Link>
                )}
                <button
                  onClick={handleShare}
                  className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
                >
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About Section */}
            {creator.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  About
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {creator.bio}
                </p>
              </div>
            )}

            {/* Skills */}
            {creator.creatorProfile?.skills?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {creator.creatorProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio/Recent Work */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Recent Work
              </h2>
              
              {portfolio.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    No work shared yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    This creator hasn't uploaded any work to showcase yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {portfolio.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="group cursor-pointer"
                      onClick={() => setSelectedWork(item)}
                    >
                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-3">
                        {item.files?.[0]?.url ? (
                          <Image
                            src={item.files[0].url}
                            alt={item.title}
                            width={400}
                            height={400}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Star className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Eye className="h-4 w-4 mr-1" />
                        {item.views || 0}
                        <Heart className="h-4 w-4 ml-4 mr-1" />
                        {item.likeCount || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Support Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Support Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Support</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹{creator.creatorStats?.totalSupport?.toLocaleString() || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Supporters</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {creator.creatorStats?.supportersCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Profile Views</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {creator.creatorStats?.portfolioViews?.toLocaleString() || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            {creator.creatorProfile?.socialLinks && Object.values(creator.creatorProfile.socialLinks).some(link => link) && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Connect
                </h3>
                <div className="space-y-3">
                  {creator.creatorProfile?.website && (
                    <a
                      href={creator.creatorProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                      Website
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </a>
                  )}
                  
                  {Object.entries(creator.creatorProfile.socialLinks || {}).map(([platform, url]) => {
                    if (!url) return null;
                    const Icon = getSocialIcon(platform);
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors capitalize"
                      >
                        <Icon className="h-5 w-5" />
                        {platform}
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Support */}
            {recentSupport.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Recent Support
                </h3>
                <div className="space-y-3">
                  {recentSupport.slice(0, 5).map((payment, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <Coffee className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {payment.message || "Thanks for the chai!"}
                        </p>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ₹{(payment.amount / 100).toFixed(0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal - only show for non-own profiles */}
      {showPaymentForm && !isOwnProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
          <div className="relative max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowPaymentForm(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur-lg text-white p-2 rounded-full hover:bg-white/30 transition-colors"
            >
              ✕
            </button>
            <PaymentForm
              username={creator.username}
              recipientName={creator.creatorProfile?.displayName || creator.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}