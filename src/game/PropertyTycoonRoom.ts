import { Room, Client } from "colyseus";
import { GameState, Player, Space } from "./schema";
import { BOARD_DATA } from "./boardData";
import { CHANCE_CARDS, CHEST_CARDS, shuffleIndices, CardDef } from "./cards";

export class PropertyTycoonRoom extends Room<GameState> {
  maxClients = 4;

  private chanceOrder: number[] = [];
  private chestOrder: number[] = [];
  private chanceIdx = 0;
  private chestIdx = 0;

  /** Movement from a dice roll this turn (broken by Chance/Chest or cards). */
  private landedFromDiceRoll = false;
  /** Whether the dice roll that moved the player was doubles (for extra roll). */
  private movementWasDoubles = false;

  onCreate(_options: unknown) {
    this.setState(new GameState());
    this.state.roomCode = this.roomId;

    BOARD_DATA.forEach((data, index) => {
      const space = new Space();
      space.index = index;
      space.name = data.name;
      space.type = data.type;
      space.groupId = data.groupId || "";
      space.price = data.price || 0;
      space.houseCost = data.houseCost || 0;
      space.baseRent = data.rent ? data.rent[0] : 0;
      this.state.board.push(space);
    });

    this.shuffleDecks();

    this.onMessage("ready", (client, message: { ready?: boolean; name?: string; token?: string }) => {
      const player = this.state.players.get(client.sessionId) as Player | undefined;
      if (!player) return;
      player.isReady = !!message.ready;
      if (message.name) player.name = message.name;
      if (message.token) player.token = message.token;
      this.broadcastLog(`${player.name} is ${player.isReady ? "ready" : "not ready"}.`);
      const allReady = Array.from(this.state.players.values()).every((p) => (p as Player).isReady);
      if (allReady && this.state.players.size >= 2) this.startGame();
    });

    this.onMessage("roll", (client) => this.handleRoll(client.sessionId));
    this.onMessage("jail_pay", (client) => this.handleJailPay(client.sessionId));
    this.onMessage("jail_use_card", (client) => this.handleJailUseCard(client.sessionId));
    this.onMessage("jail_roll", (client) => this.handleJailRoll(client.sessionId));

    this.onMessage("buy", (client) => this.handleBuy(client.sessionId));
    this.onMessage("decline_purchase", (client) => this.handleDeclinePurchase(client.sessionId));

    this.onMessage("auction_bid", (client, msg: { amount?: number }) => {
      const amount = typeof msg?.amount === "number" ? msg.amount : 0;
      this.handleAuctionBid(client.sessionId, amount);
    });
    this.onMessage("auction_pass", (client) => this.handleAuctionPass(client.sessionId));

    this.onMessage("end_turn", (client) => this.handleEndTurn(client.sessionId));

    this.onMessage("build_house", (client, msg: { spaceIndex?: number }) => {
      const idx = typeof msg?.spaceIndex === "number" ? msg.spaceIndex : -1;
      this.handleBuildHouse(client.sessionId, idx);
    });
    this.onMessage("sell_house", (client, msg: { spaceIndex?: number }) => {
      const idx = typeof msg?.spaceIndex === "number" ? msg.spaceIndex : -1;
      this.handleSellHouse(client.sessionId, idx);
    });
    this.onMessage("mortgage", (client, msg: { spaceIndex?: number }) => {
      const idx = typeof msg?.spaceIndex === "number" ? msg.spaceIndex : -1;
      this.handleMortgage(client.sessionId, idx);
    });
    this.onMessage("unmortgage", (client, msg: { spaceIndex?: number }) => {
      const idx = typeof msg?.spaceIndex === "number" ? msg.spaceIndex : -1;
      this.handleUnmortgage(client.sessionId, idx);
    });

    this.onMessage("collect_free_parking", (client) => this.handleCollectFreeParking(client.sessionId));
  }

