"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import Image from "next/image";
import {
  User,
  Camera,
  FileText,
  CreditCard,
  Check,
  ChevronLeft,
  ChevronRight,
  Upload,
  X,
  Plus,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Globe,
} from "lucide-react";

const CREATOR_CATEGORIES = [
  { value: 'artist', label: 'Artist', emoji: '🎨' },
  { value: 'musician', label: 'Musician', emoji: '🎵' },
  { value: 'writer', label: 'Writer', emoji: '✍️' },
  { value: 'photographer', label: 'Photographer', emoji: '📸' },
  { value: 'developer', label: 'Developer', emoji: '💻' },
  { value: 'designer', label: 'Designer', emoji: '🎨' },
  { value: 'content_creator', label: 'Content Creator', emoji: '📱' },
  { value: 'educator', label: 'Educator', emoji: '📚' },
  { value: 'entrepreneur', label: 'Entrepreneur', emoji: '🚀' },
  { value: 'other', label: 'Other', emoji: '💼' },
];

export default function CreatorSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState("");

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    displayName: "",
    tagline: "",
    bio: "",
    category: "",
    location: "",
    website: "",

    // Step 2: Profile & Social
    profilePic: null,
    socialLinks: {
      instagram: "",
      twitter: "",
      youtube: "",
      linkedin: "",
      github: "",
      behance: "",
      dribbble: "",
    },
    skills: [],

    // Step 3: Bank Details
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      upiId: "",
    },
  });

  const [newSkill, setNewSkill] = useState("");

  // Check if user is already a creator with completed profile
  useEffect(() => {
    const checkExistingProfile = async () => {
      if (session?.user?.email) {
        try {
          const res = await fetch("/api/creator/profile");
          if (res.ok) {
            const profile = await res.json();
            console.log('Existing profile check:', profile);
            if (profile.isCreator && profile.profileSetupComplete) {
              toast.success("Your creator profile is already set up!");
              router.push('/dashboard');
              return;
            }
          }
        } catch (error) {
          console.error("Failed to check existing profile:", error);
        }
      }
    };

    checkExistingProfile();
  }, [session, router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?redirect=creator-setup");
    }
  }, [status, router]);

  const handleInputChange = (field, value, section = null) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setProfileImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && formData.skills.length < 10) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (index) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.displayName.trim()) {
          toast.error("Display name is required");
          return false;
        }
        if (!formData.category) {
          toast.error("Please select a category");
          return false;
        }
        if (!formData.bio.trim()) {
          toast.error("Bio is required");
          return false;
        }
        return true;

      case 2:
        // Optional step - no validation required
        return true;

      case 3:
        if (!formData.bankDetails.accountHolderName.trim()) {
          toast.error("Account holder name is required");
          return false;
        }
        if (!formData.bankDetails.upiId.trim() && 
            (!formData.bankDetails.accountNumber.trim() || !formData.bankDetails.ifscCode.trim())) {
          toast.error("Please provide either UPI ID or bank account details");
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Add profile image if selected
      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      // Add form data
      formDataToSend.append('formData', JSON.stringify(formData));

      const response = await fetch('/api/creator/setup', {
        method: 'POST',
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("🎉 Creator profile setup complete!");
        // Force a page refresh to clear any cached profile data
        window.location.href = '/dashboard';
      } else {
        toast.error(result.error || "Setup failed");
      }
    } catch (error) {
      console.error('Setup error:', error);
      toast.error("Setup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: "Basic Info", icon: User, completed: currentStep > 1 },
    { number: 2, title: "Profile & Social", icon: Camera, completed: currentStep > 2 },
    { number: 3, title: "Payment Details", icon: CreditCard, completed: false },
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Tell us about yourself</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Display Name *
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => handleInputChange('displayName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Your professional name"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tagline
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleInputChange('tagline', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="A brief description of what you do"
                maxLength={150}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {CREATOR_CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => handleInputChange('category', category.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      formData.category === category.value
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                        : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    <span className="text-lg">{category.emoji}</span>
                    <span className="font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio *
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Tell people about your work and passion..."
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Profile & Social Links</h2>

            {/* Profile Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Profile Picture
              </label>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-600">
                    {profileImagePreview ? (
                      <Image
                        src={profileImagePreview}
                        alt="Profile preview"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    id="profileImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="profileImage"
                    className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full cursor-pointer hover:bg-emerald-600 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload a professional photo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Max size: 5MB • JPG, PNG supported
                  </p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Skills & Expertise
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Add a skill..."
                  maxLength={50}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={!newSkill.trim() || formData.skills.length >= 10}
                  className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      className="text-emerald-600 hover:text-emerald-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {formData.skills.length}/10 skills added
              </p>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Social Media Links
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: '@username' },
                  { key: 'twitter', label: 'Twitter', icon: Twitter, placeholder: '@username' },
                  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'Channel URL' },
                  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'Profile URL' },
                  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'Profile URL' },
                  { key: 'behance', label: 'Behance', icon: Globe, placeholder: 'Profile URL' },
                ].map((social) => (
                  <div key={social.key}>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {social.label}
                    </label>
                    <div className="relative">
                      <social.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.socialLinks[social.key]}
                        onChange={(e) => handleInputChange(social.key, e.target.value, 'socialLinks')}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        placeholder={social.placeholder}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center mb-6">Payment Details</h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Add your bank details to receive payments from supporters
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Account Holder Name *
              </label>
              <input
                type="text"
                value={formData.bankDetails.accountHolderName}
                onChange={(e) => handleInputChange('accountHolderName', e.target.value, 'bankDetails')}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Full name as per bank account"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Choose Payment Method (Required)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    UPI ID (Recommended)
                  </label>
                  <input
                    type="text"
                    value={formData.bankDetails.upiId}
                    onChange={(e) => handleInputChange('upiId', e.target.value, 'bankDetails')}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="yourname@paytm or yourname@googlepay"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Fastest way to receive payments
                  </p>
                </div>

                <div className="text-center text-gray-500 dark:text-gray-400 font-medium">
                  OR
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-800 dark:text-gray-200">
                    Bank Account Details
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value, 'bankDetails')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Enter account number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.ifscCode}
                        onChange={(e) => handleInputChange('ifscCode', e.target.value.toUpperCase(), 'bankDetails')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="IFSC Code (e.g., SBIN0001234)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value, 'bankDetails')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Bank name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Branch Name
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.branchName}
                        onChange={(e) => handleInputChange('branchName', e.target.value, 'bankDetails')}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Branch name"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Your payment information is secure</p>
                  <p>We use bank-grade encryption to protect your financial data. You can update these details anytime from your dashboard.</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950 py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = step.completed;
              
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                      isCompleted 
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : isActive 
                        ? "bg-emerald-100 border-emerald-500 text-emerald-600"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}>
                      {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                    </div>
                    <div className={`mt-2 text-sm font-medium ${
                      isActive ? "text-emerald-600" : "text-gray-500"
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      step.completed ? "bg-emerald-500" : "bg-gray-300"
                    }`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-gray-200 dark:border-gray-700">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 mt-8 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <Check className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}