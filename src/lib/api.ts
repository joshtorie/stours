// Mock data types
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
  artist: string;
  neighborhood_id: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

// Mock data
const mockNeighborhoods: Neighborhood[] = [
  { id: 'n1', name: 'Downtown', city: 'Cape Town' },
  { id: 'n2', name: 'Woodstock', city: 'Cape Town' },
  { id: 'n3', name: 'Observatory', city: 'Cape Town' }
];

const mockArtists: { [key: string]: Artist[] } = {
  'n1': [
    { id: 'a1', name: 'Faith47', neighborhood_ids: ['n1', 'n2'] },
    { id: 'a2', name: 'Falko One', neighborhood_ids: ['n1'] }
  ],
  'n2': [
    { id: 'a3', name: 'Jack Fox', neighborhood_ids: ['n2'] },
    { id: 'a1', name: 'Faith47', neighborhood_ids: ['n1', 'n2'] }
  ],
  'n3': [
    { id: 'a4', name: 'Dal East', neighborhood_ids: ['n3'] }
  ]
};

const mockStreetArt: { [key: string]: StreetArt[] } = {
  'a1': [
    {
      id: 'sa1',
      title: 'The Guardian',
      artist_id: 'a1',
      artist: 'Faith47',
      neighborhood_id: 'n1',
      coordinates: { lat: -33.92543, lng: 18.42322 }
    },
    {
      id: 'sa2',
      title: 'Freedom',
      artist_id: 'a1',
      artist: 'Faith47',
      neighborhood_id: 'n2',
      coordinates: { lat: -33.92789, lng: 18.42567 }
    }
  ],
  'a2': [
    {
      id: 'sa3',
      title: 'Colorful Elephant',
      artist_id: 'a2',
      artist: 'Falko One',
      neighborhood_id: 'n1',
      coordinates: { lat: -33.92111, lng: 18.42111 }
    }
  ],
  'a3': [
    {
      id: 'sa4',
      title: 'Urban Life',
      artist_id: 'a3',
      artist: 'Jack Fox',
      neighborhood_id: 'n2',
      coordinates: { lat: -33.92999, lng: 18.42888 }
    }
  ],
  'a4': [
    {
      id: 'sa5',
      title: 'Bird in Flight',
      artist_id: 'a4',
      artist: 'Dal East',
      neighborhood_id: 'n3',
      coordinates: { lat: -33.93456, lng: 18.43222 }
    }
  ]
};

// API functions
export const getNeighborhoods = async (): Promise<Neighborhood[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockNeighborhoods;
};

export const getArtistsByNeighborhood = async (neighborhoodId: string): Promise<Artist[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockArtists[neighborhoodId] || [];
};

export const getStreetArtByArtist = async (artistId: string, neighborhoodId: string): Promise<StreetArt[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const artworks = mockStreetArt[artistId] || [];
  return artworks.filter(art => art.neighborhood_id === neighborhoodId);
};
