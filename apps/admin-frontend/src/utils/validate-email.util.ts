export const validateEmail = (value: string) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Invalid email format";
  } else {
    return "";
  }
};
