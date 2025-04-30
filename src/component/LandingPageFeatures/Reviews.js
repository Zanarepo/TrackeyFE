import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { supabase } from '../../supabaseClient'; // Importing supabase client

export default function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);

  const storeId = Number(localStorage.getItem('store_id'));
  const userId = localStorage.getItem('user_id');
  const isOwner = !userId;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeId || (!userId && !isOwner)) {
      setMessage('You must be logged in to submit a review.');
      return;
    }

    setLoading(true);
    setMessage(null);

    const reviewPayload = {
      comment,
      rating,
    };

    if (isOwner) {
      reviewPayload.store_id = storeId;
      reviewPayload.store_user_id = null; // If it's a store owner, store_user_id will be null
    } else {
      reviewPayload.store_id = null; // If it's a user, store_id will be null
      reviewPayload.store_user_id = Number(userId); // User's ID will be used for store_user_id
    }

    // Insert review into the "reviews" table using supabase
    const {error } = await supabase
      .from('reviews')
      .insert([reviewPayload]);

    setLoading(false);

    if (error) {
      console.error('Insert error:', error);
      setMessage('Failed to submit review.');
    } else {
      setMessage('Review submitted successfully!');
      setComment('');
      setRating(5);
      setIsReviewVisible(false); // Hide the form after submission
    }
  };

  return (
    <section className="bg-indigo-100 dark:bg-gray-900 py-10 px-6 rounded-xl max-w-2xl mx-auto">
      <button
        onClick={() => setIsReviewVisible(!isReviewVisible)}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl mb-6"
      >
        {isReviewVisible ? 'Close Review Form' : 'Write a Review'}
      </button>

      {isReviewVisible && (
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Write a Review</h2>
          {message && (
            <div className="mb-4 text-sm text-center text-red-600 dark:text-red-400">{message}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rating:
              </label>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => {
                  const starValue = i + 1;
                  return (
                    <button
                      type="button"
                      key={starValue}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHover(starValue)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <FaStar
                        className={
                          (hover || rating) >= starValue
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                        size={24}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Your Review:
              </label>
              <textarea
                id="comment"
                name="comment"
                rows="4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:text-white"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-xl"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
