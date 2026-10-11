export const USER_NAME = "Siddu";

export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return `Good Morning, ${USER_NAME}`;
  if (hour >= 12 && hour < 17) return `Good Afternoon, ${USER_NAME}`;
  if (hour >= 17 && hour < 21) return `Good Evening, ${USER_NAME}`;
  return `Good Night, ${USER_NAME}`;
}
