import { formatDistanceToNow, parseISO } from 'date-fns';

export const formatRelativeTime = (dateString) => {
  const date = parseISO(dateString); // Convertit la chaîne ISO en objet Date
  return formatDistanceToNow(date, { addSuffix: true });
};