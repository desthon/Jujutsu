

'use strict';

/* ============================================================
   咒术回战模拟器 · 重构版 —— 核心逻辑
   ============================================================ */

const STATS = ['ce', 'ctrl', 'eff', 'vit', 'tai', 'iq'];
const MAX_LEVEL = 130;
const AGE_LIMIT = 120;
const STAT_NAMES = {
  ce: '咒力总量', ctrl: '咒力操控', eff: '咒力效率',
  vit: '体质', tai: '体术', iq: '战斗智商'
};

const TALENT_FINAL_CAP = [105, 110, 114, 118, 122, 126, 130, 133, 136, 140];
const TIERS = [
  { i: 1,  name: 'F',   w: 33, grow: 0.55, cap: 62 },
  { i: 2,  name: 'E',   w: 25, grow: 0.65, cap: 68 },
  { i: 3,  name: 'D',   w: 11, grow: 0.75, cap: 74 },
  { i: 4,  name: 'C',   w: 9,  grow: 0.85, cap: 80 },
  { i: 5,  name: 'B',   w: 7,  grow: 0.95, cap: 86 },
  { i: 6,  name: 'A',   w: 5,  grow: 1.05, cap: 91 },
  { i: 7,  name: 'S',   w: 4,  grow: 1.15, cap: 95 },
  { i: 8,  name: 'SS',  w: 3,  grow: 1.25, cap: 98 },
  { i: 9,  name: 'SSS', w: 2,  grow: 1.35, cap: 100 },
  { i: 10, name: 'EX',  w: 1,  grow: 1.50, cap: 100 }
];

const BENCH = [
  { min: 1,  max: 9,   grade: '四级咒术师', who: '伊地知洁高' },
  { min: 10, max: 19,  grade: '三级咒术师', who: '吉野顺平' },
  { min: 20, max: 29,  grade: '二级咒术师', who: '伏黑惠（少年院）' },
  { min: 30, max: 39,  grade: '准一级咒术师', who: '七海建人' },
  { min: 40, max: 49,  grade: '一级咒术师', who: '禅院真希' },
  { min: 50, max: 59,  grade: '一级·上位', who: '虎杖悠仁' },
  { min: 60, max: 69,  grade: '准特级', who: '夏油杰（怀玉）' },
  { min: 70, max: 79,  grade: '特级', who: '乙骨忧太' },
  { min: 80, max: 89,  grade: '特级·巅峰', who: '夏油杰（百鬼夜行）' },
  { min: 90, max: 94,  grade: '特级·极限', who: '乙骨忧太（新宿）' },
  { min: 95, max: 99,  grade: '诅咒之王', who: '两面宿傩' },
  { min: 100, max: 106, grade: '现代最强', who: '五条悟' },
  { min: 107, max: 113, grade: '现代最强·六眼全开', who: '五条悟' },
  { min: 114, max: 120, grade: '超越者', who: '你' },
  { min: 121, max: 130, grade: '新世界之神', who: '你' }
];

const CONS = {
  none: {
    name: '普通术师', w: 31,
    desc: '没有特殊体质，六维成长均衡。',
    mods: {}, tag: ''
  },
  multi: {
    name: '多术式体质', w: 6,
    desc: '生得术式不止一种。开局额外获得一门生得术式，第二术式的咒力消耗 +15%。',
    mods: { ctrl: 8, eff: 8, iq: 4 }, tag: '多术式'
  },
  sixEyes: {
    name: '六眼', w: 8,
    desc: '咒力效率与操控大幅提升，术式消耗降低；持无下限时解锁「茈」。',
    mods: { ce: 4, ctrl: 10, eff: 16, iq: 6 }, tag: '六眼'
  },
  heavenly: {
    name: '天与咒缚', w: 10,
    desc: '咒力为零，无法使用术式与反转术式；体质与体术翻倍，免疫领域必中，改用咒具出招。',
    mods: {}, tag: '天与'
  },
  star: {
    name: '星浆体', w: 12,
    desc: '生命与反转术式强化，每回合自动回复少量生命。',
    mods: { vit: 12, eff: 6 }, tag: '星浆'
  },
  curse: {
    name: '咒灵体质', w: 14,
    desc: '生命与回复提升，但反转术式效果减半。',
    mods: { vit: 16, ce: 8 }, tag: '咒灵'
  },
  vessel: {
    name: '宿傩容器', w: 12,
    desc: '对宿傩伤害提升，每场战斗一次免死。',
    mods: { vit: 10, ce: 10 }, tag: '容器'
  },
  ninePhases: {
    name: '九相图', w: 7,
    desc: '半人半咒灵的九相图体质。生得术式固定为赤血操术，初始只觉醒「穿血」；专属事件「九相图」会逐步唤醒超新星、赤血之铠与血星磊。',
    mods: { ce: 6, ctrl: 6, vit: 12, tai: 4 }, tag: '九相'
  }
};

/* ---------------- 术式 ---------------- */

const TECHS = {
  limitless: {
    name: '无下限咒术', req: 8, domain: '无量空处',
    focus: { ce: 1.2, ctrl: 1.4, eff: 1.5, vit: .7, tai: .6, iq: 1.0 },
    desc: '把「无限」具现化。没有六眼时，每一步都昂贵得可怕。',
    passive: 'sixeyes',
    moves: [
      { id: 'blue', name: '术式顺转·苍', cost: 35, kind: 'atk', power: 2.1, ignore: .2, resistCut: .06, debuff: { atk: .1, turns: 2 }, desc: '引力吸附，削弱敌方攻击并撕开 6% 伤害抗性。' },
      { id: 'red', name: '术式反转·赫', cost: 50, kind: 'atk', power: 3.1, desc: '斥力轰击，最简单的高伤。' },
      { id: 'infinity', name: '无下限', cost: 18, kind: 'def', shield: .75, ceGain: 8, desc: '本回合伤害降低 75%。' },
      { id: 'purple', name: '虚式「茈」', cost: 90, kind: 'atk', power: 6.4, ignore: .5, resistCut: .16, req: 'sixeyes', cd: 3, desc: '苍与赫的融合，湮灭 16% 伤害抗性。需六眼。' },
      { id: 'muryo', name: '领域展开·无量空处', cost: 150, kind: 'domain', power: 1.7, req: 'domain', desc: '四回合必中增伤，并让宿傩停止一回合；结束后熔断。' }
    ]
  },
  shrine: {
    name: '御厨子', req: 9, domain: '伏魔御厨子',
    focus: { ce: 1.1, ctrl: 1.0, eff: 1.0, vit: 1.0, tai: 1.3, iq: 1.2 },
    desc: '斩击与火焰的术式。对流血目标伤害更高。',
    passive: 'bleed',
    moves: [
      { id: 'dismantle', name: '解', cost: 20, kind: 'atk', power: 1.8, ignore: .3, desc: '无形斩击，无视部分防御。' },
      { id: 'cleave', name: '捌', cost: 30, kind: 'atk', power: 2.2, bleed: 2, desc: '连续斩击，造成流血。' },
      { id: 'dismantle3', name: '解·三连', cost: 45, kind: 'atk', power: .85, hits: 3, bleed: 1, desc: '三段斩击，叠加流血。' },
      { id: 'kamino', name: '火焰·竈', cost: 60, kind: 'atk', power: 3.3, burn: 2, cd: 2, desc: '点燃目标，持续灼烧。' },
      { id: 'fukuma', name: '领域展开·伏魔御厨子', cost: 150, kind: 'domain', power: 1.9, bleed: 2, req: 'domain', desc: '四回合必中增伤，斩击持续撕裂；结束后熔断。' }
    ]
  },
  tenShadows: {
    name: '十种影法术', req: 4, domain: '嵌合暗翳庭',
    focus: { ce: 1.1, ctrl: 1.2, eff: 1.0, vit: 1.1, tai: .9, iq: 1.1 },
    desc: '以影子召唤式神。生命低于 35% 时，魔虚罗会自行现身一次。',
    passive: 'mahoraga',
    moves: [
      { id: 'dogs', name: '玉犬', cost: 25, kind: 'atk', power: 1.0, hits: 2, desc: '双犬夹击。' },
      { id: 'nue', name: '鵺', cost: 35, kind: 'atk', power: 1.9, dodgeDown: .2, desc: '雷击并使目标难以闪避。' },
      { id: 'elephant', name: '满象', cost: 50, kind: 'atk', power: 2.6, ignore: .2, desc: '巨象冲撞。' },
      { id: 'sword', name: '八握剑', cost: 70, kind: 'atk', power: 3.6, crit: .15, desc: '高伤斩击，易出暴击。' },
      { id: 'chimera', name: '领域展开·嵌合暗翳庭', cost: 140, kind: 'domain', power: 1.7, req: 'domain', desc: '四回合必中增伤，影子持续侵蚀；结束后熔断。' }
    ]
  },
  spiritManip: {
    name: '咒灵操术', req: 7, domain: null,
    focus: { ce: 1.2, ctrl: 1.2, eff: 1.1, vit: .9, tai: .8, iq: 1.1 },
    desc: '驱使收服的咒灵。开局携带 3 只咒灵，攻击时消耗 1 只增伤 30%。',
    passive: 'spirits',
    moves: [
      { id: 'release', name: '咒灵放出', cost: 20, kind: 'atk', power: 1.1, hits: 2, desc: '放出低级咒灵撕咬。' },
      { id: 'grade1', name: '准一级咒灵', cost: 45, kind: 'atk', power: 2.5, desc: '准一级咒灵全力一击。' },
      { id: 'uzumaki', name: '极之番「漩涡」', cost: 80, kind: 'atk', power: 4.6, ignore: .3, extraDmg: .10, cd: 2, desc: '将所有咒灵熔为一击，额外伤害 +10%。' },
      { id: 'armor', name: '咒灵铠', cost: 25, kind: 'def', shield: .5, buff: { def: .2, turns: 2 }, desc: '咒灵覆体，减伤并提升防御。' }
    ]
  },
  idleTransfig: {
    name: '无为转变', req: 6, domain: '自闭圆顿裹',
    focus: { ce: 1.1, ctrl: 1.3, eff: 1.2, vit: 1.0, tai: .8, iq: 1.0 },
    desc: '触碰灵魂，无视防御。代价是自身防御下降。',
    passive: 'soul',
    moves: [
      { id: 'touch', name: '灵魂触碰', cost: 25, kind: 'atk', power: 1.7, ignore: 1, resistCut: .12, desc: '直接作用于灵魂，无视部分伤害抗性。' },
      { id: 'multi', name: '多重魂', cost: 40, kind: 'atk', power: .95, hits: 2, ignore: 1, desc: '多道灵魂同时改写。' },
      { id: 'body', name: '遍杀即灵体', cost: 75, kind: 'atk', power: 3.6, ignore: 1, extraDmg: .10, selfDef: .2, desc: '舍弃防御的全力一击，额外伤害 +10%。' },
      { id: 'reshape', name: '无为转变·改造', cost: 30, kind: 'heal', healBase: 40, healCtrl: 3, healEff: 2, desc: '改造自身肉体，回复生命。' },
      { id: 'domain', name: '领域展开·自闭圆顿裹', cost: 150, kind: 'domain', power: 1.8, req: 'domain', desc: '四回合必中增伤，触碰即死；结束后熔断。' }
    ]
  },
  bloodManip: {
    name: '赤血操术', req: 1, domain: null,
    focus: { ce: 1.0, ctrl: 1.2, eff: 1.1, vit: 1.2, tai: 1.2, iq: .8 },
    desc: '以血为刃。部分招式消耗生命，攻击附带吸血。',
    passive: 'blood',
    moves: [
      { id: 'pierce', name: '穿血', cost: 15, hpCost: .03, kind: 'atk', power: 2.0, lifesteal: .15, bloodStage: 1, desc: '高压血柱贯穿。' },
      { id: 'supernova', name: '超新星', cost: 30, hpCost: .06, kind: 'atk', power: 1.4, hits: 2, lifesteal: .15, bloodStage: 2, desc: '血滴引爆，两段伤害。' },
      { id: 'bloodArmor', name: '赤血操术·铠', cost: 25, kind: 'def', shield: .5, buff: { def: .15, turns: 2 }, bloodStage: 2, desc: '血液凝固成甲。' },
      { id: 'convergence', name: '血星磊', cost: 50, hpCost: .1, kind: 'atk', power: 4.2, ignore: .2, extraDmg: .12, lifesteal: .2, bloodStage: 3, desc: '全部血液压缩后的重击，额外伤害 +12%。' }
    ]
  },
  murderLight: {
    name: '杀意之光', req: 10, domain: '杀意光庭',
    focus: { ce: 1.1, ctrl: 1.1, eff: 1.2, vit: .9, tai: 1.0, iq: 1.1 },
    desc: '达布拉·卡拉巴的术式：把杀意与质量赋予光本身，让光成为可站立、可贯穿、可粉碎的武器；反转后化为吞噬一切的暗。',
    passive: 'light',
    moves: [
      { id: 'lightPillar', name: '杀意之光·光柱', cost: 24, kind: 'atk', power: 2.15, ignore: .35, extraDmg: .06, crit: .06, desc: '压缩的杀意光柱，瞬间贯穿目标并提高额外伤害。' },
      { id: 'lightRain', name: '杀意之光·光雨', cost: 42, kind: 'atk', power: .82, hits: 4, ignore: .18, desc: '赋予光质量后洒落，四段贯穿。' },
      { id: 'killingMass', name: '杀意赋予', cost: 34, kind: 'atk', power: 2.1, ignore: .2, stun: 1, resistDown: .06, resistDownTurns: 2, debuff: { atk: .12, turns: 2 }, desc: '把杀意压进光里，令宿傩失衡、攻击与伤害抗性下降。' },
      { id: 'sublight', name: '亚光速', cost: 30, kind: 'atk', power: 1.15, buff: { atk: .25, extraDmg: .15, turns: 2 }, dodgeDown: .15, desc: '以光速逼近后重击，提升下一击攻击与额外伤害。' },
      { id: 'lightDomain', name: '领域展开·杀意光庭', cost: 150, kind: 'domain', power: 1.95, req: 'domain', desc: '四回合必中增伤；光庭内每一束光都带着杀意；结束后熔断。' }
    ]
  },
  iceFormation: {
    name: '冰凝咒法', req: 5, domain: null,
    focus: { ce: 1.2, ctrl: 1.2, eff: 1.2, vit: .9, tai: .8, iq: 1.0 },
    desc: '冻结咒力。对冻结目标伤害提升 25%。',
    passive: 'freeze',
    moves: [
      { id: 'shards', name: '冰砾', cost: 20, kind: 'atk', power: 1.6, freeze: 1, desc: '冰锥射击，短暂冻结。' },
      { id: 'frost', name: '霜凪', cost: 35, kind: 'atk', power: 2.3, freeze: 1, desc: '寒气蔓延。' },
      { id: 'falls', name: '直瀑', cost: 55, kind: 'atk', power: 3.3, freeze: 1, desc: '冰瀑倾泻。' },
      { id: 'absolute', name: '冰凝·极', cost: 75, kind: 'atk', power: 4.2, freeze: 2, extraDmg: .15, cd: 3, desc: '绝对零度，冻结两回合并造成额外伤害。' }
    ]
  },
  projection: {
    name: '投射咒法', req: 4, domain: null,
    focus: { ce: 1.0, ctrl: 1.1, eff: 1.1, vit: 1.1, tai: 1.4, iq: .9 },
    desc: '把动作拆成 24 帧。每第三回合，攻击额外增加一段。',
    passive: 'frames',
    moves: [
      { id: 'frames24', name: '24 帧', cost: 20, kind: 'atk', power: 1.5, buff: { dodge: .2, turns: 1 }, desc: '高速移动中的打击。' },
      { id: 'project', name: '投射', cost: 30, kind: 'atk', power: 2.1, desc: '预判落点的直线突击。' },
      { id: 'blink', name: '瞬间移动', cost: 25, kind: 'def', shield: .6, buff: { dodge: .25, turns: 2 }, desc: '脱离帧序列，极难命中。' },
      { id: 'barrage', name: '超高速连打', cost: 45, kind: 'atk', power: .65, hits: 4, desc: '四段高速连击。' }
    ]
  },
  ratio: {
    name: '十划咒法', req: 1, domain: null,
    focus: { ce: 1.0, ctrl: 1.1, eff: 1.1, vit: 1.0, tai: 1.3, iq: 1.2 },
    desc: '在 7:3 处制造弱点。暴击伤害提升至 2.2 倍。',
    passive: 'ratio',
    moves: [
      { id: 'seven3', name: '7:3', cost: 20, kind: 'atk', power: 2.0, ignore: .4, resistCut: .12, crit: .2, desc: '强制命中弱点，并削开 12% 伤害抗性。' },
      { id: 'collapse', name: '瓦落瓦落', cost: 40, kind: 'atk', power: 2.9, crit: .15, desc: '连续敲击同一弱点。' },
      { id: 'blackFlash', name: '黑闪', cost: 50, kind: 'atk', power: 3.6, crit: .35, extraDmg: .20, resistCut: .10, cd: 2, desc: '咒力迟滞 0.000001 秒，额外伤害 +20% 并削抗。' }
    ]
  },
  cursedSpeech: {
    name: '咒言', req: 3, domain: null,
    focus: { ce: 1.1, ctrl: 1.3, eff: 1.2, vit: .9, tai: .8, iq: 1.2 },
    desc: '以语言强制命令。连续使用会损伤喉咙。',
    passive: 'recoil',
    moves: [
      { id: 'stop', name: '「不要动」', cost: 25, kind: 'atk', power: .6, stun: 1, desc: '命令对方停止行动。' },
      { id: 'burst', name: '「爆碎」', cost: 40, kind: 'atk', power: 2.6, resistCut: .08, desc: '命令目标崩解，削减 8% 伤害抗性。' },
      { id: 'sleep', name: '「睡吧」', cost: 35, kind: 'atk', power: .4, stun: 1, debuff: { atk: .15, turns: 2 }, desc: '强制入睡并削弱。' },
      { id: 'die', name: '「去死」', cost: 70, kind: 'atk', power: 4.6, extraDmg: .18, selfDmg: .08, cd: 2, desc: '最强的命令，额外伤害 +18%，反噬自身。' }
    ]
  },
  boogieWoogie: {
    name: '不义游戏', req: 1, domain: null,
    focus: { ce: 1.0, ctrl: 1.1, eff: 1.0, vit: 1.2, tai: 1.4, iq: 1.1 },
    desc: '拍手即交换。每第三回合自动回避一次攻击并反击。',
    passive: 'swap',
    moves: [
      { id: 'clap', name: '拍手', cost: 10, kind: 'def', evade: 1, ceGain: 10, desc: '下一次攻击必定回避。' },
      { id: 'swap', name: '交换位置', cost: 15, kind: 'def', buff: { dodge: .25, turns: 2 }, ceGain: 8, desc: '打乱对方节奏。' },
      { id: 'counter', name: '反击', cost: 25, kind: 'atk', power: 1.2, counter: .6, desc: '把上一击的力量还回去。' },
      { id: 'flurry', name: '乱拍', cost: 45, kind: 'atk', power: .85, hits: 3, dodgeDown: .25, desc: '连续交换位置中的乱打。' }
    ]
  },
  construction: {
    name: '构筑术式', req: 1, domain: null,
    focus: { ce: 1.0, ctrl: 1.1, eff: 1.1, vit: 1.0, tai: 1.0, iq: 1.4 },
    desc: '以咒力构筑武器。伤害与护盾随战斗智商提升。',
    passive: 'iq',
    moves: [
      { id: 'spear', name: '构筑·枪', cost: 20, kind: 'atk', power: 1.8, ignore: .2, desc: '瞬间成形的长枪。' },
      { id: 'shield', name: '构筑·盾', cost: 25, kind: 'def', shield: .55, desc: '咒力结晶护盾。' },
      { id: 'blade', name: '构筑·剑', cost: 40, kind: 'atk', power: 2.8, crit: .1, desc: '高密度咒力刃。' },
      { id: 'cannon', name: '构筑·炮', cost: 60, kind: 'atk', power: 3.7, extraDmg: .10, desc: '一次性重火力，额外伤害 +10%。' }
    ]
  },
  blackBird: {
    name: '黑鸟操术', req: 1, domain: null,
    focus: { ce: 1.1, ctrl: 1.2, eff: 1.2, vit: .9, tai: 1.1, iq: 1.0 },
    desc: '操纵黑鸟群。多段攻击，暴击率高。',
    passive: 'birds',
    moves: [
      { id: 'flock', name: '鸟群', cost: 15, kind: 'atk', power: .6, hits: 3, desc: '三只黑鸟轮番冲击。' },
      { id: 'dive', name: '黑鸟·突击', cost: 30, kind: 'atk', power: 2.0, sure: true, desc: '锁定目标，必然命中。' },
      { id: 'kamikaze', name: '神风', cost: 55, kind: 'atk', power: 3.5, ignore: .3, extraDmg: .12, desc: '鸟群自爆式撞击，额外伤害 +12%。' }
    ]
  },
  copy: {
    name: '术式复制', req: 8, domain: null,
    focus: { ce: 1.2, ctrl: 1.2, eff: 1.1, vit: 1.0, tai: 1.0, iq: 1.0 },
    desc: '复制他人的术式。开局随机复制两个招式。',
    passive: 'copy',
    moves: [
      { id: 'rika', name: '里香', cost: 30, kind: 'def', shield: .35, buff: { atk: .25, turns: 3 }, desc: '特级过咒怨灵显现，攻击大幅提升。' },
      { id: 'copySlash', name: '复制·斩', cost: 30, kind: 'atk', power: 2.3, desc: '复制来的斩击。' },
      { id: 'copyArt', name: '复制·术', cost: 50, kind: 'special', exec: 'copyArt', power: 2.6, desc: '随机释放一个已复制的术式。' },
      { id: 'trueCopy', name: '真·复制', cost: 80, kind: 'special', exec: 'trueCopy', power: 3.6, extraDmg: .10, cd: 2, desc: '复刻宿傩上一招，以 1.5 倍返还并提高额外伤害。' }
    ]
  },
  heavenly: {
    name: '天与咒缚·咒具', req: 1, domain: null,
    focus: { ce: 0, ctrl: 0, eff: 0, vit: 2.2, tai: 2.2, iq: 1.0 },
    desc: '没有咒力，只有被诅咒的肉体。咒具与体术就是全部。',
    passive: 'heavenly',
    moves: [
      { id: 'soulKatana', name: '释魂刀', cost: 0, kind: 'atk', power: 2.3, ignore: .6, desc: '斩断灵魂的咒具。' },
      { id: 'cloud', name: '游云', cost: 0, kind: 'atk', power: .9, hits: 3, desc: '三节棍连击。' },
      { id: 'chain', name: '万里锁', cost: 0, kind: 'atk', power: 1.4, stun: 1, desc: '锁链束缚，令目标停止一回合。' },
      { id: 'rush', name: '体术·连击', cost: 0, kind: 'atk', power: 1.9, desc: '纯粹的肉体打击。' },
      { id: 'slay', name: '斩魂', cost: 0, kind: 'atk', power: 3.6, ignore: .7, cd: 2, desc: '瞄准灵魂的一闪。' }
    ]
  }
};

const DOMAIN_FX = {
  '无量空处': {
    title: '信息过载',
    desc: '四回合必中增伤；展开时宿傩停滞一回合，领域内宿傩攻击 -12%。',
    activate: { stun: 1 },
    activateLog: '无量空处的信息洪流灌入宿傩的感知，他的四只手同时慢了半拍。',
    turn: { aura: .9, enemyAtkDebuff: .12, log: '信息洪流持续冲刷宿傩的神经。' }
  },
  '伏魔御厨子': {
    title: '斩击厨床',
    desc: '四回合必中增伤；每回合附加 1 层流血、削减 3% 伤害抗性，领域侵蚀提高 15%。',
    turn: { aura: 1.15, bleed: 1, resistDown: .03, log: '无形的斩击在结界里反复落下。' }
  },
  '嵌合暗翳庭': {
    title: '影之掩护',
    desc: '四回合必中增伤；展开时闪避 +12%，每回合获得 12% 减伤。',
    activate: { evade: .12 },
    turn: { aura: 1, shield: .12, log: '影子替你吞掉了一部分攻击。' }
  },
  '自闭圆顿裹': {
    title: '触碰即死',
    desc: '四回合必中增伤；展开时削抗 10%；宿傩生命低于 35% 时，领域侵蚀提高至 2.4 倍。',
    activate: { resistDown: .10 },
    turn: { aura: .85, lowHp: .35, lowAura: 2.4, log: '结界在残血处收得更紧。' }
  },
  '杀意光庭': {
    title: '杀意增幅',
    desc: '四回合必中增伤；展开时攻击 +20%、额外伤害 +15%，领域侵蚀提高 25%。',
    activate: { atk: .2, extraDmg: .15 },
    turn: { aura: 1.25, extraDmg: .03, log: '每一束光都带着更锋利的杀意。' }
  },
  '胎藏遍野': {
    title: '咒灵群袭',
    desc: '四回合必中增伤；展开时获得 1 只咒灵，每回合 3 段侵蚀并回复咒力。',
    activate: { spirits: 1 },
    turn: { aura: .62, hits: 3, ce: 8, log: '胎藏中的咒灵成群扑向宿傩。' }
  },
  '赤血苑囿': {
    title: '血液回流',
    desc: '四回合必中增伤；展开时回复 8% 生命，每回合回复 2.5% 生命。',
    activate: { heal: .08 },
    turn: { aura: 1, heal: .025, log: '赤血在结界里回流，修补你的伤口。' }
  },
  '万古冰狱': {
    title: '绝对零度',
    desc: '四回合必中增伤；展开时冻结宿傩 1 回合，每回合 30% 概率再次冻结。',
    activate: { freeze: 1 },
    turn: { aura: .8, freezeChance: .3, log: '冰狱的寒气仍在封冻宿傩的动作。' }
  },
  '时隙回廊': {
    title: '帧间回廊',
    desc: '四回合必中增伤；展开时所有冷却 -1，每回合再 -1、获得 10% 闪避并穿抗 4%。',
    activate: { cd: 1 },
    turn: { aura: .9, cd: 1, evade: .1, resistPen: .04, log: '时隙被拉长，你的动作快过了这一帧。' }
  },
  '七三裁定所': {
    title: '七三裁定',
    desc: '四回合必中增伤；展开时宿傩防御 -25%、伤害抗性 -12%，领域侵蚀提高 35% 并持续削抗。',
    activate: { defDebuff: .25, resistDown: .12 },
    turn: { aura: 1.35, resistDown: .03, log: '七三的界线在结界里被重新划定。' }
  },
  '万籁俱寂': {
    title: '禁言',
    desc: '四回合必中增伤；展开时宿傩攻击 -20%，领域内攻击再 -20%。',
    activate: { atkDebuff: .2 },
    turn: { aura: .75, enemyAtkDebuff: .2, log: '没有声音，宿傩的咒词被吞进寂静。' }
  },
  '虚位拍手': {
    title: '拍手换位',
    desc: '四回合必中增伤；展开时宿傩停滞一回合，每回合 20% 概率再次停滞。',
    activate: { stun: 1 },
    turn: { aura: .85, stunChance: .2, log: '拍手声在结界里错位，宿傩失去了目标。' }
  },
  '万象工房': {
    title: '即时构筑',
    desc: '四回合必中增伤；展开时获得 35% 减伤，每回合再获得 18% 减伤。',
    activate: { shield: .35 },
    turn: { aura: 1, shield: .18, log: '工房在结界里临时筑起新的掩体。' }
  },
  '暮鸦天幕': {
    title: '群鸦噬日',
    desc: '四回合必中增伤；展开时施加 2 层流血，每回合 3 段侵蚀。',
    activate: { bleed: 2 },
    turn: { aura: .55, hits: 3, log: '暮鸦分成三群，从不同方向啄食宿傩。' }
  },
  '万法归藏': {
    title: '万法回响',
    desc: '四回合必中增伤；展开时回复 25 点咒力，每回合回复 6 点咒力并穿抗 5%。',
    activate: { ce: 25 },
    turn: { aura: 1.05, ce: 6, resistPen: .05, log: '被复制的术式在藏中回响，咒力重新汇聚。' }
  },
  '无咒·天与牢': {
    title: '咒力真空',
    desc: '四回合必中增伤；展开时获得 30% 减伤，领域内宿傩攻击 -15%。',
    activate: { shield: .3 },
    turn: { aura: 1, shield: .15, enemyAtkDebuff: .15, log: '咒力被抽空，宿傩只能凭肉体硬撑。' }
  }
};

const DEFAULT_DOMAIN_FX = {
  title: '领域侵蚀',
  desc: '四回合必中增伤；领域结束后进入术式熔断。',
  activate: {},
  turn: { aura: 1 }
};

function domainFxFor(run, mv) {
  const raw = mv && typeof mv.name === 'string' ? mv.name.replace(/^领域展开·/, '') : '';
  const key = raw || (run && run.domainName) || (run && run.techName) || '';
  return DOMAIN_FX[key] || DEFAULT_DOMAIN_FX;
}

const UNIVERSAL = [
  { id: 'basic', name: '普通攻击', cost: 0, kind: 'atk', power: 1.0, desc: '不消耗咒力的体术攻击。' },
  { id: 'guard', name: '防御', cost: 0, kind: 'def', shield: .6, ceGain: 14, desc: '本回合伤害降低 60%，回复少量咒力。' },
  { id: 'dodge', name: '闪避', cost: 0, kind: 'def', evade: .55, ceGain: 5, desc: '赌一次闪避，成功则完全免伤。' },
  { id: 'breath', name: '调息', cost: 0, kind: 'rest', ceGain: 45, desc: '不攻击，集中恢复咒力。' },
  { id: 'spaceGuard', name: '空间抗性', cost: 35, kind: 'def', body: true, spaceOnly: true, spaceGuard: 1, evade: .35, desc: '仅在空间斩「世界」预警时可用：抵消必中，闪避率 +35%，本次空间斩伤害降低 80%。' }
];

const RCT_MOVE = {
  id: 'rct', name: '反转术式', cost: 85, kind: 'heal', cd: 2,
  healBase: 40, healCtrl: 2.8, healEff: 1.8,
  desc: '以反转术式治愈肉体，清除流血。冷却 2 回合；咒灵体质效果减半。'
};

const BURNOUT_FIX_MOVE = {
  id: 'burnoutFix', name: '修复熔断', cost: 20, kind: 'repair',
  desc: '修补术式回路，将熔断压缩到 1 回合；拥有「领域余响」时下一回合立刻结束熔断。只能在熔断中使用。'
};