  private shuffleDecks() {
    this.chanceOrder = shuffleIndices(CHANCE_CARDS.length);
    this.chestOrder = shuffleIndices(CHEST_CARDS.length);
    this.chanceIdx = 0;
    this.chestIdx = 0;
  }

  private drawChance(): CardDef {
    const id = this.chanceOrder[this.chanceIdx % this.chanceOrder.length];
    this.chanceIdx++;
    return CHANCE_CARDS[id];
  }

  private drawChest(): CardDef {
    const id = this.chestOrder[this.chestIdx % this.chestOrder.length];
    this.chestIdx++;
    return CHEST_CARDS[id];
  }

  private activePlayerIds(): string[] {
    return Array.from(this.state.players.keys()).filter((id) => !this.state.players.get(id)?.isBankrupt);
  }

  private broadcastLog(message: string) {
    this.state.log.push(message);
    if (this.state.log.length > 80) this.state.log.shift();
  }

  /** Sync dice for client animations (movement dice, jail, utility rent). */
  private setDiceDisplay(d1: number, d2: number) {
    this.state.lastDie1 = d1;
    this.state.lastDie2 = d2;
    this.state.diceRollSeq++;
  }

  private setWinner(sessionId: string) {
    this.state.gameOver = true;
    this.state.winnerId = sessionId;
    this.state.turnPhase = "game_over";
    const w = this.state.players.get(sessionId) as Player | undefined;
    this.broadcastLog(w ? `${w.name} wins the game!` : "Game over.");
  }

  private checkWinner() {
    const ids = this.activePlayerIds();
    if (ids.length === 1) this.setWinner(ids[0]);
  }

  private forfeitProperties(ownerId: string) {
    this.state.board.forEach((s) => {
      const sp = s as Space;
      if (sp.ownerId === ownerId) {
        sp.ownerId = "";
        sp.houseCount = 0;
        sp.isMortgaged = false;
      }
    });
  }

  private eliminatePlayer(sessionId: string) {
    const p = this.state.players.get(sessionId) as Player | undefined;
    if (!p) return;
    p.isBankrupt = true;
    p.balance = 0;
    this.forfeitProperties(sessionId);
    this.broadcastLog(`${p.name} is bankrupt and out of the game.`);
    this.checkWinner();
    if (this.state.gameOver) return;
    if (this.state.currentTurnId === sessionId) this.endTurn();
  }

  /** Returns false if player went bankrupt */
  private transferMoney(
    fromId: string,
    toId: string | null,
    amount: number,
    opts?: { toFreeParking?: boolean }
  ): boolean {
    if (amount <= 0) return true;
    const from = this.state.players.get(fromId) as Player | undefined;
    if (!from || from.isBankrupt) return false;
    if (from.balance >= amount) {
      from.balance -= amount;
      if (toId) {
        const to = this.state.players.get(toId) as Player | undefined;
        if (to && !to.isBankrupt) to.balance += amount;
      } else if (opts?.toFreeParking && this.state.freeParkingJackpot) {
        this.state.freeParkingPot += amount;
      }
      return true;
    }
    const pay = from.balance;
    from.balance = 0;
    if (toId) {
      const to = this.state.players.get(toId) as Player | undefined;
      if (to && !to.isBankrupt) to.balance += pay;
    } else if (opts?.toFreeParking && this.state.freeParkingJackpot) {
      this.state.freeParkingPot += pay;
    }
    this.eliminatePlayer(fromId);
    return false;
  }

  private getGroupPropertySpaces(groupId: string): Space[] {
    return this.state.board.filter((s) => {
      const sp = s as Space;
      return sp.type === "property" && sp.groupId === groupId;
    }) as Space[];
  }

  private hasMonopoly(playerId: string, groupId: string): boolean {
    const spaces = this.getGroupPropertySpaces(groupId);
    if (spaces.length === 0) return false;
    return spaces.every((s) => s.ownerId === playerId);
  }

