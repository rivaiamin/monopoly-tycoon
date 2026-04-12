/** Card effect payloads — interpreted by PropertyTycoonRoom */

export type CardEffect =
  | { kind: "money"; amount: number }
  | { kind: "advance_to_go" }
  | { kind: "go_to_jail" }
  | { kind: "move_to"; index: number }
  | { kind: "move_relative"; delta: number }
  | { kind: "get_out_of_jail" }
  | { kind: "pay_each_player"; amount: number }
  | { kind: "collect_each_player"; amount: number }
  | { kind: "pay_buildings"; perHouse: number; perHotel: number }
  | { kind: "street_repairs"; perHouse: number; perHotel: number };

export interface CardDef {
  id: string;
  text: string;
  effect: CardEffect;
}

export const CHANCE_CARDS: CardDef[] = [
  { id: "ch_go", text: "Advance to GO (Collect $200).", effect: { kind: "advance_to_go" } },
  { id: "ch_bank", text: "Bank pays you dividend of $50.", effect: { kind: "money", amount: 50 } },
  { id: "ch_jail", text: "Go to Jail. Do not pass GO, do not collect $200.", effect: { kind: "go_to_jail" } },
  { id: "ch_back", text: "Go back 3 spaces.", effect: { kind: "move_relative", delta: -3 } },
  { id: "ch_fine", text: "Pay poor tax of $15.", effect: { kind: "money", amount: -15 } },
  { id: "ch_reading", text: "Take a trip to Reading Railroad. If you pass GO, collect $200.", effect: { kind: "move_to", index: 5 } },
  { id: "ch_chair", text: "You have been elected Chairman of the Board. Pay each player $50.", effect: { kind: "pay_each_player", amount: 50 } },
  { id: "ch_building", text: "Make general repairs on all your property: For each house pay $25, for each hotel $100.", effect: { kind: "street_repairs", perHouse: 25, perHotel: 100 } },
  { id: "ch_getout", text: "Get Out of Jail Free.", effect: { kind: "get_out_of_jail" } },
  { id: "ch_illinois", text: "Advance to Illinois Avenue. If you pass GO, collect $200.", effect: { kind: "move_to", index: 24 } },
];

export const CHEST_CARDS: CardDef[] = [
  { id: "cx_go", text: "Advance to GO (Collect $200).", effect: { kind: "advance_to_go" } },
  { id: "cx_bank", text: "Bank error in your favor. Collect $200.", effect: { kind: "money", amount: 200 } },
  { id: "cx_doctor", text: "Doctor's fee. Pay $50.", effect: { kind: "money", amount: -50 } },
  { id: "cx_stock", text: "From sale of stock you get $50.", effect: { kind: "money", amount: 50 } },
  { id: "cx_jail", text: "Go to Jail. Do not pass GO, do not collect $200.", effect: { kind: "go_to_jail" } },
  { id: "cx_birthday", text: "It is your birthday. Collect $10 from every player.", effect: { kind: "collect_each_player", amount: 10 } },
  { id: "cx_hospital", text: "Pay hospital fees of $100.", effect: { kind: "money", amount: -100 } },
  { id: "cx_school", text: "Pay school taxes of $150.", effect: { kind: "money", amount: -150 } },
  { id: "cx_getout", text: "Get Out of Jail Free.", effect: { kind: "get_out_of_jail" } },
  { id: "cx_repairs", text: "You are assessed for street repairs: $40 per house, $115 per hotel.", effect: { kind: "pay_buildings", perHouse: 40, perHotel: 115 } },
];

export function shuffleIndices(len: number): number[] {
  const a = Array.from({ length: len }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
