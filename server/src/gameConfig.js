const GAME_CONFIG = {
  TOTAL_WEEKS: 20,
  LEAD_TIME: 2,
  INITIAL_INVENTORY: 12,
  INITIAL_PIPELINE: [4, 4],
  HOLDING_COST: 0.50,
  SHORTAGE_COST: 1.00,
  ROUND_TIME_SECONDS: 60,
  ROLES: ['retailer', 'wholesaler', 'distributor', 'manufacturer'],
  DEMAND_CURVE: [4,4,4,4,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8],
  EXCELLENT_THRESHOLD: {
    retailer: 150,
    wholesaler: 200,
    distributor: 250,
    manufacturer: 300,
    team: 700
  }
}
module.exports = GAME_CONFIG
