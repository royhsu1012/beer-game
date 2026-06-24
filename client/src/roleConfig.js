const ROLE_CONFIG = {
  retailer: {
    name: '零售商', nameEn: 'Retailer', color: '#3B82F6',
    orderLabel: '向批发商下单',
    victoryCondition: '总成本最低 · 缺货周数为零',
    excellentThreshold: 150,
    card: {
      description: '你经营一家啤酒零售店，直接面对消费者。每周消费者来买啤酒，你需要确保有库存。缺货会流失顾客，囤太多要付仓储费。你向批发商下单，2 周后才到货。',
      canSee: ['自己的当前库存', '积压订单(backlog)', '在途货物', '消费者本周需求量'],
      cannotSee: ['批发商的库存', '任何上游信息', '未来消费者需求'],
      tip: '前 4 周需求稳定约 4 箱。第 5 周需求会跳升，提前准备好安全库存。'
    },
    hints: [
      { week: 5, text: '⚠️ 消费者需求跳升了！重新评估你的安全库存。' },
      { week: 10, text: '📊 你的订单量是否远超实际需求？' },
      { week: 16, text: '⏰ 游戏快结束，多余库存依然要付持有成本。' }
    ]
  },
  wholesaler: {
    name: '批发商', nameEn: 'Wholesaler', color: '#10B981',
    orderLabel: '向分销商下单',
    victoryCondition: '总成本最低 · 对零售商满足率 ≥ 95%',
    excellentThreshold: 200,
    card: {
      description: '你经营批发中心，服务零售商。收到零售商订单后出货，库存不足则积压。向分销商补货，2 周才到。你看不到零售商库存，也不知道消费者真实需求。',
      canSee: ['自己的当前库存', '零售商本周订单量', '积压订单', '在途货物'],
      cannotSee: ['零售商的库存', '消费者需求', '分销商的库存'],
      tip: '零售商订单 ≠ 消费者真实需求。他们可能在恐慌性过度下单。'
    },
    hints: [
      { week: 5, text: '零售商订单增加了？先观察一周，别立刻大量补货。' },
      { week: 8, text: '⚠️ 你的订单量是零售商的几倍？这就是牛鞭效应。' },
      { week: 15, text: '库存过多可减少下单，让管道里的货先消化。' }
    ]
  },
  distributor: {
    name: '分销商', nameEn: 'Distributor', color: '#F59E0B',
    orderLabel: '向制造商下单',
    victoryCondition: '总成本最低 · 订单波动比批发商小',
    excellentThreshold: 250,
    card: {
      description: '你管理区域配送中心，连接工厂与批发商。你的订单经过两层转手，波动已被放大。向制造商下单，2 周后到货。完全不知道零售商或消费者的状况。',
      canSee: ['自己的当前库存', '批发商本周订单量', '积压订单', '在途货物'],
      cannotSee: ['批发商的库存', '零售商的一切', '消费者需求'],
      tip: '尝试平滑你的下单量，而非跟着批发商的波动走。设定目标库存水位。'
    },
    hints: [
      { week: 5, text: '批发商订单波动？设定目标库存：目标-现有+本周出货=下单量。' },
      { week: 10, text: '你能成为供应链的稳定器吗？让你的订单比批发商更平稳。' },
      { week: 15, text: '最后五周，维持稳定下单节奏，避免库存积压。' }
    ]
  },
  manufacturer: {
    name: '制造商', nameEn: 'Manufacturer', color: '#EF4444',
    orderLabel: '下达生产指令',
    victoryCondition: '总成本最低 · 生产量变动最小',
    excellentThreshold: 300,
    card: {
      description: '你是啤酒工厂生产经理。你不向上游订货，而是决定每周生产多少箱。生产指令下达后 2 周完工入库。你是供应链源头，但看不到任何下游状况。',
      canSee: ['成品库存', '分销商本周订单量', '生产线上的数量(2周后完工)', '积压订单'],
      cannotSee: ['分销商的库存', '更下游的一切', '消费者需求'],
      tip: '牛鞭效应在你这里感受最强烈。维持平稳生产比大增大减更有效。'
    },
    hints: [
      { week: 5, text: '分销商订单跳了？先看：你手上有多少库存和在产的货？' },
      { week: 10, text: '检查你的生产量曲线。是否剧烈波动？平稳生产是关键。' },
      { week: 15, text: '⚠️ 游戏快结束，大量增产会在第20周变成高持有成本。' }
    ]
  }
}
export default ROLE_CONFIG
