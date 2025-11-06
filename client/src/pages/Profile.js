import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { User, Mail, Calendar, Shield, Save, Loader2 } from 'lucide-react';
import { updateProfile, getProfile } from '../store/features/userSlice';
import toast from 'react-hot-toast';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { profile, isLoading } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('personal');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    dispatch(getProfile());
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setValue('firstName', user?.firstName || '');
      setValue('lastName', user?.lastName || '');
      setValue('email', user?.email || '');
      setValue('age', profile.age || '');
      setValue('incomeStability', profile.income_stability || '');
      setValue('riskTolerance', profile.risk_tolerance || 'moderate');
      setValue('lifeStage', profile.life_stage || '');
      setValue('financialKnowledgeLevel', profile.financial_knowledge_level || 3);
      setValue('investmentHorizon', profile.investment_horizon || '');
    }
  }, [profile, user, setValue]);

  const onSubmit = async (data) => {
    try {
      await dispatch(updateProfile(data)).unwrap();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'financial', name: 'Financial Profile', icon: Shield },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 rounded-t-lg">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-blue-100">{user?.email}</p>
              <div className="flex items-center mt-2 text-sm text-blue-100">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm flex items-center
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('firstName', { required: 'First name is required' })}
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('lastName', { required: 'Last name is required' })}
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                    {...register('email')}
                  />
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                </div>
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="18"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('age', { 
                    min: { value: 18, message: 'Must be at least 18' },
                    max: { value: 120, message: 'Invalid age' }
                  })}
                />
                {errors.age && (
                  <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Income Stability
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('incomeStability')}
                >
                  <option value="">Select income stability</option>
                  <option value="very_stable">Very Stable (Permanent employment)</option>
                  <option value="stable">Stable (Contract/Regular income)</option>
                  <option value="variable">Variable (Freelance/Commission)</option>
                  <option value="unstable">Unstable (Irregular income)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Risk Tolerance
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('riskTolerance')}
                >
                  <option value="conservative">Conservative - Preserve capital</option>
                  <option value="moderate">Moderate - Balanced growth</option>
                  <option value="aggressive">Aggressive - Maximum growth</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Life Stage
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('lifeStage')}
                >
                  <option value="">Select life stage</option>
                  <option value="student">Student</option>
                  <option value="early_career">Early Career (20s-30s)</option>
                  <option value="mid_career">Mid Career (30s-40s)</option>
                  <option value="peak_earning">Peak Earning (40s-50s)</option>
                  <option value="pre_retirement">Pre-Retirement (50s-60s)</option>
                  <option value="retirement">Retirement (60s+)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Knowledge Level
                </label>
                <div className="flex items-center space-x-4">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        value={level}
                        className="mr-2"
                        {...register('financialKnowledgeLevel')}
                      />
                      <span className="text-sm">{level}</span>
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-gray-500">1 = Beginner, 5 = Expert</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Investment Horizon
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('investmentHorizon')}
                >
                  <option value="">Select investment horizon</option>
                  <option value="short">Short term (Less than 1 year)</option>
                  <option value="medium">Medium term (1-5 years)</option>
                  <option value="long">Long term (5-10 years)</option>
                  <option value="very_long">Very long term (10+ years)</option>
                </select>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 border-t">
            <button
              type="submit"
              disabled={isLoading}
              className="
                flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      {/* Security Settings */}
      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-gray-500">Last changed 30 days ago</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Change Password
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Enable 2FA
            </button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Active Sessions</p>
              <p className="text-sm text-gray-500">Manage your active sessions</p>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;