  private minHousesInGroup(groupId: string): number {
    return Math.min(...this.getGroupPropertySpaces(groupId).map((s) => s.houseCount));
  }

  private maxHousesInGroup(groupId: string): number {
    return Math.max(...this.getGroupPropertySpaces(groupId).map((s) => s.houseCount));
  }

  private countHousesHotels(playerId: string): { houses: number; hotels: number } {
    let houses = 0;
    let hotels = 0;
    this.state.board.forEach((s) => {
      const sp = s as Space;
      if (sp.ownerId !== playerId || sp.type !== "property") return;
      if (sp.houseCount === 5) hotels++;
      else houses += sp.houseCount;
    });
    return { houses, hotels };
  }

  private calculateRent(space: Space): number {
    if (space.isMortgaged) return 0;
    if (space.type === "property") {
      const data = BOARD_DATA[space.index];
      if (!data.rent) return space.baseRent;
      const idx = Math.min(space.houseCount, data.rent.length - 1);
      let rent = data.rent[idx];
      if (space.houseCount === 0 && this.hasMonopoly(space.ownerId, space.groupId)) {
        rent *= 2;
      }
      return rent;
    }
    if (space.type === "railroad") {
      const n = this.state.board.filter(
        (s) => (s as Space).type === "railroad" && (s as Space).ownerId === space.ownerId
      ).length;
      return 25 * Math.pow(2, n - 1);
    }
    if (space.type === "utility") {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2;
      this.setDiceDisplay(d1, d2);
      this.broadcastLog(`Utility rent dice: ${d1} + ${d2} = ${sum}.`);
      const utilOwned = this.state.board.filter(
        (s) => (s as Space).type === "utility" && (s as Space).ownerId === space.ownerId
      ).length;
      const mult = utilOwned >= 2 ? 10 : 4;
      return sum * mult;
    }
    return 0;
  }

