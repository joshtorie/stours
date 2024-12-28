export interface City {
  id: string;
  name: string;
  heroImage: string;
}

export interface Neighborhood {
  id: string;
  name: string;
  cityId: string;
  heroImage: string;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  heroImage: string;
}

export interface StreetArt {
  id: string;
  title: string;
  description: string;
  image: string;
  artistId: string;
  neighborhoodId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  dateCreated: string;
}