const VOWS = [
  { id: 'noDodge', name: '不闪不避', desc: '本回合受伤 +50%，下一次攻击伤害 ×2.2。' },
  { id: 'seal', name: '术式封印', desc: '封印一个随机术式，永久攻击 +25%。' },
  { id: 'life', name: '以命换力', desc: '消耗 20% 当前生命，回满咒力；下一次攻击必中且暴击。' },
  { id: 'name', name: '真名束缚', desc: '本场咒力消耗 -40%，防御 -25%。' },
  { id: 'allIn', name: '孤注一掷', desc: '当前生命降至 55%，下一次攻击伤害 ×2.8，且必中、暴击。' },
  { id: 'ironBody', name: '铁身', desc: '本场无法闪避；防御永久 +30%，攻击永久 -12%。' },
  { id: 'bloodPact', name: '血契', desc: '生命上限永久 -15%，攻击永久 +30%。' },
  { id: 'lastStand', name: '受身', desc: '回复 20% 最大生命，本回合受到的伤害 -45%。' }
];

const MASTERY_TIERS = [300, 600, 900];
const MASTERY_LINES = {
  limitless: '无下限的轨迹被压缩到最短，苍与赫的消耗下降。',
  shrine: '斩击的间隙被你算尽，解与捌的轨迹更短。',
  tenShadows: '影子的轮廓更清晰，式神的行动更服从你的意志。',
  spiritManip: '咒灵的层级在你眼中重排，漩涡更凝练。',
  idleTransfig: '灵魂的触感变得精确，改造自身时损耗更低。',
  bloodManip: '血液的流速与压力被你重新计算，赤血更锋利。',
  murderLight: '光的质量与杀意被你重新称量，白昼也会成为凶器。',
  iceFormation: '冰晶的生成更快，霜层更薄却更坚硬。',
  projection: '分身的落点更准，突进的距离更短。',
  ratio: '七三分的界线更清晰，弱点更容易被切中。',
  cursedSpeech: '咒言的余韵更长，命令更难被抵抗。',
  boogieWoogie: '拍手的落点更隐蔽，换位更难被预判。',
  construction: '构造的咒力损耗下降，成品更稳定。',
  blackBird: '黑鸟的影子更安静，俯冲更突然。',
  copy: '复制来的术式残影更完整，发动更快。',
  heavenly: '咒具与肉体的界限消失，挥击更省力。'
};

const AWAKEN_PATHS = {
  limitless: ['reverse', 'domain', 'amplify', 'maximum', 'expand'],
  shrine: ['domain', 'reverse', 'maximum', 'expand', 'amplify'],
  tenShadows: ['domain', 'reverse', 'maximum', 'amplify', 'expand'],
  spiritManip: ['domain', 'reverse', 'expand', 'maximum', 'amplify'],
  idleTransfig: ['domain', 'reverse', 'maximum', 'expand', 'amplify'],
  bloodManip: ['reverse', 'domain', 'maximum', 'expand', 'amplify'],
  murderLight: ['reverse', 'domain', 'maximum', 'expand', 'amplify'],
  iceFormation: ['reverse', 'domain', 'expand', 'maximum', 'amplify'],
  projection: ['domain', 'reverse', 'amplify', 'maximum', 'expand'],
  ratio: ['reverse', 'domain', 'maximum', 'expand', 'amplify'],
  cursedSpeech: ['domain', 'reverse', 'amplify', 'maximum', 'expand'],
  boogieWoogie: ['domain', 'reverse', 'amplify', 'maximum', 'expand'],
  construction: ['domain', 'reverse', 'maximum', 'amplify', 'expand'],
  blackBird: ['domain', 'reverse', 'maximum', 'expand', 'amplify'],
  copy: ['reverse', 'domain', 'maximum', 'expand', 'amplify'],
  heavenly: ['reverse', 'domain', 'maximum', 'amplify', 'expand']
};

const AWAKEN_NAMES = {
  limitless: { reverse: '术式反转·赫', maximum: '极之番·虚式茈', domain: '无量空处' },
  shrine: { reverse: '术式反转·逆解', maximum: '极之番·捌', domain: '伏魔御厨子' },
  tenShadows: { reverse: '术式反转·影返', maximum: '极之番·魔虚罗', domain: '嵌合暗翳庭' },
  spiritManip: { reverse: '术式反转·咒灵回生', maximum: '极之番·百鬼夜行', domain: '胎藏遍野' },
  idleTransfig: { reverse: '术式反转·魂塑', maximum: '极之番·遍杀即灵体', domain: '自闭圆顿裹' },
  bloodManip: { reverse: '术式反转·赤血逆流', maximum: '极之番·赤血天幕', domain: '赤血苑囿' },
  murderLight: { reverse: '术式反转·蚀暗', maximum: '极之番·无光黑洞', domain: '杀意光庭' },
  iceFormation: { reverse: '术式反转·霜逆', maximum: '极之番·冰河世纪', domain: '万古冰狱' },
  projection: { reverse: '术式反转·逆帧', maximum: '极之番·二十四帧', domain: '时隙回廊' },
  ratio: { reverse: '术式反转·七三倒置', maximum: '极之番·必中七三', domain: '七三裁定所' },
  cursedSpeech: { reverse: '术式反转·逆言', maximum: '极之番·一言神谕', domain: '万籁俱寂' },
  boogieWoogie: { reverse: '术式反转·逆拍', maximum: '极之番·千手拍', domain: '虚位拍手' },
  construction: { reverse: '术式反转·解构', maximum: '极之番·天工开物', domain: '万象工房' },
  blackBird: { reverse: '术式反转·白鸦', maximum: '极之番·群鸦噬日', domain: '暮鸦天幕' },
  copy: { reverse: '术式反转·万法逆写', maximum: '极之番·无尽藏', domain: '万法归藏' },
  heavenly: { reverse: '术式反转·无咒逆刃', maximum: '极之番·天与一刀', domain: '无咒·天与牢' }
};

const AWAKEN_DESC = {
  reverse: '把生得术式的方向反过来。术式反转伤害更高，但咒力消耗也更重。',
  amplify: '用领域外壳包住身体，抵消敌方领域必中并强化近身术式。',
  maximum: '术式的极限形态。极高伤害，冷却较长。',
  expand: '扩张术式的作用对象，让攻击覆盖更广、更难被防御。',
  domain: '把生得术式封进领域，形成持续多回合的必中结界。'
};

const DOMAIN_COUNTER_FLAGS = {
  simpleDomain: '简易领域',
  fallingBlossom: '落花之情',
  hollowWicker: '弥虚葛笼',
  burnoutFix: '熔断修复'
};

const DOMAIN_COUNTERS = {
  simpleDomain: {
    id: 'simpleDomain', name: '简易领域', cost: 20, kind: 'counter', domainOnly: true,
    guardTurns: 2, guardReduce: 0.55,
    desc: '展开小规模领域，抵消领域必中并减伤 55%。'
  },
  fallingBlossom: {
    id: 'fallingBlossom', name: '落花之情', cost: 30, kind: 'counter', domainOnly: true,
    guardTurns: 2, guardReduce: 0.7, reflect: 0.15,
    desc: '以情绪为盾，抵消领域必中、减伤 70% 并反震宿傩。'
  },
  hollowWicker: {
    id: 'hollowWicker', name: '弥虚葛笼', cost: 45, kind: 'counter', domainOnly: true,
    guardTurns: 2, guardReduce: 1,
    desc: '古代结界术。完全无效化一次领域展开，并抵消领域必中。'
  }
};

/* ---------------- 工具 ---------------- */


/* ---------------- 词条 ---------------- */

const RARITY = {
  common: { name: '普通', cls: 'common' },
  rare: { name: '稀有', cls: 'rare' },
  legendary: { name: '传说', cls: 'legendary' },
  curse: { name: '诅咒', cls: 'curse' },
  mythic: { name: '彩色', cls: 'mythic' }
};

const TRAITS = [
  { id: 'keen', name: '洞察', rarity: 'common', w: 12, desc: '战斗智商 +8，暴击率 +4%。', mods: { iq: 8 }, crit: 0.04 },
  { id: 'iron', name: '铁壁', rarity: 'common', w: 12, desc: '体质 +8，受到伤害 -5%。', mods: { vit: 8 }, taken: -0.05 },
  { id: 'glutton', name: '大胃王', rarity: 'common', w: 12, desc: '咒力总量 +8，最大咒力 +40。', mods: { ce: 8 }, maxCe: 40 },
  { id: 'swift', name: '疾足', rarity: 'common', w: 12, desc: '体术 +8，闪避 +4%。', mods: { tai: 8 }, dodge: 0.04 },
  { id: 'efficient', name: '精算', rarity: 'common', w: 12, desc: '咒力效率 +8，术式消耗 -6%。', mods: { eff: 8 }, cost: -0.06 },
  { id: 'sturdy', name: '强韧', rarity: 'common', w: 12, desc: '生命 +80，防御 +8%。', hp: 80, defPct: 0.08 },
  { id: 'circuit', name: '咒力回路', rarity: 'common', w: 12, desc: '咒力操控 +8，每回合回蓝 +4。', mods: { ctrl: 8 }, regen: 4 },
  { id: 'hunter', name: '猎咒人', rarity: 'common', w: 12, desc: '对宿傩伤害 +6%，弱点发现率 +25%。', sukuDmg: 0.06, weakChance: 0.25 },

  { id: 'blackflash', name: '黑闪体质', rarity: 'rare', w: 6, desc: '暴击率 +5%，暴击伤害 +25%。', crit: 0.05, critDmg: 0.25 },
  { id: 'reversal', name: '反转亲和', rarity: 'rare', w: 6, desc: '反转术式治疗 +35%，冷却 -1 回合。', heal: 0.35, rctCd: -1 },
  { id: 'barrier', name: '结界天资', rarity: 'rare', w: 6, desc: '领域持续 +1 回合，领域伤害 +10%。', domainTurn: 1, domainDmg: 0.10 },
  { id: 'tool', name: '咒具精通', rarity: 'rare', w: 6, desc: '攻击 +8%，无视 8% 防御。', atkPct: 0.08, ignore: 0.08 },
  { id: 'lucky', name: '强运', rarity: 'rare', w: 6, desc: '事件触发率 +30%，弱点发现率 +30%。', eventChance: 0.30, weakChance: 0.30 },
  { id: 'blood', name: '血液沸腾', rarity: 'rare', w: 6, desc: '造成伤害 +8%，受到伤害 +4%。', dmg: 0.08, taken: 0.04 },
  { id: 'six', name: '六眼残响', rarity: 'rare', w: 5, desc: '咒力效率 +16，术式消耗 -10%。', mods: { eff: 16 }, cost: -0.10 },

  { id: 'king', name: '诅咒之王', rarity: 'legendary', w: 2, desc: '造成伤害 +12%，受到伤害 +6%。', dmg: 0.12, taken: 0.06 },
  { id: 'heaven', name: '天与残躯', rarity: 'legendary', w: 2, desc: '生命 +15%，攻击 +10%，最大咒力 -30。', hpPct: 0.15, atkPct: 0.10, maxCe: -30 },
  { id: 'void', name: '无量残影', rarity: 'legendary', w: 2, desc: '领域持续 +1 回合，领域伤害 +15%，术式消耗 -8%。', domainTurn: 1, domainDmg: 0.15, cost: -0.08 },
  { id: 'ancient', name: '千年咒胎', rarity: 'legendary', w: 2, desc: '初始行动点 +40，经验获取 +15%。', points: 40, xp: 0.15 },

  { id: 'bound', name: '契阔', rarity: 'curse', w: 7, desc: '全属性 +6，但每次行动额外消耗 1 点行动点。', mods: { ce: 6, ctrl: 6, eff: 6, vit: 6, tai: 6, iq: 6 }, pointsDrain: 1 },
  { id: 'short', name: '短命', rarity: 'curse', w: 7, desc: '初始行动点 -30，造成伤害 +15%。', points: -30, dmg: 0.15 },
  { id: 'glass', name: '玻璃', rarity: 'curse', w: 7, desc: '受到伤害 +12%，暴击率 +10%。', taken: 0.12, crit: 0.10 },
  { id: 'wild', name: '咒力失控', rarity: 'curse', w: 7, desc: '造成伤害 +12%，术式消耗 +15%。', dmg: 0.12, cost: 0.15 },
  { id: 'gaze', name: '宿傩的注视', rarity: 'curse', w: 7, desc: '对宿傩伤害 +10%，但受到宿傩伤害 +10%。', sukuDmg: 0.10, taken: 0.10 },

  { id: 'tempo', name: '残心', rarity: 'common', w: 9, desc: '使用防御或调息后，下一次攻击伤害 +30%，暴击率 +15%。', focusDmg: 0.30, focusCrit: 0.15 },
  { id: 'siphon', name: '咒力虹吸', rarity: 'common', w: 9, desc: '暴击时回复 8 点咒力。', critCe: 8 },
  { id: 'vanguard', name: '先手', rarity: 'common', w: 9, desc: '战斗第 1 回合造成伤害 +25%。', opening: 0.25 },
  { id: 'bleedEdge', name: '裂伤', rarity: 'common', w: 9, desc: '攻击有 30% 概率追加 1 层流血。', bleedOnHit: 0.30 },
  { id: 'lastBreath', name: '穷地', rarity: 'common', w: 8, desc: '生命低于 40% 时，防御 +20%，受到伤害 -10%。', lowDef: 0.20, lowTaken: -0.10 },
  { id: 'keenEdge', name: '锋锐', rarity: 'common', w: 8, desc: '额外伤害 +6%。', extraDmg: 0.06 },

  { id: 'sureStep', name: '空间步', rarity: 'rare', w: 4, desc: '每场一次，必中攻击伤害降低 75%，并回复 10% 生命。', sureGuard: 0.75, sureHeal: 0.10 },
  { id: 'traitBreaker', name: '破咒', rarity: 'rare', w: 4, desc: '额外伤害 +8%，无视宿傩 7% 伤害抗性。', extraDmg: 0.08, resistPen: 0.07 },
  { id: 'execution', name: '处刑', rarity: 'rare', w: 5, desc: '对生命低于 30% 的宿傩造成伤害 +25%。', execute: 0.25 },
  { id: 'bloodPact', name: '血之契', rarity: 'rare', w: 5, desc: '生命低于 50% 时攻击 +18%；每回合回复 2% 生命。', lowAtk: 0.18, regenPct: 0.02 },
  { id: 'counter', name: '反震', rarity: 'rare', w: 4, desc: '受到直接攻击时，对宿傩造成相当于你防御 80% 的反伤。', counter: 0.80 },

  { id: 'domainEcho', name: '领域余响', rarity: 'legendary', w: 2, desc: '领域展开后的术式熔断减少 1 回合；修复熔断会立刻结束熔断。', burnoutCut: 1 },
  { id: 'vowEcho', name: '束缚回响', rarity: 'legendary', w: 2, desc: '每场第一次立下束缚后，回复 15% 生命，且不消耗本回合的束缚次数。', vowEcho: 1 },
  { id: 'undying', name: '不灭', rarity: 'legendary', w: 2, desc: '每场一次，致死时以 30% 生命复活，并清除流血与灼烧。', revive: 1, cleanse: 1 },
  { id: 'riftEdge', name: '裂界', rarity: 'legendary', w: 2, desc: '额外伤害 +12%，无视宿傩 11% 伤害抗性；暴击时额外削抗 4%，持续 3 回合。', extraDmg: 0.12, resistPen: 0.11, resistBreakOnCrit: 0.04 },

  { id: 'reincarnator', name: '回廊行者', rarity: 'mythic', w: 1, desc: '每场一次，必中攻击伤害降低 80% 并回复 10% 生命；每场一次，致死时以 35% 生命复活。', sureGuard: 0.80, sureHeal: 0.10, revive: 1 },
  { id: 'zenith', name: '万象归一', rarity: 'mythic', w: 1, desc: '每次暴击使本场暴击率 +6%、暴击伤害 +15%、伤害 +4%，最多 6 层；叠满后下一次攻击必定暴击并造成 2.2 倍伤害。', critStack: 1 },
  { id: 'chrono', name: '时之楔', rarity: 'mythic', w: 1, desc: '术式冷却速度翻倍；使用带冷却的术式时 25% 概率不进入冷却；每 3 回合重置全部术式冷却。', cdRefresh: 1 },
  { id: 'causality', name: '因果裁断', rarity: 'mythic', w: 1, desc: '额外伤害 +18%，无视宿傩 16% 伤害抗性；暴击时额外削抗 5%，持续 3 回合。', extraDmg: 0.18, resistPen: 0.16, resistBreakOnCrit: 0.05 }
];

function traitVal(run, key) {
  return (run.traits || []).reduce((a, t) => a + (t[key] || 0), 0);
}

function weightedTrait(pool) {
  const total = pool.reduce((a, t) => a + t.w, 0);
  let r = Math.random() * total;
  for (const t of pool) { r -= t.w; if (r <= 0) return t; }
  return pool[pool.length - 1];
}

function rollTraits(n) {
  const out = [];
  const positive = TRAITS.filter(t => t.rarity !== 'curse');
  out.push(weightedTrait(positive));
  let guard = 0;
  while (out.length < n && guard++ < 80) {
    const t = weightedTrait(TRAITS);
    if (!out.find(x => x.id === t.id)) out.push(t);
  }
  return out;
}

function traitCls(t) {
  return t.rarity === 'mythic' ? 'rainbow'
    : t.rarity === 'legendary' ? 'gold'
    : t.rarity === 'rare' ? 'purple'
    : t.rarity === 'curse' ? 'dmg' : 'sys';
}

function grantTrait(run, wantedId) {
  if (!run.traits) run.traits = [];
  const owned = new Set(run.traits.map(t => t.id));
  const pool = TRAITS.filter(t => !owned.has(t.id) && (!wantedId || t.id === wantedId));
  if (!pool.length) return null;
  const t = weightedTrait(pool);
  run.traits.push(t);
  if (t.mods) for (const k in t.mods) addStat(run, k, t.mods[k]);
  run.points += t.points || 0;
  run.log.push({ text: `【词条·${RARITY[t.rarity].name}】获得「${t.name}」：${t.desc}`, cls: traitCls(t) });
  return t;
}

