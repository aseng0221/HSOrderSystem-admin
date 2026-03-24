export interface Branch {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  openTime: string;
  closeTime: string;
  image?: string;
  distance?: number;
}
