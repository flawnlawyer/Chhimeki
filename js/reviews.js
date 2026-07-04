// reviews.js — Review CRUD (localStorage)

function getReviews() {
  try {
    return JSON.parse(localStorage.getItem('chhimeki_reviews') || '{}');
  } catch {
    return {};
  }
}

function getProviderReviews(providerId) {
  const all = getReviews();
  return all[providerId] || [];
}

function addReview(providerId, { author, rating, text }) {
  const all = getReviews();
  if (!all[providerId]) all[providerId] = [];
  all[providerId].unshift({
    id: Date.now(),
    author: author.trim(),
    rating: Number(rating),
    text: text.trim(),
    date: new Date().toISOString()
  });
  localStorage.setItem('chhimeki_reviews', JSON.stringify(all));
}