function rnd(a, b) { return Math.floor(a + Math.random() * (b - a + 1)); }
function rf(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function money(n) { return Math.round(n).toLocaleString('zh-CN'); }

function benchOf(lvl) {
  for (const b of BENCH) if (lvl >= b.min && lvl <= b.max) return b;
  return BENCH[BENCH.length - 1];
}

function tierOf(i) { return TIERS[clamp(i, 1, 10) - 1]; }

/* ---------------- 难度梯度 ---------------- */
const DIFF_ORDER = ['easy', 'normal', 'hard', 'hell'];
const DIFFICULTIES = {
  easy: {
    id: 'easy', name: '简单', tag: '休闲',
    desc: '宿傩生命 -20% · 攻击 -18% · 积分 85%',
    enemyHp: 0.80, enemyAtk: 0.82, enemyDef: 0.90, reward: 0.85
  },
  normal: {
    id: 'normal', name: '普通', tag: '标准',
    desc: '宿傩原始强度 · 积分 100%',
    enemyHp: 1.00, enemyAtk: 1.00, enemyDef: 1.00, reward: 1.00
  },
  hard: {
    id: 'hard', name: '困难', tag: '压迫',
    desc: '宿傩生命 +18% · 攻击 +12% · 积分 115%',
    enemyHp: 1.18, enemyAtk: 1.12, enemyDef: 1.08, reward: 1.15
  },
  hell: {
    id: 'hell', name: '地狱', tag: '绝境',
    desc: '宿傩生命 +38% · 攻击 +26% · 积分 130%',
    enemyHp: 1.38, enemyAtk: 1.26, enemyDef: 1.15, reward: 1.30
  }
};
function diffOf(id) { return DIFFICULTIES[id] || DIFFICULTIES.normal; }

/* ---------------- 开局 ---------------- */

function guardMinFor(playerLv, points) {
  if (points >= 100) return 10;
  if (playerLv >= 75) return 3;
  if (playerLv >= 25) return 2;
  return 1;
}

function rollTier(playerLv, guardMin) {
  const base = [0, 33, 25, 11, 9, 7, 5, 4, 3, 2, 1];
  let p = Math.min(0.75, 0.15 + (playerLv || 0) * 0.001);
  const scale = (p / (1 - p)) * (85 / 15);
  const w = base.slice();
  for (let i = 6; i <= 10; i++) w[i] = base[i] * scale;
  const total = w.reduce((a, b) => a + b, 0);
  const floor = guardMin || 1;
  for (let t = 0; t < 60; t++) {
    let r = Math.random() * total, acc = 0;
    for (let i = 1; i <= 10; i++) {
      acc += w[i];
      if (r < acc) {
        if (i >= floor) return i;
        break;
      }
    }
  }
  return floor;
}

function rollCons() {
  const keys = Object.keys(CONS);
  const total = keys.reduce((a, k) => a + CONS[k].w, 0);
  let r = Math.random() * total;
  for (const k of keys) {
    r -= CONS[k].w;
    if (r <= 0) return k;
  }
  return 'none';
}

function techPool(tier) {
  return Object.keys(TECHS).filter(k => k !== 'heavenly' && TECHS[k].req <= tier);
}

function rollTech(tier) {
  return pick(techPool(tier));
}

function initStats(tierIdx, techId, consId) {
  const t = tierOf(tierIdx);
  const tech = TECHS[techId];
  const s = {};
  for (const k of STATS) {
    s[k] = 5 + tierIdx * 1.35 + rf(-2, 3) + (tech.focus[k] || 1) * 4;
  }
  const cons = CONS[consId];
  for (const k in cons.mods) s[k] += cons.mods[k];
  if (consId === 'heavenly') {
    s.ce = 0; s.ctrl = 0; s.eff = 0;
    s.vit = s.vit * 2 + 8;
    s.tai = s.tai * 2 + 8;
  }
  for (const k of STATS) s[k] = clamp(s[k], 1, statCap(tierIdx, consId, k));
  if (consId === 'heavenly') { s.ce = 0; s.ctrl = 0; s.eff = 0; }
  return s;
}

function statCap(tierIdx, consId, k) {
  let cap = tierOf(tierIdx).cap;
  if (consId === 'sixEyes' && (k === 'ctrl' || k === 'eff')) cap = 100;
  if (consId === 'heavenly' && (k === 'vit' || k === 'tai')) cap = 100;
  return cap;
}

function statCapFor(run, k) {
  const base = statCap(run.tier, run.cons, k);
  const bonus = run.capBonus || 0;
  if (run.lvl < 90) return base + bonus;
  const final = TALENT_FINAL_CAP[clamp(run.tier, 1, 10) - 1];
  if (run.lvl < 100) {
    const progress = clamp((run.lvl - 90) / 10, 0, 1);
    const cap = Math.max(base, 80 + (final - 80) * progress);
    return Math.min(145, Math.round(cap) + bonus);
  }
  return Math.min(145, final + bonus);
}

function makeRun(opts = {}) {
  const playerLv = opts.playerLv || 0;
  const diff = diffOf(opts.difficulty);
  const tierIdx = opts.tier || rollTier(playerLv, opts.guardMin || 1);
  const consId = opts.cons || rollCons();
  let techId = consId === 'heavenly' ? 'heavenly' : (opts.tech || rollTech(tierIdx));
  if (consId === 'ninePhases') techId = 'bloodManip';
  const tech = TECHS[techId];
  const stats = initStats(tierIdx, techId, consId);
  const techChoices = Object.keys(TECHS).filter(k => k !== 'heavenly' && TECHS[k].req <= tierIdx && k !== techId);
  const tech2Id = consId === 'multi' && techChoices.length
    ? (techChoices.includes(opts.tech2) ? opts.tech2 : techChoices[rnd(0, techChoices.length - 1)])
    : null;
  const tech2 = tech2Id ? TECHS[tech2Id] : null;
  const run = {
    tier: tierIdx,
    tierName: tierOf(tierIdx).name,
    difficulty: diff.id,
    difficultyName: diff.name,
    diff,
    cons: consId,
    consName: CONS[consId].name,
    tech: techId,
    techName: tech.name,
    tech2: tech2Id,
    tech2Name: tech2 ? tech2.name : '',
    domainName: (AWAKEN_NAMES[techId] && AWAKEN_NAMES[techId].domain) || tech.domain || '',
    lvl: Math.max(1, Math.round(tierIdx * 0.9)),
    xp: 0,
    age: 6,
    points: 85 + tierIdx * 12 + rnd(0, 24),
    actions: 0,
    stats,
    refine: { ce: 0, ctrl: 0, eff: 0, vit: 0, tai: 0, iq: 0 },
    techMastery: 0,
    bloodStage: consId === 'ninePhases' ? 1 : 0,
    bloodAwakened: false,
    weak: [],
    capBonus: 0,
    mythicBoons: { hp: 0, atk: 0, dmg: 0, cost: 0, critDmg: 0, revive: 0, domainTurn: 0 },
    flags: {
      rct: false, domain: false,
      simpleDomain: false, fallingBlossom: false,
      hollowWicker: false, burnoutFix: false
    },
    awaken: {},
    copiedMoves: [],
    plotDone: [],
    eventCounts: {},
    phase: 'sim',
    mode: null,
    dead: false,
    slain: false,
    traits: [],
    log: []
  };
  run.traits = rollTraits(3);
  for (const t of run.traits) {
    if (t.mods) for (const k in t.mods) addStat(run, k, t.mods[k]);
    run.points += t.points || 0;
  }
  if (techId === 'copy') {
    const pool = [];
    for (const k of Object.keys(TECHS)) {
      if (k === 'copy' || k === 'heavenly') continue;
      if (TECHS[k].req > tierIdx) continue;
      for (const m of TECHS[k].moves) {
        if (m.kind === 'domain' || m.req) continue;
        pool.push({ ...m, id: 'cp_' + m.id });
      }
    }
    for (let i = 0; i < 2 && pool.length; i++) {
      const idx = rnd(0, pool.length - 1);
      run.copiedMoves.push(pool.splice(idx, 1)[0]);
    }
  }
  run.log.push({ text: '你穿越到了咒术回战的世界。', cls: 'sys' });
  run.log.push({ text: `难度：${diff.name}。${diff.desc}。`, cls: 'gold' });
  run.log.push({ text: `生得术式『${tech.name}』，咒术天赋 ${run.tierName}，特殊体质「${run.consName}」。`, cls: 'gold' });
  if (consId === 'ninePhases') {
    run.log.push({ text: '九相图在腹中醒来。九道死胎的血液同时流动，赤血操术·穿血已经可以发动；剩下的招式要在专属事件「九相图」中唤醒。', cls: 'gold' });
  }
  const b = benchOf(run.lvl);
  run.log.push({ text: `初始评级 ${b.grade}（对标 ${b.who}），六维已生成。`, cls: 'sys' });
  if (consId === 'heavenly') {
    run.log.push({ text: '咒力为零。你的身体就是术式——咒具与体术，是你唯一的路。', cls: 'big' });
  }
  if (consId === 'sixEyes') {
    run.log.push({ text: '六眼展开。咒力的流动在你眼中纤毫毕现。', cls: 'gold' });
  }
  if (consId === 'sixEyes' && techId === 'limitless') {
    run.log.push({ text: '六眼与无下限共鸣——虚式「茈」已解锁。', cls: 'big' });
  }
  if (techId === 'copy' && run.copiedMoves.length) {
    run.log.push({ text: `复制完成：${run.copiedMoves.map(m => '「' + m.name + '」').join('、')}。`, cls: 'purple' });
  }
  for (const t of run.traits) {
    run.log.push({ text: `【词条·${RARITY[t.rarity].name}】${t.name}：${t.desc}`, cls: traitCls(t) });
  }
  return run;
}

/* ---------------- 成长 ---------------- */

function xpNeed(lvl) {
  if (lvl >= 100) return Math.round(1000 + (lvl - 100) * 200);
  const late = lvl >= 90 ? (lvl - 89) * 20 : 0;
  return Math.round(20 + lvl * 1.9 + late);
}

function xpGain(run) {
  const base = 13 + run.tier * 2.6 + run.stats.iq * 0.2 + run.stats.ctrl * 0.06 + (run.cons === 'sixEyes' ? 2 : 0);
  return base * (1 + traitVal(run, 'xp'));
}

function awakenCount(run) {
  const path = AWAKEN_PATHS[run.tech] || [];
  return path.filter(k => run.awaken && run.awaken[k]).length;
}

function nextAwakenKind(run) {
  const path = AWAKEN_PATHS[run.tech] || [];
  if (!run.awaken) run.awaken = {};
  const remaining = path.filter(k => !run.awaken[k]);
  if (!remaining.length) return null;
  if (!run.awaken.maximum && remaining.includes('maximum') && (run.techMastery || 0) >= 2) {
    return 'maximum';
  }
  return remaining[0];
}

function awakenChance(run) {
  const mastery = Math.max(0, Math.min(3, run.techMastery || 0));
  const talent = ((run.tier || 5) - 5) * 0.03;
  const iq = ((run.stats && run.stats.iq) || 0) * 0.0015;
  return clamp(0.10 + mastery * 0.12 + talent + iq, 0.05, 0.9);
}

function tryAwaken(run, source = '契机', bonus = 0) {
  if (!run || !run.tech) return false;
  if (!run.awaken) run.awaken = {};
  const kind = nextAwakenKind(run);
  if (!kind) return false;
  const chance = clamp(awakenChance(run) + bonus, 0.05, 0.95);
  if (Math.random() >= chance) {
    run.log.push({
      text: `【术式觉醒·${source}】你触碰到了${awakenName(run, kind)}的门槛，但这次没有跨过去。（成功率 ${Math.round(chance * 100)}%）`,
      cls: 'sys'
    });
    return false;
  }
  run.awaken[kind] = true;
  if (kind === 'domain') {
    run.flags.domain = true;
    run.domainName = (AWAKEN_NAMES[run.tech] && AWAKEN_NAMES[run.tech].domain) || TECHS[run.tech].domain || run.domainName || run.techName;
  }
  run.log.push({
    text: `【术式觉醒·${source}】${awakenName(run, kind)}。${AWAKEN_DESC[kind]}`,
    cls: 'big'
  });
  return true;
}

function awakenName(run, kind) {
  const tech = TECHS[run.tech];
  const named = AWAKEN_NAMES[run.tech] || {};
  if (kind === 'reverse') return named.reverse || `术式反转·${tech.name}`;
  if (kind === 'amplify') return `领域展延·${tech.name}`;
  if (kind === 'maximum') return named.maximum || `极之番·${tech.name}`;
  if (kind === 'expand') return `术式对象扩张·${tech.name}`;
  return named.domain || tech.domain || tech.name;
}

function syncAwakening(run) {
  if (!run) return {};
  if (!run.awaken) run.awaken = {};
  return run.awaken;
}

function totalRefine(run) {
  if (!run || !run.refine) return 0;
  return STATS.reduce((a, k) => a + (run.refine[k] || 0), 0);
}

function checkMastery(run) {
  if (!run || !run.refine) return;
  if (typeof run.techMastery !== 'number') run.techMastery = 0;
  const total = totalRefine(run);
  while (run.techMastery < MASTERY_TIERS.length && total >= MASTERY_TIERS[run.techMastery]) {
    run.techMastery++;
    const rank = ['壹', '贰', '叁'][run.techMastery - 1];
    const dmg = run.techMastery * 4;
    const cost = run.techMastery * 3;
    const line = MASTERY_LINES[run.tech] || `你对〈${run.techName}〉的理解更深。`;
    run.log.push({
      text: `【术式领悟·${rank}】${line} 招式伤害 +${dmg}%，消耗 -${cost}%。`,
      cls: 'gold'
    });
  }
}

function addStat(run, k, v) {
  if (run.cons === 'heavenly' && ['ce', 'ctrl', 'eff'].includes(k)) return;
  if (!run.refine) run.refine = { ce: 0, ctrl: 0, eff: 0, vit: 0, tai: 0, iq: 0 };
  const cap = statCapFor(run, k);
  const before = run.stats[k];
  const target = clamp(before + v, 1, cap);
  run.stats[k] = target;
  if (v > 0 && target + 1e-9 < before + v) {
    run.refine[k] = (run.refine[k] || 0) + (before + v - target);
    checkMastery(run);
  }
}

function train(run) {
  const t = tierOf(run.tier);
  for (const k of STATS) {
    let f = TECHS[run.tech].focus[k];
    if (f === undefined) f = 1;
    if (f === 0) continue;
    let inc = (0.35 + Math.random() * 0.45) * t.grow * f * (0.9 + run.lvl / 280);
    if (run.lvl >= 90) inc *= 1 + (run.lvl - 90) * 0.025;
    if (run.cons === 'heavenly' && (k === 'vit' || k === 'tai')) inc *= 2.2;
    addStat(run, k, inc);
  }
}

function levelUp(run, gainLabel) {
  const l = run.lvl;
  let p = 0;
  if (l >= 55 && l <= 65) p = 1;
  else if (l >= 66 && l <= 75) p = 2;
  else if (l >= 76 && l <= 85) p = 3;
  else if (l >= 86 && l <= 90) p = 4;
  else if (l >= 91 && l <= 95) p = 5;
  else if (l >= 96 && l <= 98) p = 8;
  else if (l === 99) p = 20;
  else if (l >= 100 && l <= 110) p = 10;
  else if (l >= 111 && l <= 120) p = 12;
  else if (l >= 121) p = 15;
  run.points += p;
  if (p) run.log.push({ text: `Lv.${l} 的突破返还了 ${p} 点行动点。`, cls: 'sys' });
  const b = benchOf(l);
  if ([10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100, 105, 110, 114, 120, 130].includes(l)) {
    run.log.push({ text: `等级提升至 Lv.${l} —— ${b.grade}（对标 ${b.who}）。`, cls: 'big' });
  } else if (!gainLabel) {
    run.log.push({ text: `修炼有成，等级提升至 Lv.${l}。`, cls: 'sys' });
  }
  if (l === 100 && !run.flags.limitBreak) {
    run.flags.limitBreak = true;
    run.log.push({ text: '你越过了咒术师的极限。六维上限到达天赋终局。', cls: 'big' });
  }
  checkUnlocks(run);
  if ([30, 60, 90, 105, 120].includes(l)) grantTrait(run);
}

function gainXp(run, amount) {
  run.xp += amount;
  let guard = 0;
  while (run.lvl < MAX_LEVEL && run.xp >= xpNeed(run.lvl) && guard++ < 200) {
    run.xp -= xpNeed(run.lvl);
    run.lvl++;
    levelUp(run, true);
  }
  if (run.lvl >= MAX_LEVEL) { run.lvl = MAX_LEVEL; run.xp = 0; }
}

function checkUnlocks(run) {
  if (!run.flags.rct && run.lvl >= 50 && run.stats.ctrl >= 55 && run.cons !== 'heavenly') {
    run.flags.rct = true;
    run.log.push({ text: '你掌握了反转术式。负负得正，伤口开始逆流。', cls: 'big' });
  }
}

/* ---------------- 弱点 ---------------- */

const WEAK_POINTS = [
  { name: '契阔之隙', sub: '束缚的缝隙', boost: 0.10 },
  { name: '灵魂分界', sub: '受肉体的接缝', boost: 0.10 },
  { name: '领域熔断', sub: '术式熔断的瞬间', boost: 0.10 },
  { name: '反转迟滞', sub: '反转术式的间隔', boost: 0.10 },
  { name: '咒胎烙印', sub: '咒胎的旧痕', boost: 0.10 },
  { name: '指之容器', sub: '手指与肉体的排斥', boost: 0.10 },
  { name: '受肉之躯', sub: '容器与灵魂的错位', boost: 0.10 },
  { name: '狱门疆之锁', sub: '封印的残响', boost: 0.10 },
  { name: '魔虚罗之眼', sub: '适应的破绽', boost: 0.10 },
  { name: '御厨子核心', sub: '术式的中枢', boost: 0.10 },
  { name: '斩击惯性', sub: '收刀时的空档', boost: 0.10 },
  { name: '火焰余烬', sub: '竈火熄灭的间隙', boost: 0.10 },
  { name: '空间坐标', sub: '世界斩的落点', boost: 0.10 },
  { name: '咒力逆流', sub: '咒力回路的倒灌', boost: 0.10 },
  { name: '十影之忆', sub: '影法术的旧约', boost: 0.10 },
  { name: '赤血之毒', sub: '血脉里的杂质', boost: 0.10 },
  { name: '无量之隙', sub: '无限中的一瞬', boost: 0.10 },
  { name: '千年之倦', sub: '漫长岁月的破绽', boost: 0.10 },
  { name: '王座裂痕', sub: '诅咒之王的座基', boost: 0.10 },
  { name: '真名残响', sub: '束缚的真名', boost: 0.10 }
];

function addWeak(run) {
  if (run.weak.length >= 5) return null;
  const rest = WEAK_POINTS.filter(w => !run.weak.find(x => x.name === w.name));
  if (!rest.length) return null;
  const w = pick(rest);
  run.weak.push(w);
  const bonus = rnd(3, 6);
  addStat(run, 'iq', 1);
  addStat(run, 'ctrl', 1);
  run.log.push({ text: `你窥见了宿傩的弱点『${w.name}·${w.sub}』。对宿傩伤害 +10%，战斗智商 +1${run.cons === 'heavenly' ? '' : '，咒力操控 +1'}。`, cls: 'gold' });
  if (run.weak.length === 3) run.log.push({ text: '三处弱点已集齐。终局时，你有一次「弱点重创」的机会。', cls: 'big' });
  if (run.weak.length === 5) run.log.push({ text: '五处弱点尽数洞穿。宿傩在你眼中已没有秘密。', cls: 'gold' });
  return w;
}

function weakBonus(run) { return run.weak.reduce((a, w) => a + w.boost, 0); }

function applyWeakStrike(d) {
  if (!d || d.over || d.weakStrikeUsed) return 0;
  const s = d.suku, run = d.run;
  d.weakStrikeUsed = true;
  const dmg = Math.max(1, Math.round(s.maxHp * 0.30 + run.stats.iq * 4));
  s.hp -= dmg;
  pushDuel(d, `你没有出招。三处弱点同时崩开，宿傩的${s.stage === 1 ? '十影之躯' : '原身'}损失 ${money(dmg)} 点生命。`, 'big');
  checkSukuPhase(d);
  return dmg;
}

/* ---------------- 事件 ---------------- */

function learnChance(run, base = 0.2, perTier = 0.06) {
  return clamp(base + (run.tier - 1) * perTier + run.stats.iq * 0.0025, 0.15, 0.95);
}

function eventPower(run) {
  if (run.cons === 'heavenly') {
    return run.stats.tai * 2.2 + run.stats.vit * 1.4 + run.stats.iq * 0.5 + run.lvl * 0.6;
  }
  return run.stats.ce + run.stats.ctrl + run.stats.tai + run.stats.iq * 0.2;
}

function addMythicBoon(run, key, value) {
  run.mythicBoons = run.mythicBoons || { hp: 0, atk: 0, dmg: 0, cost: 0, critDmg: 0, revive: 0, domainTurn: 0 };
  run.mythicBoons[key] = (run.mythicBoons[key] || 0) + value;
}

function eventDeathOrInjury(run, deathText, surviveText) {
  if (run.lvl >= 70) {
    const loss = rnd(4, 8);
    run.points = Math.max(0, run.points - loss);
    return `${surviveText} 行动点 -${loss}。`;
  }
  run.dead = true;
  return deathText;
}

function advanceBlood(run, amount = 1) {
  const before = run.bloodStage || 1;
  const stage = Math.min(3, before + amount);
  run.bloodStage = stage;
  run.bloodAwakened = stage >= 3;
  return { before, stage };
}

const EVENTS = [
  {
    id: 'core', name: '咒力核心觉醒', w: 18, max: 2,
    cond: r => r.age >= 12,
    run: r => {
      const pts = rnd(4, 9), ce = rnd(2, 5), ctrl = rnd(2, 4);
      r.points += pts; addStat(r, 'ce', ce); addStat(r, 'ctrl', ctrl); gainXp(r, 35);
      return [`沉睡的咒力核心二次觉醒：行动点 +${pts}，咒力总量 +${ce}，咒力操控 +${ctrl}。`];
    }
  },
  {
    id: 'bloodline', name: '御三家血脉', w: 5, max: 1,
    cond: r => r.age >= 6 && r.tier <= 6,
    run: r => {
      const ce = rnd(3, 6), ctrl = rnd(3, 6), eff = rnd(2, 4);
      addStat(r, 'ce', ce); addStat(r, 'ctrl', ctrl); addStat(r, 'eff', eff);
      return [`你发现身上流着御三家的血：咒力总量 +${ce}，操控 +${ctrl}，效率 +${eff}。`];
    }
  },
  {
    id: 'ninePhases', name: '九相图', w: 14, max: 3,
    cond: r => r.cons === 'ninePhases' && (r.bloodStage || 1) < 3 && r.age >= 8,
    prompt: '梦里，九个死胎在同一个腹腔里睁眼。加茂宪伦留下的血脉在叫你的名字，兄弟们的手从血里伸出来，掌心里各自握着一式赤血操术。',
    options: [
      {
        id: 'accept', label: '让兄弟的血流进来', cls: 'blood',
        desc: '78% 唤醒下一式赤血操术并强化体质；22% 被九相图反噬。',
        run: r => {
          if (Math.random() < 0.78) {
            const step = advanceBlood(r);
            const vit = rnd(2, 4), ce = rnd(2, 3), tai = rnd(1, 3);
            addStat(r, 'vit', vit); addStat(r, 'ce', ce); addStat(r, 'tai', tai); gainXp(r, 95);
            const msg = step.stage === 2
              ? '血液在血管里炸开又收束。你听见「超新星」与「赤血操术·铠」同时成形的声响。'
              : step.stage === 3
                ? '九道心跳终于重合。血液压缩到极致，『血星磊』在你掌心凝成一颗赤色星辰。'
                : '九相图的血液继续流动，赤血操术更深一层。';
            return [`${msg} 体质 +${vit}，咒力 +${ce}，体术 +${tai}。`];
          }
          const loss = rnd(4, 8);
          r.points -= loss;
          return [`兄弟的血在体内逆流。你压住喉咙里的铁锈味，行动点 -${loss}。`];
        }
      },
      {
        id: 'commune', label: '与九道死胎对话', cls: 'ghost',
        desc: '65% 唤醒下一式并提升操控与战斗智商；35% 只得到一点感悟。',
        run: r => {
          if (Math.random() < 0.65) {
            const step = advanceBlood(r);
            const ctrl = rnd(2, 4), iq = rnd(1, 3);
            addStat(r, 'ctrl', ctrl); addStat(r, 'iq', iq); gainXp(r, 75);
            return [`九个声音同时开口。你听见了赤血操术的下一个音节，${step.stage >= 3 ? '血星磊已经完整。' : '招式在血里继续成形。'} 操控 +${ctrl}，战斗智商 +${iq}。`];
          }
          r.points += 3;
          return ['兄弟们没有回答，只留下一点温热的血。行动点 +3。'];
        }
      },
      {
        id: 'suppress', label: '压制九相图', cls: 'ghost',
        desc: '不推进觉醒，稳定获得咒力效率与行动点。',
        run: r => {
          r.points += 4; addStat(r, 'eff', 2);
          return ['你把九道胎动压回腹腔深处。行动点 +4，咒力效率 +2。'];
        }
      }
    ]
  },
  {
    id: 'culling', name: '死灭回游·结界', w: 12, max: 2,
    cond: r => r.lvl >= 50,
    run: r => {
      const power = eventPower(r);
      const chance = clamp(0.28 + power / 850 + (r.tier - 1) * 0.01, 0.28, 0.95);
      if (Math.random() < chance) {
        const tai = rnd(3, 6), vit = rnd(2, 4);
        const ce = r.cons === 'heavenly' ? 0 : rnd(3, 7);
        if (ce) addStat(r, 'ce', ce);
        addStat(r, 'tai', tai); addStat(r, 'vit', vit); gainXp(r, 60);
        r.points += 4;
        return [`你在死灭回游的结界里杀穿重围：${ce ? `咒力 +${ce}，` : ''}体术 +${tai}，体质 +${vit}，行动点 +4。`];
      }
      if (Math.random() < (r.cons === 'heavenly' ? 0.12 : 0.25)) {
        return [eventDeathOrInjury(r, '结界闭合。你没能走出来——死灭回游吞掉了你的名字。', '结界闭合的瞬间，你以特级术师的咒力强行撕开一条缝，带着重伤走了出来。')];
      }
      r.points -= rnd(3, 7);
      return ['你在结界中重伤逃出，行动点被大幅消耗。'];
    }
  },
  {
    id: 'finger', name: '拾得宿傩的手指', w: 10, max: 1,
    cond: r => r.lvl >= 20,
    run: r => {
      const ce = rnd(4, 8), pts = rnd(5, 10);
      addStat(r, 'ce', ce); r.points += pts; gainXp(r, 40);
      const out = [`你吞下那根手指，庞大的咒力在体内重组：咒力总量 +${ce}，行动点 +${pts}。`];
      if (r.cons === 'none' && Math.random() < 0.25) {
        r.cons = 'vessel'; r.consName = CONS.vessel.name;
        out.push('你的身体成为宿傩的容器——对宿傩伤害提升，每场一次免死。');
      }
      return out;
    }
  },
  {
    id: 'crystal', name: '咒力结晶', w: 32, max: 3,
    cond: r => true,
    run: r => {
      const pts = rnd(6, 11), eff = rnd(2, 4), ce = rnd(2, 4);
      r.points += pts; addStat(r, 'eff', eff); addStat(r, 'ce', ce);
      return [`偶得一罐高纯度咒力结晶：行动点 +${pts}，咒力效率 +${eff}，咒力总量 +${ce}。`];
    }
  },
  {
    id: 'exorcism', name: '讨伐特级咒灵', w: 18, max: 5,
    cond: r => r.lvl >= 55,
    run: r => {
      const power = r.stats.ce + r.stats.tai + r.stats.iq;
      if (Math.random() < clamp(0.4 + power / 500, 0.4, 0.92)) {
        const ce = rnd(4, 8), tai = rnd(2, 4);
        addStat(r, 'ce', ce); addStat(r, 'tai', tai); gainXp(r, 70);
        return [`你祓除了那头特级咒灵：咒力 +${ce}，体术 +${tai}，境界提升。`];
      }
      if (Math.random() < 0.2) {
        return [eventDeathOrInjury(r, '特级咒灵的领域比你更快一步。你没能回来。', '特级咒灵的领域闭合前，你以自身咒力反向撕开结界，重伤脱身。')];
      }
      r.points -= rnd(4, 8);
      return ['讨伐失败，你被特级咒灵重创，行动点大幅流失。'];
    }
  },
  {
    id: 'simpleDomain', name: '简易领域·学习', w: 8, max: 4,
    cond: r => r.lvl >= 30 && !r.flags.simpleDomain,
    run: r => {
      if (Math.random() < learnChance(r, 0.22, 0.06)) {
        r.flags.simpleDomain = true;
        addStat(r, 'ctrl', 2);
        return ['你在结界课的残页里学会了『简易领域』。敌方领域展开时，你可以用它抵消必中并减伤。'];
      }
      return ['你试图在身体周围张开简易领域，结界在成形前碎掉了。下次再试。'];
    }
  },
  {
    id: 'fallingBlossom', name: '落花之情·学习', w: 6, max: 4,
    cond: r => r.lvl >= 45 && !r.flags.fallingBlossom,
    run: r => {
      if (Math.random() < learnChance(r, 0.18, 0.06)) {
        r.flags.fallingBlossom = true;
        addStat(r, 'eff', 2);
        return ['你学会了『落花之情』。以情绪为盾，领域必中会被削弱，冲击还能反震宿傩。'];
      }
      return ['落花之情要求心绪绝对平稳。你的情绪波动让结界散了。'];
    }
  },
  {
    id: 'hollowWicker', name: '弥虚葛笼·学习', w: 5, max: 4,
    cond: r => r.lvl >= 60 && !r.flags.hollowWicker,
    run: r => {
      if (Math.random() < learnChance(r, 0.14, 0.055)) {
        r.flags.hollowWicker = true;
        addStat(r, 'ctrl', 3);
        return ['古代结界术『弥虚葛笼』在你指尖成形。它能把一次领域展开完全无效化。'];
      }
      return ['弥虚葛笼的笼目太多，你的咒力在最后一层断掉了。'];
    }
  },
  {
    id: 'burnoutFix', name: '熔断修复·学习', w: 6, max: 4,
    cond: r => r.lvl >= 50 && !r.flags.burnoutFix,
    run: r => {
      if (Math.random() < learnChance(r, 0.2, 0.055)) {
        r.flags.burnoutFix = true;
        addStat(r, 'eff', 2);
        return ['你学会了出招『修复熔断』。熔断期间使用它，会把剩余熔断压缩到 1 回合。'];
      }
      return ['你尝试修复术式熔断，但咒力回路在重接时再次烧断。'];
    }
  },
  {
    id: 'talent', name: '天赋重估', w: 7, max: 2,
    cond: r => r.lvl >= 20 && r.tier < 10,
    run: r => {
      const chance = clamp(0.28 + (r.tier - 1) * 0.045 + r.stats.iq * 0.0015, 0.28, 0.9);
      if (Math.random() < chance) {
        r.tier = Math.min(10, r.tier + 1);
        r.tierName = tierOf(r.tier).name;
        gainXp(r, 45);
        return [`你的天赋被重新丈量：咒术天赋提升至 ${r.tierName}。上限与成长都会随天赋抬高。`];
      }
      return ['你试图重新丈量自己的天赋，但这一次只摸到了门槛。'];
    }
  },
  {
    id: 'capBreak', name: '六维突破', w: 5, max: 3,
    cond: r => r.lvl >= 60 && (r.capBonus || 0) < 30,
    run: r => {
      const chance = clamp(0.2 + (r.tier - 1) * 0.065 + r.stats.iq * 0.0015, 0.2, 0.95);
      if (Math.random() < chance) {
        r.capBonus = (r.capBonus || 0) + 5;
        const k = pick(STATS);
        addStat(r, k, 1);
        gainXp(r, 30);
        return [`六维的壁障裂开一道缝：六维上限 +5（累计 +${r.capBonus}），${STAT_NAMES[k]} +1。天赋越高，越容易再次敲开。`];
      }
      return ['你触到了六维的壁障，但这次没有敲开。'];
    }
  },
  {
    id: 'awakenCrack', name: '术式觉醒·契机', w: 9, max: 8,
    cond: r => r.lvl >= 25 && !!nextAwakenKind(r),
    run: r => {
      const ok = tryAwaken(r, '契机');
      return [ok
        ? '契机落下的瞬间，你抓住了生得术式的另一种答案。'
        : '你隐约看见了那扇门，但这次契机从指缝里滑走了。'];
    }
  },
  {
    id: 'awakenInsight', name: '术式觉醒·顿悟', w: 5, max: 4,
    cond: r => r.lvl >= 60 && !!nextAwakenKind(r),
    run: r => {
      const ok = tryAwaken(r, '顿悟', 0.08);
      return [ok
        ? '长久的积累在某一刻连成一线，术式的边界向后退了一寸。'
        : '你试图在寂静里抓住那道灵光，但它还差一点。'];
    }
  },
  {
    id: 'blackFlash', name: '黑闪', w: 7, max: 4,
    cond: r => r.lvl >= 15,
    run: r => {
      const chance = clamp(0.12 + r.stats.tai * 0.0022 + r.stats.iq * 0.0014, 0.12, 0.68);
      if (Math.random() < chance) {
        const tai = rnd(2, 4), ce = rnd(1, 3);
        addStat(r, 'tai', tai);
        if (r.cons !== 'heavenly') addStat(r, 'ce', ce);
        r.points += rnd(3, 6);
        gainXp(r, 55);
        return [`你的拳头与咒力在同一帧重叠。黑闪！体术 +${tai}${r.cons === 'heavenly' ? '' : `，咒力 +${ce}`}，行动点增加。`];
      }
      r.points -= rnd(1, 4);
      return ['你试图抓住黑闪的间隙，但咒力在最后一刻偏了半寸。'];
    }
  },
  {
    id: 'curseWomb', name: '废弃咒胎', w: 6, max: 2,
    cond: r => r.lvl >= 30,
    run: r => {
      const chance = clamp(0.3 + eventPower(r) / 720, 0.3, 0.9);
      if (Math.random() < chance) {
        const eff = rnd(2, 4), vit = rnd(1, 3);
        addStat(r, 'eff', eff); addStat(r, 'vit', vit);
        r.points += rnd(2, 5); gainXp(r, 50);
        return [`你在废弃医院里找到一枚未成形的咒胎。咒力效率 +${eff}，体质 +${vit}，行动点增加。`];
      }
      r.points -= rnd(3, 6);
      return ['咒胎在你靠近时突然睁眼。你毁掉了它，但也被残秽拖住了脚步。'];
    }
  },
  {
    id: 'oldFriend', name: '旧友的刀', w: 5, max: 1,
    cond: r => r.age >= 28,
    run: r => {
      if (Math.random() < 0.55) {
        r.points += rnd(2, 5);
        const t = grantTrait(r);
        return [`旧友把一把用旧的咒具交给你。${t ? `你从中得到词条「${t.name}」。` : '你把它收进背包。'}`];
      }
      r.points -= rnd(2, 4);
      addStat(r, 'iq', 1);
      return ['旧友已经不在原来的地方。你只找到一封被雨泡烂的信，战斗智商 +1。'];
    }
  },
  {
    id: 'tengenBarrier', name: '天元结界', w: 4, max: 1,
    cond: r => r.lvl >= 70,
    run: r => {
      if (Math.random() < 0.6) {
        const ctrl = rnd(2, 4), eff = rnd(1, 3);
        addStat(r, 'ctrl', ctrl); addStat(r, 'eff', eff); gainXp(r, 85);
        r.points += 3;
        return [`你替天元补完了一段结界。咒力操控 +${ctrl}，效率 +${eff}，行动点 +3。`];
      }
      r.points -= rnd(2, 5);
      return ['结界的排斥力把你弹了出来。你咳出一口血，行动点受损。'];
    }
  },
  {
    id: 'demonWhisper', name: '宿傩的耳语', w: 5, max: 1,
    cond: r => r.lvl >= 35,
    prompt: '新宿的废墟里，有一道不属于你的声音在笑。它说，只要点头，就能少走十年弯路。',
    options: [
      {
        id: 'listen', label: '倾听', cls: 'blood',
        desc: '55% 获得力量；45% 被咒力反噬。',
        run: r => {
          if (Math.random() < 0.55) {
            const ce = rnd(3, 6), tai = rnd(2, 4);
            if (r.cons !== 'heavenly') addStat(r, 'ce', ce);
            addStat(r, 'tai', tai); gainXp(r, 70);
            return [`你听见了斩击的节拍。${r.cons === 'heavenly' ? '' : `咒力 +${ce}，`}体术 +${tai}。`];
          }
          const loss = rnd(4, 8);
          r.points -= loss;
          return [`耳语突然变成大笑。你的术式回路被震得发麻，行动点 -${loss}。`];
        }
      },
      {
        id: 'retort', label: '反呛', cls: 'ghost',
        desc: '60% 获得感悟；40% 被拖入幻境。',
        run: r => {
          if (Math.random() < 0.6) {
            const iq = rnd(2, 3), eff = rnd(1, 2);
            addStat(r, 'iq', iq); addStat(r, 'eff', eff); gainXp(r, 40);
            return [`你没有顺着它的话走，反而从声音的缝隙里听出了破绽。战斗智商 +${iq}，效率 +${eff}。`];
          }
          const loss = rnd(3, 6);
          r.points -= loss;
          return [`幻境把你按在废墟里。你挣脱时，行动点已经 -${loss}。`];
        }
      },
      {
        id: 'leave', label: '离开', cls: 'ghost',
        desc: '稳定获得少量感悟，不承担风险。',
        run: r => {
          r.points += 2; addStat(r, 'iq', 1);
          return ['你没有回头。耳语在身后淡去，行动点 +2，战斗智商 +1。'];
        }
      }
    ]
  },
  {
    id: 'vowAltar', name: '束缚祭坛', w: 4, max: 1,
    cond: r => r.lvl >= 45,
    prompt: '地下祭坛刻满了旧时代的束缚。只要你给出代价，它就能把代价变成力量。',
    options: [
      {
        id: 'blood', label: '以血为祭', cls: 'blood',
        desc: '65% 体术与体质提升；35% 祭坛反噬。',
        run: r => {
          if (Math.random() < 0.65) {
            const tai = rnd(2, 4), vit = rnd(1, 3);
            addStat(r, 'tai', tai); addStat(r, 'vit', vit); r.points += 4;
            return [`祭坛收下了你的血。体术 +${tai}，体质 +${vit}，行动点 +4。`];
          }
          const loss = rnd(4, 8);
          r.points -= loss;
          const vit = Math.max(1, r.stats.vit - 1);
          r.stats.vit = vit;
          return [`祭坛索要的比你说的更多。行动点 -${loss}，体质 -1。`];
        }
      },
      {
        id: 'oath', label: '以名为誓', cls: 'ghost',
        desc: '55% 获得一个词条；45% 名字被祭坛吞掉一部分。',
        run: r => {
          if (Math.random() < 0.55) {
            const t = grantTrait(r);
            r.points += 2;
            return [`祭坛认可了你的名字。${t ? `获得词条「${t.name}」。` : '你的咒力变得更沉。'}`];
          }
          const loss = rnd(3, 7);
          r.points -= loss;
          return [`你的名字被刮掉了一角。行动点 -${loss}。`];
        }
      },
      {
        id: 'refuse', label: '不立誓', cls: 'ghost',
        desc: '不付出代价，获得少量咒力效率。',
        run: r => {
          r.points += 2; addStat(r, 'eff', 1);
          return ['你把祭坛留在身后。行动点 +2，咒力效率 +1。'];
        }
      }
    ]
  },
  {
    id: 'domainShard', name: '领域残片', w: 3, max: 1,
    cond: r => r.lvl >= 55 && !r.flags.domain,
    prompt: '一枚半透明的领域残片嵌在墙里。它还在呼吸，像一颗没有主人的心脏。',
    options: [
      {
        id: 'devour', label: '吞下残片', cls: 'blood',
        desc: '45% 学会领域；40% 获得咒力成长；15% 被残片撑碎。',
        run: r => {
          const roll = Math.random();
          if (roll < 0.45) {
            r.flags.domain = true;
            addStat(r, 'ctrl', 3); gainXp(r, 100);
            return ['残片在你体内展开。你学会了领域展开；咒力操控 +3。'];
          }
          if (roll < 0.85) {
            const eff = rnd(2, 4), ctrl = rnd(1, 3);
            addStat(r, 'eff', eff); addStat(r, 'ctrl', ctrl); r.points += 3;
            return [`残片没有成形，但它的结构留在了你的回路里。效率 +${eff}，操控 +${ctrl}，行动点 +3。`];
          }
          return [eventDeathOrInjury(r, '残片在你体内重新闭合。你被自己的领域压成了齑粉。', '残片即将闭合时，你以特级术师的领域抗性把它压回体外，重伤但活着。')];
        }
      },
      {
        id: 'analyze', label: '解析残片', cls: 'ghost',
        desc: '70% 提升效率与操控；30% 精神受损。',
        run: r => {
          if (Math.random() < 0.7) {
            const eff = rnd(2, 4), ctrl = rnd(1, 2);
            addStat(r, 'eff', eff); addStat(r, 'ctrl', ctrl); gainXp(r, 45);
            return [`你拆开了残片的纹路。咒力效率 +${eff}，操控 +${ctrl}。`];
          }
          r.points -= rnd(3, 6);
          return ['残片的纹路反客为主。你的精神被拖进去一瞬，行动点受损。'];
        }
      },
      {
        id: 'seal', label: '封印残片', cls: 'ghost',
        desc: '稳定获得行动点与战斗智商。',
        run: r => {
          r.points += 5; addStat(r, 'iq', 1);
          return ['你把残片封进咒具匣。行动点 +5，战斗智商 +1。'];
        }
      }
    ]
  },
  {
    id: 'junior', name: '后辈的请求', w: 4, max: 1,
    cond: r => r.lvl >= 25,
    prompt: '一个刚入学的后辈拦住你，说想看看真正的咒术师是怎么战斗的。',
    options: [
      {
        id: 'teach', label: '认真指导', cls: 'ghost',
        desc: '80% 教学相长；20% 被拖慢进度。',
        run: r => {
          if (Math.random() < 0.8) {
            const iq = rnd(2, 3);
            addStat(r, 'iq', iq); r.points += 4; gainXp(r, 35);
            return [`你把基础拆开讲了一遍，自己也理清了几个旧问题。战斗智商 +${iq}，行动点 +4。`];
          }
          r.points -= rnd(2, 4);
          return ['后辈的问题比你想象的多。你花掉了半天，行动点受损。'];
        }
      },
      {
        id: 'test', label: '带他实战', cls: 'blood',
        desc: '55% 获得词条；45% 被突发咒灵打乱。',
        run: r => {
          if (Math.random() < 0.55) {
            const t = grantTrait(r);
            r.points += 2;
            return [`你们在废弃大楼里遇到一只低级咒灵。${t ? `你护住后辈，获得词条「${t.name}」。` : '你护住了后辈。'}`];
          }
          r.points -= rnd(3, 6);
          return ['咒灵比预想中多。你带着后辈撤退，行动点受损。'];
        }
      },
      {
        id: 'decline', label: '拒绝', cls: 'ghost',
        desc: '不承担风险，获得少量行动点。',
        run: r => {
          r.points += 2; addStat(r, 'eff', 1);
          return ['你让后辈去找别的老师。行动点 +2，咒力效率 +1。'];
        }
      }
    ]
  },
  {
    id: 'shibuya', name: '涩谷事变', w: 12, max: 2,
    cond: r => r.lvl >= 40,
    prompt: '涩谷站的地下通道挤满了人。广播反复播放着避难通知，墙缝里却渗出不属于这个季节的寒气。远处，一道帐正在合拢。',
    options: [
      {
        id: 'rescue', label: '先疏散普通人', cls: 'ghost',
        desc: '稳定获得行动点、体质与经验；不会追击咒灵。',
        run: r => {
          const pts = rnd(5, 9), vit = rnd(1, 3);
          r.points += pts; addStat(r, 'vit', vit); gainXp(r, 60);
          return [`你把最后一批人推出闸机。行动点 +${pts}，体质 +${vit}，经验增加。`];
        }
      },
      {
        id: 'hunt', label: '逆着人流追杀咒灵', cls: 'blood',
        desc: '高概率获得体术、咒力与经验；失败会重伤。',
        run: r => {
          const chance = clamp(0.55 + eventPower(r) / 1000, 0.55, 0.92);
          if (Math.random() < chance) {
            const tai = rnd(2, 4), ce = r.cons === 'heavenly' ? 0 : rnd(2, 4);
            if (ce) addStat(r, 'ce', ce);
            addStat(r, 'tai', tai); gainXp(r, 85); r.points += 3;
            return [`你在帐合拢前撕开了咒灵的腹部。体术 +${tai}${ce ? `，咒力 +${ce}` : ''}，行动点 +3。`];
          }
          r.points -= rnd(4, 8);
          return ['咒灵的数量远超情报。你拖着伤腿退回地面，行动点大幅流失。'];
        }
      },
      {
        id: 'seal', label: '协助封锁结界', cls: 'ghost',
        desc: '有机会学会简易领域；否则获得效率与操控。',
        run: r => {
          if (!r.flags.simpleDomain && Math.random() < 0.55) {
            r.flags.simpleDomain = true; gainXp(r, 45);
            return ['你跟着结界班补完最后一笔符文。学会了『简易领域』。'];
          }
          const eff = rnd(2, 3), ctrl = rnd(1, 3);
          addStat(r, 'eff', eff); addStat(r, 'ctrl', ctrl); r.points += 2;
          return [`你没能完全掌握简易领域，但记住了结界的骨架。效率 +${eff}，操控 +${ctrl}，行动点 +2。`];
        }
      }
    ]
  },
  {
    id: 'auction', name: '咒具拍卖会', w: 9, max: 2,
    cond: r => r.lvl >= 35,
    prompt: '地下拍卖场的灯很暗，台上的咒具却一盏比一盏亮。主持人说，今晚最后一件拍品没有底价，也没有安全说明。',
    options: [
      {
        id: 'bid', label: '举牌竞拍', cls: 'primary',
        desc: '消耗 10 行动点，获得一个随机词条。',
        run: r => {
          if (r.points < 10) return ['你的行动点不够举牌。主持人移开了视线。'];
          r.points -= 10;
          const t = grantTrait(r);
          return [t ? `你拍下了那件咒具，从铭文里得到词条「${t.name}」。` : '你拍下了咒具，但它没有提供新的词条。'];
        }
      },
      {
        id: 'steal', label: '在散场时动手', cls: 'blood',
        desc: '55% 抢到词条与行动点；25% 受伤；20% 被咒具反噬。',
        run: r => {
          const roll = Math.random();
          if (roll < 0.55) {
            const t = grantTrait(r); r.points += rnd(3, 6);
            return [`你在后巷截住了卖家。${t ? `获得词条「${t.name}」，` : ''}行动点增加。`];
          }
          if (roll < 0.80) {
            r.points -= rnd(4, 7);
            return ['卖家早有准备。你抢到一半就被咒具震开，行动点受损。'];
          }
          if (Math.random() < 0.35) { return [eventDeathOrInjury(r, '那件咒具没有保险栓。你的身体在巷子里被自己的咒力撕开。', '咒具反噬爆发的瞬间，你以特级术师的咒力强行压住暴走，重伤脱身。')]; }
          r.points -= rnd(6, 10);
          return ['咒具反噬，你勉强保住性命，行动点几乎见底。'];
        }
      },
      {
        id: 'appraise', label: '只看不买，帮人掌眼', cls: 'ghost',
        desc: '稳定获得战斗智商与行动点。',
        run: r => {
          const iq = rnd(2, 3); addStat(r, 'iq', iq); r.points += 5;
          return [`你替一位老术师看穿了三件赝品。战斗智商 +${iq}，行动点 +5。`];
        }
      }
    ]
  },
  {
    id: 'vowContract', name: '束缚契约', w: 8, max: 1,
    cond: r => r.lvl >= 45,
    prompt: '一张没有落款的契约摊在桌上。条件写得很清楚：你交出一点自由，契约给你一点超出常理的力量。落款处已经有一个指纹。',
    options: [
      {
        id: 'accept', label: '按下指纹', cls: 'blood',
        desc: '获得诅咒词条「契阔」；若已拥有则改为全属性提升。',
        run: r => {
          const t = grantTrait(r, 'bound');
          if (t) return ['契约认可了你。你获得诅咒词条「契阔」，每次行动会多消耗一点行动点。'];
          for (const k of ['ce', 'ctrl', 'eff', 'vit', 'tai', 'iq']) addStat(r, k, 2);
          r.points -= 3;
          return ['契约在你身上找不到新的缝隙，只留下旧痕。全属性 +2，行动点 -3。'];
        }
      },
      {
        id: 'refuse', label: '把契约烧掉', cls: 'ghost',
        desc: '稳定获得行动点与效率。',
        run: r => {
          r.points += 4; addStat(r, 'eff', 1);
          return ['纸灰落地时，你听见一声很轻的叹息。行动点 +4，咒力效率 +1。'];
        }
      },
      {
        id: 'rewrite', label: '在落款处改写条件', cls: 'rainbow',
        desc: '60% 获得传说词条「束缚回响」；40% 被契约反噬。',
        run: r => {
          if (Math.random() < 0.60) {
            const t = grantTrait(r, 'vowEcho');
            return [t ? '你改写了契约的结尾。获得传说词条「束缚回响」。' : '契约已经记住了你的笔迹，但没有新的力量回应。'];
          }
          r.points -= rnd(5, 9);
          return ['契约的墨迹反过来爬上你的手腕。行动点被抽走，留下灼痕。'];
        }
      }
    ]
  },
  {
    id: 'memory', name: '走马灯', w: 6, max: 1,
    cond: r => r.lvl >= 70,
    prompt: '濒死的一瞬间，过去的日子在眼前倒放。你看见第一次握紧咒具的手，也看见某个还没有发生的结局。',
    options: [
      {
        id: 'look', label: '把走马灯看完', cls: 'ghost',
        desc: '获得大量经验与战斗智商。',
        run: r => {
          const iq = rnd(2, 4);
          addStat(r, 'iq', iq); gainXp(r, 130);
          return [`你把每一个细节都记住了。战斗智商 +${iq}，经验大幅增加。`];
        }
      },
      {
        id: 'move', label: '睁开眼，继续走', cls: 'primary',
        desc: '获得行动点与咒力。',
        run: r => {
          r.points += 7; addStat(r, 'ce', 3);
          return ['你从走马灯里挣脱出来。行动点 +7，咒力总量 +3。'];
        }
      },
      {
        id: 'grasp', label: '伸手抓住那个结局', cls: 'rainbow',
        desc: '若仍有术式未觉醒，进行一次高成功率觉醒判定；否则获得经验。',
        run: r => {
          if (nextAwakenKind(r)) {
            const ok = tryAwaken(r, '走马灯', 0.10);
            return [ok ? '你在尚未发生的结局里抓住了术式的另一面。' : '那个结局从指缝里滑走，但你看清了它的轮廓。'];
          }
          gainXp(r, 90);
          return ['术式已经没有未走完的路。你把这份经验收进身体。'];
        }
      }
    ]
  },
  {
    id: 'domainTrial', name: '领域试炼', w: 7, max: 2,
    cond: r => r.lvl >= 50,
    prompt: '一座废弃的咒术高专训练场在夜里亮起。结界自动闭合，广播里传来没有感情的电子音：请在一分钟内完成领域展开。',
    options: [
      {
        id: 'expand', label: '强行展开领域', cls: 'blood',
        desc: '已有领域则获得传说词条「领域余响」；否则 60% 学会领域。',
        run: r => {
          if (r.flags.domain) {
            const t = grantTrait(r, 'domainEcho');
            return [t ? '领域在训练场里稳定下来。获得传说词条「领域余响」。' : '领域已经足够稳定，训练场没有再给出新的东西。'];
          }
          if (Math.random() < 0.60) {
            r.flags.domain = true; addStat(r, 'ctrl', 3); gainXp(r, 100);
            return ['结界在你脚下展开。你学会了领域展开，咒力操控 +3。'];
          }
          r.points -= rnd(4, 8);
          return ['领域的骨架在最后一秒崩塌。你被反冲震伤，行动点受损。'];
        }
      },
      {
        id: 'endure', label: '用身体承受领域', cls: 'ghost',
        desc: '获得体质与防御成长，但消耗行动点。',
        run: r => {
          const vit = rnd(2, 4);
          addStat(r, 'vit', vit); r.points -= 2;
          return [`你在领域里站满了六十秒。体质 +${vit}，行动点 -2。`];
        }
      },
      {
        id: 'analyze', label: '记录结界结构', cls: 'ghost',
        desc: '获得效率、操控与经验。',
        run: r => {
          const eff = rnd(2, 4), ctrl = rnd(1, 3);
          addStat(r, 'eff', eff); addStat(r, 'ctrl', ctrl); gainXp(r, 50);
          return [`你把结界的节点画满了一整本笔记。效率 +${eff}，操控 +${ctrl}。`];
        }
      }
    ]
  },
  {
    id: 'reincarnationGate', name: '轮回之门', w: 2, max: 1, rarity: 'mythic',
    cond: r => r.lvl >= 65,
    prompt: '门立在废墟中央，门后站着另一个你。那个你没有影子，胸口却亮着和你一样的咒力回路。它说：走进去，你会得到不属于这一世的东西。',
    options: [
      {
        id: 'step', label: '走进门里', cls: 'rainbow',
        desc: '获得一个彩色词条，并留下「门后余身」：生命上限 +12%，每场额外复活 1 次。',
        run: r => {
          const t = grantTrait(r, 'reincarnator') || grantTrait(r, 'zenith') || grantTrait(r, 'chrono');
          addMythicBoon(r, 'hp', .12); addMythicBoon(r, 'revive', 1);
          if (t) return [`门后的你把手按在你胸口。获得彩色词条「${t.name}」；门后余身：生命上限 +12%，每场额外复活 1 次。`];
          gainXp(r, 180);
          return ['门后的你已经没有更多词条，但留下了门后余身：生命上限 +12%，每场额外复活 1 次。'];
        }
      },
      {
        id: 'bargain', label: '和另一个自己交易', cls: 'blood',
        desc: '60% 获得彩色词条「时之楔」与「时间债」：术式消耗 -10%；40% 被夺走行动点。',
        run: r => {
          if (Math.random() < 0.60) {
            const t = grantTrait(r, 'chrono');
            addMythicBoon(r, 'cost', .10);
            return [t ? '交易达成。获得彩色词条「时之楔」，并背负时间债：所有术式消耗 -10%。' : '另一个你摊开手：词条已经有了，但时间债仍然成立——所有术式消耗 -10%。'];
          }
          r.points -= rnd(8, 14);
          return ['另一个你拿走了一段属于你的时间。行动点大幅流失。'];
        }
      },
      {
        id: 'close', label: '把门关上', cls: 'ghost',
        desc: '稳定获得行动点、经验与六维，并留下「门之静默」：生命上限 +8%，伤害 +6%。',
        run: r => {
          r.points += 10; gainXp(r, 80);
          addStat(r, 'ce', 3); addStat(r, 'ctrl', 2);
          addMythicBoon(r, 'hp', .08); addMythicBoon(r, 'dmg', .06);
          return ['门合上时，你听见另一个自己轻轻笑了一声。行动点 +10，咒力 +3，操控 +2；门之静默：生命上限 +8%，伤害 +6%。'];
        }
      }
    ]
  },
  {
    id: 'rainbowThread', name: '万色咒线', w: 2, max: 1, rarity: 'mythic',
    cond: r => r.lvl >= 55,
    prompt: '一根看不见的线从天空垂下来，穿过你的胸口，另一端连着一个正在发光的词条。线的颜色一直在变，像是把很多人的命运拧在了一起。',
    options: [
      {
        id: 'weave', label: '把线织进身体', cls: 'rainbow',
        desc: '获得彩色词条「万象归一」或「回廊行者」，并织入「万色回路」：生命上限 +10%，伤害 +12%。',
        run: r => {
          const t = grantTrait(r, 'zenith') || grantTrait(r, 'reincarnator');
          addMythicBoon(r, 'hp', .10); addMythicBoon(r, 'dmg', .12);
          if (t) return [`咒线融进回路。获得彩色词条「${t.name}」；万色回路：生命上限 +10%，伤害 +12%。`];
          return ['咒线没有留下新词条，但织成了万色回路：生命上限 +10%，伤害 +12%。'];
        }
      },
      {
        id: 'cut', label: '一刀斩断咒线', cls: 'blood',
        desc: '获得大量经验、行动点与「断线余烬」：暴击伤害 +20%；小概率被命运反噬。',
        run: r => {
          if (Math.random() < 0.80) {
            gainXp(r, 120); r.points += 8; addMythicBoon(r, 'critDmg', .20);
            return ['咒线断开，散成漫天光点。经验大幅增加，行动点 +8；断线余烬：暴击伤害 +20%。'];
          }
          r.points -= rnd(6, 10);
          return ['断口喷出不属于你的记忆。你站在原地很久，行动点受损。'];
        }
      },
      {
        id: 'follow', label: '顺着线走', cls: 'ghost',
        desc: '获得随机词条、经验与「线外之身」：领域持续 +1 回合；可能遇到另一段人生。',
        run: r => {
          const t = grantTrait(r); gainXp(r, 70); addMythicBoon(r, 'domainTurn', 1);
          return [t ? `线的另一端系着一个词条。获得「${t.name}」；线外之身：领域持续 +1 回合。` : '线的另一端什么也没有，只留下线外之身：领域持续 +1 回合。'];
        }
      }
    ]
  }
];

function doEvent(run) {
  const pool = EVENTS.filter(e =>
    e.cond(run) && (run.eventCounts[e.id] || 0) < e.max
  );
  if (!pool.length) return null;
  const total = pool.reduce((a, e) => a + e.w, 0);
  let r = Math.random() * total, chosen = pool[0];
  for (const e of pool) { r -= e.w; if (r <= 0) { chosen = e; break; } }
  run.eventCounts[chosen.id] = (run.eventCounts[chosen.id] || 0) + 1;
  const mythic = chosen.rarity === 'mythic';
  if (chosen.options) {
    run.pendingEvent = { id: chosen.id, name: chosen.name };
    run.log.push({ text: `【${mythic ? '彩色事件' : '事件'}·${chosen.name}】`, cls: mythic ? 'rainbow' : 'purple' });
    run.log.push({ text: chosen.prompt, cls: mythic ? 'rainbow' : 'big' });
    return null;
  }
  const msgs = chosen.run(run) || [];
  run.log.push({ text: `【${mythic ? '彩色事件' : '事件'}·${chosen.name}】`, cls: mythic ? 'rainbow' : 'purple' });
  for (const m of msgs) run.log.push({ text: m, cls: run.dead ? 'dmg' : 'sys' });
  return msgs;
}

function resolveEventChoice(run, choiceId) {
  const pending = run && run.pendingEvent;
  if (!pending) return [];
  const ev = EVENTS.find(e => e.id === pending.id);
  const opt = ev && ev.options && ev.options.find(o => o.id === choiceId);
  run.pendingEvent = null;
  if (!opt) return [];
  run.log.push({ text: `【抉择·${ev.name}】${opt.label}`, cls: ev.rarity === 'mythic' ? 'rainbow' : 'gold' });
  const msgs = opt.run(run) || [];
  for (const m of msgs) run.log.push({ text: m, cls: run.dead ? 'dmg' : 'sys' });
  if (run.points < 0) run.points = 0;
  checkUnlocks(run);
  if (run.dead) {
    run.phase = 'over';
    run.mode = 'dead';
  } else if (run.points <= 0 || run.age >= AGE_LIMIT) {
    const why = run.age >= AGE_LIMIT ? '身体到达极限' : '行动点耗尽';
    if (run.lvl >= 90) {
      run.phase = 'duel';
      run.log.push({ text: `${why}。宿傩就在新宿的废墟上等你。`, cls: 'big' });
    } else {
      run.phase = 'over';
      run.mode = 'points';
      run.log.push({ text: `${why}。以你现在的等级，连站在宿傩面前的资格都没有。`, cls: 'dmg' });
    }
  }
  return msgs;
}

/* ---------------- 剧情 ---------------- */

const PLOTS = [
  { id: 'p1', lv: 10, name: '少年院', text: '少年院的走廊里，咒胎的哭声比诅咒更刺耳。',
    fx: r => { addStat(r, 'vit', 2); addStat(r, 'tai', 2); } },
  { id: 'p2', lv: 20, name: '幼鱼与逆罚', text: '你第一次明白，诅咒也可以来自活人。',
    fx: r => { addStat(r, 'iq', 2); addStat(r, 'ctrl', 1); } },
  { id: 'p3', lv: 30, name: '京都姊妹校交流会', text: '花御的咒力像森林一样压过来。',
    fx: r => { addStat(r, 'tai', 2); addStat(r, 'ce', 2); } },
  { id: 'p4', lv: 40, name: '怀玉', text: '那个夏天，最强与最强并肩走过。',
    fx: r => { addStat(r, 'ctrl', 3); addStat(r, 'eff', 2); } },
  { id: 'p5', lv: 50, name: '涩谷事变', text: '狱门疆落下。你看见了「最强」也会被封印。',
    fx: r => { addStat(r, 'ce', 3); addStat(r, 'ctrl', 2); if (r.cons !== 'heavenly') r.flags.rct = true; } },
  { id: 'p6', lv: 60, name: '狱门疆', text: '结界内部没有时间。你在寂静里打磨咒力。',
    fx: r => { addStat(r, 'eff', 3); addStat(r, 'iq', 2); } },
  { id: 'p7', lv: 70, name: '死灭回游', text: '结界、规则、点数。你开始把战斗当成算术。',
    fx: r => { addStat(r, 'iq', 3); addStat(r, 'ce', 2); addStat(r, 'tai', 2); } },
  { id: 'p8', lv: 80, name: '仙台结界', text: '四天王的领域交错，你在缝隙里找到了自己的答案。',
    fx: r => { addStat(r, 'ctrl', 3); addStat(r, 'eff', 2); } },
  { id: 'p9', lv: 85, name: '东京第一结界', text: '城市变成咒灵的巢。你一步步清理到中心。',
    fx: r => { addStat(r, 'vit', 3); addStat(r, 'tai', 2); } },
  { id: 'p10', lv: 90, name: '樱岛结界', text: '你终于站到了「特级」这个词的上方。',
    fx: r => { addStat(r, 'ce', 4); addStat(r, 'ctrl', 2); } },
  { id: 'p11', lv: 94, name: '人外魔境·新宿决战', text: '五条悟与宿傩的战斗把天空撕成两半。你在看台上记住了每一招。',
    fx: r => { addStat(r, 'iq', 4); addStat(r, 'ctrl', 3); addStat(r, 'eff', 2); } },
  { id: 'p12', lv: 99, name: '向南', text: '你不再问「能不能赢」。你只问「要怎么赢」。',
    fx: r => { addStat(r, 'ce', 5); addStat(r, 'vit', 4); addStat(r, 'tai', 3); addStat(r, 'iq', 3); } }
];

function doPlot(run) {
  const pool = PLOTS.filter(p => run.lvl >= p.lv && !run.plotDone.includes(p.id));
  if (!pool.length) return null;
  const p = pick(pool);
  run.plotDone.push(p.id);
  run.log.push({ text: `【剧情·${p.name}】`, cls: 'gold' });
  run.log.push({ text: p.text, cls: 'big' });
  p.fx(run);
  run.log.push({ text: '你在这一战中留下了什么。六维得到提升。', cls: 'sys' });
  checkUnlocks(run);
  return [p.name];
}

/* ---------------- 年度推进 ---------------- */

function advanceAction(run) {
  if (run.phase !== 'sim' || run.pendingEvent) return [];
  run.actions = (run.actions || 0) + 1;
  run.points -= 1 + traitVal(run, 'pointsDrain');
  run.age = Math.round((run.age + 0.15) * 100) / 100;
  const before = run.log.length;

  train(run);
  gainXp(run, xpGain(run));
  checkUnlocks(run);

  if (run.lvl >= 90 && run.weak.length < 5 && Math.random() < 0.02 * (1 + traitVal(run, 'weakChance'))) {
    addWeak(run);
  }
  if (Math.random() < 0.24 * (1 + traitVal(run, 'eventChance'))) doEvent(run);
  if (!run.dead && !run.pendingEvent && Math.random() < 0.07 * (1 + traitVal(run, 'eventChance') * 0.5)) doPlot(run);

  if (run.log.length > before) {
    run.log.splice(before, 0, { text: `── 行动 ${run.actions} · ${run.age.toFixed(1)} 岁 ──`, cls: 'year' });
  }

  if (run.pendingEvent) {
    if (run.points < 0) run.points = 0;
    return run.log.slice(-6);
  }
  if (run.points < 0) run.points = 0;
  if (run.dead) {
    run.phase = 'over';
    run.mode = 'dead';
    return run.log.slice(-6);
  }
  if (run.points <= 0 || run.age >= AGE_LIMIT) {
    const why = run.age >= AGE_LIMIT ? '身体到达极限' : '行动点耗尽';
    if (run.lvl >= 90) {
      run.phase = 'duel';
      run.log.push({ text: `${why}。宿傩就在新宿的废墟上等你。`, cls: 'big' });
    } else {
      run.phase = 'over';
      run.mode = 'points';
      run.log.push({ text: `${why}。以你现在的等级，连站在宿傩面前的资格都没有。`, cls: 'dmg' });
    }
  }
  return run.log.slice(-6);
}

const advanceYear = advanceAction;

/* ---------------- 战斗派生 ---------------- */

function derived(run) {
  const s = run.stats;
  let maxHp = 350 + s.vit * 28 + s.ce * 3;
  let atk = 22 + s.ce * 0.65 + s.tai * 1.0 + s.iq * 0.35;
  let def = 15 + s.vit * 1.1 + s.ctrl * 0.45 + s.eff * 0.2;
  let maxCe = 80 + s.ce * 9;
  let regen = 8 + s.eff * 0.45;
  if (run.cons === 'heavenly') {
    maxHp = 520 + s.vit * 38;
    atk = 30 + s.tai * 1.6 + s.vit * 0.5 + s.iq * 0.4;
    def = 20 + s.vit * 1.5;
    maxCe = 0; regen = 0;
  }
  if (run.tech === 'idleTransfig') def *= 0.88;
  if (run.cons === 'sixEyes') maxCe *= 1.1;
  if (run.cons === 'curse') maxHp *= 1.2;
  if (run.cons === 'star') maxHp *= 1.08;
  maxHp += traitVal(run, 'hp');
  maxHp *= 1 + traitVal(run, 'hpPct');
  atk *= 1 + traitVal(run, 'atkPct');
  def *= 1 + traitVal(run, 'defPct');
  const mb = run.mythicBoons || {};
  maxHp *= 1 + (mb.hp || 0);
  atk *= 1 + (mb.atk || 0);
  maxCe += traitVal(run, 'maxCe');
  regen += traitVal(run, 'regen');
  const rp = k => ((run.refine && run.refine[k]) || 0) / 100;
  maxHp *= 1 + rp('vit') * 0.01 + rp('ce') * 0.002;
  atk *= 1 + rp('tai') * 0.01 + rp('ce') * 0.002 + rp('iq') * 0.002;
  def *= 1 + rp('ctrl') * 0.01 + rp('vit') * 0.002;
  maxCe *= 1 + rp('ce') * 0.01 + rp('eff') * 0.002;
  regen *= 1 + rp('eff') * 0.01;
  if (run.cons === 'heavenly') { maxCe = 0; regen = 0; }
  return {
    maxHp: Math.round(maxHp), atk: Math.round(atk), def: Math.round(def),
    maxCe: Math.max(0, Math.round(maxCe)), regen: Math.max(0, Math.round(regen))
  };
}

function awakenMove(run, kind) {
  const tech = TECHS[run.tech];
  const noCe = run.cons === 'heavenly';
  const name = awakenName(run, kind);
  const base = { id: 'aw_' + kind, name, awaken: kind, body: noCe };
  if (kind === 'reverse') {
    return { ...base, cost: noCe ? 0 : 55, kind: 'atk', power: noCe ? 2.6 : 3.0, ignore: .3, cd: 2,
      desc: `${AWAKEN_DESC.reverse}${noCe ? ' 以咒具模拟反转。' : ''}` };
  }
  if (kind === 'maximum') {
    return { ...base, cost: noCe ? 0 : 95, kind: 'atk', power: noCe ? 4.2 : 4.4, ignore: .4, cd: 3,
      desc: `${AWAKEN_DESC.maximum}${noCe ? ' 以咒具完成极之番。' : ''}` };
  }
  if (kind === 'expand') {
    return { ...base, cost: noCe ? 0 : 45, kind: 'atk', power: noCe ? 1.95 : 2.1, hits: 2, ignore: .5,
      desc: `${AWAKEN_DESC.expand}${noCe ? ' 咒具的作用范围被扩张。' : ''}` };
  }
  return { ...base, cost: noCe ? 0 : 30, kind: 'counter', guardTurns: 2, guardReduce: .65,
    buff: { atk: .18, turns: 2 }, desc: `${AWAKEN_DESC.amplify}${noCe ? ' 以咒具外壳模拟。' : ''}` };
}

function genericDomainMove(run) {
  const name = run.domainName || run.techName;
  const noCe = run.cons === 'heavenly';
  const fx = DOMAIN_FX[name] || DEFAULT_DOMAIN_FX;
  return {
    id: 'aw_domain', name: `领域展开·${name}`, cost: noCe ? 0 : 150, kind: 'domain', power: 1.9,
    body: noCe,
    desc: `${fx.desc}${noCe ? ' 以咒具与肉体强行划出结界。' : ''}`
  };
}

function movesOf(run) {
  const tech = TECHS[run.tech];
  let arr = tech.moves.map(m => ({ ...m }));
  if (run.tech === 'copy') arr = arr.concat(run.copiedMoves.map(m => ({ ...m })));
  if (run.tech2 && TECHS[run.tech2]) {
    const t2 = TECHS[run.tech2];
    arr = arr.concat(t2.moves
      .filter(m => m.req !== 'domain' && m.req !== 'sixeyes')
      .map(m => ({
        ...m, id: 't2_' + m.id, name: '第二术式·' + m.name,
        cost: typeof m.cost === 'number' ? Math.max(0, Math.round(m.cost * 1.15)) : m.cost,
        desc: `第二术式：${m.desc || ''}`
      })));
  }
  if (run.cons === 'ninePhases' && run.tech === 'bloodManip') {
    const stage = run.bloodStage || 1;
    arr = arr.filter(m => (m.bloodStage || 0) <= stage);
  }
  arr = arr.filter(m => {
    if (m.req === 'sixeyes') return run.cons === 'sixEyes';
    if (m.req === 'domain') return run.flags.domain;
    return true;
  });
  for (const kind of ['reverse', 'amplify', 'maximum', 'expand']) {
    if (run.awaken && run.awaken[kind]) arr.push(awakenMove(run, kind));
  }
  if (run.flags.domain && !tech.domain) arr.push(genericDomainMove(run));
  for (const key of ['simpleDomain', 'fallingBlossom', 'hollowWicker']) {
    if (run.flags[key] && run.cons !== 'heavenly') arr.push({ ...DOMAIN_COUNTERS[key] });
  }
  if (run.flags.burnoutFix) arr.push({ ...BURNOUT_FIX_MOVE, cost: run.cons === 'heavenly' ? 0 : BURNOUT_FIX_MOVE.cost });
  arr = arr.concat(UNIVERSAL.map(m => ({ ...m })));
  arr = arr.map(m => {
    if (m.kind !== 'domain') return m;
    const name = String(m.name || '').replace('领域展开·', '');
    const fx = DOMAIN_FX[name];
    return fx ? { ...m, desc: fx.desc } : m;
  });
  if (run.flags.rct && run.cons !== 'heavenly') arr.push({ ...RCT_MOVE });
  if (run.cons === 'heavenly') arr = arr.map(m => ({ ...m, body: true }));
  const mastery = run.techMastery || 0;
  if (mastery) {
    const dmgMul = 1 + mastery * 0.04;
    const costMul = 1 - mastery * 0.03;
    arr = arr.map(m => {
      const out = { ...m };
      if (typeof out.power === 'number') out.power = Math.round(out.power * dmgMul * 100) / 100;
      if (typeof out.cost === 'number' && out.cost > 0) out.cost = Math.max(1, Math.round(out.cost * costMul));
      return out;
    });
  }
  return arr;
}

function isBodyMove(mv) {
  return !!mv && (!!mv.body || ['basic', 'guard', 'dodge', 'breath'].includes(mv.id));
}

function moveById(run, id) {
  return movesOf(run).find(m => m.id === id);
}

function effectiveCost(run, mv, extra) {
  let cost = mv.cost || 0;
  if (cost > 0) {
    let mod = extra || 1;
    if (run.cons === 'sixEyes') mod *= run.tech === 'limitless' ? 0.6 : 0.85;
    if (run.tech === 'limitless' && run.cons !== 'sixEyes') mod *= 1.8;
    mod *= 1 - Math.min(0.35, run.stats.eff * 0.0025);
    mod *= 1 - Math.min(0.40, (run.mythicBoons && run.mythicBoons.cost) || 0);
    mod = Math.max(0.2, mod * (1 + traitVal(run, 'cost')));
    cost = Math.max(1, Math.round(cost * mod));
  }
  return cost;
}

/* ---------------- 宿傩战 ---------------- */

const SUKU_STAGE_NAMES = { 1: '十影宿傩', 2: '原身宿傩' };

function startDuel(run) {
  const d = derived(run);
  const diff = diffOf(run.difficulty);
  const sukuTotal = Math.round((10920 + run.lvl * 57) * diff.enemyHp);
  const stage1Max = Math.round(sukuTotal * 0.54);
  const stage2Max = sukuTotal - stage1Max;
  const baseAtk = Math.round((244 + run.lvl * 0.85) * diff.enemyAtk);
  const baseDef = Math.round((160 + run.lvl * 0.52) * diff.enemyDef);
  const stage1Atk = Math.round(baseAtk * 1.20);
  const stage2Atk = Math.round(baseAtk * 1.55);
  const duel = {
    run, turn: 1, over: false, result: null, busy: false, vowThisTurn: false,
    weakStrikeUsed: false,
    log: [],
    player: {
      hp: d.maxHp, maxHp: d.maxHp, ce: d.maxCe, maxCe: d.maxCe,
      atk: d.atk, def: d.def, regen: d.regen,
      shield: 0, evade: 0, dodgeBuff: 0,
      atkBuff: 0, atkBuffT: 0, defBuff: 0, defBuffT: 0,
      bleed: 0, burn: 0, skip: 0,
      domainTurns: 0, burnout: 0, burnoutFixUsed: false, domainGuard: null,
      vowAtk: 1, vowVuln: 1, vowCrit: false, vowSure: false,
      costMod: 1, defDownPerm: 0, sealed: [], cd: {},
      extraDmgBuff: 0, extraDmgBuffT: 0, resistPenBuff: 0, resistPenBuffT: 0,
      revive: (run.cons === 'vessel' ? 1 : 0) + traitVal(run, 'revive') + ((run.mythicBoons && run.mythicBoons.revive) || 0),
      spirits: run.tech === 'spiritManip' ? 3 : 0,
      rctUses: 0, shouts: 0,
      focusShot: false, sureGuardUsed: false, vowEchoUsed: false, critStack: 0, zenithNuke: false, spaceGuard: 0
    },
    suku: {
      hp: stage1Max, maxHp: stage1Max, totalMax: sukuTotal,
      stage: 1, stage2Max: stage2Max,
      atk: stage1Atk, def: baseDef, resist: .10, resistDown: 0, resistDownT: 0,
      stage2Atk, stage2Def: Math.round(baseDef * 1.14),
      bleed: 0, burn: 0, freeze: 0, stun: 0,
      atkDebuff: 0, atkDebuffT: 0, defDebuff: 0, defDebuffT: 0,
      domainTurns: 0, domainUsed: false, tenDomainUsed: false,
      worldUsed: false, mahoSummoned: false, agitoSummoned: false, gridUsed: false,
      summons: { agito: false, maho: false }, justChanged: false,
      intent: null, cd: {}, healUsed: {}, lastMove: null,
      mahoraga: false, forceIntent: null, worldWarned: false
    },
    vowUsed: {}
  };
  pushDuel(duel, '十影宿傩站在新宿的废墟上。影子在他脚下铺开，像一片正在呼吸的海。', 'big');
  pushDuel(duel, '这一战有两具身体：先夺舍十影，再取回原身。两阶段生命独立结算。', 'gold');
  pushDuel(duel, `你的生命 ${d.maxHp}，攻击 ${d.atk}，防御 ${d.def}，咒力 ${d.maxCe}。`, 'sys');
  pushDuel(duel, `宿傩的伤害抗性 ${Math.round(duel.suku.resist * 100)}%：额外伤害区会被抗性削减。`, 'gold');
  if (run.weak.length) {
    pushDuel(duel, `已看破 ${run.weak.length} 处弱点：对宿傩伤害 +${Math.round(weakBonus(run) * 100)}%。`, 'gold');
  }
  if (run.traits && run.traits.length) {
    pushDuel(duel, `词条：${run.traits.map(t => t.name).join('、')}。`, 'sys');
  }
  rollIntent(duel);
  announceWorldWarning(duel);
  return duel;
}

function pushDuel(d, text, cls) {
  d.log.push({ text, cls: cls || '' });
  if (d.log.length > 240) d.log.splice(0, d.log.length - 240);
}

function rollIntent(d) {
  const s = d.suku;
  if (s.forceIntent === 'summonAgito') {
    s.forceIntent = null;
    s.intent = { id: 'summonAgito', name: '召唤·颚吐', summon: 'agito', mult: 1.2, sure: false, w: 0 };
    return;
  }
  if (s.forceIntent === 'summonMaho') {
    s.forceIntent = null;
    s.intent = { id: 'summonMaho', name: '召唤·魔虚罗', summon: 'maho', mult: 1.5, sure: false, w: 0 };
    return;
  }
  if (s.forceIntent === 'grid') {
    s.forceIntent = null; s.gridUsed = true;
    s.intent = { id: 'grid', name: '网格解', mult: .82, hits: 7, ignore: .38, bleed: 1, sure: true };
    return;
  }
  if (s.forceIntent === 'domain') {
    s.forceIntent = null; s.domainUsed = true;
    s.intent = { id: 'domain', name: '领域展开·伏魔御厨子', domainName: '伏魔御厨子', mult: 2.2, sure: true, domain: true };
    return;
  }
  if (s.forceIntent === 'world') {
    s.forceIntent = null; s.worldUsed = true;
    s.intent = { id: 'world', name: '空间斩「世界」', mult: 6.0, sure: true, ignore: .75, cd: 4 };
    return;
  }

  let pool;
  if (s.stage === 1) {
    pool = [
      { id: 'dogs', name: '玉犬·双咬', mult: 1.1, w: 4, hits: 2 },
      { id: 'nue', name: '鵺', mult: 2.0, w: 4 },
      { id: 'elephant', name: '满象', mult: 2.45, w: 2, cd: 2 },
      { id: 'sword', name: '八握剑', mult: 3.05, w: 2, cd: 2 }
    ];
    if (!s.domainUsed) pool.push({ id: 'domain', name: '领域展开·伏魔御厨子', domainName: '伏魔御厨子', mult: 2.2, w: 5, sure: true, domain: true });
  } else {
    pool = [
      { id: 'kai', name: '解', mult: 2.0, w: 4 },
      { id: 'hachi', name: '捌', mult: 1.65, w: 3, bleed: 2 },
      { id: 'kai3', name: '解·三连', mult: .95, w: 2, hits: 3 },
      { id: 'grid', name: '网格解', mult: .82, w: 4, hits: 7, ignore: .38, bleed: 1 },
      { id: 'kafu', name: '火焰·竈', mult: 2.8, w: 3, burn: 2, cd: 3 }
    ];
    if (!s.domainUsed) pool.push({ id: 'domain', name: '领域展开·伏魔御厨子', domainName: '伏魔御厨子', mult: 2.2, w: 6, sure: true, domain: true });
    if (!s.worldUsed) pool.push({ id: 'world', name: '空间斩「世界」', mult: 6.0, w: 3, sure: true, ignore: .75, cd: 4 });
    if (s.worldUsed) pool.push({ id: 'kai7', name: '解·七连', mult: .62, w: 2, hits: 7, cd: 4 });
  }
  const avail = pool.filter(o => !o.cd || !(s.cd[o.id] > 0));
  const use = avail.length ? avail : pool.filter(o => !o.domain);
  const total = use.reduce((a, o) => a + o.w, 0);
  let r = Math.random() * total, chosen = use[0];
  for (const o of use) { r -= o.w; if (r <= 0) { chosen = o; break; } }
  s.intent = chosen;
}

function worldIncoming(s) {
  return !!(s && ((s.intent && s.intent.id === 'world') || s.forceIntent === 'world'));
}

function announceWorldWarning(d) {
  const s = d.suku;
  if (!worldIncoming(s) || s.worldWarned) return;
  s.worldWarned = true;
  pushDuel(d, '空间斩「世界」已经锁定。你有一回合准备：使用「空间抗性」可抵消必中并把本次伤害压低 80%；若不应对，单次伤害最高为最大生命的 80%。', 'big');
}

function tickSukuStatus(d) {
  const s = d.suku;
  if (s.resistDownT > 0) {
    s.resistDownT--;
    if (s.resistDownT <= 0) s.resistDown = 0;
  }
  if (s.bleed > 0) {
    const dmg = Math.round(s.maxHp * 0.015 * s.bleed);
    s.hp -= dmg;
    pushDuel(d, `斩击的伤口仍在撕裂，宿傩受到 ${money(dmg)} 点流血伤害。`, 'purple');
    s.bleed--;
  }
  if (s.burn > 0) {
    const dmg = Math.round(s.maxHp * 0.025 * s.burn);
    s.hp -= dmg;
    pushDuel(d, `竈的火焰附着在肉上，宿傩受到 ${money(dmg)} 点灼烧伤害。`, 'purple');
    s.burn--;
  }
  if (s.hp <= 0) checkSukuPhase(d);
}

function healSuku(d) {
  const s = d.suku;
  const heal = Math.round(s.maxHp * 0.15);
  s.hp = Math.min(s.maxHp, s.hp + heal);
  s.healUsed[s.stage] = true;
  pushDuel(d, `宿傩结出反转术式的印。伤口逆流，回复 ${money(heal)} 点生命。`, 'red');
}

function summonAct(d, key) {
  const s = d.suku, p = d.player;
  const isMaho = key === 'maho';
  const base = s.atk * (isMaho ? 1.55 : 1.25) * (1 - s.atkDebuff);
  const def = p.def * (1 + p.defBuff) - p.defDownPerm;
  let dmg = Math.max(1, base - def * (isMaho ? 0.25 : 0.45));
  dmg *= rf(0.92, 1.08) * p.vowVuln;
  if (p.shield > 0) dmg *= (1 - p.shield);
  if (d.run.cons === 'heavenly') dmg *= 0.7;
  dmg *= 1 + traitVal(d.run, 'taken');
  dmg = Math.max(1, Math.round(dmg));
  p.hp -= dmg;
  if (isMaho) {
    s.lastSummonDamage = dmg;
    pushDuel(d, `魔虚罗抡起八握剑，轮盘转动——你受到 ${money(dmg)} 点伤害。`, 'dmg');
  } else {
    p.bleed += 1;
    pushDuel(d, `颚吐从影中扑出，利齿撕开伤口——你受到 ${money(dmg)} 点伤害，流血 1 层。`, 'dmg');
  }
}

function sukuTurn(d) {
  if (d.over) return;
  const s = d.suku, p = d.player;

  tickSukuStatus(d);
  if (d.over) return;
  if (s.domainTurns > 0) {
    const aura = Math.max(1, Math.round(p.maxHp * 0.02));
    p.hp -= aura;
    pushDuel(d, `伏魔御厨子的领域仍在侵蚀你，受到 ${money(aura)} 点必中伤害。`, 'dmg');
    if (p.hp <= 0) {
      if (p.revive > 0) {
        p.revive--;
        p.hp = Math.round(p.maxHp * 0.35);
        if (traitVal(d.run, 'cleanse') > 0) { p.bleed = 0; p.burn = 0; }
        pushDuel(d, d.run.cons === 'vessel' ? '领域几乎把你磨碎，但容器里的另一道灵魂把你推了回来。' : '领域几乎把你磨碎，但某种更古老的力量把你推了回来。', 'big');
      } else {
        p.hp = 0; d.over = true; d.result = 'lose';
        pushDuel(d, '伏魔御厨子合拢。你的身体在领域里失去了形状。', 'big');
        return;
      }
    }
  }
  if (s.justChanged) { s.justChanged = false; endEnemyTurn(d); return; }

  if (p.domainTurns > 0) {
    const fx = domainFxFor(d.run, { name: `领域展开·${p.domainName || d.run.domainName}` });
    applyDomainTurn(d, fx);
    p.domainTurns--;
    checkSukuPhase(d);
    if (d.over) return;
    if (s.justChanged) { s.justChanged = false; endEnemyTurn(d); return; }
  }

  if (s.freeze > 0) {
    s.freeze--;
    pushDuel(d, '冰层封住了宿傩的动作。这一回合，他无法出招。', 'purple');
    endEnemyTurn(d);
    return;
  }
  if (s.stun > 0) {
    s.stun--;
    pushDuel(d, '咒言/束缚生效。宿傩停在原地，四只手同时僵住。', 'purple');
    endEnemyTurn(d);
    return;
  }
  if (s.hp < s.maxHp * 0.60 && !s.healUsed[s.stage]) {
    healSuku(d);
    endEnemyTurn(d);
    return;
  }

  const intent = s.intent || { id: 'kai', name: s.stage === 1 ? '玉犬·双咬' : '解', mult: s.stage === 1 ? .95 : 1.75, hits: s.stage === 1 ? 2 : 1 };
  s.intent = null;
  s.lastMove = intent;
  if (intent.id === 'world') s.worldUsed = true;
  const spaceGuarded = intent.id === 'world' && (p.spaceGuard || 0) > 0;
  if (spaceGuarded) {
    p.spaceGuard = 0;
    intent.mult *= 0.2;
    intent.sure = false;
    pushDuel(d, '空间抗性生效。『世界』的斩击被你提前压偏，必中被抵消，伤害大幅降低。', 'rainbow');
  }
  if (intent.cd) s.cd[intent.id] = intent.cd;
  if (intent.summon) {
    s.summons[intent.summon] = true;
    pushDuel(d, intent.summon === 'agito'
      ? '「颚吐。」影子裂开，一只缠绕咒力的式神从宿傩背后站起。'
      : '「魔虚罗。」轮盘转动，八握剑异戒神将从影中显形。', 'big');
    pushDuel(d, '召唤物落地即行动——它会和宿傩一起向你出手。', 'red');
  }

  if (intent.domain) {
    if (p.domainTurns > 0) {
      intent.sure = false;
      intent.mult *= 0.82;
      pushDuel(d, '你的领域与宿傩的领域正面咬合，结界互相抵消了一瞬。', 'gold');
      pushDuel(d, '宿傩的领域未能展开，这一击的必中被压掉了。', 'purple');
    } else if (p.domainGuard && p.domainGuard.turns > 0) {
      const guard = p.domainGuard;
      intent.sure = false;
      intent.mult *= guard.reduce >= 1 ? 0 : Math.max(0.15, 1 - guard.reduce);
      if (guard.reflect) {
        const ref = Math.round(s.maxHp * 0.035);
        s.hp -= ref;
        pushDuel(d, `『${guard.name}』反震宿傩，造成 ${money(ref)} 点伤害。`, 'gold');
      }
      pushDuel(d, `你以『${guard.name}』抵消了领域展开的必中，领域伤害被削减 ${Math.round(guard.reduce * 100)}%。`, 'purple');
    } else {
      s.domainTurns = 3;
      s.domainUsed = true;
      pushDuel(d, '「领域展开·伏魔御厨子。」', 'big');
      pushDuel(d, s.stage === 1 ? '十影与斩击在结界里重叠。接下来三回合，宿傩的斩击必中。' : '白骨与刀山在结界里展开。接下来三回合，斩击必中。', 'red');
    }
  }

  let sure = !!intent.sure && d.run.cons !== 'heavenly';
  if (sure && traitVal(d.run, 'sureGuard') > 0 && !p.sureGuardUsed) {
    p.sureGuardUsed = true;
    const cut = Math.min(0.9, traitVal(d.run, 'sureGuard'));
    intent.mult *= 1 - cut;
    const heal = Math.round(p.maxHp * traitVal(d.run, 'sureHeal'));
    if (heal > 0) p.hp = Math.min(p.maxHp, p.hp + heal);
    pushDuel(d, `空间的必中轨迹被你看穿。『${intent.name}』的伤害降低 ${Math.round(cut * 100)}%${heal ? `，回复 ${money(heal)} 点生命` : ''}。`, traitVal(d.run, 'sureGuard') >= 0.8 ? 'rainbow' : 'purple');
  }

  // 不义游戏：每第三回合自动交换
  if (d.run.tech === 'boogieWoogie' && d.turn % 3 === 0 && !sure) {
    pushDuel(d, '你拍了下手。宿傩的斩击落空——你们的位置在最后一刻交换了。', 'purple');
    endEnemyTurn(d);
    return;
  }

  let dodged = false;
  const dodgeChance = (p.evade || 0) + p.dodgeBuff + 0.02 + d.run.stats.tai * 0.0015 + traitVal(d.run, 'dodge');
  if (!sure && Math.random() < dodgeChance) {
    dodged = true;
    pushDuel(d, `你侧身避开了『${intent.name}』。`, 'green');
  }

  if (!dodged && !intent.summon) {
    const hits = intent.hits || 1;
    let total = 0, crit = false;
    for (let i = 0; i < hits; i++) {
      let raw = s.atk * intent.mult * (1 - s.atkDebuff);
      let def = p.def * (1 + p.defBuff) - p.defDownPerm;
      if (p.hp <= p.maxHp * 0.40) def *= 1 + traitVal(d.run, 'lowDef');
      let dmg = Math.max(1, raw - def * 0.5);
      dmg *= rf(0.9, 1.12);
      if (s.domainTurns > 0) dmg *= 1.15;
      dmg *= p.vowVuln;
      if (Math.random() < 0.08) { dmg *= 1.5; crit = true; }
      if (p.shield > 0) dmg *= (1 - p.shield);
      if (d.run.cons === 'heavenly') dmg *= 0.7;
      dmg *= 1 + traitVal(d.run, 'taken');
      if (p.hp <= p.maxHp * 0.40) dmg *= 1 + traitVal(d.run, 'lowTaken');
      total += Math.round(dmg);
    }
    if (intent.id === 'world') {
      const cap = Math.round(p.maxHp * (spaceGuarded ? 0.55 : 0.80));
      if (total > cap) {
        total = cap;
        pushDuel(d, spaceGuarded ? '空间抗性把「世界」的余波压到最大生命的 55%。' : '「世界」的余波被限制在最大生命的 80%。', spaceGuarded ? 'rainbow' : 'purple');
      }
    }
    p.hp -= total;
    s.lastDamage = total;
    pushDuel(d, `宿傩以『${intent.name}』斩来——你受到 ${money(total)} 点伤害${crit ? '（会心一击）' : ''}。`, 'dmg');
    if (intent.bleed) {
      p.bleed += intent.bleed;
      pushDuel(d, `伤口无法闭合，流血 ${intent.bleed} 层。`, 'red');
    }
    if (intent.burn) {
      p.burn += intent.burn;
      pushDuel(d, `竈的火焰附着在你身上，灼烧 ${intent.burn} 层。`, 'red');
    }
    if (p.hp > 0 && traitVal(d.run, 'counter') > 0) {
      const ref = Math.max(1, Math.round(p.def * traitVal(d.run, 'counter')));
      s.hp -= ref;
      pushDuel(d, `反震回敬宿傩 ${money(ref)} 点伤害。`, 'purple');
      checkSukuPhase(d);
      if (d.over) return;
    }
  }

  if (s.summons && s.summons.agito) summonAct(d, 'agito');
  if (s.summons && s.summons.maho) summonAct(d, 'maho');

  p.shield = 0;
  if (p.hp <= 0) {
    if (p.revive > 0) {
      p.revive--;
      p.hp = Math.round(p.maxHp * 0.35);
      if (traitVal(d.run, 'cleanse') > 0) { p.bleed = 0; p.burn = 0; }
      pushDuel(d, d.run.cons === 'vessel' ? '宿傩的斩击贯穿了心脏——但容器里的另一道灵魂把你推了回来。你活了下来。' : '宿傩的斩击贯穿了心脏——某种更古老的力量把你推了回来。你活了下来。', 'big');
    } else {
      p.hp = 0;
      d.over = true; d.result = 'lose';
      pushDuel(d, '你的身体在斩击中失去了形状。', 'big');
      return;
    }
  }
  endEnemyTurn(d);
}

function endEnemyTurn(d) {
  const s = d.suku, p = d.player;
  p.vowVuln = 1;
  for (const k in s.cd) if (s.cd[k] > 0) s.cd[k]--;
  if (s.atkDebuffT > 0) { s.atkDebuffT--; if (s.atkDebuffT === 0) s.atkDebuff = 0; }
  if (s.defDebuffT > 0) { s.defDebuffT--; if (s.defDebuffT === 0) s.defDebuff = 0; }
  if (s.domainTurns > 0) s.domainTurns--;
  if (p.domainGuard) {
    p.domainGuard.turns--;
    if (p.domainGuard.turns <= 0) p.domainGuard = null;
  }
  d.turn++;
  if (d.over) return;
  beginPlayerTurn(d);
}

function beginPlayerTurn(d) {
  const p = d.player;
  if (p.bleed > 0) {
    const dmg = Math.round(p.maxHp * 0.018 * p.bleed);
    p.hp -= dmg;
    pushDuel(d, `流血发作，你失去 ${money(dmg)} 点生命。`, 'dmg');
    p.bleed--;
  }
  if (p.burn > 0) {
    const dmg = Math.round(p.maxHp * 0.028 * p.burn);
    p.hp -= dmg;
    pushDuel(d, `灼烧发作，你失去 ${money(dmg)} 点生命。`, 'dmg');
    p.burn--;
  }
  if (p.hp <= 0) {
    if (p.revive > 0) {
      p.revive--; p.hp = Math.round(p.maxHp * 0.3);
      if (traitVal(d.run, 'cleanse') > 0) { p.bleed = 0; p.burn = 0; }
      pushDuel(d, '你再次从死亡边缘被拽了回来。', 'big');
    } else {
      p.hp = 0; d.over = true; d.result = 'lose';
      pushDuel(d, '失血过多。你倒在了新宿的废墟里。', 'big');
      return;
    }
  }
  if (d.run.cons === 'star') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.02);
  if (d.run.cons === 'curse') p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.03);
  const regenPct = traitVal(d.run, 'regenPct');
  if (regenPct > 0) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * regenPct);
  p.ce = Math.min(p.maxCe, p.ce + p.regen);
  if (d.run.tech === 'spiritManip' && d.turn % 3 === 0 && p.spirits < 6) {
    p.spirits++;
    pushDuel(d, '一只新的咒灵被收服，加入你的队列。', 'purple');
  }
  if (d.run.tech === 'tenShadows' && !d.suku.mahoraga && p.hp < p.maxHp * 0.35) {
    d.suku.mahoraga = true;
    const heal = Math.round(p.maxHp * 0.22);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    const dmg = Math.round(p.atk * 3.2);
    d.suku.hp -= dmg;
    pushDuel(d, '影子自行转动。八握剑异戒神将·魔虚罗现身。', 'big');
    pushDuel(d, `魔虚罗挥剑，宿傩受到 ${money(dmg)} 点伤害；你的伤口也被影子覆盖，回复 ${money(heal)} 点生命。`, 'purple');
    checkSukuPhase(d);
    if (d.over) return;
  }
  const chrono = traitVal(d.run, 'cdRefresh') > 0;
  for (const k in p.cd) if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - (chrono ? 2 : 1));
  if (chrono && d.turn % 3 === 0) {
    for (const k in p.cd) p.cd[k] = 0;
    pushDuel(d, '时之楔转过一圈，所有术式冷却被重置。', 'rainbow');
  }
  if (p.atkBuffT > 0) { p.atkBuffT--; if (!p.atkBuffT) p.atkBuff = 0; }
  if (p.defBuffT > 0) { p.defBuffT--; if (!p.defBuffT) p.defBuff = 0; }
  if (p.extraDmgBuffT > 0) { p.extraDmgBuffT--; if (!p.extraDmgBuffT) p.extraDmgBuff = 0; }
  if (p.resistPenBuffT > 0) { p.resistPenBuffT--; if (!p.resistPenBuffT) p.resistPenBuff = 0; }
  if (p.dodgeBuff > 0) p.dodgeBuff = Math.max(0, p.dodgeBuff - 0.1);
  p.shield = 0;
  p.evade = 0;
  d.vowThisTurn = false;
  d.busy = false;
  const s = d.suku;
  checkSukuPhase(d);
  if (d.over) return;
  if (s.forceIntent || !s.intent) rollIntent(d);
  announceWorldWarning(d);
}

