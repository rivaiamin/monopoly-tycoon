export interface SpaceData {
  name: string;
  type: string;
  groupId?: string;
  price?: number;
  rent?: number[];
  houseCost?: number;
}

export const BOARD_DATA: SpaceData[] = [
  { name: "GO", type: "go" },
  { name: "Mediterranean Avenue", type: "property", groupId: "brown", price: 60, rent: [2, 10, 30, 90, 160, 250], houseCost: 50 },
  { name: "Community Chest", type: "chest" },
  { name: "Baltic Avenue", type: "property", groupId: "brown", price: 60, rent: [4, 20, 60, 180, 320, 450], houseCost: 50 },
  { name: "Income Tax", type: "tax" },
  { name: "Reading Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
  { name: "Oriental Avenue", type: "property", groupId: "lightBlue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { name: "Chance", type: "chance" },
  { name: "Vermont Avenue", type: "property", groupId: "lightBlue", price: 100, rent: [6, 30, 90, 270, 400, 550], houseCost: 50 },
  { name: "Connecticut Avenue", type: "property", groupId: "lightBlue", price: 120, rent: [8, 40, 100, 300, 450, 600], houseCost: 50 },
  { name: "Jail", type: "jail" },
  { name: "St. Charles Place", type: "property", groupId: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { name: "Electric Company", type: "utility", price: 150 },
  { name: "States Avenue", type: "property", groupId: "pink", price: 140, rent: [10, 50, 150, 450, 625, 750], houseCost: 100 },
  { name: "Virginia Avenue", type: "property", groupId: "pink", price: 160, rent: [12, 60, 180, 500, 700, 900], houseCost: 100 },
  { name: "Pennsylvania Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
  { name: "St. James Place", type: "property", groupId: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { name: "Community Chest", type: "chest" },
  { name: "Tennessee Avenue", type: "property", groupId: "orange", price: 180, rent: [14, 70, 200, 550, 750, 950], houseCost: 100 },
  { name: "New York Avenue", type: "property", groupId: "orange", price: 200, rent: [16, 80, 220, 600, 800, 1000], houseCost: 100 },
  { name: "Free Parking", type: "parking" },
  { name: "Kentucky Avenue", type: "property", groupId: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { name: "Chance", type: "chance" },
  { name: "Indiana Avenue", type: "property", groupId: "red", price: 220, rent: [18, 90, 250, 700, 875, 1050], houseCost: 150 },
  { name: "Illinois Avenue", type: "property", groupId: "red", price: 240, rent: [20, 100, 300, 750, 925, 1100], houseCost: 150 },
  { name: "B. & O. Railroad", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
  { name: "Atlantic Avenue", type: "property", groupId: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { name: "Ventnor Avenue", type: "property", groupId: "yellow", price: 260, rent: [22, 110, 330, 800, 975, 1150], houseCost: 150 },
  { name: "Water Works", type: "utility", price: 150 },
  { name: "Marvin Gardens", type: "property", groupId: "yellow", price: 280, rent: [24, 120, 360, 850, 1025, 1200], houseCost: 150 },
  { name: "Go To Jail", type: "go_to_jail" },
  { name: "Pacific Avenue", type: "property", groupId: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { name: "North Carolina Avenue", type: "property", groupId: "green", price: 300, rent: [26, 130, 390, 900, 1100, 1275], houseCost: 200 },
  { name: "Community Chest", type: "chest" },
  { name: "Pennsylvania Avenue", type: "property", groupId: "green", price: 320, rent: [28, 150, 450, 1000, 1200, 1400], houseCost: 200 },
  { name: "Short Line", type: "railroad", price: 200, rent: [25, 50, 100, 200] },
  { name: "Chance", type: "chance" },
  { name: "Park Place", type: "property", groupId: "darkBlue", price: 350, rent: [35, 175, 500, 1100, 1300, 1500], houseCost: 200 },
  { name: "Luxury Tax", type: "tax" },
  { name: "Boardwalk", type: "property", groupId: "darkBlue", price: 400, rent: [50, 200, 600, 1400, 1700, 2000], houseCost: 200 },
];
