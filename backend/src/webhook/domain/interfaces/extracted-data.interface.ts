export interface IExtractedData {
  date?: string;
  amount?: number;
  period?: string;
  metric?: string;
  event_name?: string;
  name?: string;
  contact_name?: string;
  capacity?: string;
  price?: string;
  [key: string]: unknown; // Allow flexibility but encourage strict fields
}