function extraDamageState(d, mv) {
  const run = d.run, p = d.player, s = d.suku;
  const mb = run.mythicBoons || {};
  const bonus = 1 + traitVal(run, 'extraDmg') + (mb.extraDmg || 0) + (p.extraDmgBuff || 0) + ((mv && mv.extraDmg) || 0);
  const pen = traitVal(run, 'resistPen') + (mb.resistPen || 0) + (p.resistPenBuff || 0) + ((mv && mv.resistCut) || 0) + (s.resistDown || 0);
  const resist = Math.max(-0.35, Math.min(0.85, (s.resist || 0) - pen));
  return { bonus, resist, pen, mult: bonus * (1 - resist) };
}

function applyResistDown(d, amount, turns, source) {
  if (!amount) return;
  const s = d.suku, before = s.resistDown || 0;
  s.resistDown = Math.min(0.45, before + amount);
  const gained = s.resistDown - before;
  if (gained <= 0.0001) return;
  s.resistDownT = Math.max(s.resistDownT || 0, turns || 2);
  pushDuel(d, `${source || '破抗'}：宿傩伤害抗性被削减 ${Math.round(gained * 100)}%（剩余 ${s.resistDownT} 回合）。`, 'gold');
}

function attackOnce(d, mv, hitIndex) {
  const run = d.run, s = d.suku, p = d.player;
  let atk = p.atk * (1 + p.atkBuff);
  let mult = mv.power;
  const focus = !!p.focusShot;
  if (focus) p.focusShot = false;
  let ignore = mv.ignore || 0;
  if (run.tech === 'idleTransfig') ignore = 1;
  if (run.tech === 'heavenly') ignore = Math.max(ignore, .25);
  ignore = Math.min(1, ignore + traitVal(run, 'ignore'));
  let base = atk * mult * (1 + run.stats.ctrl / 260);
  if (run.tech === 'shrine' && s.bleed > 0) base *= 1.15;
  if (run.tech === 'iceFormation' && s.freeze > 0) base *= 1.25;
  if (run.tech === 'bloodManip' && p.hp < p.maxHp * 0.5) base *= 1.2;
  if (run.tech === 'construction') base *= 1 + run.stats.iq * 0.004;
  if (run.cons === 'vessel') base *= 1.15;
  base *= 1 + weakBonus(run);
  base *= 1 + ((run.mythicBoons && run.mythicBoons.dmg) || 0);
  base *= 1 + traitVal(run, 'dmg') + traitVal(run, 'sukuDmg');
  if (traitVal(run, 'critStack') > 0) base *= 1 + (p.critStack || 0) * 0.04;
  if (d.turn === 1) base *= 1 + traitVal(run, 'opening');
  if (s.hp <= s.maxHp * 0.30) base *= 1 + traitVal(run, 'execute');
  if (p.hp <= p.maxHp * 0.50) base *= 1 + traitVal(run, 'lowAtk');
  if (focus) base *= 1 + traitVal(run, 'focusDmg');
  if (run.tech === 'idleTransfig' && s.hp < s.maxHp * 0.25) base *= 1.3;
  if (p.domainTurns > 0) base *= 1.36 + traitVal(run, 'domainDmg');
  if (p.vowAtk > 1) base *= p.vowAtk;
  const zenithNuke = !!p.zenithNuke;
  if (zenithNuke) { p.zenithNuke = false; base *= 2.2; }
  let def = s.def * (1 - s.defDebuff) * (1 - ignore);
  let dmg = base - def * 0.55;
  dmg *= rf(0.9, 1.12);
  let critChance = 0.05 + run.stats.iq * 0.0022 + (mv.crit || 0);
  if (run.tech === 'ratio') critChance += 0.08;
  if (run.tech === 'blackBird') critChance += 0.08;
  critChance += traitVal(run, 'crit') + (p.critStack || 0) * 0.06;
  if (focus) critChance += traitVal(run, 'focusCrit');
  if (p.vowCrit) critChance = 1;
  const crit = zenithNuke || Math.random() < Math.min(0.9, critChance);
  if (crit) dmg *= (run.tech === 'ratio' ? 2.2 : 1.7) + traitVal(run, 'critDmg') + ((run.mythicBoons && run.mythicBoons.critDmg) || 0) + (p.critStack || 0) * 0.15;
  const extra = extraDamageState(d, mv);
  dmg *= extra.mult;
  dmg = Math.max(1, Math.round(dmg));
  s.hp -= dmg;
  if (crit) {
    if (traitVal(run, 'critCe') > 0) p.ce = Math.min(p.maxCe, p.ce + traitVal(run, 'critCe'));
    if (traitVal(run, 'critStack') > 0) {
      const beforeStack = p.critStack || 0;
      p.critStack = Math.min(6, beforeStack + 1);
      if (beforeStack < 6 && p.critStack === 6) {
        p.zenithNuke = true;
        pushDuel(d, '万象归一·临界。六道暴击的因果收束为下一击。', 'rainbow');
      }
    }
    const resistBreak = traitVal(run, 'resistBreakOnCrit');
    if (resistBreak > 0) applyResistDown(d, resistBreak, 3, '暴击破抗');
  }
  if (mv.resistDown) applyResistDown(d, mv.resistDown, mv.resistDownTurns || 2, `『${mv.name}』`);
  if (zenithNuke) pushDuel(d, '万象归一收束——这一击必定暴击，伤害翻倍。', 'rainbow');
  if (traitVal(run, 'bleedOnHit') > 0 && Math.random() < traitVal(run, 'bleedOnHit')) s.bleed += 1;
  return { dmg, crit };
}

