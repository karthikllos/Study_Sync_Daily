"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Settings,
  Upload,
  Eye,
  Heart,
  DollarSign,
  TrendingUp,
  Calendar,
  MessageSquare,
  BarChart3,
  PlusCircle,
  Edit3,
  Share2,
  Copy,
  ExternalLink,
  CreditCard,
  Users,
  Star,
  Award,
  Clock,
  Activity,
} from "lucide-react";

export default function CreatorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [creatorData, setCreatorData] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    thisMonth: 0,
    supporters: 0,
    portfolioViews: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth");
      return;
    }

    if (status === "authenticated" && session) {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch creator profile data
      const profileResponse = await fetch("/api/creator/profile");
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setCreatorData(profileData);
        
        // If not a creator or setup not complete, redirect to setup
        if (!profileData.isCreator || !profileData.profileSetupComplete) {
          router.push("/creator-setup");
          return;
        }
      }

      // Fetch portfolio
      const portfolioResponse = await fetch("/api/creator/portfolio");
      if (portfolioResponse.ok) {
        const portfolioData = await portfolioResponse.json();
        setPortfolio(portfolioData.portfolio || []);
      }

      // Fetch earnings data
      const earningsResponse = await fetch("/api/creator/earnings");
      if (earningsResponse.ok) {
        const earningsData = await earningsResponse.json();
        setEarnings(earningsData);
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/${session?.user?.username}`;
    navigator.clipboard.writeText(profileUrl);
    // You could add a toast notification here
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "portfolio", label: "Portfolio", icon: Upload },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const StatCard = ({ title, value, icon: Icon, trend, color = "emerald" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className={`text-3xl font-bold text-${color}-600 dark:text-${color}-400 mt-2`}>
            {value}
          </p>
          {trend && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="text-green-600">+{trend}%</span> from last month
            </p>
          )}
        </div>
        <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 rounded-xl`}>
          <Icon className={`h-6 w-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {creatorData?.name || session?.user?.name}! 👋
            </h1>
            <p className="text-emerald-100 text-lg">
              Ready to share your amazing work with the world?
            </p>
          </div>
          <div className="hidden md:block">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4">
              <Activity className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-4">
          <Link
            href="/dashboard?tab=portfolio"
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Upload className="h-5 w-5" />
            Add New Work
          </Link>
          <button
            onClick={copyProfileLink}
            className="bg-white/20 backdrop-blur-lg px-6 py-3 rounded-xl font-semibold hover:bg-white/30 transition-colors flex items-center gap-2"
          >
            <Share2 className="h-5 w-5" />
            Share Profile
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Earnings"
          value={`₹${earnings.totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          trend={15}
          color="emerald"
        />
        <StatCard
          title="This Month"
          value={`₹${earnings.thisMonth.toLocaleString()}`}
          icon={TrendingUp}
          trend={8}
          color="blue"
        />
        <StatCard
          title="Supporters"
          value={earnings.supporters.toLocaleString()}
          icon={Users}
          trend={12}
          color="purple"
        />
        <StatCard
          title="Portfolio Views"
          value={earnings.portfolioViews.toLocaleString()}
          icon={Eye}
          trend={25}
          color="pink"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <PlusCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Upload New Work
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Share your latest creation with your audience
            </p>
            <button
              onClick={() => setActiveTab("portfolio")}
              className="bg-emerald-500 text-white px-6 py-2 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Start Upload
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Edit3 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Update Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Keep your profile fresh and engaging
            </p>
            <button
              onClick={() => setActiveTab("profile")}
              className="bg-blue-500 text-white px-6 py-2 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              View Public Profile
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              See how others see your profile
            </p>
            <Link
              href={`/${session?.user?.username}`}
              target="_blank"
              className="bg-purple-500 text-white px-6 py-2 rounded-xl hover:bg-purple-600 transition-colors inline-block"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Portfolio Items */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Recent Work
          </h2>
          <button
            onClick={() => setActiveTab("portfolio")}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium flex items-center gap-2"
          >
            View All
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        
        {portfolio.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              No work uploaded yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Start building your portfolio by uploading your first piece
            </p>
            <button
              onClick={() => setActiveTab("portfolio")}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Upload First Work
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="group cursor-pointer"
                onClick={() => setActiveTab("portfolio")}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden mb-3">
                  {item.files?.[0]?.url ? (
                    <Image
                      src={item.files[0].url}
                      alt={item.title}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Upload className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
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
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "portfolio":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Portfolio Management</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Portfolio management interface will be implemented here.
            </p>
          </div>
        );
      case "earnings":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Earnings & Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed earnings and analytics interface will be implemented here.
            </p>
          </div>
        );
      case "profile":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Profile editing interface will be implemented here.
            </p>
          </div>
        );
      case "settings":
        return (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">Account Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Account settings interface will be implemented here.
            </p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <div className="relative w-10 h-10">
                {creatorData?.profilepic ? (
                  <Image
                    src={creatorData.profilepic}
                    alt="Profile"
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Creator Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{session?.user?.username}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={copyProfileLink}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <Link
                href={`/${session?.user?.username}`}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">View Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
}