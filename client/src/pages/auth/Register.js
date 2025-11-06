import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { register as registerUser, reset } from '../../store/features/authSlice';
import toast from 'react-hot-toast';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { isLoading, isError, isSuccess, message } = useSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (isError) {
      toast.error(message);
    }

    if (isSuccess) {
      toast.success('Registration successful!');
      navigate('/dashboard');
    }

    dispatch(reset());
  }, [isError, isSuccess, message, navigate, dispatch]);

  const onSubmit = async (data) => {
    const { confirmPassword, ...userData } = data;
    try {
      await dispatch(registerUser(userData)).unwrap();
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
              First name
            </label>
            <div className="mt-1">
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                className={`
                  appearance-none block w-full px-3 py-2 border rounded-lg
                  shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500
                  ${errors.firstName ? 'border-red-300' : 'border-gray-300'}
                `}
                {...register('firstName', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters',
                  },
                })}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.firstName.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
              Last name
            </label>
            <div className="mt-1">
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                className={`
                  appearance-none block w-full px-3 py-2 border rounded-lg
                  shadow-sm placeholder-gray-400 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500
                  ${errors.lastName ? 'border-red-300' : 'border-gray-300'}
                `}
                {...register('lastName', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters',
                  },
                })}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email address
          </label>
          <div className="mt-1">
            <input
              id="email"
              type="email"
              autoComplete="email"
              className={`
                appearance-none block w-full px-3 py-2 border rounded-lg
                shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${errors.email ? 'border-red-300' : 'border-gray-300'}
              `}
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="mt-1 relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`
                appearance-none block w-full px-3 py-2 border rounded-lg
                shadow-sm placeholder-gray-400 pr-10
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${errors.password ? 'border-red-300' : 'border-gray-300'}
              `}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message:
                    'Password must contain uppercase, lowercase, and number',
                },
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium text-gray-700"
          >
            Confirm password
          </label>
          <div className="mt-1">
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`
                appearance-none block w-full px-3 py-2 border rounded-lg
                shadow-sm placeholder-gray-400 
                focus:outline-none focus:ring-blue-500 focus:border-blue-500
                ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}
              `}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <input
            id="terms"
            type="checkbox"
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            {...register('terms', {
              required: 'You must accept the terms and conditions',
            })}
          />
          <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
            I agree to the{' '}
            <Link
              to="/terms"
              className="text-blue-600 hover:text-blue-500"
            >
              Terms and Conditions
            </Link>
          </label>
        </div>
        {errors.terms && (
          <p className="text-sm text-red-600">{errors.terms.message}</p>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="
              w-full flex justify-center py-2 px-4 border border-transparent 
              rounded-lg shadow-sm text-sm font-medium text-white 
              bg-blue-600 hover:bg-blue-700 focus:outline-none 
              focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create account'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;