function applyDomainActivation(d, fx) {
  const p = d.player, s = d.suku, a = fx.activate || {};
  if (a.atk || a.def) applyBuff(p, { atk: a.atk || 0, def: a.def || 0, turns: 3 });
  if (a.shield) p.shield = Math.max(p.shield, a.shield);
  if (a.evade) p.evade = Math.max(p.evade, a.evade);
  if (a.heal) p.hp = Math.min(p.maxHp, p.hp + p.maxHp * a.heal);
  if (a.ce) p.ce = Math.min(p.maxCe, p.ce + a.ce);
  if (a.spirits) p.spirits = Math.min(6, p.spirits + a.spirits);
  if (a.stun) s.stun = Math.max(s.stun, a.stun);
  if (a.freeze) s.freeze = Math.max(s.freeze, a.freeze);
  if (a.bleed) s.bleed += a.bleed;
  if (a.burn) s.burn += a.burn;
  if (a.atkDebuff) {
    s.atkDebuff = Math.max(s.atkDebuff, a.atkDebuff);
    s.atkDebuffT = Math.max(s.atkDebuffT, 3);
  }
  if (a.defDebuff) {
    s.defDebuff = Math.max(s.defDebuff, a.defDebuff);
    s.defDebuffT = Math.max(s.defDebuffT, 3);
  }
  if (a.cd) for (const k in p.cd) if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - a.cd);
  if (a.extraDmg) { p.extraDmgBuff = Math.max(p.extraDmgBuff, a.extraDmg); p.extraDmgBuffT = Math.max(p.extraDmgBuffT, 3); }
  if (a.resistPen) { p.resistPenBuff = Math.max(p.resistPenBuff, a.resistPen); p.resistPenBuffT = Math.max(p.resistPenBuffT, 3); }
  if (a.resistDown) applyResistDown(d, a.resistDown, 3, `领域特性·${fx.title || '破抗'}`);
  if (fx.activateLog) pushDuel(d, fx.activateLog, 'rainbow');
}

