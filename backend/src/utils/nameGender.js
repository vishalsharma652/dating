const femaleNames = new Set([
  'aadhya',
  'aarohi',
  'aditi',
  'ananya',
  'anjali',
  'avani',
  'diya',
  'isha',
  'kavya',
  'kiara',
  'meera',
  'myra',
  'neha',
  'nisha',
  'pooja',
  'priya',
  'riya',
  'saanvi',
  'shreya',
  'sneha',
  'tanya'
]);

const maleNames = new Set([
  'aarav',
  'aditya',
  'aman',
  'arjun',
  'dev',
  'ishaan',
  'kabir',
  'karan',
  'krishna',
  'rahul',
  'raj',
  'rohan',
  'samar',
  'siddharth',
  'vivaan',
  'yash'
]);

const genderAliases = {
  female: 'female',
  girl: 'female',
  woman: 'female',
  women: 'female',
  male: 'male',
  boy: 'male',
  man: 'male',
  men: 'male'
};

function normalizeGender(value) {
  return genderAliases[String(value || '').trim().toLowerCase()] || null;
}

function firstName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z\s-]/g, '')
    .split(/[\s-]+/)
    .filter(Boolean)[0] || '';
}

function inferGenderFromName(name) {
  const normalizedName = firstName(name);
  if (femaleNames.has(normalizedName)) return 'female';
  if (maleNames.has(normalizedName)) return 'male';
  return null;
}

function hasNameGenderMismatch(name, gender) {
  const nameGender = inferGenderFromName(name);
  const selectedGender = normalizeGender(gender);
  return Boolean(nameGender && selectedGender && nameGender !== selectedGender);
}

module.exports = { hasNameGenderMismatch, normalizeGender };
