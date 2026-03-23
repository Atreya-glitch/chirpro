/**
 * Generates a random password using ONLY uppercase and lowercase letters.
 * No numbers, no special characters.
 * @param {number} length - Desired password length (default: 12)
 * @returns {string} Generated password
 */
const generateLetterPassword = (length = 12) => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const allChars = uppercase + lowercase;

  let password = "";

  // Guarantee at least one uppercase and one lowercase
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];

  for (let i = 2; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle to avoid predictable first chars
  password = password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");

  return password;
};

module.exports = { generateLetterPassword };
