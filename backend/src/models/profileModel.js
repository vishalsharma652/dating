const { query } = require('../config/db');

async function getForUser(userId) {
  const rows = await query('SELECT * FROM profiles WHERE user_id = :userId LIMIT 1', { userId });
  const profile = rows[0] || null;
  if (!profile) return null;
  const photos = await query('SELECT id, url, sort_order FROM profile_photos WHERE profile_id = :profileId ORDER BY sort_order ASC', { profileId: profile.id });
  return {
    ...profile,
    languages: parseJson(profile.languages, []),
    interests: parseJson(profile.interests, []),
    lifestyle: parseJson(profile.lifestyle, []),
    photos: photos.map((photo) => photo.url)
  };
}

async function upsert(userId, data) {
  const existing = await getForUser(userId);
  const payload = {
    userId,
    age: data.age || null,
    gender: data.gender || null,
    interestedIn: data.interestedIn || null,
    city: data.city || data.location || null,
    occupation: data.occupation || null,
    education: data.education || null,
    bio: data.bio || null,
    languages: JSON.stringify(data.languages || []),
    interests: JSON.stringify(data.interests || []),
    lifestyle: JSON.stringify(data.lifestyle || [])
  };

  if (existing) {
    await query(
      `UPDATE profiles SET age=:age, gender=:gender, interested_in=:interestedIn, city=:city, occupation=:occupation,
       education=:education, bio=:bio, languages=:languages, interests=:interests, lifestyle=:lifestyle WHERE user_id=:userId`,
      payload
    );
  } else {
    await query(
      `INSERT INTO profiles (user_id, age, gender, interested_in, city, occupation, education, bio, languages, interests, lifestyle)
       VALUES (:userId, :age, :gender, :interestedIn, :city, :occupation, :education, :bio, :languages, :interests, :lifestyle)`,
      payload
    );
  }

  const profile = await getForUser(userId);
  if (Array.isArray(data.photos)) {
    await query('DELETE FROM profile_photos WHERE profile_id = :profileId', { profileId: profile.id });
    for (const [index, url] of data.photos.filter(Boolean).entries()) {
      await query('INSERT INTO profile_photos (profile_id, url, sort_order) VALUES (:profileId, :url, :sortOrder)', {
        profileId: profile.id,
        url,
        sortOrder: index
      });
    }
  }
  return getForUser(userId);
}

async function discover(userId, { limit = 20 } = {}) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 100));
  const rows = await query(
    `SELECT u.id, u.name, COALESCE(TIMESTAMPDIFF(YEAR, u.dob, CURDATE()), p.age) AS age, p.city AS location, p.bio,
      COALESCE(pp.url, '') AS photo, u.kyc_status = 'approved' AS verified,
      p.interests, 85 AS matchScore
     FROM users u
     JOIN profiles p ON p.user_id = u.id
     LEFT JOIN profile_photos pp ON pp.profile_id = p.id AND pp.sort_order = 0
     WHERE u.id <> :userId AND u.role = 'user' AND u.status = 'active'
       AND u.id NOT IN (SELECT target_user_id FROM likes WHERE user_id = :userId)
     LIMIT ${safeLimit}`,
    { userId }
  );
  return rows.map((row) => ({ ...row, interests: parseJson(row.interests, []) }));
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

module.exports = { getForUser, upsert, discover };