function applyDomainTurn(d, fx) {
  const p = d.player, s = d.suku, t = fx.turn || {};
  if (t.resistDown) applyResistDown(d, t.resistDown, 2, `领域侵蚀·${fx.title || '破抗'}`);
  if (t.extraDmg) { p.extraDmgBuff += t.extraDmg; p.extraDmgBuffT = Math.max(p.extraDmgBuffT, 3); }
  if (t.resistPen) { p.resistPenBuff += t.resistPen; p.resistPenBuffT = Math.max(p.resistPenBuffT, 3); }
  const low = t.lowHp && s.hp <= s.maxHp * t.lowHp;
  const mult = (low && t.lowAura ? t.lowAura : (t.aura || 1)) * (1 + traitVal(d.run, 'domainDmg'));
  const extra = extraDamageState(d, {});
  const hits = Math.max(1, t.hits || 1);
  let total = 0;
  for (let i = 0; i < hits; i++) {
    const dmg = Math.max(1, Math.round(s.maxHp * 0.04 * mult * extra.mult));
    s.hp -= dmg;
    total += dmg;
  }
  pushDuel(d, `『${fx.title || '领域'}』仍在侵蚀宿傩，造成 ${money(total)} 点必中伤害${hits > 1 ? `（${hits} 段）` : ''}。${t.log ? ` ${t.log}` : ''}`, 'purple');
  if (t.heal) {
    const heal = Math.round(p.maxHp * t.heal);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    pushDuel(d, `领域回流，你回复 ${money(heal)} 点生命。`, 'heal');
  }
  if (t.shield) p.shield = Math.max(p.shield, t.shield);
  if (t.evade) p.evade = Math.max(p.evade, t.evade);
  if (t.ce) p.ce = Math.min(p.maxCe, p.ce + t.ce);
  if (t.bleed) s.bleed += t.bleed;
  if (t.burn) s.burn += t.burn;
  if (t.cd) for (const k in p.cd) if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - t.cd);
  if (t.enemyAtkDebuff) {
    s.atkDebuff = Math.max(s.atkDebuff, t.enemyAtkDebuff);
    s.atkDebuffT = Math.max(s.atkDebuffT, 2);
  }
  if (t.freezeChance && s.freeze <= 0 && Math.random() < t.freezeChance) {
    s.freeze = Math.max(s.freeze, 1);
    pushDuel(d, '冰狱的寒气再次封住宿傩的动作。', 'purple');
  }
  if (t.stunChance && s.stun <= 0 && Math.random() < t.stunChance) {
    s.stun = Math.max(s.stun, 1);
    pushDuel(d, '拍手声错位，宿傩再次失去目标。', 'purple');
  }
}

function playerMove(d, id) {
  if (!d || d.over || d.busy) return false;
  const run = d.run, p = d.player, s = d.suku;
  const mv = moveById(run, id);
  if (!mv) return false;
  if (mv.cd && p.cd[mv.id] > 0) {
    pushDuel(d, `『${mv.name}』还在冷却（${p.cd[mv.id]} 回合）。`, 'sys');
    return false;
  }
  if (p.sealed.includes(id)) {
    pushDuel(d, `『${mv.name}』已被你自己的束缚封印。`, 'sys');
    return false;
  }
  if (p.burnout > 0 && !isBodyMove(mv) && mv.kind !== 'repair') {
    pushDuel(d, `术式熔断还剩 ${p.burnout} 回合。你现在只能使用体术与咒具，或使用『修复熔断』。`, 'sys');
    return false;
  }
  if (mv.kind === 'repair' && p.burnout <= 0) {
    pushDuel(d, '术式回路没有熔断，无需修复。', 'sys');
    return false;
  }
  if (mv.kind === 'repair' && p.burnoutFixUsed) {
    pushDuel(d, '这段熔断已经修复过，接下来只能先以体术过渡。', 'sys');
    return false;
  }
  if (mv.domainOnly && !(s.domainTurns > 0 || (s.intent && s.intent.domain))) {
    pushDuel(d, `『${mv.name}』只能在敌方领域展开时使用。`, 'sys');
    return false;
  }
  if (mv.spaceOnly && !worldIncoming(s)) {
    pushDuel(d, '没有空间斩预警。『空间抗性』只能用来预判「世界」。', 'sys');
    return false;
  }
  const cost = effectiveCost(run, mv, p.costMod);
  if (cost > p.ce) {
    pushDuel(d, '咒力不足。你无法发动这一招。', 'sys');
    return false;
  }
  p.ce -= cost;
  if (mv.cd) {
    const chronoFree = traitVal(run, 'cdRefresh') > 0 && Math.random() < 0.25;
    if (chronoFree) pushDuel(d, '时之楔拨动因果，这一招没有留下冷却。', 'rainbow');
    else p.cd[mv.id] = Math.max(1, mv.cd + (mv.id === 'rct' ? traitVal(run, 'rctCd') : 0));
  }
  if (mv.hpCost) {
    const hp = Math.round(p.maxHp * mv.hpCost);
    p.hp -= hp;
    pushDuel(d, `你割开皮肉，以 ${money(hp)} 点生命为代价。`, 'red');
  }
  if (mv.selfDmg) {
    const hp = Math.round(p.maxHp * mv.selfDmg);
    p.hp -= hp;
    pushDuel(d, `咒言反噬，你失去 ${money(hp)} 点生命。`, 'red');
  }
  if (mv.selfDef) {
    p.defBuff -= mv.selfDef;
    p.defBuffT = Math.max(p.defBuffT, 2);
    pushDuel(d, '你舍弃了防御，把一切押在下一击。', 'sys');
  }
  if (run.tech === 'cursedSpeech' && ['stop', 'burst', 'sleep', 'die'].includes(mv.id)) {
    p.shouts++;
    if (p.shouts > 2) {
      const hp = Math.round(p.maxHp * 0.05);
      p.hp -= hp;
      pushDuel(d, `喉咙已经撕裂，鲜血顺着嘴角流下。你失去 ${money(hp)} 点生命。`, 'red');
    }
  }

  if (mv.kind === 'repair') {
    const before = p.burnout;
    const echo = (run.traits || []).some(t => t.id === 'domainEcho');
    p.burnout = echo ? 0 : 1;
    p.burnoutFixUsed = true;
    pushDuel(d, echo
      ? `领域余响接住了断开的回路，熔断从 ${before} 回合直接归零。下一回合即可再次使用术式。`
      : `你重接术式回路，熔断从 ${before} 回合压缩到 1 回合；下一回合仍需以体术过渡，之后才能再次使用术式。`, echo ? 'rainbow' : 'purple');
  } else if (mv.kind === 'counter') {
    const before = !!s.domainTurns;
    if (s.domainTurns > 0) s.domainTurns = 0;
    p.domainGuard = {
      name: mv.name,
      turns: mv.guardTurns || 2,
      reduce: mv.guardReduce || 0.5,
      reflect: mv.reflect || 0
    };
    if (mv.buff) applyBuff(p, mv.buff);
    pushDuel(d, `你展开『${mv.name}』。${before ? '宿傩的领域被从内部撕开，' : '下一次领域袭来时，'}你获得 ${p.domainGuard.turns} 回合的领域抗性。`, 'purple');
  } else if (mv.kind === 'def') {
    if (mv.shield) p.shield = Math.max(p.shield, mv.shield);
    if (mv.evade) p.evade = Math.max(p.evade, mv.evade);
    if (mv.ceGain) p.ce = Math.min(p.maxCe, p.ce + mv.ceGain);
    if (mv.buff) applyBuff(p, mv.buff);
    if (mv.spaceGuard) {
      p.spaceGuard = Math.max(p.spaceGuard || 0, 1);
      pushDuel(d, '你把咒力压成一层贴身的空间褶曲。『世界』的轨迹被看穿：本次伤害降低 80%，必中被抵消。', 'rainbow');
    } else {
      pushDuel(d, `你摆出防御架势（${Math.round((mv.shield || 0) * 100)}% 减伤${mv.evade ? ' / 闪避' : ''}）。`, 'green');
    }
    if (traitVal(run, 'focusDmg') > 0) p.focusShot = true;
  } else if (mv.kind === 'rest') {
    p.ce = Math.min(p.maxCe, p.ce + (mv.ceGain || 0));
    if (traitVal(run, 'focusDmg') > 0) p.focusShot = true;
    pushDuel(d, `你调匀呼吸，咒力回复 ${mv.ceGain || 0} 点。`, 'green');
  } else if (mv.kind === 'heal') {
    let heal = (mv.healBase || 0) + run.stats.ctrl * (mv.healCtrl || 0) + run.stats.eff * (mv.healEff || 0);
    if (run.cons === 'curse') heal *= 0.5;
    if (run.cons === 'star') heal *= 1.2;
    heal *= 1 + traitVal(run, 'heal');
    heal = Math.round(heal);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    p.bleed = 0;
    p.rctUses++;
    pushDuel(d, `反转术式。伤口逆流，回复 ${money(heal)} 点生命，流血被清除。`, 'heal');
  } else if (mv.kind === 'domain') {
    const fx = domainFxFor(run, mv);
    const domainName = run.domainName || String(mv.name || '').replace('领域展开·', '');
    p.domainName = domainName;
    const domExtra = (run.mythicBoons && run.mythicBoons.domainTurn) || 0;
    p.domainTurns = 4 + traitVal(run, 'domainTurn') + domExtra;
    p.burnout = Math.max(1, 3 - traitVal(run, 'burnoutCut'));
    p.burnoutFixUsed = false;
    s.domainTurns = 0;
    applyDomainActivation(d, fx);
    const res = attackOnce(d, { ...mv, power: mv.power }, 0);
    pushDuel(d, `领域展开——『${domainName}』${fx.title ? ` · ${fx.title}` : ''}。`, 'big');
    pushDuel(d, `结界内必中。宿傩受到 ${money(res.dmg)} 点伤害${fx.activate && fx.activate.stun ? '，并被停滞一回合' : ''}；领域将持续 ${p.domainTurns} 回合。`, 'purple');
    pushDuel(d, `术式熔断：接下来 ${p.burnout} 回合只能使用体术与咒具。`, 'red');
    if (fx.desc) pushDuel(d, `领域特性：${fx.desc}`, 'rainbow');
    if (mv.bleed) { s.bleed += mv.bleed; pushDuel(d, `结界里的斩击留下 ${mv.bleed} 层流血。`, 'purple'); }
    if (mv.burn) { s.burn += mv.burn; pushDuel(d, `竈火在结界内蔓延，${mv.burn} 层灼烧。`, 'purple'); }
    checkSukuPhase(d);
  } else if (mv.kind === 'special') {
    if (mv.exec === 'copyArt') {
      const pool = run.copiedMoves;
      if (!pool.length) {
        pushDuel(d, '没有可复制的术式。你只能凭自己的身体。', 'sys');
        const res = attackOnce(d, { ...mv, power: 1.4 }, 0);
        pushDuel(d, `你勉强打出一击，造成 ${money(res.dmg)} 点伤害。`, 'sys');
      } else {
        const cm = pick(pool);
        const res = attackOnce(d, { ...mv, power: Math.max(2.0, (cm.power || 2) * 1.1) }, 0);
        pushDuel(d, `你复刻了『${cm.name}』——造成 ${money(res.dmg)} 点伤害。`, 'purple');
      }
    } else if (mv.exec === 'trueCopy') {
      const last = s.lastMove;
      const pw = last ? (last.mult || 2) * 1.5 : 2.4;
      const res = attackOnce(d, { ...mv, power: pw, ignore: last && last.sure ? .4 : .1 }, 0);
      pushDuel(d, last ? `你复刻了宿傩的『${last.name}』，以 1.5 倍返还——${money(res.dmg)} 点伤害。` : '没有可复刻的招式。你打出一记普通斩击。', 'purple');
    }
  } else if (mv.kind === 'atk') {
    let hits = mv.hits || 1;
    if (run.tech === 'projection' && d.turn % 3 === 0) {
      hits++;
      pushDuel(d, '投射咒法·加速。第 25 帧被强行插入。', 'purple');
    }
    let total = 0, crits = 0;
    let spiritBoost = false;
    if (run.tech === 'spiritManip' && p.spirits > 0) {
      p.spirits--;
      spiritBoost = true;
    }
    for (let i = 0; i < hits; i++) {
      const res = attackOnce(d, mv, i);
      total += res.dmg;
      if (res.crit) crits++;
      if (s.hp <= 0) break;
    }
    if (spiritBoost) {
      const extra = Math.round(total * 0.3);
      s.hp -= extra;
      total += extra;
      pushDuel(d, `一只咒灵被献祭，伤害追加 ${money(extra)}。`, 'purple');
    }
    if (run.tech === 'boogieWoogie' && mv.counter) {
      const extra = Math.round((s.lastDamage || 0) * mv.counter);
      if (extra > 0) { s.hp -= extra; total += extra; }
    }
    const name = mv.name;
    pushDuel(d, `你以『${name}』${hits > 1 ? hits + ' 段' : ''}命中宿傩，造成 ${money(total)} 点伤害${crits ? `（暴击 ${crits} 次）` : ''}。`, crits ? 'gold' : 'tech');
    if (mv.buff) applyBuff(p, mv.buff);
    if (mv.bleed) { s.bleed += mv.bleed; pushDuel(d, `斩击留下 ${mv.bleed} 层流血。`, 'purple'); }
    if (mv.burn) { s.burn += mv.burn; pushDuel(d, `竈火附着，${mv.burn} 层灼烧。`, 'purple'); }
    if (mv.freeze) { s.freeze += mv.freeze; pushDuel(d, `寒气侵入，宿傩被冻结 ${mv.freeze} 回合。`, 'purple'); }
    if (mv.stun) { s.stun += mv.stun; pushDuel(d, `宿傩的动作被强行停住。`, 'purple'); }
    if (mv.debuff) {
      s.atkDebuff = Math.max(s.atkDebuff, mv.debuff.atk);
      s.atkDebuffT = Math.max(s.atkDebuffT, mv.debuff.turns);
    }
    if (mv.dodgeDown) {
      s.dodgeDown = Math.max(s.dodgeDown || 0, mv.dodgeDown);
    }
    if (mv.lifesteal) {
      const heal = Math.round(total * mv.lifesteal);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      pushDuel(d, `血液回流，你回复 ${money(heal)} 点生命。`, 'heal');
    }
    if (p.vowAtk > 1) { p.vowAtk = 1; pushDuel(d, '束缚兑现，力量退潮。', 'sys'); }
    if (p.vowCrit) p.vowCrit = false;
  }

  checkSukuPhase(d);
  if (d.over) return true;
  if (p.hp <= 0) {
    p.hp = 0;
    d.over = true; d.result = 'lose';
    pushDuel(d, '你倒下了。', 'big');
    return true;
  }
  if (p.burnout > 0 && mv.kind !== 'domain' && mv.kind !== 'repair') {
    p.burnout--;
    if (p.burnout <= 0) p.burnoutFixUsed = false;
  }
  d.busy = true;
  return true;
}

function applyBuff(p, buff) {
  if (buff.atk) { p.atkBuff += buff.atk; p.atkBuffT = Math.max(p.atkBuffT, buff.turns || 2); }
  if (buff.def) { p.defBuff += buff.def; p.defBuffT = Math.max(p.defBuffT, buff.turns || 2); }
  if (buff.dodge) p.dodgeBuff += buff.dodge;
  if (buff.extraDmg) { p.extraDmgBuff += buff.extraDmg; p.extraDmgBuffT = Math.max(p.extraDmgBuffT, buff.turns || 2); }
  if (buff.resistPen) { p.resistPenBuff += buff.resistPen; p.resistPenBuffT = Math.max(p.resistPenBuffT, buff.turns || 2); }
}

function enterStage2(d) {
  const s = d.suku;
  s.stage = 2;
  s.maxHp = s.stage2Max;
  s.hp = s.stage2Max;
  s.atk = s.stage2Atk;
  s.def = s.stage2Def;
  s.resist = Math.max(s.resist || 0, 0.15);
  s.resistDown = 0; s.resistDownT = 0;
  s.bleed = 0; s.burn = 0; s.freeze = 0; s.stun = 0;
  s.atkDebuff = 0; s.atkDebuffT = 0; s.defDebuff = 0; s.defDebuffT = 0;
  s.domainTurns = 0; s.cd = {}; s.healUsed = {};
  s.domainUsed = false; s.worldUsed = false; s.gridUsed = false;
  s.agitoSummoned = true; s.mahoSummoned = true;
  s.summons = { agito: false, maho: false };
  s.forceIntent = null;
  s.worldWarned = false;
  s.intent = { id: 'domain', name: '领域展开·伏魔御厨子', domainName: '伏魔御厨子', mult: 2.2, sure: true, domain: true };
  s.justChanged = true;
  pushDuel(d, '十影宿傩的影之肉体崩解。影子缩回地面，露出里面那具四手四眼的身体。', 'big');
  pushDuel(d, '「十影只是借来的壳。」原身宿傩活动了一下手腕。第二阶段开始。', 'big');
}

function checkSukuPhase(d) {
  const s = d.suku;
  if (!s) return;
  if (s.stage === 1) {
    if (s.hp <= 0) { enterStage2(d); return; }
    if (!s.forceIntent && !s.domainUsed && s.hp <= s.maxHp * 0.85) {
      s.domainUsed = true;
      s.forceIntent = 'domain';
      pushDuel(d, '十影宿傩的影子开始收束，领域要展开了。', 'purple');
      return;
    }
    if (!s.forceIntent && !s.agitoSummoned && s.hp <= s.maxHp * 0.78) {
      s.agitoSummoned = true;
      s.forceIntent = 'summonAgito';
      pushDuel(d, '影子里传来第二道呼吸。宿傩要召唤颚吐。', 'gold');
      return;
    }
    if (!s.forceIntent && !s.mahoSummoned && s.hp <= s.maxHp * 0.58) {
      s.mahoSummoned = true;
      s.forceIntent = 'summonMaho';
      pushDuel(d, '轮盘转动的声音从影中升起。魔虚罗要来了。', 'gold');
    }
    return;
  }
  if (s.hp <= 0) {
    s.hp = 0;
    d.over = true; d.result = 'win';
    pushDuel(d, '原身宿傩的最后一只手落下。诅咒之王，这一次真的死了。', 'big');
    return;
  }
  if (s.intent && s.intent.id === 'world') return;
  if (!s.forceIntent && !s.worldUsed && s.hp <= s.maxHp * 0.48) {
    s.forceIntent = 'world';
    s.worldUsed = true;
    s.worldWarned = false;
    pushDuel(d, '宿傩收起了玩闹的表情。空间在他指尖折成一条线。下一回合，空间斩「世界」会落下——准备「空间抗性」。', 'big');
    return;
  }
  if (!s.forceIntent && !s.gridUsed && s.hp <= s.maxHp * 0.70) {
    s.gridUsed = true;
    s.forceIntent = 'grid';
    pushDuel(d, '宿傩抬手划出纵横的线。网格解，要落下来了。', 'purple');
    return;
  }
  if (!s.forceIntent && !s.domainUsed && !(s.intent && s.intent.domain)) {
    s.forceIntent = 'domain';
    pushDuel(d, '原身宿傩的咒力漫过废墟。伏魔御厨子，要来了。', 'purple');
  }
}

function useVow(d, id) {
  if (!d || d.over || d.vowUsed[id]) return false;
  if (d.vowThisTurn) { pushDuel(d, '这一回合已经立过束缚了。', 'sys'); return false; }
  const p = d.player;
  d.vowUsed[id] = true;
  d.vowThisTurn = true;
  if (id === 'noDodge') {
    p.vowVuln = 1.5;
    p.vowAtk = 2.2;
    pushDuel(d, '「不闪不避。」你把退路烧掉，换取下一击的重量。', 'gold');
  } else if (id === 'seal') {
    const pool = movesOf(d.run).filter(m => !['basic', 'guard', 'dodge', 'breath', 'rct'].includes(m.id) && !p.sealed.includes(m.id));
    if (pool.length) {
      const m = pick(pool);
      p.sealed.push(m.id);
      p.atkBuff += 0.25;
      pushDuel(d, `「以『${m.name}』为祭。」术式被封印，攻击永久 +25%。`, 'gold');
    } else {
      p.atkBuff += 0.25;
      pushDuel(d, '「以术式为祭。」攻击永久 +25%。', 'gold');
    }
  } else if (id === 'life') {
    const loss = Math.round(p.hp * 0.2);
    p.hp = Math.max(1, p.hp - loss);
    p.ce = p.maxCe;
    p.vowCrit = true;
    p.vowSure = true;
    pushDuel(d, `「以命换力。」你献出 ${money(loss)} 点生命，咒力回满，下一击必中且暴击。`, 'gold');
  } else if (id === 'name') {
    p.costMod *= 0.6;
    p.defDownPerm += p.def * 0.25;
    pushDuel(d, '「以真名为誓。」咒力消耗降低 40%，防御永久下降 25%。', 'gold');
  } else if (id === 'allIn') {
    const loss = Math.max(0, p.hp - Math.max(1, Math.round(p.hp * 0.55)));
    p.hp = Math.max(1, p.hp - loss);
    p.vowAtk = 2.8;
    p.vowCrit = true;
    p.vowSure = true;
    pushDuel(d, `「孤注一掷。」你舍弃 ${money(loss)} 点生命，下一击伤害 ×2.8，必中且暴击。`, 'gold');
  } else if (id === 'ironBody') {
    if (!p.sealed.includes('dodge')) p.sealed.push('dodge');
    p.def = Math.max(1, Math.round(p.def * 1.3));
    p.atk = Math.max(1, Math.round(p.atk * 0.88));
    pushDuel(d, '「铁身。」你放弃闪避，以肉身承受一切；防御 +30%，攻击 -12%。', 'gold');
  } else if (id === 'bloodPact') {
    p.maxHp = Math.max(1, Math.round(p.maxHp * 0.85));
    p.hp = Math.min(p.hp, p.maxHp);
    p.atk = Math.round(p.atk * 1.3);
    pushDuel(d, `「以血为契。」生命上限降至 ${p.maxHp}，攻击永久 +30%。`, 'gold');
  } else if (id === 'lastStand') {
    const heal = Math.round(p.maxHp * 0.2);
    const before = p.hp;
    p.hp = Math.min(p.maxHp, p.hp + heal);
    p.vowVuln = 0.55;
    pushDuel(d, `「受身。」你回复 ${money(p.hp - before)} 点生命，本回合受到的伤害 -45%。`, 'gold');
  }
  if (traitVal(d.run, 'vowEcho') > 0 && !p.vowEchoUsed) {
    p.vowEchoUsed = true;
    const heal = Math.round(p.maxHp * 0.15);
    p.hp = Math.min(p.maxHp, p.hp + heal);
    d.vowThisTurn = false;
    pushDuel(d, `束缚的回响在体内折返。你回复 ${money(heal)} 点生命，本回合仍可再立一次束缚。`, 'rainbow');
  }
  return true;
}

function retreatDuel(d) {
  if (!d || d.over) return;
  d.over = true;
  d.result = 'retreat';
  pushDuel(d, '你转身离开。宿傩没有追——他对逃跑的人没有兴趣。', 'sys');
}

/* ---------------- 结算 ---------------- */

function calcPoints(run) {
  if (run.mode === 'retreat') return 0;
  let pts = 0;
  if (run.tier <= 1) pts += 5;
  else if (run.tier === 2) pts += 4;
  else if (run.tier === 3) pts += 3;
  else if (run.tier === 4) pts += 2;
  else pts += 1;
  if (run.lvl >= 81) pts += 3;
  if (run.lvl >= 91) pts += 5;
  if (run.lvl >= 95) pts += 8;
  if (run.lvl >= 99) pts += 10;
  if (run.lvl >= 105) pts += 4;
  if (run.lvl >= 115) pts += 6;
  if (run.slain) pts += 30;
  pts = Math.round(pts * diffOf(run.difficulty).reward);
  return Math.min(100, pts);
}

function settle(run, mode) {
  run.phase = 'over';
  run.mode = mode || run.mode || 'points';
  run.slain = run.mode === 'slain';
  const early = mode === 'retreat' || mode === 'forfeit';
  const exp = run.endless ? 0 : (run.slain ? 1000 : Math.round(run.lvl * (early ? 0.1 : 0.5)));
  return {
    exp,
    points: run.endless ? 0 : (early ? 0 : calcPoints(run)),
    mode: run.mode,
    level: run.lvl,
    wave: run.endlessWave || 0,
    endless: !!run.endless,
    endlessOutcome: run.endlessOutcome || '',
    bench: benchOf(run.lvl),
    stats: run.stats,
    weak: run.weak.length,
    age: run.age,
    difficulty: run.difficulty || 'normal',
    difficultyName: diffOf(run.difficulty).name
  };
}

/* ---------------- 导出 ---------------- */

const JJK = {
  STATS, STAT_NAMES, TIERS, BENCH, CONS, TECHS, UNIVERSAL, RCT_MOVE, BURNOUT_FIX_MOVE, VOWS,
  DIFFICULTIES, DIFF_ORDER, diffOf,
  WEAK_POINTS, EVENTS, PLOTS, TRAITS, RARITY, traitVal, grantTrait,
  rnd, rf, clamp, pick, money, benchOf, tierOf, MAX_LEVEL, AGE_LIMIT,
  rollTier, rollCons, rollTech, techPool, initStats, statCap, statCapFor, makeRun,
  xpNeed, xpGain, addStat, train, levelUp, gainXp, checkUnlocks, totalRefine, checkMastery, MASTERY_TIERS, MASTERY_LINES,
  AWAKEN_PATHS, AWAKEN_NAMES, AWAKEN_DESC, DOMAIN_COUNTERS, DOMAIN_COUNTER_FLAGS, awakenCount, awakenChance, nextAwakenKind, tryAwaken, syncAwakening, awakenName,
  addWeak, weakBonus, applyWeakStrike, advanceBlood, eventPower, doEvent, resolveEventChoice, doPlot, advanceYear, advanceAction,
  rollIntent, checkSukuPhase, enterStage2, summonAct,
  derived, movesOf, moveById, effectiveCost, isBodyMove, startDuel, playerMove, sukuTurn, useVow,
  retreatDuel, calcPoints, settle, guardMinFor
};

const J = JJK;
if (typeof window !== 'undefined') window.JJK = JJK;
if (typeof module !== 'undefined' && module.exports) module.exports = JJK;


/* ===== UI ===== */
'use strict';

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

const G = {
  run: null,
  duel: null,
  auto: null,
  autoOn: false,
  duelFromSim: false,
  meta: loadMeta()
};

const MUSIC_DATA = {
  aizo: 'assets/audio/aizo.mp3',
  heart: 'assets/audio/heart.mp3',
  rain: 'assets/audio/rain.mp3',
  ruguo: 'assets/audio/ruguo.mp3',
  boss: 'assets/audio/boss.mp3'
};
const MUSIC_NAMES = {
  aizo: 'AIZO',
  heart: '心似烟火 DJ版',
  rain: '雨爱 DJ版',
  ruguo: '如果可以DJ版',
  boss: '雨爱解说版'
};
const MUSIC = { on: false, boss: false, current: null, audio: null };

function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem('jjk_meta_v1') || 'null');
    if (m && typeof m === 'object') {
      const out = Object.assign({ exp: 0, lv: 0, points: 0, runs: 0, wins: 0, best: 0, endlessBest: 0, difficulty: 'normal' }, m);
      if (!J.DIFFICULTIES[out.difficulty]) out.difficulty = 'normal';
      return out;
    }
  } catch (e) { /* ignore */ }
  return { exp: 0, lv: 0, points: 0, runs: 0, wins: 0, best: 0, endlessBest: 0, difficulty: 'normal' };
}
function saveMeta() {
  try { localStorage.setItem('jjk_meta_v1', JSON.stringify(G.meta)); } catch (e) { /* ignore */ }
}

function musicInit() {
  if (MUSIC.audio) return;
  MUSIC.audio = new Audio();
  MUSIC.audio.volume = 0.45;
  MUSIC.audio.preload = 'auto';
  MUSIC.audio.addEventListener('ended', () => {
    if (!MUSIC.on) return;
    if (MUSIC.boss) playMusic('boss');
    else playRandomMusic(MUSIC.current);
  });
}

function updateMusicUI() {
  const b = $('#music-toggle');
  if (b) {
    b.textContent = MUSIC.on ? '音乐：开' : '音乐：关';
    b.classList.toggle('on', MUSIC.on);
    b.setAttribute('aria-pressed', MUSIC.on ? 'true' : 'false');
    b.title = MUSIC.on && MUSIC.current
      ? `正在播放：${MUSIC_NAMES[MUSIC.current]}（点击关闭）`
      : '随机播放 AIZO / 心似烟火 DJ版 / 雨爱 DJ版 / 如果可以DJ版；宿傩战切换雨爱解说版';
  }
  const mb = $('#m-music');
  if (mb) {
    mb.textContent = MUSIC.on ? '音乐：开' : '音乐';
    mb.classList.toggle('on', MUSIC.on);
    mb.setAttribute('aria-pressed', MUSIC.on ? 'true' : 'false');
  }
}

function playMusic(key) {
  if (!MUSIC.on) return;
  const src = MUSIC_DATA[key];
  if (!src) return;
  musicInit();
  const a = MUSIC.audio;
  if (MUSIC.current === key) {
    if (a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => {}); }
    return;
  }
  MUSIC.current = key;
  a.src = src;
  a.currentTime = 0;
  const p = a.play();
  if (p && p.catch) p.catch(() => {});
  updateMusicUI();
  toast(`音乐：${MUSIC_NAMES[key]}`);
}

function playRandomMusic(exclude) {
  const pool = ['aizo', 'heart', 'rain', 'ruguo'].filter(k => k !== exclude);
  const key = pool[Math.floor(Math.random() * pool.length)] || 'aizo';
  playMusic(key);
}

function toggleMusic() {
  MUSIC.on = !MUSIC.on;
  if (!MUSIC.on) {
    if (MUSIC.audio) MUSIC.audio.pause();
  } else if (MUSIC.boss) {
    playMusic('boss');
  } else {
    playRandomMusic(MUSIC.current);
  }
  updateMusicUI();
}

function enterBossMusic() {
  MUSIC.boss = true;
  if (MUSIC.on) playMusic('boss');
  updateMusicUI();
}

function leaveBossMusic() {
  if (!MUSIC.boss) return;
  MUSIC.boss = false;
  if (MUSIC.on) playRandomMusic('boss');
  else if (MUSIC.current === 'boss') MUSIC.current = null;
  updateMusicUI();
}

function show(id) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + id));
  if (id !== 'duel') setDuelLog(false);
  try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { /* ignore */ }
}

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('on'), 1600);
}

function openModal(title, bodyHTML, actions) {
  stopAuto();
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  const box = $('#modal-actions');
  box.innerHTML = '';
  for (const a of actions) {
    const b = document.createElement('button');
    b.className = 'btn ' + (a.cls || 'ghost');
    b.textContent = a.label;
    b.onclick = () => { closeModal(); if (a.fn) a.fn(); };
    box.appendChild(b);
  }
  $('#modal').hidden = false;
}
function closeModal() {
  $('#modal').hidden = true;
  const box = document.querySelector('#modal .modal-box');
  if (box) box.classList.remove('mythic');
}

