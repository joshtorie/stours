import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Neighborhood {
  id: string;
  name: string;
  city: string;
}

export interface Artist {
  id: string;
  name: string;
  neighborhood_ids: string[];
}

export interface StreetArt {
  id: string;
  title: string;
  artist_id: string;
  neighborhood_id: string;
  location: {
    lat: number;
    lng: number;
  };
}

// Fetch all neighborhoods
export const getNeighborhoods = async (): Promise<Neighborhood[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/neighborhoods`);
    return response.data;
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    return [];
  }
};

// Fetch artists by neighborhood
export const getArtistsByNeighborhood = async (neighborhoodId: string): Promise<Artist[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/artists?neighborhood=${neighborhoodId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching artists:', error);
    return [];
  }
};

// Fetch street art by artist and neighborhood
export const getStreetArtByArtist = async (artistId: string, neighborhoodId: string): Promise<StreetArt[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/street-art?artist=${artistId}&neighborhood=${neighborhoodId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching street art:', error);
    return [];
  }
};
