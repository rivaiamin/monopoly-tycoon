import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") sessionId: string;
  @type("string") name: string;
  @type("string") token: string;
  @type("number") balance: number = 1500;
  @type("number") position: number = 0;
  @type("boolean") inJail: boolean = false;
  @type("number") jailTurns: number = 0;
  @type("number") getOutOfJailCards: number = 0;
  @type("boolean") isBankrupt: boolean = false;
  @type("boolean") isReady: boolean = false;
}

export class Space extends Schema {
  @type("number") index: number;
  @type("string") name: string;
  @type("string") type: string;
  @type("string") groupId: string;
  @type("number") price: number;
  @type("number") houseCost: number;
  @type("string") ownerId: string = "";
  @type("number") houseCount: number = 0;
  @type("boolean") isMortgaged: boolean = false;
  @type("number") baseRent: number;
}

export class GameState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type([Space]) board = new ArraySchema<Space>();
  @type("string") currentTurnId: string = "";
  /** waiting_for_players | waiting_to_roll | jail_choice | post_move_action | property_management | auction | game_over */
  @type("string") turnPhase: string = "waiting_for_players";
  @type("number") turnRollCount: number = 0;
  @type("boolean") pendingExtraRoll: boolean = false;
  @type("boolean") gameStarted: boolean = false;
  @type(["string"]) log = new ArraySchema<string>();

  @type("string") winnerId: string = "";
  @type("boolean") gameOver: boolean = false;

  @type("number") freeParkingPot: number = 0;
  @type("boolean") freeParkingJackpot: boolean = true;

  @type("number") auctionSpaceIndex: number = -1;
  @type("number") auctionHighBid: number = 0;
  @type("string") auctionHighBidderId: string = "";
  @type("number") auctionPassesSinceLastBid: number = 0;

  @type("string") lastCardText: string = "";

  /** invite / room display */
  @type("string") roomCode: string = "";

  /** Last dice shown in UI (synced on every roll, including utility rent). */
  @type("number") lastDie1: number = 0;
  @type("number") lastDie2: number = 0;
  @type("number") diceRollSeq: number = 0;
}