/* ---------------- 首页 ---------------- */

function renderDiffPicker() {
  const box = $('#diff-picker');
  if (!box) return;
  const cur = G.meta.difficulty || 'normal';
  box.innerHTML = J.DIFF_ORDER.map(id => {
    const d = J.DIFFICULTIES[id];
    return `<button type="button" class="diff-opt${id === cur ? ' active' : ''}" data-diff="${id}" role="radio" aria-checked="${id === cur}">
      <em>${d.tag}</em><b>${d.name}</b><span>${d.desc}</span>
    </button>`;
  }).join('');
  const note = $('#diff-note');
  if (note) note.textContent = `当前：${J.DIFFICULTIES[cur].name} · ${J.DIFFICULTIES[cur].desc}`;
}

function setDifficulty(id) {
  if (!J.DIFFICULTIES[id] || G.meta.difficulty === id) return;
  G.meta.difficulty = id;
  saveMeta();
  renderDiffPicker();
  toast(`难度：${J.DIFFICULTIES[id].name}`);
}

function setMobileTab(tab) {
  const view = $('#view-game');
  if (!view) return;
  view.dataset.mtab = tab === 'log' ? 'log' : 'status';
  $$('#game-tabs [data-mtab]').forEach(b => b.classList.toggle('active', b.dataset.mtab === view.dataset.mtab));
}

function setDuelLog(open) {
  document.body.classList.toggle('mlog-open', !!open);
  const b = $('#m-duel-log');
  if (b) b.textContent = open ? '收起' : '战报';
}

function renderHome() {
  const m = G.meta;
  $('#home-meta').textContent =
    `术师等级 Lv.${m.lv} · 保底 ${m.points}/100 · 已模拟 ${m.runs} 次 · 斩杀 ${m.wins} 次 · 最高 Lv.${m.best}${m.endlessBest ? ` · 无尽最高 第 ${m.endlessBest} 次轮回` : ''}`;
  renderDiffPicker();
  const bgv = document.querySelector('.home-bg video');
  if (bgv && bgv.paused) { const p = bgv.play(); if (p && p.catch) p.catch(() => {}); }
  setDuelLog(false);
  show('home');
}

/* ---------------- 开局 ---------------- */

function startRun() {
  stopAuto();
  closeModal();
  leaveBossMusic();
  const m = G.meta;
  const floor = J.guardMinFor(m.lv, m.points);
  const useGuard = m.points >= 100;
  G.run = J.makeRun({ playerLv: m.lv, guardMin: floor, difficulty: m.difficulty || 'normal' });
  if (useGuard) {
    m.points = 0;
    saveMeta();
    G.run.log.push({ text: '保底积分清空。本局强制 EX 天赋。', cls: 'gold' });
  }
  G.duel = null;
  G.duelFromSim = false;
  setMobileTab('status');
  renderGame();
  show('game');
  setTimeout(scrollLog, 60);
  startAuto();
}

function startTrial() {
  stopAuto();
  closeModal();
  leaveBossMusic();
  const r = J.makeRun({ tier: 10, playerLv: 0, guardMin: 10, difficulty: G.meta.difficulty || 'normal' });
  r.lvl = 90;
  r.age = 28;
  r.points = 0;
  r.actions = 0;
  r.xp = 0;
  for (const k of J.STATS) r.stats[k] = Math.max(r.stats[k], 86);
  if (r.cons === 'heavenly') {
    r.stats.ce = 0; r.stats.ctrl = 0; r.stats.eff = 0;
    r.stats.vit = Math.max(r.stats.vit, 92);
    r.stats.tai = Math.max(r.stats.tai, 92);
  }
  r.flags.rct = r.cons !== 'heavenly';
  r.flags.domain = !!J.TECHS[r.tech].domain;
  r.weak = [J.WEAK_POINTS[0], J.WEAK_POINTS[1]];
  r.phase = 'duel';
  r.trial = true;
  r.log.push({ text: '【试炼场】你以 Lv.90 的完成度直接站到了宿傩面前。这场战斗不计入正式生涯。', cls: 'gold' });
  r.log.push({ text: '试炼场为你标记了 2 处弱点，对宿傩伤害 +20%。', cls: 'gold' });
  G.run = r;
  G.duelFromSim = true;
  enterDuel();
}

function startEndlessFromRun() {
  const r = G.run;
  if (!r || r.endless) return;
  stopAuto();
  closeModal();
  leaveBossMusic();
  r.endless = true;
  r.trial = false;
  r.endlessWave = 1;
  r.endlessWins = 0;
  r.endlessOutcome = '';
  while ((r.weak || []).length < 3) {
    if (!J.addWeak(r)) break;
  }
  r.log.push({ text: '【无尽回廊】你从宿傩的尸骸上站起来，轮回的门在背后打开。等级、六维、词条、觉醒、术式与弱点全部保留。', cls: 'gold' });
  r.log.push({ text: '这里不会立刻开战。你会像重开一局一样，从满行动点开始新的轮回；宿傩则在每次轮回中获得极大加成。', cls: 'gold' });
  beginEndlessCycle(1);
}

function restartEndless() {
  const r = G.run;
  if (!r || !r.endless) { startRun(); return; }
  stopAuto();
  closeModal();
  leaveBossMusic();
  r.endlessWave = 1;
  r.endlessWins = 0;
  r.endlessOutcome = '';
  r.log.push({ text: '【无尽回廊】轮回重新收紧。你的数据没有清零，只是再次从第一次轮回开始。', cls: 'gold' });
  beginEndlessCycle(1);
}

function endlessWaveReward(run, wave) {
  const beforeLvl = run.lvl;
  const beforeStats = Object.fromEntries(J.STATS.map(k => [k, Math.round(run.stats[k])]));
  J.gainXp(run, 60 + wave * 35);
  const keys = ['ce', 'ctrl', 'eff', 'vit', 'tai', 'iq'];
  const picks = 2 + Math.floor((wave - 1) / 3);
  for (let i = 0; i < picks; i++) {
    J.addStat(run, J.pick(keys), 2 + Math.floor(wave / 2));
  }
  if (wave % 2 === 0) J.addWeak(run);
  if (wave % 3 === 0) J.grantTrait(run);
  run.points += 2;
  run.endlessWins = (run.endlessWins || 0) + 1;
  const grew = J.STATS.filter(k => Math.round(run.stats[k]) > beforeStats[k])
    .map(k => `${J.STAT_NAMES[k]} +${Math.round(run.stats[k]) - beforeStats[k]}`);
  const lvlText = run.lvl > beforeLvl ? `Lv.${beforeLvl} → Lv.${run.lvl}` : `Lv.${run.lvl}`;
  run.log.push({ text: `【轮回馈赠】第 ${wave} 次轮回后：${lvlText}${grew.length ? '，' + grew.join('，') : ''}${wave % 2 === 0 ? '，新增一处弱点' : ''}${wave % 3 === 0 ? '，获得新词条' : ''}。`, cls: 'gold' });
  return { beforeLvl, afterLvl: run.lvl, grew };
}

function endlessActionPoints(run) {
  return 85 + (run.tier || 1) * 12 + 24;
}

function endlessSukuScale(wave) {
  const n = Math.max(1, wave || 1);
  return {
    hp: 1.55 * Math.pow(1.32, n - 1),
    atk: 1.30 * Math.pow(1.24, n - 1),
    def: 1.18 * Math.pow(1.15, n - 1),
    resist: Math.min(0.55, 0.10 + 0.035 * (n - 1))
  };
}

function applyEndlessSukuScale(d) {
  if (!d || !d.run || !d.run.endless || d._endlessScaled) return d;
  const wave = d.run.endlessWave || 1;
  const sc = endlessSukuScale(wave);
  const s = d.suku;
  s.totalMax = Math.round(s.totalMax * sc.hp);
  s.stage2Max = Math.round(s.stage2Max * sc.hp);
  s.maxHp = Math.round(s.maxHp * sc.hp);
  s.hp = s.maxHp;
  s.atk = Math.round(s.atk * sc.atk);
  s.stage2Atk = Math.round(s.stage2Atk * sc.atk);
  s.def = Math.round(s.def * sc.def);
  s.stage2Def = Math.round(s.stage2Def * sc.def);
  s.resist = Math.max(s.resist || 0, sc.resist);
  d.endlessWave = wave;
  d.endlessScales = sc;
  d._endlessScaled = true;
  pushDuel(d, `【第 ${wave} 次轮回】宿傩获得极大加成：生命 ×${sc.hp.toFixed(2)}，攻击 ×${sc.atk.toFixed(2)}，防御 ×${sc.def.toFixed(2)}，伤害抗性 ${Math.round(s.resist * 100)}%。`, 'gold');
  return d;
}

function beginEndlessCycle(wave = 1) {
  const r = G.run;
  if (!r || !r.endless) return;
  stopAuto();
  closeModal();
  leaveBossMusic();
  r.endlessWave = Math.max(1, wave || 1);
  r.endlessOutcome = '';
  r.phase = 'sim';
  r.mode = null;
  r.dead = false;
  r.slain = false;
  r._settled = false;
  r.age = 6;
  r.points = endlessActionPoints(r);
  r.actions = 0;
  r.pendingEvent = null;
  r.eventCounts = {};
  r.plotDone = [];
  G.duel = null;
  G.duelFromSim = false;
  const sc = endlessSukuScale(r.endlessWave);
  r.log.push({ text: `【第 ${r.endlessWave} 次轮回】像重开一局一样，从满行动点重新开始。等级、六维、词条、觉醒、术式、弱点与精炼全部保留；这一轮的宿傩生命 ×${sc.hp.toFixed(2)}、攻击 ×${sc.atk.toFixed(2)}、防御 ×${sc.def.toFixed(2)}、伤害抗性 ${Math.round(sc.resist * 100)}%。`, cls: 'gold' });
  setMobileTab('status');
  renderGame();
  show('game');
  setTimeout(scrollLog, 60);
  startAuto();
}

/* ---------------- 生涯界面 ---------------- */


function traitChipsHTML(run) {
  return (run.traits || []).map(t =>
    `<button class="chip trait-chip r-${t.rarity}" data-trait="${t.id}" title="${t.desc}">${t.name}</button>`
  ).join('');
}

function openTrait(id) {
  const t = J.TRAITS.find(x => x.id === id);
  if (!t) return;
  const rar = J.RARITY[t.rarity];
  openModal(`词条 · ${t.name}`,
    `<p class="${t.rarity === 'mythic' ? 'rainbow-text' : 'dim'}" style="letter-spacing:.12em">${rar.name}词条</p>
     <p style="margin-top:10px">${t.desc}</p>
     <p class="dim" style="margin-top:12px">词条效果即时生效，点击左侧词条可随时查看。</p>`,
    [{ label: '知道了', cls: 'primary' }]);
}

function quickRestart() {
  const endless = !!(G.run && G.run.endless);
  if (endless) { restartEndless(); toast('无尽轮回已重开，数据保留'); }
  else { startRun(); toast('已快速重开'); }
}

function renderGame() {
  const r = G.run;
  if (!r) return;
  const b = J.benchOf(r.lvl);
  $('#game-title').textContent = `${r.techName}${r.tech2 ? ' / ' + r.tech2Name : ''} · ${r.consName}${r.endless ? ` · 第 ${r.endlessWave || 1} 次轮回` : ''}`;
  $('#id-tier').textContent = r.tierName;
  const gd = $('#game-diff');
  if (gd) gd.textContent = r.difficultyName || '标准';
  $('#id-tech').textContent = r.techName + (r.tech2 ? ' / ' + r.tech2Name : '');
  $('#id-cons').textContent = r.consName + (r.flags.rct ? ' · 反转术式' : '') + (r.flags.domain ? ' · 领域' : '');
  $('#tech-desc').textContent = J.TECHS[r.tech].desc
    + (r.tech2 ? ' 第二术式：' + J.TECHS[r.tech2].desc : '')
    + (r.cons !== 'none' ? ' ' + J.CONS[r.cons].desc : '');

  const progress = Math.min(100, Math.round(r.xp / J.xpNeed(r.lvl) * 100));
  $('#meta-grid').innerHTML = `
    <div><div class="k">等级</div><div class="v">Lv.${r.lvl}</div></div>
    <div><div class="k">评级</div><div class="v">${b.grade}</div></div>
    <div><div class="k">对标</div><div class="v">${b.who}</div></div>
    <div><div class="k">年龄</div><div class="v">${r.age.toFixed(1)} 岁</div></div>
    <div><div class="k">行动点</div><div class="v">${r.points}</div></div>
    <div><div class="k">修炼进度</div><div class="v">${progress}%</div></div>
    <div><div class="k">剧情</div><div class="v">${r.plotDone.length}</div></div>
    <div><div class="k">词条</div><div class="v">${(r.traits || []).length}</div></div>
    <div><div class="k">上限突破</div><div class="v" style="color:${(r.capBonus || 0) ? 'var(--gold)' : 'inherit'}">+${r.capBonus || 0}</div></div>
    <div><div class="k">难度</div><div class="v" style="font-size:15px;color:var(--gold)">${r.difficultyName || '标准'}</div></div>
  `;

  const list = $('#stat-list');
  list.innerHTML = '';
  for (const k of J.STATS) {
    const val = Math.round(r.stats[k]);
    const ref = Math.round((r.refine && r.refine[k]) || 0);
    const cap = Math.max(1, J.statCapFor(r, k));
    const basePct = Math.min(100, Math.min(100, val) / cap * 100);
    const overPct = val > 100 ? Math.min(100, (val - 100) / cap * 100) : 0;
    const row = document.createElement('div');
    row.className = 'stat-row' + (val > 100 ? ' over' : '');
    row.innerHTML = `<span class="n">${J.STAT_NAMES[k]}</span>
      <span class="bar-track" title="100 刻度 · ${cap} 上限${ref ? ` · 精炼 +${ref}` : ''}"><i style="width:${basePct}%"></i>${overPct ? `<b class="over" style="left:${100 / cap * 100}%;width:${overPct}%"></b>` : ''}</span>
      <span class="val">${val}</span>`;
    list.appendChild(row);
  }

  const refTotal = Math.round(J.totalRefine(r));
  const mastery = r.techMastery || 0;
  const tiers = J.MASTERY_TIERS;
  let refFill = 100;
  let refNote = '术式领悟 叁 / 叁';
  if (mastery < tiers.length) {
    refFill = Math.max(0, Math.min(100, refTotal / tiers[tiers.length - 1] * 100));
    refNote = refTotal <= 0 && mastery === 0
      ? `达到当前上限后转入 · 首阶 ${tiers[0]}`
      : `术式领悟 ${mastery} / 3 · 下一 ${tiers[mastery]}`;
  }
  $('#refine-total').textContent = refTotal;
  $('#refine-note').textContent = refNote;
  $('#refine-fill').style.width = refFill + '%';

  const flags = $('#flag-chips');
  flags.innerHTML = '';
  if (r.cons !== 'none') flags.innerHTML += `<span class="chip gold">${J.CONS[r.cons].name}</span>`;
  if (r.cons === 'ninePhases') flags.innerHTML += `<span class="chip red">赤血 ${r.bloodStage || 1} / 3</span>`;
  if (r.tech2) flags.innerHTML += `<span class="chip purple">副·${r.tech2Name}</span>`;
  if (r.flags.rct) flags.innerHTML += '<span class="chip purple">反转术式</span>';
  if (r.flags.domain) flags.innerHTML += `<span class="chip purple">领域·${r.domainName || J.TECHS[r.tech].domain || r.techName}</span>`;
  const aw = Object.keys(r.awaken || {}).filter(k => r.awaken[k]);
  if (aw.length) {
    const pathLen = (J.AWAKEN_PATHS[r.tech] || []).length || 3;
    flags.innerHTML += `<span class="chip gold" title="${aw.map(k => J.awakenName(r, k)).join(' / ')}">术式觉醒 ${aw.length} / ${pathLen}</span>`;
  }
  for (const key of ['simpleDomain', 'fallingBlossom', 'hollowWicker', 'burnoutFix']) {
    if (r.flags[key]) flags.innerHTML += `<span class="chip green">${J.DOMAIN_COUNTER_FLAGS[key]}</span>`;
  }
  if (r.cons === 'heavenly') flags.innerHTML += '<span class="chip red">无咒力</span>';
  if (r.cons === 'sixEyes' && r.tech === 'limitless') flags.innerHTML += '<span class="chip gold">茈 已解锁</span>';
  if (r.tech === 'copy' && r.copiedMoves.length) flags.innerHTML += `<span class="chip">复制 ${r.copiedMoves.length}</span>`;
  const mb = r.mythicBoons || {};
  const boonBits = [];
  if (mb.hp) boonBits.push(`生命 +${Math.round(mb.hp * 100)}%`);
  if (mb.atk) boonBits.push(`攻击 +${Math.round(mb.atk * 100)}%`);
  if (mb.dmg) boonBits.push(`伤害 +${Math.round(mb.dmg * 100)}%`);
  if (mb.cost) boonBits.push(`术式消耗 -${Math.round(mb.cost * 100)}%`);
  if (mb.critDmg) boonBits.push(`暴击伤害 +${Math.round(mb.critDmg * 100)}%`);
  if (mb.revive) boonBits.push(`额外免死 ${mb.revive}`);
  if (mb.domainTurn) boonBits.push(`领域持续 +${mb.domainTurn}`);
  if (boonBits.length) flags.innerHTML += `<span class="chip r-mythic" title="${boonBits.join(' / ')}">彩色祝福 ${boonBits.length}</span>`;

  $('#weak-count').textContent = `${r.weak.length} / 5`;
  $('#weak-chips').innerHTML = r.weak.length
    ? r.weak.map(w => `<span class="chip red" title="${w.sub}">${w.name}</span>`).join('')
    : '<span class="chip">尚未窥见</span>';
  $('#trait-count').textContent = `${(r.traits || []).length} 个`;
  $('#trait-chips').innerHTML = traitChipsHTML(r) || '<span class="chip">无</span>';

  const duelBtn = $('#btn-duel');
  const canManual = r.lvl >= 90 && r.phase === 'sim';
  duelBtn.hidden = !canManual;
  duelBtn.textContent = '提前挑战宿傩（Lv.90+）';
  $('#log-round').textContent = `行动 ${r.actions || 0} · ${r.age.toFixed(1)} 岁 · Lv.${r.lvl}`;
  $('#btn-next').disabled = r.phase !== 'sim';
  $('#btn-next').textContent = r.phase === 'duel' ? '宿傩正在等你' : '行动一次';
  const mNext = $('#m-next');
  if (mNext) { mNext.disabled = r.phase !== 'sim'; mNext.textContent = r.phase === 'duel' ? '宿傩正在等你' : '行动一次'; }
  const mDuel = $('#m-duel');
  if (mDuel) { mDuel.hidden = !canManual; mDuel.textContent = '挑战宿傩'; }
  renderLog();
}

function renderLog() {
  const box = $('#log-box');
  if (!G.run) return;
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = '';
  const lines = G.run.log.slice(-120);
  for (const l of lines) {
    const div = document.createElement('div');
    div.className = 'line ' + (l.cls || '');
    div.textContent = l.text;
    box.appendChild(div);
  }
  if (nearBottom) scrollLog();
}

function scrollLog() {
  const box = $('#log-box');
  if (box) box.scrollTop = box.scrollHeight;
}

function openChoiceEvent() {
  const r = G.run;
  const pe = r && r.pendingEvent;
  if (!pe) return;
  const ev = J.EVENTS.find(e => e.id === pe.id);
  if (!ev || !ev.options) return;
  const mythic = ev.rarity === 'mythic';
  const body = `${mythic ? '<div class="event-rarity">彩色事件</div>' : ''}<p class="event-prompt">${ev.prompt}</p><div class="event-options">${ev.options.map(o =>
    `<div class="event-option"><b>${o.label}</b><span>${o.desc}</span></div>`
  ).join('')}</div><p class="dim" style="margin:12px 0 0;font-size:11.5px">选择后立即结算，结果可能成功，也可能反噬。</p>`;
  const actions = ev.options.map(o => ({ label: o.label, cls: o.cls || 'ghost', fn: () => chooseEvent(o.id) }));
  openModal(`${mythic ? '彩色事件' : '事件'} · ${ev.name}`, body, actions);
  const box = document.querySelector('#modal .modal-box');
  if (box) box.classList.toggle('mythic', mythic);
}

function mythicBurst() {
  const layer = document.createElement('div');
  layer.className = 'mythic-burst';
  const colors = ['#ff6b9d', '#ffd166', '#63e6be', '#7aa2ff', '#c084fc'];
  let html = '<i class="ring"></i><i class="ring delay"></i>';
  for (let i = 0; i < 28; i++) {
    const angle = (i * 360 / 28 + Math.random() * 12).toFixed(1);
    const color = colors[i % colors.length];
    const dist = (34 + Math.random() * 22).toFixed(1);
    html += `<b style="--a:${angle}deg;--c:${color};animation-delay:${(Math.random() * .12).toFixed(2)}s;--d:${dist}vmin"></b>`;
  }
  layer.innerHTML = html;
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 1250);
}

function chooseEvent(choiceId) {
  const r = G.run;
  if (!r || !r.pendingEvent) return;
  const ev = J.EVENTS.find(e => e.id === r.pendingEvent.id);
  const mythic = !!(ev && ev.rarity === 'mythic');
  if (mythic) mythicBurst();
  J.resolveEventChoice(r, choiceId);
  closeModal();
  renderGame();
  if (r.pendingEvent) { openChoiceEvent(); return; }
  if (r.phase === 'duel') {
    stopAuto();
    setTimeout(() => openDuelPrep(false), 350);
  } else if (r.phase === 'over') {
    stopAuto();
    setTimeout(() => finishRun(r.mode), 500);
  } else if (r.phase === 'sim') {
    setTimeout(() => {
      if (G.run === r && r.phase === 'sim' && !r.pendingEvent && !G.autoOn) startAuto();
    }, 500);
  }
}

function advance() {
  const r = G.run;
  if (!r || r.phase !== 'sim') return false;
  if (r.pendingEvent) { stopAuto(); openChoiceEvent(); return false; }
  const before = r.log.length;
  J.advanceAction(r);
  const emitted = r.log.length > before;
  renderGame();
  if (r.pendingEvent) { stopAuto(); openChoiceEvent(); return emitted; }
  if (r.phase === 'duel') {
    stopAuto();
    setTimeout(() => openDuelPrep(false), 350);
  } else if (r.phase === 'over') {
    stopAuto();
    setTimeout(() => finishRun(r.mode), 500);
  }
  return emitted;
}

function startAuto() {
  if (G.autoOn) return;
  if (!G.run || G.run.phase !== 'sim' || G.run.pendingEvent) return;
  G.autoOn = true;
  const b = $('#btn-auto');
  if (b) { b.textContent = '暂停'; b.classList.add('auto-on'); }
  const tick = () => {
    G.auto = null;
    if (!G.autoOn) return;
    if (!G.run || G.run.phase !== 'sim') { stopAuto(); return; }
    const emitted = advance();
    if (!G.autoOn || !G.run || G.run.phase !== 'sim') { stopAuto(); return; }
    G.auto = setTimeout(tick, emitted ? 600 : 0);
  };
  G.auto = setTimeout(tick, 0);
}
function toggleAuto() {
  if (G.autoOn) stopAuto();
  else startAuto();
}
function stopAuto() {
  G.autoOn = false;
  if (G.auto) clearTimeout(G.auto);
  G.auto = null;
  const b = $('#btn-auto');
  if (b) { b.textContent = '自动推进'; b.classList.remove('auto-on'); }
}

/* ---------------- 宿傩准备 ---------------- */

function openDuelPrep(fromSim) {
  const r = G.run;
  G.duelFromSim = fromSim;
  const d = J.derived(r);
  const b = J.benchOf(r.lvl);
  const weakTxt = r.weak.length
    ? `已看破 ${r.weak.length} 处弱点，对宿傩伤害 +${Math.round(J.weakBonus(r) * 100)}%。${r.weak.length >= 3 ? '可发动一次弱点重创。' : ''}`
    : '尚未看破任何弱点。';
  const weakNames = r.weak.length ? `<p class="dim">${r.weak.map(w => w.name).join(' · ')}</p>` : '';
  const endlessNote = r.endless ? (() => {
    const sc = endlessSukuScale(r.endlessWave || 1);
    return `<p class="gold" style="margin-top:10px">第 ${r.endlessWave || 1} 次轮回的宿傩：生命 ×${sc.hp.toFixed(2)}，攻击 ×${sc.atk.toFixed(2)}，防御 ×${sc.def.toFixed(2)}，伤害抗性 ${Math.round(sc.resist * 100)}%。</p>`;
  })() : '';
  const body = `
    <p>Lv.${r.lvl} · ${b.grade}（对标 ${b.who}）</p>
    <p>生命 <b>${d.maxHp}</b> · 攻击 <b>${d.atk}</b> · 防御 <b>${d.def}</b> · 咒力 <b>${d.maxCe}</b></p>
    <p>${weakTxt}</p>${weakNames}${endlessNote}
    <p class="dim" style="margin-top:10px">宿傩会提前暴露下一招，且分为十影宿傩、原身宿傩两个独立阶段。防御、闪避、反转术式与束缚，都是你的出招。</p>
  `;
  const actions = [
    { label: '正面对决', cls: 'primary', fn: () => enterDuel() }
  ];
  if (r.weak.length >= 3) {
    actions.push({ label: '以弱点重创', cls: 'blood', fn: () => weakStrike() });
  }
  actions.push({ label: fromSim ? '再行动一次' : '转身离开', cls: 'ghost', fn: () => {
    if (fromSim) { closeModal(); }
    else finishRun('retreat');
  }});
  openModal('宿傩就在眼前', body, actions);
}

function weakStrike() {
  closeModal();
  stopAuto();
  if (!G.run) return;
  G.duel = J.startDuel(G.run);
  if (G.run.endless) applyEndlessSukuScale(G.duel);
  J.applyWeakStrike(G.duel);
  enterBossMusic();
  setDuelLog(false);
  renderDuel();
  show('duel');
}

function endlessWeakStrike() {
  const d = G.duel;
  if (!d || !d.endlessWave || d.over || d.busy || d.weakStrikeUsed || (G.run.weak || []).length < 3) return;
  J.applyWeakStrike(d);
  if (!d.over && d.suku.forceIntent) J.rollIntent(d);
  renderDuel();
  if (d.over) setTimeout(endDuel, 700);
}

/* ---------------- 战斗 ---------------- */

function enterDuel() {
  closeModal();
  stopAuto();
  if (!G.run) return;
  G.duel = J.startDuel(G.run);
  if (G.run.endless) applyEndlessSukuScale(G.duel);
  enterBossMusic();
  setDuelLog(false);
  renderDuel();
  show('duel');
}

