export const getWeekRange = (): {
  startOfWeek: Date;
  endOfWeek: Date;
} => {
  const now = new Date();
  const day = now.getDay(); // Sunday - 0, Monday - 1, ..., Saturday - 6
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust if Sunday, set start to Monday
  const startOfWeek = new Date(now.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0); // Start of the week

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Add 6 days to get end of the week
  endOfWeek.setHours(23, 59, 59, 999); // End of the week

  return { startOfWeek, endOfWeek };
};