  private handleRoll(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "waiting_to_roll") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player || player.inJail) return;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const rollSum = die1 + die2;
    const isDoubles = die1 === die2;

    this.setDiceDisplay(die1, die2);
    this.broadcastLog(`${player.name} rolled ${die1} and ${die2} (${rollSum}).`);

    if (isDoubles) {
      this.state.turnRollCount++;
      if (this.state.turnRollCount >= 3) {
        this.broadcastLog(`${player.name} rolled 3 doubles and goes to Jail!`);
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.state.pendingExtraRoll = false;
        this.landedFromDiceRoll = false;
        this.movementWasDoubles = false;
        this.endTurn();
        return;
      }
    } else {
      this.state.turnRollCount = 0;
    }

    const oldPos = player.position;
    player.position = (player.position + rollSum) % 40;
    if (player.position < oldPos && !player.inJail) {
      player.balance += 200;
      this.broadcastLog(`${player.name} passed GO and collected $200.`);
    }

    this.state.pendingExtraRoll = false;
    this.state.turnPhase = "post_move_action";
    this.landedFromDiceRoll = true;
    this.movementWasDoubles = isDoubles;
    this.evaluateSpace(player, true);
  }

  private handleJailPay(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "jail_choice") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player || !player.inJail) return;

    if (player.balance < 50) {
      this.broadcastLog(`${player.name} cannot afford $50 to leave jail.`);
      return;
    }
    player.balance -= 50;
    if (this.state.freeParkingJackpot) this.state.freeParkingPot += 50;
    player.inJail = false;
    player.jailTurns = 0;
    this.broadcastLog(`${player.name} paid $50 to leave jail.`);

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const rollSum = die1 + die2;
    this.setDiceDisplay(die1, die2);
    this.broadcastLog(`${player.name} rolled ${die1} and ${die2} (${rollSum}) after leaving jail.`);
    const oldPos = player.position;
    player.position = (player.position + rollSum) % 40;
    if (player.position < oldPos) {
      player.balance += 200;
      this.broadcastLog(`${player.name} passed GO and collected $200.`);
    }
    this.state.turnPhase = "post_move_action";
    this.landedFromDiceRoll = true;
    this.movementWasDoubles = die1 === die2;
    this.evaluateSpace(player, true);
  }

  private handleJailUseCard(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "jail_choice") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player || !player.inJail || player.getOutOfJailCards <= 0) return;

    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.broadcastLog(`${player.name} used a Get Out of Jail Free card.`);

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const rollSum = die1 + die2;
    this.setDiceDisplay(die1, die2);
    this.broadcastLog(`${player.name} rolled ${die1} and ${die2} (${rollSum}).`);
    const oldPos = player.position;
    player.position = (player.position + rollSum) % 40;
    if (player.position < oldPos) {
      player.balance += 200;
      this.broadcastLog(`${player.name} passed GO and collected $200.`);
    }
    this.state.turnPhase = "post_move_action";
    this.landedFromDiceRoll = true;
    this.movementWasDoubles = die1 === die2;
    this.evaluateSpace(player, true);
  }

  private handleJailRoll(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "jail_choice") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player || !player.inJail) return;

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const isDoubles = die1 === die2;
    this.setDiceDisplay(die1, die2);
    this.broadcastLog(`${player.name} rolled ${die1} and ${die2} for jail.`);

    if (isDoubles) {
      player.inJail = false;
      player.jailTurns = 0;
      this.state.turnRollCount = 0;
      const rollSum = die1 + die2;
      const oldPos = player.position;
      player.position = (player.position + rollSum) % 40;
      if (player.position < oldPos) {
        player.balance += 200;
        this.broadcastLog(`${player.name} passed GO and collected $200.`);
      }
      this.state.turnPhase = "post_move_action";
      this.landedFromDiceRoll = true;
      this.movementWasDoubles = true;
      this.evaluateSpace(player, true);
      return;
    }

    player.jailTurns++;
    if (player.jailTurns >= 3) {
      if (player.balance < 50) {
        this.eliminatePlayer(player.sessionId);
        return;
      }
      player.balance -= 50;
      if (this.state.freeParkingJackpot) this.state.freeParkingPot += 50;
      player.inJail = false;
      player.jailTurns = 0;
      this.broadcastLog(`${player.name} failed to roll doubles and paid $50 to leave jail.`);
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      const sum = d1 + d2;
      this.setDiceDisplay(d1, d2);
      this.broadcastLog(`${player.name} rolled ${d1} and ${d2} (${sum}).`);
      const oldPos = player.position;
      player.position = (player.position + sum) % 40;
      if (player.position < oldPos) {
        player.balance += 200;
        this.broadcastLog(`${player.name} passed GO and collected $200.`);
      }
      this.state.turnPhase = "post_move_action";
      this.landedFromDiceRoll = true;
      this.movementWasDoubles = d1 === d2;
      this.evaluateSpace(player, true);
      return;
    }

    this.broadcastLog(`${player.name} stays in jail. (${3 - player.jailTurns} tries left before paying $50)`);
    this.endTurn();
  }

  private handleBuy(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "post_move_action") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[player.position] as Space;
    if (!["property", "railroad", "utility"].includes(space.type)) return;
    if (space.ownerId !== "" || player.balance < space.price) return;

    player.balance -= space.price;
    space.ownerId = player.sessionId;
    this.broadcastLog(`${player.name} bought ${space.name} for $${space.price}.`);
    this.state.turnPhase = "property_management";
    this.tryExtraDoublesRoll(player);
  }

  private handleDeclinePurchase(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "post_move_action") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[player.position] as Space;
    if (!["property", "railroad", "utility"].includes(space.type) || space.ownerId !== "") return;

    this.startAuction(space.index, sessionId);
  }

  private startAuction(spaceIndex: number, declinedBy: string) {
    const space = this.state.board[spaceIndex] as Space;
    this.state.auctionSpaceIndex = spaceIndex;
    this.state.auctionHighBid = 0;
    this.state.auctionHighBidderId = "";
    this.state.auctionPassesSinceLastBid = 0;
    this.state.turnPhase = "auction";
    this.broadcastLog(`Auction started for ${space.name}. Minimum bid $1. Pass or bid.`);
  }

  private handleAuctionBid(sessionId: string, amount: number) {
    if (this.state.gameOver) return;
    if (this.state.turnPhase !== "auction") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player || player.isBankrupt) return;
    if (this.state.auctionSpaceIndex < 0) return;
    if (amount <= this.state.auctionHighBid || amount > player.balance) return;

    this.state.auctionHighBid = amount;
    this.state.auctionHighBidderId = sessionId;
    this.state.auctionPassesSinceLastBid = 0;
    this.broadcastLog(`${player.name} bid $${amount}.`);
  }

  private handleAuctionPass(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.turnPhase !== "auction") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player || player.isBankrupt) return;

    this.state.auctionPassesSinceLastBid++;
    this.broadcastLog(`${player.name} passes on the auction.`);

    const n = this.activePlayerIds().length;
    const high = this.state.auctionHighBid;
    if (high === 0 && this.state.auctionPassesSinceLastBid >= n) {
      this.finishAuctionUnsold();
      return;
    }
    if (high > 0 && this.state.auctionPassesSinceLastBid >= n - 1) {
      this.finishAuctionSold();
    }
  }

  private finishAuctionUnsold() {
    const idx = this.state.auctionSpaceIndex;
    const space = this.state.board[idx] as Space;
    this.broadcastLog(`No one bought ${space.name}. It remains available.`);
    this.resetAuctionState();
    this.state.turnPhase = "property_management";
    const cur = this.state.players.get(this.state.currentTurnId) as Player | undefined;
    if (cur) this.tryExtraDoublesRoll(cur);
  }

  private finishAuctionSold() {
    const idx = this.state.auctionSpaceIndex;
    const space = this.state.board[idx] as Space;
    const winnerId = this.state.auctionHighBidderId;
    const amount = this.state.auctionHighBid;
    const winner = this.state.players.get(winnerId) as Player | undefined;
    if (!winner || winner.balance < amount) {
      this.finishAuctionUnsold();
      return;
    }
    winner.balance -= amount;
    space.ownerId = winnerId;
    this.broadcastLog(`${winner.name} won ${space.name} for $${amount}.`);
    this.resetAuctionState();
    this.state.turnPhase = "property_management";
    const cur = this.state.players.get(this.state.currentTurnId) as Player | undefined;
    if (cur) this.tryExtraDoublesRoll(cur);
  }

  private resetAuctionState() {
    this.state.auctionSpaceIndex = -1;
    this.state.auctionHighBid = 0;
    this.state.auctionHighBidderId = "";
    this.state.auctionPassesSinceLastBid = 0;
  }

  private handleEndTurn(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.pendingExtraRoll) return;
    const ok =
      this.state.turnPhase === "property_management" ||
      this.state.turnPhase === "post_move_action";
    if (!ok) return;
    this.endTurn();
  }

  private handleBuildHouse(sessionId: string, spaceIndex: number) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "property_management") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[spaceIndex] as Space | undefined;
    if (!space || space.type !== "property" || space.ownerId !== sessionId) return;
    if (!this.hasMonopoly(sessionId, space.groupId)) return;
    if (space.isMortgaged) return;
    if (space.houseCount >= 5) return;

    const group = this.getGroupPropertySpaces(space.groupId);
    if (group.some((s) => s.isMortgaged)) return;
    const minH = this.minHousesInGroup(space.groupId);
    if (space.houseCount !== minH) return;

    const data = BOARD_DATA[space.index];
    const cost = data.houseCost || 0;
    if (player.balance < cost) return;

    player.balance -= cost;
    space.houseCount++;
    this.broadcastLog(`${player.name} built ${space.houseCount === 5 ? "a hotel" : "a house"} on ${space.name}.`);
  }

  private handleSellHouse(sessionId: string, spaceIndex: number) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "property_management") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[spaceIndex] as Space | undefined;
    if (!space || space.type !== "property" || space.ownerId !== sessionId) return;
    if (space.houseCount <= 0) return;

    const maxH = this.maxHousesInGroup(space.groupId);
    if (space.houseCount !== maxH) return;

    const data = BOARD_DATA[space.index];
    const half = Math.ceil((data.houseCost || 0) / 2);
    const wasHotel = space.houseCount === 5;
    space.houseCount--;
    player.balance += half;
    this.broadcastLog(
      `${player.name} sold ${wasHotel ? "a hotel" : "a house"} on ${space.name} for $${half}.`
    );
  }

  private handleMortgage(sessionId: string, spaceIndex: number) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "property_management") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[spaceIndex] as Space | undefined;
    if (!space || space.ownerId !== sessionId || space.isMortgaged) return;
    if (space.type === "property" && space.houseCount > 0) return;

    const value = Math.ceil(space.price / 2);
    space.isMortgaged = true;
    player.balance += value;
    this.broadcastLog(`${player.name} mortgaged ${space.name} for $${value}.`);
  }

  private handleUnmortgage(sessionId: string, spaceIndex: number) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "property_management") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[spaceIndex] as Space | undefined;
    if (!space || space.ownerId !== sessionId || !space.isMortgaged) return;

    const mortgageValue = Math.ceil(space.price / 2);
    const pay = Math.ceil(mortgageValue * 1.1);
    if (player.balance < pay) return;

    player.balance -= pay;
    space.isMortgaged = false;
    this.broadcastLog(`${player.name} unmortgaged ${space.name} for $${pay}.`);
  }

  private handleCollectFreeParking(sessionId: string) {
    if (this.state.gameOver) return;
    if (this.state.currentTurnId !== sessionId) return;
    if (this.state.turnPhase !== "post_move_action" && this.state.turnPhase !== "property_management") return;
    const player = this.state.players.get(sessionId) as Player | undefined;
    if (!player) return;
    const space = this.state.board[player.position] as Space;
    if (space.type !== "parking" || !this.state.freeParkingJackpot) return;

    const pot = this.state.freeParkingPot;
    if (pot <= 0) return;
    player.balance += pot;
    this.state.freeParkingPot = 0;
    this.broadcastLog(`${player.name} collected $${pot} from Free Parking.`);
  }

  private applyCard(player: Player, card: CardDef, deck: "chance" | "chest") {
    this.state.lastCardText = card.text;
    this.broadcastLog(`${deck === "chance" ? "Chance" : "Community Chest"}: ${card.text}`);

    const e = card.effect;
    switch (e.kind) {
      case "money": {
        if (e.amount >= 0) {
          player.balance += e.amount;
        } else {
          const ok = this.transferMoney(player.sessionId, null, -e.amount, { toFreeParking: true });
          if (!ok) return;
        }
        break;
      }
      case "advance_to_go":
        player.position = 0;
        player.balance += 200;
        this.broadcastLog(`${player.name} collected $200 for landing on GO.`);
        break;
      case "go_to_jail":
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.state.turnPhase = "property_management";
        this.endTurn();
        return;
      case "move_relative": {
        player.position = (player.position + e.delta + 40) % 40;
        this.evaluateSpace(player, false);
        return;
      }
      case "move_to": {
        const old = player.position;
        player.position = e.index;
        if (e.index < old || (e.index === 0 && old !== 0)) {
          player.balance += 200;
          this.broadcastLog(`${player.name} passed GO and collected $200.`);
        }
        this.evaluateSpace(player, false);
        return;
      }
      case "get_out_of_jail":
        player.getOutOfJailCards++;
        this.broadcastLog(`${player.name} keeps a Get Out of Jail Free card.`);
        break;
      case "pay_each_player": {
        const others = this.activePlayerIds().filter((id) => id !== player.sessionId);
        let total = e.amount * others.length;
        if (player.balance < total) {
          this.eliminatePlayer(player.sessionId);
          return;
        }
        for (const oid of others) {
          player.balance -= e.amount;
          const o = this.state.players.get(oid) as Player;
          o.balance += e.amount;
        }
        break;
      }
      case "collect_each_player": {
        const others = this.activePlayerIds().filter((id) => id !== player.sessionId);
        for (const oid of others) {
          const o = this.state.players.get(oid) as Player;
          if (o.balance >= e.amount) {
            o.balance -= e.amount;
            player.balance += e.amount;
          }
        }
        break;
      }
      case "pay_buildings":
      case "street_repairs": {
        const { houses, hotels } = this.countHousesHotels(player.sessionId);
        const cost = houses * e.perHouse + hotels * e.perHotel;
        if (cost > 0) {
          const ok = this.transferMoney(player.sessionId, null, cost, { toFreeParking: true });
          if (!ok) return;
        }
        break;
      }
      default:
        break;
    }

    if (this.state.turnPhase !== "game_over") {
      this.state.turnPhase = "property_management";
    }
  }

  private drawAndApplyCard(player: Player, deck: "chance" | "chest") {
    const card = deck === "chance" ? this.drawChance() : this.drawChest();
    this.applyCard(player, card, deck);
  }

  private evaluateSpace(player: Player, fromDiceRoll: boolean) {
    if (!fromDiceRoll) {
      this.landedFromDiceRoll = false;
      this.movementWasDoubles = false;
    }

    const space = this.state.board[player.position] as Space;

    if (space.type === "chance") {
      this.landedFromDiceRoll = false;
      this.movementWasDoubles = false;
      this.drawAndApplyCard(player, "chance");
      return;
    }
    if (space.type === "chest") {
      this.landedFromDiceRoll = false;
      this.movementWasDoubles = false;
      this.drawAndApplyCard(player, "chest");
      return;
    }

    if (space.type === "tax") {
      const tax = space.name === "Income Tax" ? 200 : 100;
      const ok = this.transferMoney(player.sessionId, null, tax, { toFreeParking: true });
      if (!ok) return;
      this.broadcastLog(`${player.name} paid $${tax} in taxes.`);
      this.state.turnPhase = "property_management";
      this.tryExtraDoublesRoll(player);
      return;
    }

    if (space.type === "go_to_jail") {
      player.position = 10;
      player.inJail = true;
      player.jailTurns = 0;
      this.landedFromDiceRoll = false;
      this.movementWasDoubles = false;
      this.broadcastLog(`${player.name} was sent to Jail!`);
      this.endTurn();
      return;
    }

    if (space.type === "parking") {
      this.state.turnPhase = "property_management";
      this.tryExtraDoublesRoll(player);
      return;
    }

    if (space.type === "jail") {
      this.state.turnPhase = "property_management";
      this.tryExtraDoublesRoll(player);
      return;
    }

    if (
      space.ownerId !== "" &&
      space.ownerId !== player.sessionId &&
      !space.isMortgaged
    ) {
      const owner = this.state.players.get(space.ownerId) as Player | undefined;
      if (owner && !owner.isBankrupt) {
        const rent = this.calculateRent(space);
        const ok = this.transferMoney(player.sessionId, space.ownerId, rent);
        if (!ok) return;
        this.broadcastLog(`${player.name} paid $${rent} rent to ${owner.name} for ${space.name}.`);
      }
      this.state.turnPhase = "property_management";
      this.tryExtraDoublesRoll(player);
      return;
    }

    if (
      space.ownerId === "" &&
      ["property", "railroad", "utility"].includes(space.type)
    ) {
      this.state.turnPhase = "post_move_action";
      return;
    }

    this.state.turnPhase = "property_management";
    this.tryExtraDoublesRoll(player);
  }

  private tryExtraDoublesRoll(player: Player) {
    if (!this.landedFromDiceRoll || !this.movementWasDoubles) return;
    if (this.state.turnRollCount >= 3) return;
    if (player.inJail) return;
    if (this.state.turnPhase !== "property_management") return;
    this.state.pendingExtraRoll = true;
    this.state.turnPhase = "waiting_to_roll";
    this.broadcastLog(`${player.name} rolled doubles — roll again.`);
  }

  private endTurn() {
    if (this.state.gameOver) return;

    this.state.pendingExtraRoll = false;
    this.state.turnRollCount = 0;
    this.landedFromDiceRoll = false;
    this.movementWasDoubles = false;

    const playerIds = this.activePlayerIds();
    if (playerIds.length === 0) return;
    if (playerIds.length === 1) {
      this.setWinner(playerIds[0]);
      return;
    }

    let currentIndex = playerIds.indexOf(this.state.currentTurnId);
    if (currentIndex === -1) {
      currentIndex = 0;
      this.state.currentTurnId = playerIds[0];
    }
    const nextIndex = (currentIndex + 1) % playerIds.length;
    this.state.currentTurnId = playerIds[nextIndex];
    const nextPlayer = this.state.players.get(this.state.currentTurnId) as Player;
    this.broadcastLog(`It is now ${nextPlayer.name}'s turn.`);

    if (nextPlayer.inJail) {
      this.state.turnPhase = "jail_choice";
    } else {
      this.state.turnPhase = "waiting_to_roll";
    }
  }

  onJoin(client: Client, options: { name?: string; token?: string }) {
    if (this.state.gameStarted) {
      client.leave(4000, "Game already in progress");
      return;
    }
    const player = new Player();
    player.sessionId = client.sessionId;
    player.name = options?.name || `Player ${this.state.players.size + 1}`;
    player.token = options?.token || "car";
    this.state.players.set(client.sessionId, player);
    this.broadcastLog(`${player.name} joined the game.`);
  }

  async onLeave(client: Client, consented: boolean) {
    if (!consented) {
      try {
        await this.allowReconnection(client, 45);
        return;
      } catch {
        /* reconnection window expired */
      }
    }

    const leavingId = client.sessionId;
    const player = this.state.players.get(leavingId) as Player | undefined;

    const idsBefore = this.activePlayerIds();
    const wasCurrent =
      this.state.gameStarted &&
      !this.state.gameOver &&
      this.state.currentTurnId === leavingId;

    let nextAfterLeave: Player | null = null;
    if (wasCurrent && idsBefore.length > 1) {
      const i = idsBefore.indexOf(leavingId);
      const nextId = idsBefore[(i + 1) % idsBefore.length];
      this.state.currentTurnId = nextId;
      nextAfterLeave = this.state.players.get(nextId) as Player;
      this.state.turnPhase = nextAfterLeave.inJail ? "jail_choice" : "waiting_to_roll";
      this.state.turnRollCount = 0;
      this.state.pendingExtraRoll = false;
      this.landedFromDiceRoll = false;
      this.movementWasDoubles = false;
    }

    if (player) {
      this.broadcastLog(`${player.name} left the game.`);
      this.forfeitProperties(leavingId);
      this.state.players.delete(leavingId);
    }

    if (nextAfterLeave) {
      this.broadcastLog(`It is now ${nextAfterLeave.name}'s turn.`);
    }

    if (wasCurrent && idsBefore.length <= 1) {
      this.state.currentTurnId = "";
      this.state.turnPhase = "game_over";
    }

    this.checkWinner();
  }

  startGame() {
    this.state.gameStarted = true;
    this.lock();
    this.shuffleDecks();
    const playerIds = this.activePlayerIds();
    this.state.currentTurnId = playerIds[0];
    const first = this.state.players.get(this.state.currentTurnId) as Player;
    this.state.turnPhase = first.inJail ? "jail_choice" : "waiting_to_roll";
    this.broadcastLog("The game has started!");
  }
}