function renderDuel() {
  const d = G.duel;
  if (!d) return;
  const r = d.run, p = d.player, s = d.suku;
  const dd = $('#duel-diff');
  if (dd) dd.textContent = r.difficultyName || '标准';

  const sp = Math.max(0, s.hp / s.maxHp * 100);
  $('#suku-hp').style.width = sp + '%';
  $('#suku-hp-text').textContent = `${J.money(Math.max(0, s.hp))} / ${J.money(s.maxHp)}`;
  $('#suku-phase').textContent = (d.endlessWave ? `第 ${d.endlessWave} 次轮回 · ` : '') + SUKU_PHASE_LABEL(s);
  $('#suku-line').innerHTML =
    `<span>攻击 <b>${Math.round(s.atk * (1 - s.atkDebuff))}</b></span>` +
    `<span>防御 <b>${Math.round(s.def)}</b></span>` +
    `<span class="gold">抗性 <b>${Math.round((s.resist || 0) * 100)}%</b></span>` +
    (s.resistDown ? `<span class="red">破抗 <b>-${Math.round(s.resistDown * 100)}%</b>${s.resistDownT ? `/${s.resistDownT}` : ''}</span>` : '') +
    (s.bleed ? `<span class="red">流血 <b>${s.bleed}</b></span>` : '') +
    (s.burn ? `<span class="red">灼烧 <b>${s.burn}</b></span>` : '') +
    (s.freeze ? `<span class="purple">冻结 <b>${s.freeze}</b></span>` : '') +
    (s.domainTurns ? `<span class="red">领域 <b>${s.domainTurns}</b></span>` : '') +
    (s.summons && s.summons.agito ? '<span class="gold">颚吐 <b>在场</b></span>' : '') +
    (s.summons && s.summons.maho ? '<span class="gold">魔虚罗 <b>在场</b></span>' : '');

  const intent = s.intent;
  const worldWarn = !!(intent && intent.id === 'world');
  const intentBox = $('#suku-intent');
  intentBox.classList.toggle('world', worldWarn);
  if (intent) {
    const tag = worldWarn ? '必中' : (intent.summon ? '召唤物将行动' : (intent.sure ? (r.cons === 'heavenly' ? '领域必中·天与免疫' : '必中') : '可闪避'));
    const hits = intent.hits ? ` × ${intent.hits}` : '';
    const dmgTxt = intent.summon ? '' : ` · 约 ${Math.round(s.atk * (intent.mult || 1) * (intent.hits || 1))} 伤害`;
    intentBox.innerHTML = `<span class="k">${worldWarn ? '空间斩预警' : '下一招'}</span>${intent.name}${hits} · ${tag}${dmgTxt}${worldWarn ? ' · 使用「空间抗性」' : ''}`;
  } else {
    intentBox.innerHTML = '<span class="k">下一招</span>观察中……';
  }

  const php = Math.max(0, p.hp / p.maxHp * 100);
  const pce = p.maxCe > 0 ? Math.max(0, p.ce / p.maxCe * 100) : 0;
  $('#player-hp').style.width = php + '%';
  $('#player-hp-text').textContent = `${J.money(Math.max(0, p.hp))} / ${J.money(p.maxHp)}`;
  $('#player-ce').style.width = pce + '%';
  $('#player-ce-text').textContent = p.maxCe > 0 ? `咒力 ${Math.round(p.ce)} / ${p.maxCe}` : '无咒力';
  $('#player-name').textContent = `Lv.${r.lvl} · ${J.benchOf(r.lvl).grade}`;
  $('#player-tech').textContent = r.techName + (r.tech2 ? ' / ' + r.tech2Name : '');
  const xz = extraDamageState(d, {});
  const pExtra = Math.round((xz.bonus - 1) * 100);
  const pPen = Math.round((xz.pen - (s.resistDown || 0)) * 100);
  $('#player-line').innerHTML =
    `<span>攻击 <b>${Math.round(p.atk * (1 + p.atkBuff))}</b>${p.atkBuff ? ` <span class="gold">+${Math.round(p.atkBuff * 100)}%</span>` : ''}</span>` +
    `<span>防御 <b>${Math.round(p.def * (1 + p.defBuff) - p.defDownPerm)}</b>${p.defBuff ? ` <span class="purple">+${Math.round(p.defBuff * 100)}%</span>` : ''}</span>` +
    (pExtra ? `<span class="gold">额外伤害 <b>+${pExtra}%</b></span>` : '') +
    (pPen ? `<span class="purple">穿抗 <b>${pPen}%</b></span>` : '') +
    (p.shield ? `<span class="green">减伤 ${Math.round(p.shield * 100)}%</span>` : '') +
    (p.evade ? `<span class="green">闪避待机</span>` : '') +
    (p.bleed ? `<span class="red">流血 <b>${p.bleed}</b></span>` : '') +
    (p.burn ? `<span class="red">灼烧 <b>${p.burn}</b></span>` : '') +
    (p.domainTurns ? `<span class="purple">领域·${p.domainName || r.domainName || '展开'} <b>${p.domainTurns}</b></span>` : '') +
    (p.critStack ? `<span class="gold">万象 <b>${p.critStack}</b>/6${p.zenithNuke ? ' · 临界' : ''}</span>` : '') +
    (p.burnout ? `<span class="red">熔断 <b>${p.burnout}</b></span>` : '') +
    (p.domainGuard ? `<span class="green">${p.domainGuard.name} <b>${p.domainGuard.turns}</b></span>` : '') +
    (p.revive ? '<span class="gold">容器免死</span>' : '') +
    (p.spaceGuard ? '<span class="gold">空间抗性</span>' : '') +
    (p.spirits ? `<span class="purple">咒灵 ${p.spirits}</span>` : '');

  $('#duel-traits').innerHTML = traitChipsHTML(r);
  $('#duel-turn').textContent = (d.endlessWave ? `第 ${d.endlessWave} 次轮回 · ` : '') + `回合 ${d.turn}`;
  const dtitle = $('#duel-title');
  if (dtitle) dtitle.textContent = d.endlessWave ? `无尽轮回 · 第 ${d.endlessWave} 次` : '人外魔境 · 新宿决战';
  const eTag = $('#endless-wave-tag'), eWrap = $('#endless-weak-wrap');
  if (eTag) { eTag.hidden = !d.endlessWave; eTag.textContent = d.endlessWave ? `第 ${d.endlessWave} 次轮回` : ''; }
  if (eWrap) eWrap.hidden = !d.endlessWave || d.weakStrikeUsed || (r.weak || []).length < 3;

  const ml = $('#move-list');
  ml.innerHTML = '';
  const domainThreat = s.domainTurns > 0 || !!(s.intent && s.intent.domain);
  const moves = J.movesOf(r).filter(m =>
    (!m.domainOnly || domainThreat) && (m.kind !== 'repair' || (p.burnout > 0 && !p.burnoutFixUsed))
  );
  for (const m of moves) {
    const cost = J.effectiveCost(r, m, p.costMod);
    const cd = p.cd[m.id] || 0;
    const sealed = p.sealed.includes(m.id);
    const burnoutBlocked = p.burnout > 0 && !J.isBodyMove(m) && m.kind !== 'repair';
    const spaceBlocked = m.spaceOnly && !worldWarn;
    const disabled = d.over || d.busy || sealed || cd > 0 || cost > p.ce || burnoutBlocked || spaceBlocked;
    const b = document.createElement('button');
    b.className = 'move' + (['basic', 'guard', 'dodge', 'breath'].includes(m.id) ? ' uni' : '');
    b.dataset.move = m.id;
    b.disabled = disabled;
    let tag = '';
    if (m.spaceOnly) tag = worldWarn ? '<span class="m-tag">空间</span>' : '<span class="m-tag">待预警</span>';
    else if (burnoutBlocked) tag = '<span class="m-tag">熔断</span>';
    else if (m.kind === 'repair') tag = '<span class="m-tag">修复</span>';
    else if (m.kind === 'domain') tag = '<span class="m-tag">领域</span>';
    else if (m.kind === 'counter') tag = '<span class="m-tag">领域对抗</span>';
    else if (m.kind === 'heal') tag = '<span class="m-tag">治疗</span>';
    else if (m.kind === 'def') tag = '<span class="m-tag">防御</span>';
    else if (m.awaken) tag = '<span class="m-tag">觉醒</span>';
    else if (sealed) tag = '<span class="m-tag">封印</span>';
    else if (cd > 0) tag = `<span class="m-tag">CD ${cd}</span>`;
    b.innerHTML = `<span class="m-top">${tag}<span class="m-name">${m.name}</span><span class="m-cost">${cost ? '咒力 ' + cost : '无消耗'}</span></span><span class="m-desc">${m.desc || ''}</span>`;
    ml.appendChild(b);
  }

  const vl = $('#vow-list');
  vl.innerHTML = '';
  for (const v of J.VOWS) {
    const used = d.vowUsed[v.id];
    const b = document.createElement('button');
    b.className = 'vow';
    b.dataset.vow = v.id;
    b.disabled = d.over || d.busy || used || d.vowThisTurn;
    b.innerHTML = `<b>${v.name}${used ? ' · 已用' : ''}</b>${v.desc}`;
    vl.appendChild(b);
  }

  renderDuelLog();
}

function SUKU_PHASE_LABEL(s) {
  if (s.stage === 1) return '十影宿傩 · 1/2';
  return '原身宿傩 · 2/2';
}

function renderDuelLog() {
  const d = G.duel;
  if (!d) return;
  const box = $('#duel-log');
  const near = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
  box.innerHTML = '';
  for (const l of d.log.slice(-50)) {
    const div = document.createElement('div');
    div.className = 'line ' + (l.cls || '');
    div.textContent = l.text;
    box.appendChild(div);
  }
  if (near) box.scrollTop = box.scrollHeight;
}

function doMove(id) {
  const d = G.duel;
  if (!d || d.over || d.busy) return;
  const ok = J.playerMove(d, id);
  renderDuel();
  if (!ok) return;
  if (d.over) { setTimeout(endDuel, 700); return; }
  setTimeout(() => {
    if (!G.duel || G.duel.over) return;
    J.sukuTurn(G.duel);
    renderDuel();
    if (G.duel.over) setTimeout(endDuel, 800);
  }, 720);
}

function doVow(id) {
  const d = G.duel;
  if (!d || d.over || d.busy) return;
  J.useVow(d, id);
  renderDuel();
}

function endDuel() {
  const d = G.duel;
  if (!d || d._ended) return;
  d._ended = true;
  if (G.run && G.run.endless) {
    const wave = G.run.endlessWave || d.endlessWave || 1;
    G.meta.endlessBest = Math.max(G.meta.endlessBest || 0, wave);
    saveMeta();
    if (d.result === 'win') {
      const reward = endlessWaveReward(G.run, wave);
      const nextWave = wave + 1;
      const nextSc = endlessSukuScale(nextWave);
      G.run.log.push({ text: `无尽轮回：第 ${wave} 次宿傩战突破。`, cls: 'big' });
      openModal(`无尽轮回 · 第 ${wave} 次突破`,
        `<p>十影与原身都已倒下。轮回没有结束，下一次的宿傩会获得更夸张的加成。</p>
         <p class="dim" style="margin-top:10px">本轮馈赠：${reward.afterLvl > reward.beforeLvl ? `Lv.${reward.beforeLvl} → Lv.${reward.afterLvl}` : `Lv.${reward.afterLvl}`}${reward.grew.length ? '；' + reward.grew.join('，') : ''}。已有数据全部保留。</p>
         <p class="dim" style="margin-top:8px">下一次不会直接开战：会像重开一局一样，从满行动点开始新的轮回，先修炼、遇事件，再挑战宿傩。下一次宿傩生命 ×${nextSc.hp.toFixed(2)}、攻击 ×${nextSc.atk.toFixed(2)}、防御 ×${nextSc.def.toFixed(2)}、伤害抗性 ${Math.round(nextSc.resist * 100)}%。</p>
         <p class="dim" style="margin-top:8px">三处弱点保留，每场可手动重创一次。</p>`,
        [
          { label: `进入第 ${nextWave} 次轮回`, cls: 'primary', fn: () => beginEndlessCycle(nextWave) },
          { label: '带着战绩离开', cls: 'ghost', fn: () => { G.run.endlessOutcome = 'clear'; finishRun('endless'); } }
        ]);
    } else if (d.result === 'retreat') {
      G.run.log.push({ text: `无尽轮回：第 ${wave} 次主动离开。`, cls: 'sys' });
      G.run.endlessOutcome = 'retreat';
      finishRun('endless');
    } else {
      G.run.log.push({ text: `无尽轮回：第 ${wave} 次倒下。`, cls: 'big' });
      G.run.endlessOutcome = 'dead';
      finishRun('endless');
    }
    return;
  }
  if (d.result === 'win') {
    G.run.slain = true;
    G.run.log.push({ text: '宿傩战：胜。十影与原身都已倒下，你从新宿的废墟里走了出来。', cls: 'big' });
    finishRun('slain');
  } else if (d.result === 'retreat') {
    G.run.log.push({ text: '宿傩战：撤退。', cls: 'sys' });
    finishRun('retreat');
  } else {
    G.run.log.push({ text: '宿傩战：败。你的咒术师生涯到此为止。', cls: 'big' });
    finishRun('dead');
  }
}

/* ---------------- 结算 ---------------- */

const ENDINGS = {
  slain: {
    kicker: 'CURSED KING SLAYER',
    title: '诅咒之王，陨落',
    desc: '宿傩的肉体重组失败。新宿的废墟上只剩风声，和你还没有收回的手。'
  },
  dead: {
    kicker: 'YOU DIED',
    title: '斩击落下',
    desc: '你的故事停在了这里。但咒术师的道路，本来就不保证明天。'
  },
  points: {
    kicker: 'TIME UP',
    title: '实力不足',
    desc: '你活到了最后，却没走到能站在宿傩面前的高度。'
  },
  retreat: {
    kicker: 'RETREAT',
    title: '你转身离开',
    desc: '活下去也是一种选择。只是下一次，你未必还有机会。'
  },
  endless: {
    kicker: 'ENDLESS REINCARNATION',
    title: '无尽轮回',
    desc: '你停下的地方，就是下一次轮回的起点。宿傩会记得你，也会一次比一次更强。'
  },
};

function finishRun(mode) {
  stopAuto();
  closeModal();
  leaveBossMusic();
  const r = G.run;
  if (!r) return;
  if (r.phase === 'over' && r._settled) return;
  r._settled = true;
  if (r.endless && !r.endlessOutcome) {
    r.endlessOutcome = (mode === 'retreat' || mode === 'forfeit') ? 'retreat' : 'dead';
  }
  const res = J.settle(r, mode);

  if (r.endless) {
    const m = G.meta;
    m.endlessBest = Math.max(m.endlessBest || 0, res.wave || 0);
    saveMeta();
  } else if (!r.trial) {
    const m = G.meta;
    m.exp += res.exp;
    while (m.exp >= 50 * (m.lv + 1)) {
      m.exp -= 50 * (m.lv + 1);
      m.lv++;
    }
    m.runs++;
    if (res.mode === 'slain') m.wins++;
    m.best = Math.max(m.best, res.level);
    m.points = Math.min(100, m.points + res.points);
    saveMeta();
  }

  renderSettle(res);
  show('settle');
}


/* ---------------- 分享战绩 ---------------- */

function canvasRoundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function canvasSpacedText(ctx, text, x, y, space) {
  let cx = x;
  for (const ch of String(text)) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + space;
  }
  return cx;
}

function canvasFitFont(ctx, text, maxWidth, start, weight, family) {
  let size = start;
  while (size > 12) {
    ctx.font = `${weight} ${size}px ${family}`;
    if (ctx.measureText(String(text)).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function canvasWrap(ctx, text, maxWidth, maxLines) {
  const chars = Array.from(String(text));
  const lines = [];
  let cur = '';
  for (const ch of chars) {
    const next = cur + ch;
    if (cur && ctx.measureText(next).width > maxWidth) {
      lines.push(cur);
      cur = ch;
      if (lines.length === maxLines) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && chars.join('').length > lines.join('').length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[lines.length - 1] = last + '…';
  }
  return lines;
}

function drawShareCanvas(res) {
  const W = 1080, H = 1440, M = 72;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const run = G.run || {};
  const stats = res.stats || run.stats || {};
  const ending = ENDINGS[res.mode] || ENDINGS.points;
  const serif = '"Songti SC","Noto Serif SC","STSong","SimSun",serif';
  const sans = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
  const INK = '#ece5dc', MUT = '#9c949e', DIM = '#6c6572', GOLD = '#d9b36c', RED = '#c1121f';

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0c0c12');
  bg.addColorStop(.55, '#08080c');
  bg.addColorStop(1, '#100a0c');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  let rg = ctx.createRadialGradient(540, 70, 0, 540, 70, 720);
  rg.addColorStop(0, 'rgba(193,18,31,.32)');
  rg.addColorStop(.56, 'rgba(120,10,25,.10)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  rg = ctx.createRadialGradient(940, 1240, 0, 940, 1240, 520);
  rg.addColorStop(0, 'rgba(217,179,108,.10)');
  rg.addColorStop(1, 'rgba(217,179,108,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(255,255,255,.035)';
  ctx.lineWidth = 1;
  for (let x = M; x <= W - M; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 72; y <= H - 72; y += 72) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.fillStyle = 'rgba(193,18,31,.035)';
  ctx.font = `700 430px ${serif}`;
  ctx.textAlign = 'right';
  ctx.fillText('宿', W - 38, 1030);

  ctx.strokeStyle = 'rgba(217,179,108,.30)';
  ctx.lineWidth = 2;
  canvasRoundRect(ctx, 34, 34, W - 68, H - 68, 8);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(193,18,31,.55)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, 60); ctx.lineTo(W - M, 60); ctx.stroke();

  ctx.textAlign = 'left';
  ctx.font = `600 18px ${sans}`;
  ctx.fillStyle = '#b23d49';
  canvasSpacedText(ctx, 'JUJUTSU KAISEN · SIMULATOR', M, 96, 4);
  ctx.textAlign = 'right';
  ctx.fillStyle = DIM;
  ctx.font = `16px ${sans}`;
  ctx.fillText('jujutsu.desthon.xyz', W - M, 96);

  ctx.textAlign = 'left';
  ctx.font = `600 24px ${sans}`;
  ctx.fillStyle = '#c1121f';
  canvasSpacedText(ctx, ending.kicker, M, 150, 7);

  const badge = res.endless ? `第 ${res.wave} 次轮回` : res.mode === 'slain' ? '宿傩讨伐' : res.mode === 'dead' ? '战死' : res.mode === 'retreat' ? '撤退' : '时间耗尽';
  const badgeColor = res.endless || res.mode === 'slain' ? GOLD : res.mode === 'dead' ? '#e05a64' : MUT;
  ctx.font = `700 20px ${sans}`;
  const bw = ctx.measureText(badge).width + 36;
  canvasRoundRect(ctx, W - M - bw, 120, bw, 42, 21);
  ctx.fillStyle = res.mode === 'slain' ? 'rgba(217,179,108,.12)' : 'rgba(193,18,31,.12)';
  ctx.fill();
  ctx.strokeStyle = res.mode === 'slain' ? 'rgba(217,179,108,.55)' : 'rgba(193,18,31,.45)';
  ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = badgeColor; ctx.textAlign = 'center';
  ctx.fillText(badge, W - M - bw / 2, 148);

  const titleSize = canvasFitFont(ctx, ending.title, W - 2 * M - 180, 88, 600, serif);
  ctx.textAlign = 'left';
  ctx.font = `600 ${titleSize}px ${serif}`;
  ctx.fillStyle = INK;
  ctx.fillText(ending.title, M, 246);

  ctx.font = `20px ${sans}`;
  ctx.fillStyle = MUT;
  let descY = 292;
  for (const line of canvasWrap(ctx, ending.desc, W - 2 * M - 30, 2)) {
    ctx.fillText(line, M, descY); descY += 30;
  }

  const total = J.STATS.reduce((a, k) => a + (stats[k] || 0), 0);
  const cells = [
    ['难度', res.difficultyName || '标准', GOLD],
    [res.endless ? '无尽轮回' : '最终等级', res.endless ? '第 ' + res.wave + ' 次' : 'Lv.' + res.level, INK],
    ['评级', res.bench.grade, GOLD],
    ['年龄', res.age.toFixed(1) + ' 岁', INK],
    ['弱点', res.weak + ' / 5', INK],
    [res.endless ? '每轮回开始' : '获得经验', res.endless ? '满行动点' : '+' + res.exp, INK],
    [res.endless ? '最高纪录' : '保底积分', res.endless ? '第 ' + (G.meta.endlessBest || res.wave) + ' 次' : '+' + res.points, GOLD],
    ['六维总和', String(Math.round(total)), INK],
    ['术师等级', 'Lv.' + G.meta.lv, INK]
  ];
  const gap = 14, cellW = (W - 2 * M - gap * 2) / 3, cellH = 128;
  const gridY = 382;
  for (let i = 0; i < cells.length; i++) {
    const cx = M + (i % 3) * (cellW + gap);
    const cy = gridY + Math.floor(i / 3) * (cellH + gap);
    canvasRoundRect(ctx, cx, cy, cellW, cellH, 4);
    ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.09)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.textAlign = 'left';
    ctx.font = `16px ${sans}`;
    ctx.fillStyle = DIM;
    ctx.fillText(cells[i][0], cx + 18, cy + 34);
    const vs = canvasFitFont(ctx, cells[i][1], cellW - 36, 38, 600, serif);
    ctx.font = `600 ${vs}px ${serif}`;
    ctx.fillStyle = cells[i][2];
    ctx.fillText(cells[i][1], cx + 18, cy + 92);
  }

  const statsTop = 850;
  ctx.textAlign = 'left';
  ctx.font = `600 26px ${serif}`;
  ctx.fillStyle = INK;
  ctx.fillText('六维', M, statsTop);
  ctx.font = `15px ${sans}`;
  ctx.fillStyle = DIM;
  ctx.textAlign = 'right';
  ctx.fillText('100 刻度 · 金色突破段', W - M, statsTop);
  ctx.textAlign = 'left';

  const colW = (W - 2 * M - 30) / 2;
  const rowH = 60;
  J.STATS.forEach((k, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * (colW + 30), y = statsTop + 46 + row * rowH;
    const val = Math.round(stats[k] || 0);
    const cap = Math.max(100, J.statCapFor(run, k));
    ctx.font = `20px ${sans}`;
    ctx.fillStyle = '#b9b2ba';
    ctx.fillText(J.STAT_NAMES[k], x, y + 6);
    ctx.textAlign = 'right';
    ctx.font = `600 25px ${serif}`;
    ctx.fillStyle = val > 100 ? GOLD : INK;
    ctx.fillText(String(val), x + colW - 8, y + 6);
    ctx.textAlign = 'left';
    const bx = x + 104, bwBar = colW - 118, by = y + 17;
    canvasRoundRect(ctx, bx, by, bwBar, 8, 4);
    ctx.fillStyle = '#1a1920'; ctx.fill();
    const pct = Math.max(0, Math.min(1, val / cap));
    if (pct > 0) {
      const grad = ctx.createLinearGradient(bx, 0, bx + bwBar, 0);
      grad.addColorStop(0, val > 100 ? '#a77c34' : '#7c1420');
      grad.addColorStop(1, val > 100 ? GOLD : '#c1121f');
      canvasRoundRect(ctx, bx, by, Math.max(4, bwBar * pct), 8, 4);
      ctx.fillStyle = grad; ctx.fill();
    }
    const tick = bx + bwBar * Math.min(1, 100 / cap);
    ctx.strokeStyle = 'rgba(236,229,220,.42)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tick, by - 3); ctx.lineTo(tick, by + 11); ctx.stroke();
  });

  const buildY = 1112;
  const build = `${run.techName || '—'}${run.tech2 ? ' / ' + run.tech2Name : ''} · ${run.consName || '—'} · 天赋 ${run.tierName || '—'}${(run.capBonus || 0) ? ' · 突破 +' + run.capBonus : ''}`;
  ctx.font = `16px ${sans}`;
  ctx.fillStyle = DIM;
  ctx.fillText('BUILD', M, buildY);
  ctx.font = `20px ${sans}`;
  ctx.fillStyle = '#cfc7c0';
  ctx.fillText(canvasWrap(ctx, build, W - 2 * M, 1)[0] || '', M, buildY + 30);

  ctx.font = `600 22px ${serif}`;
  ctx.fillStyle = GOLD;
  ctx.fillText('战报', M, buildY + 78);
  const logs = (run.log || []).filter(l => l && l.text).slice(-2);
  let ly = buildY + 112;
  if (!logs.length) {
    ctx.font = `18px ${sans}`; ctx.fillStyle = MUT; ctx.fillText('没有留下战报。', M, ly);
  } else {
    ctx.font = `18px ${sans}`;
    for (const l of logs) {
      const ls = canvasWrap(ctx, '· ' + l.text, W - 2 * M, 2);
      ctx.fillStyle = '#aba3ac';
      for (const line of ls) { ctx.fillText(line, M, ly); ly += 26; }
      if (ly > 1340) break;
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M, 1370); ctx.lineTo(W - M, 1370); ctx.stroke();
  ctx.textAlign = 'left';
  ctx.font = `17px ${sans}`;
  ctx.fillStyle = DIM;
  ctx.fillText('咒术回战模拟器 · 重构版', M, 1396);
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.fillText('jujutsu.desthon.xyz', W - M, 1396);

  return canvas;
}

function dataUrlToFile(dataUrl, name) {
  const parts = dataUrl.split(',');
  const mime = (parts[0].match(/data:([^;]+)/) || [])[1] || 'image/png';
  const bin = atob(parts[1]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], name, { type: mime });
}

function downloadShareImage(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('战绩图片已导出');
}

async function nativeShareImage(dataUrl, filename) {
  try {
    const file = dataUrlToFile(dataUrl, filename);
    await navigator.share({ files: [file], title: '咒术回战战绩', text: '我的咒术回战模拟器战绩' });
  } catch (e) {
    if (e && e.name !== 'AbortError') toast('系统分享不可用，请下载图片');
  }
}

function shareResult() {
  const res = G.lastResult;
  if (!res) { toast('还没有可分享的战绩'); return; }
  let dataUrl;
  try { dataUrl = drawShareCanvas(res).toDataURL('image/png'); }
  catch (e) { toast('战绩图片生成失败'); return; }
  const ending = ENDINGS[res.mode] || ENDINGS.points;
  const safe = String(ending.title).replace(/[\\/:*?"<>|]/g, '').slice(0, 20);
  const filename = `咒术回战-${safe}-Lv.${res.level}.png`;
  let canShare = false;
  try {
    if (navigator.share && navigator.canShare && window.File) {
      canShare = navigator.canShare({ files: [dataUrlToFile(dataUrl, filename)] });
    }
  } catch (e) { canShare = false; }
  const actions = [
    { label: '下载图片', cls: 'primary', fn: () => downloadShareImage(dataUrl, filename) }
  ];
  if (canShare) actions.push({ label: '系统分享', cls: 'ghost', fn: () => nativeShareImage(dataUrl, filename) });
  actions.push({ label: '关闭', cls: 'ghost' });
  openModal('分享战绩', `<img class="share-preview" src="${dataUrl}" alt="咒术回战战绩图片"><div class="share-hint">图片已生成。手机可长按保存，或点击“系统分享”；桌面请下载图片。</div>`, actions);
}

function renderSettle(res) {
  G.lastResult = res;
  const e = ENDINGS[res.mode] || ENDINGS.points;
  $('#settle-kicker').textContent = res.endless ? 'ENDLESS · 无尽轮回' : ((G.run && G.run.trial) ? 'TRIAL MODE · 不计入记录' : e.kicker);
  $('#settle-title').textContent = res.endless ? `止步第 ${res.wave} 次轮回` : e.title;
  const er = $('#btn-endless-run');
  if (er) er.hidden = !(res.mode === 'slain' && !res.endless && G.run);
  const again = $('#btn-again');
  if (again) again.textContent = res.endless ? '再入轮回' : '再来一局';
  $('#settle-desc').textContent = res.endless
    ? (res.endlessOutcome === 'clear'
      ? `你在第 ${res.wave} 次轮回结束后主动离开。最高纪录已保存，下一次可以继续冲击更深的轮回。`
      : res.endlessOutcome === 'retreat'
        ? `你在第 ${res.wave} 次轮回中途离开。最高纪录已保存。`
        : `你在第 ${res.wave} 次轮回倒下。下一次宿傩会更强，下一次也许能走得更远。`)
    : e.desc;
  const stats = res.stats;
  const total = J.STATS.reduce((a, k) => a + stats[k], 0);
  $('#settle-grid').innerHTML = `
    <div class="settle-cell"><div class="k">难度</div><div class="v" style="font-size:16px;color:var(--gold)">${res.difficultyName || '标准'}</div></div>
    <div class="settle-cell"><div class="k">${res.endless ? '无尽轮回' : '最终等级'}</div><div class="v">${res.endless ? '第 ' + res.wave + ' 次' : 'Lv.' + res.level}</div></div>
    <div class="settle-cell"><div class="k">评级</div><div class="v" style="font-size:17px">${res.bench.grade}</div></div>
    <div class="settle-cell"><div class="k">年龄</div><div class="v">${res.age.toFixed(1)}<small>岁</small></div></div>
    <div class="settle-cell"><div class="k">弱点</div><div class="v">${res.weak}<small>/5</small></div></div>
    <div class="settle-cell"><div class="k">${res.endless ? '本次轮回' : '获得经验'}</div><div class="v">${res.endless ? '第 ' + res.wave + ' 次' : res.exp}</div></div>
    <div class="settle-cell"><div class="k">${res.endless ? '最高纪录' : '保底积分'}</div><div class="v">${res.endless ? '第 ' + (G.meta.endlessBest || res.wave) + ' 次' : '+' + res.points}</div></div>
    <div class="settle-cell"><div class="k">六维总和</div><div class="v">${Math.round(total)}</div></div>
    <div class="settle-cell"><div class="k">术师等级</div><div class="v">Lv.${G.meta.lv}</div></div>
  `;
  const logBox = $('#settle-log');
  logBox.innerHTML = '';
  const tail = G.run.log.slice(-10);
  for (const l of tail) {
    const div = document.createElement('div');
    div.className = 'line ' + (l.cls || '');
    div.textContent = l.text;
    logBox.appendChild(div);
  }
}

/* ---------------- 事件绑定 ---------------- */

function bind() {
  $('#btn-start').onclick = startRun;
  $('#btn-trial').onclick = startTrial;
  $('#btn-about').onclick = () => show('about');
  $$('[data-nav]').forEach(b => b.onclick = () => {
    stopAuto();
    closeModal();
    renderHome();
  });

  $('#diff-picker').addEventListener('click', e => {
    const b = e.target.closest('[data-diff]');
    if (b) setDifficulty(b.dataset.diff);
  });
  $('#game-tabs').addEventListener('click', e => {
    const b = e.target.closest('[data-mtab]');
    if (b) setMobileTab(b.dataset.mtab);
  });
  $('#m-next').addEventListener('click', () => { stopAuto(); advance(); });
  $('#m-duel').addEventListener('click', () => { if (!G.run || G.run.phase !== 'sim') return; openDuelPrep(true); });
  $('#m-duel-log').addEventListener('click', () => {
    setDuelLog(!document.body.classList.contains('mlog-open'));
  });
  $('#m-sheet-backdrop').addEventListener('click', () => setDuelLog(false));
  $('#btn-next').onclick = () => { stopAuto(); advance(); };
  $('#btn-auto').onclick = toggleAuto;
  $('#btn-forfeit').onclick = () => {
    if (!G.run || G.run.phase !== 'sim') return;
    openModal('提前结算', '<p>提前结束本局，只能获得 10% 经验，且不会获得保底积分。</p>', [
      { label: '继续修炼', cls: 'ghost' },
      { label: '确认结算', cls: 'primary', fn: () => finishRun('retreat') }
    ]);
  };
  $('#btn-duel').onclick = () => openDuelPrep(true);
  $('#btn-restart').onclick = quickRestart;
  $('#btn-restart-duel').onclick = quickRestart;

  $('#btn-retreat').onclick = () => {
    if (!G.duel || G.duel.over) return;
    if (G.run && G.run.endless) {
      openModal('结束无尽', `<p>当前到达第 ${G.run.endlessWave || 1} 次轮回。结束后会记录本次最高轮回。</p>`, [
        { label: '继续战斗', cls: 'ghost' },
        { label: '确认结束', cls: 'primary', fn: () => {
          J.retreatDuel(G.duel);
          endDuel();
        }}
      ]);
      return;
    }
    openModal('撤退', '<p>离开宿傩的战场，按提前结算处理。</p>', [
      { label: '继续战斗', cls: 'ghost' },
      { label: '确认撤退', cls: 'primary', fn: () => {
        J.retreatDuel(G.duel);
        endDuel();
      }}
    ]);
  };

  const ews = $('#btn-endless-weak');
  if (ews) ews.onclick = endlessWeakStrike;
  $('#move-list').addEventListener('click', e => {
    const b = e.target.closest('[data-move]');
    if (b && !b.disabled) doMove(b.dataset.move);
  });
  ['#trait-chips', '#duel-traits'].forEach(sel => {
    const el = $(sel);
    if (el) el.addEventListener('click', e => {
      const b = e.target.closest('[data-trait]');
      if (b) openTrait(b.dataset.trait);
    });
  });
  $('#vow-list').addEventListener('click', e => {
    const b = e.target.closest('[data-vow]');
    if (b && !b.disabled) doVow(b.dataset.vow);
  });

  $('#btn-again').onclick = () => {
    if (G.lastResult && G.lastResult.endless) restartEndless();
    else startRun();
  };
  const endlessRunBtn = $('#btn-endless-run');
  if (endlessRunBtn) endlessRunBtn.onclick = startEndlessFromRun;
  const shareBtn = $('#btn-share');
  if (shareBtn) shareBtn.onclick = shareResult;
  $('#music-toggle').onclick = toggleMusic;
  const mm = $('#m-music');
  if (mm) mm.onclick = toggleMusic;
  updateMusicUI();
}

/* ---------------- 启动 ---------------- */

bind();
renderHome();

if (typeof window !== 'undefined') {
  window.__JJK_UI = { G, MUSIC, MUSIC_NAMES, toggleMusic, startRun, startTrial, startEndlessFromRun, restartEndless, beginEndlessCycle, applyEndlessSukuScale, endlessSukuScale, endDuel, advance, enterDuel, doMove, doVow, finishRun, openDuelPrep, renderGame, renderDuel, startAuto, stopAuto, openTrait, quickRestart, closeModal, setDifficulty, setMobileTab, setDuelLog, renderDiffPicker, weakStrike, shareResult, openChoiceEvent, chooseEvent };
}

