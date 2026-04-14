export const PASSWORD_POLICY_MESSAGE =
  "A senha deve ter pelo menos 10 caracteres e incluir letra maiúscula, letra minúscula, número e símbolo.";

const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const digitRegex = /\d/;
const specialCharRegex = /[^A-Za-z0-9]/;

export function isPasswordStrong(password) {
  if (!password || password.trim().length < 10) {
    return false;
  }

  return (
    uppercaseRegex.test(password) &&
    lowercaseRegex.test(password) &&
    digitRegex.test(password) &&
    specialCharRegex.test(password)
  );
}
